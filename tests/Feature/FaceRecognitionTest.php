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
                'face_profile' => null,
            ]);
    }

    public function test_user_can_register_and_verify_matching_face_embedding(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $embedding = array_fill(0, 192, 0.0);
        $embedding[0] = 3.0;
        $embedding[1] = 4.0;

        $registerResponse = $this->postJson('/api/face/register', [
            'embedding' => $embedding,
            'model_version' => 'mobilefacenet',
        ]);

        $registerResponse->assertOk()
            ->assertJson([
                'registered' => true,
            ])
            ->assertJsonStructure([
                'message',
                'registered',
                'face_profile' => ['id', 'model_version', 'registered_at', 'embedding'],
            ]);

        $this->assertDatabaseHas('face_profiles', [
            'user_id' => $user->id,
            'model_version' => 'mobilefacenet',
        ]);

        // Verify with matching embedding
        $verifyMatch = $this->postJson('/api/face/verify', [
            'embedding' => $embedding,
        ]);

        $verifyMatch->assertOk()
            ->assertJson([
                'matched' => true,
            ]);

        // Verify with non-matching orthogonal embedding
        $otherEmbedding = array_fill(0, 192, 0.0);
        $otherEmbedding[10] = 1.0;

        $verifyMismatch = $this->postJson('/api/face/verify', [
            'embedding' => $otherEmbedding,
        ]);

        $verifyMismatch->assertOk()
            ->assertJson([
                'matched' => false,
            ]);
    }

    public function test_user_can_delete_face_profile(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $embedding = array_fill(0, 192, 1.0);
        $this->postJson('/api/face/register', ['embedding' => $embedding])->assertOk();

        $this->deleteJson('/api/face')
            ->assertOk()
            ->assertJson(['registered' => false]);

        $this->assertDatabaseMissing('face_profiles', ['user_id' => $user->id]);
    }
}
