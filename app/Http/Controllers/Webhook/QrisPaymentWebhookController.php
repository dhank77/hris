<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Models\CashAdvancePayment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * QRIS payment notification webhook.
 *
 * Contract (JSON body, signed):
 *
 *      POST /webhooks/qris
 *      X-Qris-Signature: hash_hmac('sha256', $rawBody, config('services.qris.webhook_secret'))
 *      { "amount": 250123, "code": 123 }   // nominal yang dibayar ke merchant
 *
 * Accepted alternative amount keys: nominal, gross_amount, total.
 * The amount is matched against a still-unpaid installment whose generated
 * payment (nominal + kode unik) equals it, then the installment is marked
 * paid automatically.
 */
class QrisPaymentWebhookController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $secret = (string) config('services.qris.webhook_secret');
        if ($secret === '') {
            abort(503, 'QRIS webhook secret is not configured.');
        }

        $expected = hash_hmac('sha256', $request->getContent(), $secret);
        $given = (string) $request->header('X-Qris-Signature', '');
        if (! hash_equals($expected, $given)) {
            abort(401, 'Invalid webhook signature.');
        }

        $amount = $this->extractAmount($request);
        if ($amount === null || $amount <= 0) {
            return response()->json(['status' => 'error', 'message' => 'Amount not found in payload.'], 422);
        }

        // oldest issued first; the pinned unique code makes amounts unambiguous.
        // paid installments stay matchable so replayed notifications answer
        // "already_paid" instead of dropping to "unmatched".
        $payment = CashAdvancePayment::query()
            ->where('amount', $amount)
            ->orderBy('id')
            ->first();

        if ($payment === null) {
            Log::warning('QRIS webhook: no unpaid installment matches payment amount.', [
                'amount' => $amount,
                'payload' => $request->json()->all(),
            ]);

            return response()->json(['status' => 'unmatched', 'amount' => $amount]);
        }

        $installment = $payment->installment;
        $alreadyPaid = $installment->paid;

        if (! $alreadyPaid) {
            $installment->markAsPaid();

            Log::info('QRIS webhook: installment marked paid automatically.', [
                'amount' => $amount,
                'code' => $payment->code,
                'installment_id' => $installment->id,
            ]);
        }

        return response()->json([
            'status' => $alreadyPaid ? 'already_paid' : 'matched',
            'amount' => $amount,
            'code' => (int) $payment->code,
            'installment_id' => $installment->id,
            'period_number' => $installment->period_number,
        ]);
    }

    /**
     * Amount from the payload, tolerating several webhook provider keys.
     */
    private function extractAmount(Request $request): ?float
    {
        $json = $request->json();

        foreach (['amount', 'nominal', 'gross_amount', 'total'] as $key) {
            $value = $json->get($key);
            if (is_numeric($value)) {
                return (float) $value;
            }
        }

        return null;
    }
}
