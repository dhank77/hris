<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class AttendanceController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $user = $request->user();
        $today = Carbon::today()->toDateString();
        $attendance = Attendance::where('user_id', $user->id)->where('date', $today)->first();

        // recap counts for current month
        $start = Carbon::now()->startOfMonth();
        $end = Carbon::now()->endOfMonth();
        $monthAttendances = Attendance::where('user_id', $user->id)
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->get();

        $recap = [
            'present' => $monthAttendances->where('status', 'present')->count() + $monthAttendances->where('status', 'late')->count(),
            'late' => $monthAttendances->where('status', 'late')->count(),
            'absent' => $monthAttendances->where('status', 'absent')->count(),
            'leave' => $monthAttendances->whereIn('status', ['leave', 'sick', 'permission'])->count(),
            'total' => $monthAttendances->count(),
        ];

        return Inertia::render('attendance/index', [
            'attendance' => $attendance,
            'recap' => $recap,
            'today' => $today,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'type' => 'required|in:clock_in,clock_out',
            'photo' => 'nullable|image|max:4096',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        $user = $request->user();
        $today = Carbon::today()->toDateString();
        $attendance = Attendance::firstOrCreate(
            ['user_id' => $user->id, 'date' => $today],
            ['status' => 'present']
        );

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('attendance', 'public');
        }

        if ($request->type === 'clock_in') {
            if ($attendance->clock_in_at) {
                return back()->withErrors(['clock_in' => 'Sudah clock in hari ini.']);
            }
            $now = Carbon::now();
            $lateThreshold = Carbon::today()->setTime(9, 0); // 09:00
            $lateMinutes = $now->greaterThan($lateThreshold) ? $now->diffInMinutes($lateThreshold) : 0;
            $attendance->update([
                'clock_in_at' => $now,
                'clock_in_lat' => $request->latitude,
                'clock_in_lng' => $request->longitude,
                'clock_in_photo' => $photoPath,
                'status' => $lateMinutes > 0 ? 'late' : 'present',
                'late_minutes' => $lateMinutes,
            ]);
        } else {
            if (! $attendance->clock_in_at) {
                return back()->withErrors(['clock_out' => 'Belum clock in.']);
            }
            if ($attendance->clock_out_at) {
                return back()->withErrors(['clock_out' => 'Sudah clock out hari ini.']);
            }
            $attendance->update([
                'clock_out_at' => Carbon::now(),
                'clock_out_lat' => $request->latitude,
                'clock_out_lng' => $request->longitude,
                'clock_out_photo' => $photoPath,
            ]);
        }

        return back();
    }

    public function history(Request $request): InertiaResponse
    {
        $user = $request->user();
        $period = $request->input('period', 'monthly'); // daily, weekly, monthly
        $query = Attendance::where('user_id', $user->id)->orderByDesc('date');

        if ($period === 'weekly') {
            $query->whereBetween('date', [Carbon::now()->startOfWeek()->toDateString(), Carbon::now()->endOfWeek()->toDateString()]);
        } elseif ($period === 'monthly') {
            $query->whereBetween('date', [Carbon::now()->startOfMonth()->toDateString(), Carbon::now()->endOfMonth()->toDateString()]);
        } elseif ($period === 'daily') {
            $query->where('date', Carbon::today()->toDateString());
        }

        $attendances = $query->get();

        return Inertia::render('attendance/history', [
            'attendances' => $attendances,
            'period' => $period,
        ]);
    }

    public function recap(Request $request): InertiaResponse
    {
        // for supervisors/hr: view team recap
        $user = $request->user();
        $users = User::where('supervisor_id', $user->id)->orWhere('id', $user->id)->pluck('id');
        if (in_array($user->role, ['hr', 'admin', 'finance'])) {
            $users = User::pluck('id');
        }

        $start = $request->input('start', Carbon::now()->startOfMonth()->toDateString());
        $end = $request->input('end', Carbon::now()->endOfMonth()->toDateString());

        $attendances = Attendance::whereIn('user_id', $users)
            ->whereBetween('date', [$start, $end])
            ->with('user')
            ->orderByDesc('date')
            ->get();

        return Inertia::render('attendance/recap', [
            'attendances' => $attendances,
            'start' => $start,
            'end' => $end,
        ]);
    }
}
