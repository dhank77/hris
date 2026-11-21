<?php

use App\Models\User;

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
