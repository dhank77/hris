<?php

use App\Models\CashAdvance;
use App\Models\LeaveRequest;
use App\Models\News;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

function attendanceFor(User $user, array $attributes = []): void
{
    DB::table('attendances')->insert([
        'user_id' => $user->id,
        'date' => Carbon::today()->toDateString(),
        'status' => 'present',
        'created_at' => Carbon::now(),
        'updated_at' => Carbon::now(),
        ...$attributes,
    ]);
}

test('creating an employee flashes a success toast', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->post(route('employees.store'), [
            'name' => 'Pegawai Baru',
            'email' => 'pegawai.baru@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => 'employee',
        ])
        ->assertRedirect(route('employees.index'))
        ->assertInertiaFlash('toast', [
            'type' => 'success',
            'message' => 'Pegawai berhasil ditambahkan.',
        ]);
});

test('updating an employee flashes a success toast', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $employee = User::factory()->create();

    $this->actingAs($admin)
        ->put(route('employees.update', $employee), [
            'name' => 'Nama Diperbarui',
            'email' => $employee->email,
            'role' => 'employee',
        ])
        ->assertRedirect(route('employees.show', $employee))
        ->assertInertiaFlash('toast', [
            'type' => 'success',
            'message' => 'Data pegawai berhasil diperbarui.',
        ]);
});

test('clock in flashes a success toast', function () {
    $employee = User::factory()->create();

    $this->actingAs($employee)
        ->post(route('attendance.store'), ['type' => 'clock_in'])
        ->assertInertiaFlash('toast', [
            'type' => 'success',
            'message' => 'Clock in berhasil.',
        ]);
});

test('clocking in twice flashes an error toast', function () {
    $employee = User::factory()->create();

    attendanceFor($employee, ['clock_in_at' => Carbon::now()]);

    $this->actingAs($employee)
        ->post(route('attendance.store'), ['type' => 'clock_in'])
        ->assertInertiaFlash('toast', [
            'type' => 'error',
            'message' => 'Sudah clock in hari ini.',
        ]);
});

test('clock out flashes a success toast', function () {
    $employee = User::factory()->create();

    attendanceFor($employee, ['clock_in_at' => Carbon::now()]);

    $this->actingAs($employee)
        ->post(route('attendance.store'), ['type' => 'clock_out'])
        ->assertInertiaFlash('toast', [
            'type' => 'success',
            'message' => 'Clock out berhasil.',
        ]);
});

test('submitting a cash advance flashes a success toast', function () {
    $employee = User::factory()->create();

    $this->actingAs($employee)
        ->post(route('cash-advances.store'), [
            'amount' => 500_000,
            'reason' => 'Biaya pendidikan',
            'tenor_months' => 5,
        ])
        ->assertRedirect(route('cash-advances.index'))
        ->assertInertiaFlash('toast', [
            'type' => 'success',
            'message' => 'Pengajuan kasbon berhasil dikirim.',
        ]);
});

test('approving and rejecting a cash advance flash success toasts', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $employee = User::factory()->create();

    $toApprove = CashAdvance::create([
        'user_id' => $employee->id,
        'amount' => 500_000,
        'reason' => 'Biaya pendidikan',
        'tenor_months' => 5,
        'installment_amount' => 100_000,
        'status' => 'pending',
    ]);

    $this->actingAs($admin)
        ->post(route('cash-advances.approve-level1', $toApprove))
        ->assertInertiaFlash('toast', [
            'type' => 'success',
            'message' => 'Kasbon berhasil disetujui atasan.',
        ]);

    $toReject = CashAdvance::create([
        'user_id' => $employee->id,
        'amount' => 500_000,
        'reason' => 'Biaya pendidikan',
        'tenor_months' => 5,
        'installment_amount' => 100_000,
        'status' => 'pending',
    ]);

    $this->actingAs($admin)
        ->post(route('cash-advances.reject', $toReject), ['rejection_reason' => 'Tidak memenuhi syarat'])
        ->assertInertiaFlash('toast', [
            'type' => 'success',
            'message' => 'Kasbon ditolak.',
        ]);
});

test('approving a cash advance with an invalid status flashes an error toast', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $employee = User::factory()->create();

    $advance = CashAdvance::create([
        'user_id' => $employee->id,
        'amount' => 500_000,
        'reason' => 'Biaya pendidikan',
        'tenor_months' => 5,
        'installment_amount' => 100_000,
        'status' => 'rejected',
    ]);

    $this->actingAs($admin)
        ->post(route('cash-advances.approve-level1', $advance))
        ->assertInertiaFlash('toast', [
            'type' => 'error',
            'message' => 'Status kasbon tidak valid untuk persetujuan atasan.',
        ]);
});

test('submitting and approving a leave request flash success toasts', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $employee = User::factory()->create();

    $this->actingAs($employee)
        ->post(route('leave-requests.store'), [
            'type' => 'leave',
            'start_date' => Carbon::today()->toDateString(),
            'end_date' => Carbon::today()->addDay()->toDateString(),
            'reason' => 'Keperluan keluarga',
        ])
        ->assertRedirect(route('leave-requests.index'))
        ->assertInertiaFlash('toast', [
            'type' => 'success',
            'message' => 'Pengajuan cuti berhasil dikirim.',
        ]);

    $leaveRequest = LeaveRequest::first();

    $this->actingAs($admin)
        ->post(route('leave-requests.approve', $leaveRequest))
        ->assertInertiaFlash('toast', [
            'type' => 'success',
            'message' => 'Pengajuan cuti berhasil disetujui.',
        ]);
});

test('enabling two factor authentication flashes a success toast', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->withSession(['auth.password_confirmed_at' => time()])
        ->post(route('two-factor.enable'))
        ->assertInertiaFlash('toast', [
            'type' => 'success',
            'message' => 'Autentikasi dua faktor diaktifkan.',
        ]);
});

test('news create, update and delete flash success toasts', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->post(route('news.store'), [
            'title' => 'Pengumuman',
            'body' => 'Isi pengumuman',
        ])
        ->assertRedirect(route('news.index'))
        ->assertInertiaFlash('toast', [
            'type' => 'success',
            'message' => 'Berita berhasil dipublikasikan.',
        ]);

    $news = News::first();

    $this->actingAs($admin)
        ->put(route('news.update', $news), [
            'title' => 'Pengumuman Diperbarui',
            'body' => 'Isi pengumuman',
        ])
        ->assertRedirect(route('news.index'))
        ->assertInertiaFlash('toast', [
            'type' => 'success',
            'message' => 'Berita berhasil diperbarui.',
        ]);

    $this->actingAs($admin)
        ->delete(route('news.destroy', $news))
        ->assertRedirect(route('news.index'))
        ->assertInertiaFlash('toast', [
            'type' => 'success',
            'message' => 'Berita berhasil dihapus.',
        ]);
});
