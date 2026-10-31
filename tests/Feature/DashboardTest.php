<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('dashboard exposes today, recap, leave and kasbon summaries', function () {
    $this->actingAs(User::factory()->create());

    $this->get(route('dashboard'))->assertInertia(fn (Assert $page) => $page
        ->component('dashboard')
        ->has('today')
        ->has('monthRecap')
        ->where('pendingLeaveCount', 0)
        ->where('kasbon.active', null)
    );
});
