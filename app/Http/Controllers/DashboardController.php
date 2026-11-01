<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\CashAdvance;
use App\Models\CashAdvanceInstallment;
use App\Models\LeaveRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class DashboardController extends Controller
{
    public function __invoke(Request $request): InertiaResponse
    {
        $user = $request->user();
        $today = Carbon::today();

        $todayAttendance = Attendance::where('user_id', $user->id)
            ->whereDate('date', $today)
            ->first();

        // scope for statistics: admin/hr all, supervisor team, employee self
        if (in_array($user->role, ['hr', 'admin'])) {
            $scopedUserIds = User::pluck('id');
        } elseif ($user->role === 'supervisor') {
            $scopedUserIds = User::where('supervisor_id', $user->id)->pluck('id')->push($user->id);
        } else {
            $scopedUserIds = collect([$user->id]);
        }

        $monthAttendances = Attendance::whereIn('user_id', $scopedUserIds)
            ->whereBetween('date', [
                $today->copy()->startOfMonth()->toDateString(),
                $today->copy()->endOfMonth()->toDateString(),
            ])
            ->get();

        $activeCashAdvance = CashAdvance::where('user_id', $user->id)
            ->whereNotIn('status', ['rejected', 'completed'])
            ->latest()
            ->first();

        $nextInstallment = $activeCashAdvance
            ? CashAdvanceInstallment::where('cash_advance_id', $activeCashAdvance->id)
                ->where('paid', false)
                ->orderBy('due_date')
                ->first()
            : null;

        return Inertia::render('dashboard', [
            'today' => [
                'date' => $today->toDateString(),
                'clock_in_at' => $todayAttendance?->clock_in_at?->toIso8601String(),
                'clock_out_at' => $todayAttendance?->clock_out_at?->toIso8601String(),
                'status' => $todayAttendance?->status,
            ],
            'monthRecap' => [
                'present' => $monthAttendances->whereIn('status', ['present', 'late'])->count(),
                'late' => $monthAttendances->where('status', 'late')->count(),
                'absent' => $monthAttendances->where('status', 'absent')->count(),
                'leave' => $monthAttendances->whereIn('status', ['leave', 'sick', 'permission'])->count(),
            ],
            'pendingLeaveCount' => LeaveRequest::whereIn('user_id', $scopedUserIds)
                ->where('status', 'pending')
                ->count(),
            'kasbon' => [
                'limit' => (float) $user->kasbon_limit,
                'remaining' => max(0, (float) $user->kasbon_limit - (float) $user->kasbon_used),
                'active' => $activeCashAdvance ? [
                    'id' => $activeCashAdvance->id,
                    'amount' => (float) $activeCashAdvance->amount,
                    'status' => $activeCashAdvance->status,
                    'approved_level1_at' => $activeCashAdvance->approved_level1_at?->toIso8601String(),
                    'approved_finance_at' => $activeCashAdvance->approved_finance_at?->toIso8601String(),
                    'disbursed_at' => $activeCashAdvance->disbursed_at?->toIso8601String(),
                ] : null,
                'next_installment' => $nextInstallment ? [
                    'due_date' => $nextInstallment->due_date->toDateString(),
                    'amount' => (float) $nextInstallment->amount,
                ] : null,
            ],
        ]);
    }
}
