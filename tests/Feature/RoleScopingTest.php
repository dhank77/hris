<?php

use App\Models\Attendance;
use App\Models\CashAdvance;
use App\Models\LeaveRequest;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

test('employees only see their own attendance history and recap', function () {
    $employee = User::factory()->create();
    $other = User::factory()->create();

    Attendance::create(['user_id' => $employee->id, 'date' => Carbon::today(), 'status' => 'present']);
    Attendance::create(['user_id' => $other->id, 'date' => Carbon::today(), 'status' => 'present']);

    $this->actingAs($employee);

    $this->get(route('attendance.history'))->assertInertia(fn (Assert $page) => $page
        ->component('attendance/history')
        ->has('attendances', 1)
    );

    $this->get(route('attendance.recap'))->assertInertia(fn (Assert $page) => $page
        ->component('attendance/recap')
        ->has('attendances', 1)
    );
});

test('employees only see their own leave requests and admins see all', function () {
    $employee = User::factory()->create();
    $other = User::factory()->create();
    $admin = User::factory()->create(['role' => 'admin']);

    LeaveRequest::create([
        'user_id' => $employee->id,
        'type' => 'leave',
        'start_date' => Carbon::today(),
        'end_date' => Carbon::today(),
        'reason' => 'reason',
        'status' => 'pending',
    ]);

    LeaveRequest::create([
        'user_id' => $other->id,
        'type' => 'leave',
        'start_date' => Carbon::today(),
        'end_date' => Carbon::today(),
        'reason' => 'reason',
        'status' => 'pending',
    ]);

    $this->actingAs($employee);

    $this->get(route('leave-requests.index'))->assertInertia(fn (Assert $page) => $page
        ->component('leave-requests/index')
        ->has('leaveRequests', 1)
    );

    $this->actingAs($admin);

    $this->get(route('leave-requests.index'))->assertInertia(fn (Assert $page) => $page
        ->component('leave-requests/index')
        ->has('leaveRequests', 2)
    );
});

test('employees only see their own cash advances and admins see all', function () {
    $employee = User::factory()->create();
    $other = User::factory()->create();
    $admin = User::factory()->create(['role' => 'admin']);

    CashAdvance::create([
        'user_id' => $employee->id,
        'amount' => 100,
        'reason' => 'reason',
        'tenor_months' => 1,
        'installment_amount' => 100,
        'status' => 'pending',
    ]);

    CashAdvance::create([
        'user_id' => $other->id,
        'amount' => 200,
        'reason' => 'reason',
        'tenor_months' => 1,
        'installment_amount' => 200,
        'status' => 'pending',
    ]);

    $this->actingAs($employee);

    $this->get(route('cash-advances.index'))->assertInertia(fn (Assert $page) => $page
        ->component('cash-advances/index')
        ->has('cashAdvances', 1)
    );

    $this->actingAs($admin);

    $this->get(route('cash-advances.index'))->assertInertia(fn (Assert $page) => $page
        ->component('cash-advances/index')
        ->has('cashAdvances', 2)
    );
});

test('only admins receive the all-employee dashboard overview', function () {
    $employee = User::factory()->create();
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($employee)->get(route('dashboard'))->assertInertia(fn (Assert $page) => $page
        ->where('overview', null)
    );

    $this->actingAs($admin)->get(route('dashboard'))->assertInertia(fn (Assert $page) => $page
        ->where('overview.totalEmployees', 2)
    );
});

test('leave request detail is limited to the owner and approvers', function () {
    $employee = User::factory()->create();
    $other = User::factory()->create();
    $admin = User::factory()->create(['role' => 'admin']);

    $leave = LeaveRequest::create([
        'user_id' => $employee->id,
        'type' => 'leave',
        'start_date' => Carbon::today(),
        'end_date' => Carbon::today(),
        'reason' => 'reason',
        'status' => 'pending',
    ]);

    $this->actingAs($other)->get(route('leave-requests.show', $leave))->assertForbidden();

    $this->actingAs($employee)->get(route('leave-requests.show', $leave))->assertOk();

    $this->actingAs($admin)->get(route('leave-requests.show', $leave))->assertInertia(fn (Assert $page) => $page
        ->component('leave-requests/show')
        ->where('canDecide', true)
    );
});
