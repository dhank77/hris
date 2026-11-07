<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\HasTableQuery;
use App\Models\CashAdvance;
use App\Models\CashAdvanceInstallment;
use App\Models\CashAdvancePayment;
use App\Models\Setting;
use App\Models\User;
use chillerlan\QRCode\QRCode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use QrisDinamis\Qris;

class CashAdvanceController extends Controller
{
    use HasTableQuery;

    public function index(Request $request): InertiaResponse
    {
        $user = $request->user();
        $query = CashAdvance::with(['user', 'installments']);

        if (! in_array($user->role, ['hr', 'admin', 'finance', 'supervisor'])) {
            $query->where('user_id', $user->id);
        } elseif ($user->role === 'supervisor') {
            $subIds = User::where('supervisor_id', $user->id)->pluck('id');
            $query->whereIn('user_id', $subIds->push($user->id));
        }

        $table = $this->tableQuery(
            $request,
            ['amount', 'tenor_months', 'status', 'created_at', 'user'],
            defaultSort: 'created_at',
        );

        if ($table['search'] !== '') {
            $search = $table['search'];
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', fn ($user) => $user->where('name', 'like', "%{$search}%"))
                    ->orWhere('reason', 'like', "%{$search}%");
            });
        }

        if ($table['sort'] === 'user') {
            $query->orderBy(User::select('name')->whereColumn('users.id', 'cash_advances.user_id'), $table['dir']);
        } else {
            $query->orderBy($table['sort'], $table['dir']);
        }

        $advances = $query->paginate(15)->withQueryString();

        // dashboard stats for current user
        $myAdvances = CashAdvance::where('user_id', $user->id)->get();
        $remainingLimit = max(0, (float) $user->kasbon_limit - (float) $user->kasbon_used);
        $totalPaid = CashAdvanceInstallment::whereIn('cash_advance_id', $myAdvances->pluck('id'))->where('paid', true)->sum('amount');
        $totalUnpaid = CashAdvanceInstallment::whereIn('cash_advance_id', $myAdvances->pluck('id'))->where('paid', false)->sum('amount');

        return Inertia::render('cash-advances/index', [
            'cashAdvances' => $advances,
            'filters' => $table,
            'stats' => [
                'limit' => (float) $user->kasbon_limit,
                'used' => (float) $user->kasbon_used,
                'remaining' => $remainingLimit,
                'totalPaid' => (float) $totalPaid,
                'totalUnpaid' => (float) $totalUnpaid,
            ],
        ]);
    }

    public function create(): InertiaResponse
    {
        return Inertia::render('cash-advances/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'reason' => 'required|string',
            'tenor_months' => 'required|integer|min:1|max:24',
        ]);

        $user = $request->user();
        if ($user->kasbon_limit > 0 && ((float) $user->kasbon_used + (float) $request->amount) > (float) $user->kasbon_limit) {
            return back()->withErrors(['amount' => 'Melebihi limit kasbon tersedia.']);
        }

        $installment = round($request->amount / $request->tenor_months, 2);

        CashAdvance::create([
            'user_id' => $user->id,
            'amount' => $request->amount,
            'reason' => $request->reason,
            'tenor_months' => $request->tenor_months,
            'installment_amount' => $installment,
            'status' => 'pending',
        ]);

        return redirect()->route('cash-advances.index');
    }

    public function show(CashAdvance $cashAdvance): InertiaResponse
    {
        $user = request()->user();
        if ($cashAdvance->user_id !== $user->id && ! in_array($user->role, ['hr', 'admin', 'finance', 'supervisor'])) {
            abort(403);
        }

        $cashAdvance->load(['user', 'installments', 'level1Approver', 'financeApprover']);

        return Inertia::render('cash-advances/show', [
            'cashAdvance' => $cashAdvance,
        ]);
    }

    public function approveLevel1(Request $request, CashAdvance $cashAdvance): RedirectResponse
    {
        $user = $request->user();
        if (! in_array($user->role, ['supervisor', 'hr', 'admin'])) {
            abort(403);
        }
        if ($user->role === 'supervisor' && $cashAdvance->user_id !== $user->id && ! User::where('id', $cashAdvance->user_id)->where('supervisor_id', $user->id)->exists()) {
            abort(403);
        }
        if ($cashAdvance->status !== 'pending') {
            return back()->withErrors(['status' => 'Status tidak valid.']);
        }
        $cashAdvance->update([
            'status' => 'approved_level1',
            'approved_level1_by' => $user->id,
            'approved_level1_at' => Carbon::now(),
        ]);

        return back();
    }

    public function approveFinance(Request $request, CashAdvance $cashAdvance): RedirectResponse
    {
        $user = $request->user();
        if (! in_array($user->role, ['finance', 'admin'])) {
            abort(403);
        }
        if ($cashAdvance->status !== 'approved_level1') {
            return back()->withErrors(['status' => 'Status tidak valid.']);
        }
        $cashAdvance->update([
            'status' => 'approved_finance',
            'approved_finance_by' => $user->id,
            'approved_finance_at' => Carbon::now(),
        ]);

        // create installments
        $start = Carbon::now()->addMonth()->startOfMonth();
        for ($i = 1; $i <= $cashAdvance->tenor_months; $i++) {
            CashAdvanceInstallment::create([
                'cash_advance_id' => $cashAdvance->id,
                'period_number' => $i,
                'due_date' => $start->copy()->addMonths($i - 1)->toDateString(),
                'amount' => $cashAdvance->installment_amount,
                'paid' => false,
            ]);
        }

        // update kasbon_used
        $cashAdvance->user->increment('kasbon_used', $cashAdvance->amount);

        return back();
    }

    public function reject(Request $request, CashAdvance $cashAdvance): RedirectResponse
    {
        $user = $request->user();
        if (! in_array($user->role, ['supervisor', 'hr', 'finance', 'admin'])) {
            abort(403);
        }
        if ($user->role === 'supervisor' && $cashAdvance->user_id !== $user->id && ! User::where('id', $cashAdvance->user_id)->where('supervisor_id', $user->id)->exists()) {
            abort(403);
        }
        $cashAdvance->update([
            'status' => 'rejected',
            'rejection_reason' => $request->input('rejection_reason'),
        ]);

        return back();
    }

    public function disburse(Request $request, CashAdvance $cashAdvance): RedirectResponse
    {
        $user = $request->user();
        if (! in_array($user->role, ['finance', 'admin'])) {
            abort(403);
        }
        if ($cashAdvance->status !== 'approved_finance') {
            return back();
        }
        $cashAdvance->update(['status' => 'disbursed', 'disbursed_at' => Carbon::now()]);

        return back();
    }

    /**
     * Generate a unique-code dynamic QRIS for an installment (JSON).
     */
    public function qris(Request $request, CashAdvanceInstallment $installment): JsonResponse
    {
        $user = $request->user();
        $advance = $installment->cashAdvance;
        $canManage = in_array($user->role, ['finance', 'hr', 'admin']);
        if ($advance->user_id !== $user->id && ! $canManage) {
            abort(403);
        }
        if ($installment->paid) {
            return response()->json(['error' => 'Cicilan ini sudah lunas.'], 422);
        }

        $baseAmount = (int) round((float) $installment->amount);

        // the unique code is "pinned" to the installment: first press issues it,
        // every later press reuses the same code so the nominal stays matched
        $payment = $installment->payments()->latest()->first();
        if ($payment === null) {
            // the code must be unused by any other still-unpaid installment
            do {
                $paymentCode = random_int(1, 999);
            } while (CashAdvancePayment::query()
                ->where('code', $paymentCode)
                ->whereHas('installment', fn ($q) => $q->where('paid', false))
                ->exists());

            $payment = CashAdvancePayment::create([
                'cash_advance_installment_id' => $installment->id,
                'code' => $paymentCode,
                'amount' => $baseAmount + $paymentCode,
            ]);
        }

        $amount = (int) $payment->amount;

        $payload = Setting::get('qris_static_payload');
        $image = null;
        $staticImage = Setting::get('qris_static_image');
        $merchant = null;

        if ($payload && Qris::isValid($payload) && $amount > 0) {
            try {
                $dynamic = Qris::convert($payload, $amount);
                $image = (new QRCode)->render($dynamic);
                $merchant = Qris::parse($payload)->merchantName;
            } catch (\Throwable) {
                $image = null;
            }
        }

        return response()->json([
            'id' => $payment->id,
            'code' => (int) $payment->code,
            'base_amount' => $baseAmount,
            'amount' => $amount,
            'image' => $image,
            'static_image' => $staticImage ? Storage::disk('public')->url($staticImage) : null,
            'merchant' => $merchant,
        ]);
    }

    public function markPaid(Request $request, CashAdvanceInstallment $installment): RedirectResponse
    {
        $user = $request->user();
        if (! in_array($user->role, ['finance', 'hr', 'admin'])) {
            abort(403);
        }
        $installment->markAsPaid();

        return back();
    }

    public function deductPayroll(Request $request): RedirectResponse
    {
        // auto-deduct all unpaid installments due this month or earlier
        $user = $request->user();
        if (! in_array($user->role, ['finance', 'hr', 'admin'])) {
            abort(403);
        }
        $today = Carbon::today();
        $due = CashAdvanceInstallment::where('paid', false)
            ->where('due_date', '<=', $today)
            ->get();
        foreach ($due as $inst) {
            $inst->markAsPaid();
        }

        return back();
    }
}
