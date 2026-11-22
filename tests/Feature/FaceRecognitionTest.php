<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FaceRecognitionTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_check_unregistered_face_status(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/face');

        $response->assertOk()
            ->assertJson([
                'registered' => false,
                'can_reregister' => true,
                'face_profile' => null,
            ]);
    }

    public function test_user_can_register_once_and_needs_admin_approval_to_reregister(): void
    {
        $employee = User::factory()->create(['role' => 'employee']);
        $admin = User::factory()->create(['role' => 'admin']);

        Sanctum::actingAs($employee);

        $embedding = array_fill(0, 192, 0.0);
        $embedding[0] = 3.0;
        $embedding[1] = 4.0;

        // Registrasi pertama berhasil
        $this->postJson('/api/face/register', [
            'embedding' => $embedding,
            'model_version' => 'mobilefacenet',
        ])->assertOk()
            ->assertJson([
                'registered' => true,
                'can_reregister' => false,
            ]);

        // Registrasi kedua tanpa izin admin ditolak (403)
        $this->postJson('/api/face/register', [
            'embedding' => $embedding,
        ])->assertForbidden();

        // Pegawai biasa tidak bisa menghapus data wajah (403)
        $this->deleteJson('/api/face')->assertForbidden();

        // Pegawai biasa tidak bisa memberi izin registrasi ulang (403)
        $this->postJson("/api/face/{$employee->id}/allow-reregister")->assertForbidden();

        // Admin mengizinkan registrasi ulang
        Sanctum::actingAs($admin);
        $this->postJson("/api/face/{$employee->id}/allow-reregister")
            ->assertOk()
            ->assertJson(['can_reregister' => true]);

        // Pegawai kini dapat registrasi ulang sekali lagi, lalu terkunci kembali
        Sanctum::actingAs($employee);
        $newEmbedding = array_fill(0, 192, 0.0);
        $newEmbedding[2] = 5.0;

        $this->postJson('/api/face/register', [
            'embedding' => $newEmbedding,
        ])->assertOk()
            ->assertJson([
                'registered' => true,
                'can_reregister' => false,
            ]);

        $this->postJson('/api/face/register', [
            'embedding' => $newEmbedding,
        ])->assertForbidden();
    }

    public function test_user_can_verify_matching_face_embedding(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $embedding = array_fill(0, 192, 0.0);
        $embedding[0] = 3.0;
        $embedding[1] = 4.0;

        $this->postJson('/api/face/register', ['embedding' => $embedding])->assertOk();

        $this->postJson('/api/face/verify', ['embedding' => $embedding])
            ->assertOk()
            ->assertJson(['matched' => true]);

        $otherEmbedding = array_fill(0, 192, 0.0);
        $otherEmbedding[10] = 1.0;

        $this->postJson('/api/face/verify', ['embedding' => $otherEmbedding])
            ->assertOk()
            ->assertJson(['matched' => false]);
    }

    public function test_admin_can_delete_own_face_profile(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $embedding = array_fill(0, 192, 1.0);
        $this->postJson('/api/face/register', ['embedding' => $embedding])->assertOk();

        $this->deleteJson('/api/face')
            ->assertOk()
            ->assertJson(['registered' => false]);

        $this->assertDatabaseMissing('face_profiles', ['user_id' => $admin->id]);
    }
}
