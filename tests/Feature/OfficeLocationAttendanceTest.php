<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\User;
use App\Services\OfficeLocationService;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OfficeLocationAttendanceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Setting::$cache = [];
        $this->withoutMiddleware(ValidateCsrfToken::class);
    }

    public function test_admin_can_update_office_location_settings(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->get(route('office-location.edit'))
            ->assertOk();

        $this->actingAs($admin)
            ->put(route('office-location.update'), [
                'office_name' => 'Kantor Jakarta',
                'office_latitude' => -6.2088,
                'office_longitude' => 106.8456,
                'office_radius_meters' => 150,
            ])
            ->assertRedirect(route('office-location.edit'));

        $settings = app(OfficeLocationService::class)->getSettings();
        $this->assertTrue($settings['is_configured']);
        $this->assertSame('Kantor Jakarta', $settings['name']);
        $this->assertEqualsWithDelta(-6.2088, $settings['latitude'], 0.0001);
        $this->assertEqualsWithDelta(106.8456, $settings['longitude'], 0.0001);
        $this->assertSame(150, $settings['radius_meters']);
    }

    public function test_employee_cannot_access_office_location_settings(): void
    {
        $employee = User::factory()->create(['role' => 'employee']);

        $this->actingAs($employee)
            ->get(route('office-location.edit'))
            ->assertForbidden();

        $this->actingAs($employee)
            ->put(route('office-location.update'), [
                'office_name' => 'Kantor',
                'office_latitude' => -6.2,
                'office_longitude' => 106.8,
                'office_radius_meters' => 100,
            ])
            ->assertForbidden();
    }

    public function test_api_attendance_clock_in_requires_configured_office_and_within_radius(): void
    {
        $employee = User::factory()->create(['role' => 'employee']);
        Sanctum::actingAs($employee);

        $embedding = array_fill(0, 192, 0.0);
        $embedding[0] = 1.0;

        // Belum registrasi wajah -> 422
        $this->postJson('/api/attendance/clock-in', [
            'latitude' => -6.2088,
            'longitude' => 106.8456,
            'face_embedding' => $embedding,
        ])->assertStatus(422);

        // Registrasi wajah pegawai
        $this->postJson('/api/face/register', ['embedding' => $embedding])->assertOk();

        // Belum dikonfigurasi -> 422
        $this->postJson('/api/attendance/clock-in', [
            'latitude' => -6.2088,
            'longitude' => 106.8456,
            'face_embedding' => $embedding,
        ])->assertStatus(422);

        // Konfigurasi kantor di Monas (-6.175392, 106.827153) radius 100m
        app(OfficeLocationService::class)->saveSettings(
            name: 'Kantor Monas',
            latitude: -6.175392,
            longitude: 106.827153,
            radiusMeters: 100,
        );

        // Wajah tidak cocok -> 422
        $wrongEmbedding = array_fill(0, 192, 0.0);
        $wrongEmbedding[5] = 1.0;
        $this->postJson('/api/attendance/clock-in', [
            'latitude' => -6.175500,
            'longitude' => 106.827200,
            'face_embedding' => $wrongEmbedding,
        ])->assertStatus(422);

        // Di luar radius (~3.7 km jauhnya) -> 422
        $this->postJson('/api/attendance/clock-in', [
            'latitude' => -6.2088,
            'longitude' => 106.8456,
            'face_embedding' => $embedding,
        ])->assertStatus(422)
            ->assertJsonStructure(['message', 'distance_meters', 'radius_meters']);

        // Di dalam radius (~20 meter dari titik kantor) + wajah cocok -> 200
        $this->postJson('/api/attendance/clock-in', [
            'latitude' => -6.175500,
            'longitude' => 106.827200,
            'notes' => 'Hadir tepat waktu',
            'face_embedding' => $embedding,
        ])->assertOk()
            ->assertJsonPath('attendance.notes', 'Hadir tepat waktu');

        // Today endpoint mengembalikan attendance dan office_location
        $this->getJson('/api/attendance/today')
            ->assertOk()
            ->assertJsonPath('office_location.name', 'Kantor Monas')
            ->assertJsonPath('office_location.radius_meters', 100)
            ->assertJsonPath('attendance.notes', 'Hadir tepat waktu');

        // Clock out di luar radius -> 422
        $this->postJson('/api/attendance/clock-out', [
            'latitude' => -6.2088,
            'longitude' => 106.8456,
            'face_embedding' => $embedding,
        ])->assertStatus(422);

        // Clock out di dalam radius + wajah cocok -> 200
        $this->postJson('/api/attendance/clock-out', [
            'latitude' => -6.175450,
            'longitude' => 106.827180,
            'face_embedding' => $embedding,
        ])->assertOk();

        // History endpoint mengembalikan 1 record
        $this->getJson('/api/attendance/history')
            ->assertOk()
            ->assertJsonCount(1, 'attendances');
    }
}
