<?php

use App\Models\Attendance;
use App\Models\LeaveRequest;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

test('employee list can be searched and sorted', function () {
    $admin = User::factory()->create(['name' => 'Zeta Admin', 'role' => 'admin']);
    $budiman = User::factory()->create(['name' => 'Budiman', 'role' => 'employee']);
    User::factory()->create(['name' => 'Andi', 'role' => 'employee']);

    $this->actingAs($admin);

    // search filters by name (case-insensitive "like")
    $this->get(route('employees.index', ['search' => 'budiman']))
        ->assertInertia(fn (Assert $page) => $page
            ->component('employees/index')
            ->has('employees.data', 1)
            ->where('employees.data.0.name', 'Budiman')
        );

    // search matches email too
    $this->get(route('employees.index', ['search' => $budiman->email]))
        ->assertInertia(fn (Assert $page) => $page
            ->component('employees/index')
            ->has('employees.data', 1)
        );

    // ascending sort by name
    $this->get(route('employees.index', ['sort' => 'name', 'dir' => 'asc']))
        ->assertInertia(fn (Assert $page) => $page
            ->component('employees/index')
            ->has('employees.data', 3)
            ->where('employees.data.0.name', 'Andi')
        );

    // descending sort by name
    $this->get(route('employees.index', ['sort' => 'name', 'dir' => 'desc']))
        ->assertInertia(fn (Assert $page) => $page
            ->component('employees/index')
            ->where('employees.data.0.name', 'Zeta Admin')
        );
});

test('invalid sort fields fall back to the default sort', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $this->actingAs($admin);

    $this->get(route('employees.index', ['sort' => 'password', 'dir' => 'sideways']))
        ->assertInertia(fn (Assert $page) => $page
            ->component('employees/index')
            ->has('employees.data')
            ->where('filters.sort', 'name')
            ->where('filters.dir', 'asc')
        );
});

test('leave request list is paginated', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    foreach (range(1, 20) as $i) {
        LeaveRequest::create([
            'user_id' => $admin->id,
            'type' => 'leave',
            'start_date' => Carbon::today()->addDays($i),
            'end_date' => Carbon::today()->addDays($i),
            'reason' => "reason {$i}",
            'status' => 'pending',
        ]);
    }

    $this->actingAs($admin);

    $this->get(route('leave-requests.index'))->assertInertia(fn (Assert $page) => $page
        ->component('leave-requests/index')
        ->has('leaveRequests.data', 15)
        ->where('leaveRequests.last_page', 2)
        ->where('leaveRequests.total', 20)
    );

    $this->get(route('leave-requests.index', ['page' => 2]))->assertInertia(fn (Assert $page) => $page
        ->component('leave-requests/index')
        ->has('leaveRequests.data', 5)
    );
});

test('attendance history can be searched by employee name', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $budiman = User::factory()->create(['name' => 'Budiman']);
    $other = User::factory()->create();

    Attendance::create(['user_id' => $budiman->id, 'date' => Carbon::today(), 'status' => 'present']);
    Attendance::create(['user_id' => $other->id, 'date' => Carbon::today(), 'status' => 'present']);

    $this->actingAs($admin);

    $this->get(route('attendance.history', ['period' => 'all', 'search' => 'Budiman']))
        ->assertInertia(fn (Assert $page) => $page
            ->component('attendance/history')
            ->has('attendances.data', 1)
            ->where('attendances.data.0.user.name', 'Budiman')
        );
});
