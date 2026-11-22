<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Services\OfficeLocationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AttendanceController extends Controller
{
    public function __construct(
        private readonly OfficeLocationService $officeLocation,
    ) {}

    public function today(Request $request): JsonResponse
    {
        $user = $request->user();
        $today = Carbon::today()->toDateString();

        $attendance = Attendance::where('user_id', $user->id)
            ->whereDate('date', $today)
            ->first();

        $start = Carbon::now()->startOfMonth()->toDateString();
        $end = Carbon::now()->endOfMonth()->toDateString();

        $monthAttendances = Attendance::where('user_id', $user->id)
            ->whereBetween('date', [$start, $end])
            ->get();

        $recap = [
            'present' => $monthAttendances->where('status', 'present')->count()
                + $monthAttendances->where('status', 'late')->count(),
            'late' => $monthAttendances->where('status', 'late')->count(),
            'absent' => $monthAttendances->where('status', 'absent')->count(),
            'leave' => $monthAttendances->whereIn('status', ['leave', 'sick', 'permission'])->count(),
            'total' => $monthAttendances->count(),
        ];

        return response()->json([
            'today' => $today,
            'attendance' => $attendance ? $this->formatAttendance($attendance) : null,
            'office_location' => $this->officeLocation->getSettings(),
            'recap' => $recap,
        ]);
    }

    public function history(Request $request): JsonResponse
    {
        $user = $request->user();
        $limit = min(max((int) $request->integer('limit', 30), 1), 100);

        $attendances = Attendance::where('user_id', $user->id)
            ->orderByDesc('date')
            ->limit($limit)
            ->get()
            ->map(fn (Attendance $item) => $this->formatAttendance($item))
            ->values();

        return response()->json([
            'attendances' => $attendances,
        ]);
    }

    public function clockIn(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $radiusCheck = $this->officeLocation->validateWithinRadius(
            (float) $validated['latitude'],
            (float) $validated['longitude'],
        );

        if (! $radiusCheck['allowed']) {
            return response()->json([
                'message' => $radiusCheck['message'],
                'distance_meters' => $radiusCheck['distance_meters'],
                'radius_meters' => $radiusCheck['office']['radius_meters'],
            ], 422);
        }

        $user = $request->user();
        $today = Carbon::today()->toDateString();

        $attendance = Attendance::firstOrCreate(
            ['user_id' => $user->id, 'date' => $today],
            ['status' => 'present'],
        );

        if ($attendance->clock_in_at) {
            return response()->json([
                'message' => 'Sudah clock in hari ini.',
            ], 422);
        }

        $now = Carbon::now();
        $lateThreshold = Carbon::today()->setTime(9, 0);
        $lateMinutes = $now->greaterThan($lateThreshold) ? $now->diffInMinutes($lateThreshold) : 0;

        $attendance->update([
            'clock_in_at' => $now,
            'clock_in_lat' => (float) $validated['latitude'],
            'clock_in_lng' => (float) $validated['longitude'],
            'status' => $lateMinutes > 0 ? 'late' : 'present',
            'late_minutes' => $lateMinutes,
            'notes' => $validated['notes'] ?? $attendance->notes,
        ]);

        return response()->json([
            'message' => 'Clock in berhasil.',
            'attendance' => $this->formatAttendance($attendance->fresh()),
            'distance_meters' => $radiusCheck['distance_meters'],
        ]);
    }

    public function clockOut(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $radiusCheck = $this->officeLocation->validateWithinRadius(
            (float) $validated['latitude'],
            (float) $validated['longitude'],
        );

        if (! $radiusCheck['allowed']) {
            return response()->json([
                'message' => $radiusCheck['message'],
                'distance_meters' => $radiusCheck['distance_meters'],
                'radius_meters' => $radiusCheck['office']['radius_meters'],
            ], 422);
        }

        $user = $request->user();
        $today = Carbon::today()->toDateString();

        $attendance = Attendance::where('user_id', $user->id)
            ->whereDate('date', $today)
            ->first();

        if (! $attendance || ! $attendance->clock_in_at) {
            return response()->json([
                'message' => 'Belum clock in hari ini.',
            ], 422);
        }

        if ($attendance->clock_out_at) {
            return response()->json([
                'message' => 'Sudah clock out hari ini.',
            ], 422);
        }

        $attendance->update([
            'clock_out_at' => Carbon::now(),
            'clock_out_lat' => (float) $validated['latitude'],
            'clock_out_lng' => (float) $validated['longitude'],
            'notes' => $validated['notes'] ?? $attendance->notes,
        ]);

        return response()->json([
            'message' => 'Clock out berhasil.',
            'attendance' => $this->formatAttendance($attendance->fresh()),
            'distance_meters' => $radiusCheck['distance_meters'],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function formatAttendance(Attendance $attendance): array
    {
        return [
            'id' => $attendance->id,
            'date' => $attendance->date?->toDateString(),
            'clock_in_at' => $attendance->clock_in_at?->toIso8601String(),
            'clock_out_at' => $attendance->clock_out_at?->toIso8601String(),
            'clock_in_lat' => $attendance->clock_in_lat !== null ? (float) $attendance->clock_in_lat : null,
            'clock_in_lng' => $attendance->clock_in_lng !== null ? (float) $attendance->clock_in_lng : null,
            'clock_out_lat' => $attendance->clock_out_lat !== null ? (float) $attendance->clock_out_lat : null,
            'clock_out_lng' => $attendance->clock_out_lng !== null ? (float) $attendance->clock_out_lng : null,
            'status' => $attendance->status,
            'late_minutes' => (int) $attendance->late_minutes,
            'notes' => $attendance->notes,
        ];
    }
}
