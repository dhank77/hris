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
 * Tools that cannot compute HMAC (e.g. MacroDroid HTTP actions) may
 * authenticate with the bare secret instead — passed as ?secret= query
 * parameter, X-Qris-Token header, or "secret" body field.
 *
 * The amount may also arrive as raw notification text (fields text, message,
 * notification, or as non-numeric amount) — e.g. "BCA: QRIS Rp 250.658
 * berhasil" is read as 250.658 after Rp, dots treated as thousand separators.
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

        if (! $this->authenticates($request, $secret)) {
            abort(401, 'Invalid webhook authentication.');
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
                'payload' => $request->json()->all() ?: $request->input(),
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
     * HMAC signature first (full back), then the bare secret as token for
     * tools that cannot compute HMAC — via ?secret=, X-Qris-Token header,
     * or "secret" body field.
     */
    private function authenticates(Request $request, string $secret): bool
    {
        $given = (string) $request->header('X-Qris-Signature', '');
        if ($given !== '' && hash_equals(hash_hmac('sha256', $request->getContent(), $secret), $given)) {
            return true;
        }

        $token = $request->query('secret')
            ?? $request->input('secret')
            ?? $request->header('X-Qris-Token', '');

        return is_string($token) && $token !== '' && hash_equals($secret, $token);
    }

    /**
     * Amount from the payload, tolerating several webhook provider keys.
     * Falls back to request input so form-encoded bodies and query
     * parameters (?amount=250123) also work, and to free-text parsing
     * (raw notification text) for automation like MacroDroid.
     */
    private function extractAmount(Request $request): ?float
    {
        // strict numeric providers: {"amount": 250658}
        foreach (['amount', 'nominal', 'gross_amount', 'total'] as $field) {
            $value = $request->json($field);
            if (is_numeric($value)) {
                return (float) $value;
            }
        }

        // free text: {"text": "BCA QRIS Rp 250.658 berhasil"} or messy amount
        foreach (['text', 'keterangan', 'message', 'notification', 'amount', 'nominal', 'gross_amount', 'total'] as $field) {
            $value = $request->json($field);
            if (is_string($value) && trim($value) !== '') {
                $parsed = $this->extractAmountFromText($value);
                if ($parsed !== null) {
                    return $parsed;
                }
            }
        }

        // form data / query params: ?amount=250123 or ?text=Rp 250.658
        foreach (['amount', 'nominal', 'gross_amount', 'total', 'text', 'keterangan', 'message', 'notification'] as $field) {
            $value = $request->input($field);
            if (is_numeric($value)) {
                return (float) $value;
            }
            if (is_string($value) && trim($value) !== '') {
                $parsed = $this->extractAmountFromText($value);
                if ($parsed !== null) {
                    return $parsed;
                }
            }
        }

        return null;
    }

    /**
     * Parse the payment amount out of raw notification text.
     * Prefers the token right after "Rp"/"IDR"; otherwise keeps the largest
     * number found (the nominal is typically the biggest figure in a
     * payment notification).
     */
    private function extractAmountFromText(string $text): ?float
    {
        if (preg_match('/(?:Rp|IDR)\.?\s*([\d.,]+)/iu', $text, $rough)) {
            $value = $this->normalizeMoneyToken($rough[1]);
            if ($value !== null && $value > 0) {
                return $value;
            }
        }

        $best = null;
        if (preg_match_all('/\d+(?:[.,]\d+)*/', $text, $found)) {
            foreach ($found[0] as $token) {
                $value = $this->normalizeMoneyToken($token);
                if ($value !== null && ($best === null || $value > $best)) {
                    $best = $value;
                }
            }
        }

        return $best;
    }

    /**
     * Normalize one money token to a float, using Indonesian formatting:
     * dots as thousand separators (250.658 → 250658), comma as decimal
     * separator (250,50 → 250.5), and full forms (1.250.658,50 → 1250658.5).
     */
    private function normalizeMoneyToken(string $token): ?float
    {
        $token = trim($token);
        if ($token === '') {
            return null;
        }

        if (str_contains($token, ',')) {
            // 1.250.658,50 — dot thousands + comma decimal
            if (preg_match('/^\d{1,3}(\.\d{3})+,\d{1,2}$/', $token)) {
                return (float) str_replace(['.', ','], ['', '.'], $token);
            }
            // 250,50 — comma decimal
            if (preg_match('/^\d+(,\d{1,2})?$/', $token)) {
                return (float) str_replace(',', '.', $token);
            }
            // 250,000,000 — comma thousands
            if (preg_match('/^\d{1,3}(,\d{3})+$/', $token)) {
                return (float) str_replace(',', '', $token);
            }

            return null;
        }

        if (str_contains($token, '.')) {
            // 250.658 / 1.250.658,00 without decimals — dot thousands
            if (preg_match('/^\d{1,3}(\.\d{3})+$/', $token)) {
                return (float) str_replace('.', '', $token);
            }
            // 250.50 — decimal
            if (preg_match('/^\d+\.\d{1,2}$/', $token)) {
                return (float) $token;
            }

            return null;
        }

        return is_numeric($token) ? (float) $token : null;
    }
}
