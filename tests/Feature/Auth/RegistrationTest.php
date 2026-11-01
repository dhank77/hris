<?php

test('registration screen cannot be rendered because registration is disabled', function () {
    $response = $this->get('/register');

    $response->assertNotFound();
});

test('new users cannot register via post request', function () {
    $response = $this->post('/register', [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertNotFound();
});
