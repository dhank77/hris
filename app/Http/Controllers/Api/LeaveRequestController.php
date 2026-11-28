<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LeaveRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

class LeaveRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $limit = min(max((int) $request->integer('limit', 30), 1), 100);
        $status = $request->query('status');

        $baseQuery = LeaveRequest::where('user_id', $user->id);

        $summary = [
            'pending' => (clone $baseQuery)->where('status', 'pending')->count(),
            'approved' => (clone $baseQuery)->where('status', 'approved')->count(),
            'rejected' => (clone $baseQuery)->where('status', 'rejected')->count(),
            'total' => (clone $baseQuery)->count(),
        ];

        $query = LeaveRequest::with('approver')
            ->where('user_id', $user->id)
            ->orderByDesc('created_at');

        if (is_string($status) && in_array($status, ['pending', 'approved', 'rejected'], true)) {
            $query->where('status', $status);
        }

        $items = $query
            ->limit($limit)
            ->get()
            ->map(fn (LeaveRequest $item) => $this->formatLeaveRequest($item))
            ->values();

        return response()->json([
            'leave_requests' => $items,
            'summary' => $summary,
        ]);
    }

    public function show(Request $request, LeaveRequest $leaveRequest): JsonResponse
    {
        $user = $request->user();
        $isOwner = $leaveRequest->user_id === $user->id;

        if (! $isOwner && ! in_array($user->role, ['hr', 'admin'], true)) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses ke pengajuan cuti ini.',
            ], 403);
        }

        return response()->json([
            'leave_request' => $this->formatLeaveRequest($leaveRequest->load('approver')),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'in:leave,sick,permission'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'reason' => ['required', 'string', 'max:1000'],
            'attachment' => ['nullable', 'file', 'max:4096', 'mimes:jpg,jpeg,png,pdf'],
        ]);

        $attachment = null;
        if ($request->hasFile('attachment')) {
            $attachment = $request->file('attachment')->store('leave-attachments', 'public');
        }

        $leaveRequest = LeaveRequest::create([
            'user_id' => $request->user()->id,
            'type' => $validated['type'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'reason' => trim($validated['reason']),
            'attachment' => $attachment,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Pengajuan cuti berhasil dikirim ke admin.',
            'leave_request' => $this->formatLeaveRequest($leaveRequest->fresh('approver')),
        ], 201);
    }

    public function destroy(Request $request, LeaveRequest $leaveRequest): JsonResponse
    {
        if ($leaveRequest->user_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Anda tidak dapat membatalkan pengajuan milik pegawai lain.',
            ], 403);
        }

        if ($leaveRequest->status !== 'pending') {
            return response()->json([
                'message' => 'Hanya pengajuan berstatus menunggu yang dapat dibatalkan.',
            ], 422);
        }

        if ($leaveRequest->attachment) {
            Storage::disk('public')->delete($leaveRequest->attachment);
        }

        $leaveRequest->delete();

        return response()->json([
            'message' => 'Pengajuan cuti berhasil dibatalkan.',
        ]);
    }

    /** @return array<string, mixed> */
    private function formatLeaveRequest(LeaveRequest $leaveRequest): array
    {
        $start = $leaveRequest->start_date instanceof Carbon
            ? $leaveRequest->start_date
            : Carbon::parse($leaveRequest->start_date);
        $end = $leaveRequest->end_date instanceof Carbon
            ? $leaveRequest->end_date
            : Carbon::parse($leaveRequest->end_date);

        return [
            'id' => $leaveRequest->id,
            'type' => $leaveRequest->type,
            'start_date' => $start->toDateString(),
            'end_date' => $end->toDateString(),
            'days' => (int) $start->diffInDays($end) + 1,
            'reason' => $leaveRequest->reason,
            'attachment_url' => $leaveRequest->attachment
                ? Storage::disk('public')->url($leaveRequest->attachment)
                : null,
            'status' => $leaveRequest->status,
            'approver_name' => $leaveRequest->approver?->name,
            'approved_at' => $leaveRequest->approved_at?->toIso8601String(),
            'rejection_reason' => $leaveRequest->rejection_reason,
            'created_at' => $leaveRequest->created_at?->toIso8601String(),
        ];
    }
}
