<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\LeaveRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class LeaveRequestController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $user = $request->user();
        $query = LeaveRequest::with(['user', 'approver'])->orderByDesc('created_at');

        if (! in_array($user->role, ['hr', 'admin', 'supervisor'])) {
            $query->where('user_id', $user->id);
        } elseif ($user->role === 'supervisor') {
            $subIds = User::where('supervisor_id', $user->id)->pluck('id');
            $query->whereIn('user_id', $subIds->push($user->id));
        }

        return Inertia::render('leave-requests/index', [
            'leaveRequests' => $query->get(),
        ]);
    }

    public function show(Request $request, LeaveRequest $leaveRequest): InertiaResponse
    {
        $user = $request->user();
        $isOwner = $leaveRequest->user_id === $user->id;
        $isSupervisorOfOwner = $user->role === 'supervisor'
            && User::where('id', $leaveRequest->user_id)->where('supervisor_id', $user->id)->exists();

        if (! $isOwner && ! in_array($user->role, ['hr', 'admin']) && ! $isSupervisorOfOwner) {
            abort(403);
        }

        return Inertia::render('leave-requests/show', [
            'leaveRequest' => $leaveRequest->load(['user', 'approver']),
            'canDecide' => in_array($user->role, ['hr', 'admin']) || $isSupervisorOfOwner || ($user->role === 'supervisor' && $isOwner),
        ]);
    }

    public function create(): InertiaResponse
    {
        return Inertia::render('leave-requests/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'type' => 'required|in:leave,sick,permission',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'required|string',
            'attachment' => 'nullable|file|max:4096',
        ]);

        $attachment = null;
        if ($request->hasFile('attachment')) {
            $attachment = $request->file('attachment')->store('leave-attachments', 'public');
        }

        LeaveRequest::create([
            'user_id' => $request->user()->id,
            'type' => $request->type,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'reason' => $request->reason,
            'attachment' => $attachment,
            'status' => 'pending',
        ]);

        return redirect()->route('leave-requests.index');
    }

    public function approve(Request $request, LeaveRequest $leaveRequest): RedirectResponse
    {
        $user = $request->user();
        if (! in_array($user->role, ['supervisor', 'hr', 'admin'])) {
            abort(403);
        }
        if ($user->role === 'supervisor' && $leaveRequest->user_id !== $user->id && ! User::where('id', $leaveRequest->user_id)->where('supervisor_id', $user->id)->exists()) {
            abort(403);
        }
        $leaveRequest->update([
            'status' => 'approved',
            'approved_by' => $user->id,
            'approved_at' => Carbon::now(),
        ]);

        // mark attendance as leave for the date range
        $start = Carbon::parse($leaveRequest->start_date);
        $end = Carbon::parse($leaveRequest->end_date);
        for ($d = $start->copy(); $d->lte($end); $d->addDay()) {
            Attendance::updateOrCreate(
                ['user_id' => $leaveRequest->user_id, 'date' => $d->toDateString()],
                ['status' => $leaveRequest->type, 'notes' => $leaveRequest->reason]
            );
        }

        return back();
    }

    public function reject(Request $request, LeaveRequest $leaveRequest): RedirectResponse
    {
        $user = $request->user();
        if (! in_array($user->role, ['supervisor', 'hr', 'admin'])) {
            abort(403);
        }
        if ($user->role === 'supervisor' && $leaveRequest->user_id !== $user->id && ! User::where('id', $leaveRequest->user_id)->where('supervisor_id', $user->id)->exists()) {
            abort(403);
        }
        $leaveRequest->update([
            'status' => 'rejected',
            'approved_by' => $user->id,
            'approved_at' => Carbon::now(),
            'rejection_reason' => $request->input('rejection_reason'),
        ]);

        return back();
    }
}
