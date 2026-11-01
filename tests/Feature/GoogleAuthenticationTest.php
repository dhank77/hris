<?php

use App\Models\User;
use Laravel\Socialite\Contracts\Provider;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;

test('google redirect route redirects to google oauth', function () {
    $response = $this->get(route('auth.google.redirect'));

    $response->assertRedirect();
    expect($response->headers->get('Location'))->toContain('accounts.google.com');
});

test('unregistered google user cannot authenticate and is redirected to login', function () {
    $abstractUser = Mockery::mock(SocialiteUser::class);
    $abstractUser->shouldReceive('getId')->andReturn('google-id-unregistered');
    $abstractUser->shouldReceive('getName')->andReturn('Unregistered User');
    $abstractUser->shouldReceive('getEmail')->andReturn('unregistered@example.com');
    $abstractUser->shouldReceive('getAvatar')->andReturn('https://lh3.googleusercontent.com/avatar');
    $abstractUser->shouldReceive('getNickname')->andReturn('unregistered');

    $provider = Mockery::mock(Provider::class);
    $provider->shouldReceive('user')->andReturn($abstractUser);

    Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

    $response = $this->get(route('auth.google.callback'));

    $this->assertGuest();
    $response->assertRedirect(route('login'));
    $response->assertSessionHasErrors(['email']);

    $user = User::where('email', 'unregistered@example.com')->first();
    expect($user)->toBeNull();
});

test('registered employee can link google account and authenticate', function () {
    $existingUser = User::factory()->create([
        'email' => 'employee@example.com',
        'google_id' => null,
    ]);

    $abstractUser = Mockery::mock(SocialiteUser::class);
    $abstractUser->shouldReceive('getId')->andReturn('google-id-12345');
    $abstractUser->shouldReceive('getName')->andReturn('Registered Employee');
    $abstractUser->shouldReceive('getEmail')->andReturn('employee@example.com');
    $abstractUser->shouldReceive('getAvatar')->andReturn('https://lh3.googleusercontent.com/avatar12345');
    $abstractUser->shouldReceive('getNickname')->andReturn(null);

    $provider = Mockery::mock(Provider::class);
    $provider->shouldReceive('user')->andReturn($abstractUser);

    Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

    $response = $this->get(route('auth.google.callback'));

    $this->assertAuthenticatedAs($existingUser);
    $response->assertRedirect(route('dashboard', absolute: false));

    expect($existingUser->fresh()->google_id)->toBe('google-id-12345');
});

test('registered employee with existing google_id can authenticate directly', function () {
    $existingUser = User::factory()->create([
        'email' => 'employee-linked@example.com',
        'google_id' => 'google-id-linked',
    ]);

    $abstractUser = Mockery::mock(SocialiteUser::class);
    $abstractUser->shouldReceive('getId')->andReturn('google-id-linked');
    $abstractUser->shouldReceive('getName')->andReturn('Linked Employee');
    $abstractUser->shouldReceive('getEmail')->andReturn('employee-linked@example.com');
    $abstractUser->shouldReceive('getAvatar')->andReturn(null);
    $abstractUser->shouldReceive('getNickname')->andReturn(null);

    $provider = Mockery::mock(Provider::class);
    $provider->shouldReceive('user')->andReturn($abstractUser);

    Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

    $response = $this->get(route('auth.google.callback'));

    $this->assertAuthenticatedAs($existingUser);
    $response->assertRedirect(route('dashboard', absolute: false));
});

test('google oauth failure redirects back to login with error', function () {
    $provider = Mockery::mock(Provider::class);
    $provider->shouldReceive('user')->andThrow(new Exception('OAuth cancelled'));

    Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

    $response = $this->get(route('auth.google.callback'));

    $this->assertGuest();
    $response->assertRedirect(route('login'));
    $response->assertSessionHasErrors(['email']);
});
