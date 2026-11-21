<?php

use App\Models\User;
use Laravel\Socialite\Contracts\Provider;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;

test('users can login via sanctum api and receive access token', function () {
    $user = User::factory()->create([
        'name' => 'Budi Santoso',
        'email' => 'budi@example.com',
        'role' => 'employee',
        'department' => 'Engineering',
        'position' => 'Software Engineer',
    ]);

    $response = $this->postJson('/api/auth/login', [
        'email' => 'budi@example.com',
        'password' => 'password',
        'device_name' => 'flutter-test',
    ]);

    $response->assertOk()
        ->assertJsonStructure([
            'access_token',
            'token_type',
            'user' => ['id', 'name', 'email', 'avatar', 'role', 'department', 'position'],
        ])
        ->assertJsonPath('user.email', 'budi@example.com')
        ->assertJsonPath('user.name', 'Budi Santoso')
        ->assertJsonPath('user.department', 'Engineering')
        ->assertJsonPath('user.position', 'Software Engineer');

    expect($user->tokens()->count())->toBe(1);
});

test('users cannot login via sanctum api with wrong password', function () {
    $user = User::factory()->create([
        'email' => 'budi@example.com',
    ]);

    $response = $this->postJson('/api/auth/login', [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $response->assertUnauthorized()
        ->assertJsonPath('message', 'Email atau password salah.');
});

test('authenticated user can fetch profile via sanctum api', function () {
    $user = User::factory()->create([
        'name' => 'Siti Aminah',
        'email' => 'siti@example.com',
    ]);

    $token = $user->createToken('flutter-test')->plainTextToken;

    $response = $this->withHeader('Authorization', 'Bearer '.$token)
        ->getJson('/api/auth/me');

    $response->assertOk()
        ->assertJsonPath('user.id', $user->id)
        ->assertJsonPath('user.name', 'Siti Aminah')
        ->assertJsonPath('user.email', 'siti@example.com');
});

test('unauthenticated user cannot fetch profile via sanctum api', function () {
    $this->getJson('/api/auth/me')->assertUnauthorized();
});

test('authenticated user can logout and revoke current sanctum token', function () {
    $user = User::factory()->create();
    $token = $user->createToken('flutter-test')->plainTextToken;

    $response = $this->withHeader('Authorization', 'Bearer '.$token)
        ->postJson('/api/auth/logout');

    $response->assertOk()
        ->assertJsonPath('message', 'Berhasil keluar.');

    expect($user->tokens()->count())->toBe(0);
});

test('registered employee with matching google_id can login via google api', function () {
    $user = User::factory()->create([
        'name' => 'Budi Google',
        'email' => 'budi.google@example.com',
        'google_id' => 'google-uid-12345',
        'role' => 'employee',
    ]);

    $socialiteUser = Mockery::mock(SocialiteUser::class);
    $socialiteUser->shouldReceive('getId')->andReturn('google-uid-12345');
    $socialiteUser->shouldReceive('getEmail')->andReturn('budi.google@example.com');
    $socialiteUser->shouldReceive('getAvatar')->andReturn('https://lh3.googleusercontent.com/avatar');

    $provider = Mockery::mock(Provider::class);
    $provider->shouldReceive('userFromToken')->with('fake-google-id-token')->andReturn($socialiteUser);
    Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

    $response = $this->postJson('/api/auth/google', [
        'id_token' => 'fake-google-id-token',
        'device_name' => 'flutter-test',
    ]);

    $response->assertOk()
        ->assertJsonStructure([
            'access_token',
            'token_type',
            'user' => ['id', 'name', 'email', 'avatar', 'role', 'department', 'position'],
        ])
        ->assertJsonPath('user.id', $user->id)
        ->assertJsonPath('user.email', 'budi.google@example.com');

    expect($user->tokens()->count())->toBe(1);
});

test('registered employee without google_id links google_id on first google api login', function () {
    $user = User::factory()->create([
        'email' => 'unlinked@example.com',
        'google_id' => null,
        'avatar' => null,
    ]);

    $socialiteUser = Mockery::mock(SocialiteUser::class);
    $socialiteUser->shouldReceive('getId')->andReturn('google-uid-99999');
    $socialiteUser->shouldReceive('getEmail')->andReturn('unlinked@example.com');
    $socialiteUser->shouldReceive('getAvatar')->andReturn('https://lh3.googleusercontent.com/new-avatar');

    $provider = Mockery::mock(Provider::class);
    $provider->shouldReceive('userFromToken')->with('valid-google-token')->andReturn($socialiteUser);
    Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

    $response = $this->postJson('/api/auth/google', [
        'id_token' => 'valid-google-token',
    ]);

    $response->assertOk()
        ->assertJsonPath('user.email', 'unlinked@example.com');

    $fresh = $user->fresh();
    expect($fresh->google_id)->toBe('google-uid-99999')
        ->and($fresh->avatar)->toBe('https://lh3.googleusercontent.com/new-avatar');
});

test('unregistered google user is rejected with 403 on google api login', function () {
    $socialiteUser = Mockery::mock(SocialiteUser::class);
    $socialiteUser->shouldReceive('getId')->andReturn('google-uid-unknown');
    $socialiteUser->shouldReceive('getEmail')->andReturn('unknown@example.com');
    $socialiteUser->shouldReceive('getAvatar')->andReturn(null);

    $provider = Mockery::mock(Provider::class);
    $provider->shouldReceive('userFromToken')->with('unknown-user-token')->andReturn($socialiteUser);
    Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

    $response = $this->postJson('/api/auth/google', [
        'id_token' => 'unknown-user-token',
    ]);

    $response->assertForbidden()
        ->assertJsonPath('message', 'Akun Google Anda belum terdaftar sebagai pegawai. Silakan hubungi admin atau HR.');
});

test('invalid google token returns 401 on google api login', function () {
    $provider = Mockery::mock(Provider::class);
    $provider->shouldReceive('userFromToken')->with('bad-token')->andThrow(new Exception('Invalid token'));
    Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

    $response = $this->postJson('/api/auth/google', [
        'id_token' => 'bad-token',
    ]);

    $response->assertUnauthorized()
        ->assertJsonPath('message', 'Gagal memverifikasi akun Google. Silakan coba lagi.');
});
