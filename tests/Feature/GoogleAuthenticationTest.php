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

test('new user can authenticate with google callback', function () {
    $abstractUser = Mockery::mock(SocialiteUser::class);
    $abstractUser->shouldReceive('getId')->andReturn('google-id-12345');
    $abstractUser->shouldReceive('getName')->andReturn('John Doe');
    $abstractUser->shouldReceive('getEmail')->andReturn('john.doe@example.com');
    $abstractUser->shouldReceive('getAvatar')->andReturn('https://lh3.googleusercontent.com/avatar');
    $abstractUser->shouldReceive('getNickname')->andReturn('johndoe');

    $provider = Mockery::mock(Provider::class);
    $provider->shouldReceive('user')->andReturn($abstractUser);

    Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

    $response = $this->get(route('auth.google.callback'));

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));

    $user = User::where('email', 'john.doe@example.com')->first();
    expect($user)->not->toBeNull()
        ->and($user->google_id)->toBe('google-id-12345')
        ->and($user->name)->toBe('John Doe')
        ->and($user->avatar)->toBe('https://lh3.googleusercontent.com/avatar');
});

test('existing user can link google account and authenticate', function () {
    $existingUser = User::factory()->create([
        'email' => 'existing@example.com',
        'google_id' => null,
    ]);

    $abstractUser = Mockery::mock(SocialiteUser::class);
    $abstractUser->shouldReceive('getId')->andReturn('google-id-999');
    $abstractUser->shouldReceive('getName')->andReturn('Existing User');
    $abstractUser->shouldReceive('getEmail')->andReturn('existing@example.com');
    $abstractUser->shouldReceive('getAvatar')->andReturn('https://lh3.googleusercontent.com/avatar999');
    $abstractUser->shouldReceive('getNickname')->andReturn(null);

    $provider = Mockery::mock(Provider::class);
    $provider->shouldReceive('user')->andReturn($abstractUser);

    Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

    $response = $this->get(route('auth.google.callback'));

    $this->assertAuthenticatedAs($existingUser);
    $response->assertRedirect(route('dashboard', absolute: false));

    expect($existingUser->fresh()->google_id)->toBe('google-id-999');
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
