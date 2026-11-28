<?php

namespace Tests\Feature;

use App\Models\LeaveRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LeaveRequestApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_can_submit_and_list_leave_requests(): void
    {
        $employee = User::factory()->create(['role' => 'employee']);
        Sanctum::actingAs($employee);

        $createResponse = $this->postJson('/api/leave-requests', [
            'type' => 'leave',
            'start_date' => '2026-12-01',
            'end_date' => '2026-12-03',
            'reason' => 'Keperluan keluarga di luar kota',
        ]);

        $createResponse->assertCreated()
            ->assertJsonPath('leave_request.type', 'leave')
            ->assertJsonPath('leave_request.start_date', '2026-12-01')
            ->assertJsonPath('leave_request.end_date', '2026-12-03')
            ->assertJsonPath('leave_request.days', 3)
            ->assertJsonPath('leave_request.status', 'pending');

        $this->assertDatabaseHas('leave_requests', [
            'user_id' => $employee->id,
            'type' => 'leave',
            'status' => 'pending',
        ]);

        $listResponse = $this->getJson('/api/leave-requests');

        $listResponse->assertOk()
            ->assertJsonCount(1, 'leave_requests')
            ->assertJsonPath('summary.pending', 1)
            ->assertJsonPath('summary.total', 1);
    }

    public function test_store_validates_dates_and_type(): void
    {
        $employee = User::factory()->create(['role' => 'employee']);
        Sanctum::actingAs($employee);

        $this->postJson('/api/leave-requests', [
            'type' => 'invalid',
            'start_date' => '2026-12-05',
            'end_date' => '2026-12-01',
            'reason' => '',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['type', 'end_date', 'reason']);
    }

    public function test_employee_can_cancel_own_pending_request_but_not_approved(): void
    {
        $employee = User::factory()->create(['role' => 'employee']);
        $other = User::factory()->create(['role' => 'employee']);

        $pending = LeaveRequest::create([
            'user_id' => $employee->id,
            'type' => 'permission',
            'start_date' => '2026-12-10',
            'end_date' => '2026-12-10',
            'reason' => 'Urusan administrasi',
            'status' => 'pending',
        ]);

        $approved = LeaveRequest::create([
            'user_id' => $employee->id,
            'type' => 'sick',
            'start_date' => '2026-12-11',
            'end_date' => '2026-12-11',
            'reason' => 'Demam',
            'status' => 'approved',
        ]);

        Sanctum::actingAs($other);
        $this->deleteJson("/api/leave-requests/{$pending->id}")->assertForbidden();

        Sanctum::actingAs($employee);
        $this->deleteJson("/api/leave-requests/{$approved->id}")->assertUnprocessable();
        $this->deleteJson("/api/leave-requests/{$pending->id}")->assertOk();

        $this->assertDatabaseMissing('leave_requests', ['id' => $pending->id]);
    }

    public function test_employee_can_upload_attachment_and_delete_removes_file(): void
    {
        Storage::fake('public');

        $employee = User::factory()->create(['role' => 'employee']);
        Sanctum::actingAs($employee);

        $file = UploadedFile::fake()->create('surat-dokter.pdf', 256, 'application/pdf');

        $response = $this->post('/api/leave-requests', [
            'type' => 'sick',
            'start_date' => '2026-12-15',
            'end_date' => '2026-12-16',
            'reason' => 'Rawat jalan dengan surat dokter',
            'attachment' => $file,
        ], ['Accept' => 'application/json']);

        $response->assertCreated()
            ->assertJsonPath('leave_request.type', 'sick')
            ->assertJsonPath('leave_request.days', 2);

        $leaveRequest = LeaveRequest::firstOrFail();
        $this->assertNotNull($leaveRequest->attachment);
        Storage::disk('public')->assertExists($leaveRequest->attachment);
        $this->assertNotNull($response->json('leave_request.attachment_url'));

        $this->deleteJson("/api/leave-requests/{$leaveRequest->id}")->assertOk();
        Storage::disk('public')->assertMissing($leaveRequest->attachment);
    }
}
