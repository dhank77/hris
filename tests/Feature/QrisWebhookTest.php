<?php

use App\Models\CashAdvance;
use App\Models\CashAdvanceInstallment;
use App\Models\CashAdvancePayment;
use App\Models\User;
use Illuminate\Support\Carbon;

use function Pest\Laravel\actingAs;

beforeEach(function () {
    config(['services.qris.webhook_secret' => 'testing-secret']);

    $this->employee = User::factory()->create(['kasbon_used' => 1_000_000]);
    $advance = CashAdvance::create([
        'user_id' => $this->employee->id,
        'amount' => 1_000_000,
        'reason' => 'tunjangan biaya',
        'tenor_months' => 2,
        'installment_amount' => 500_000,
        'status' => 'disbursed',
        'disbursed_at' => Carbon::now(),
    ]);
    $this->installment = CashAdvanceInstallment::create([
        'cash_advance_id' => $advance->id,
        'period_number' => 1,
        'due_date' => Carbon::today(),
        'amount' => 500_000,
        'paid' => false,
    ]);
    $this->payment = CashAdvancePayment::create([
        'cash_advance_installment_id' => $this->installment->id,
        'code' => 123,
        'amount' => 500_123,
    ]);
});

function qrisSign(array $payload, string $secret = 'testing-secret'): array
{
    $body = json_encode($payload, JSON_UNESCAPED_SLASHES);

    return [
        'X-Qris-Signature' => hash_hmac('sha256', $body, $secret),
    ];
}

test('signed webhook with matching amount marks installment paid', function () {
    $payload = ['amount' => 500_123];

    $response = $this->postJson('/webhooks/qris', $payload, qrisSign($payload));

    $response->assertOk()
        ->assertJsonPath('status', 'matched')
        ->assertJsonPath('code', 123)
        ->assertJsonPath('installment_id', $this->installment->id);

    $this->installment->refresh();
    $this->employee->refresh();

    expect($this->installment->paid)->toBeTrue()
        ->and($this->installment->paid_at)->not->toBeNull()
        ->and($this->employee->kasbon_used)->toBe('0.00');
});

test('rejects unsigned or incorrect signature', function () {
    $this->postJson('/webhooks/qris', ['amount' => 500_123])
        ->assertUnauthorized();

    $this->postJson('/webhooks/qris', ['amount' => 500_123], ['X-Qris-Signature' => 'wrong'])
        ->assertUnauthorized();

    expect($this->installment->refresh()->paid)->toBeFalse();
});

test('rejects when webhook secret is not configured', function () {
    config(['services.qris.webhook_secret' => null]);

    $payload = ['amount' => 500_123];
    $this->postJson('/webhooks/qris', $payload, qrisSign($payload))
        ->assertServiceUnavailable();

    expect($this->installment->refresh()->paid)->toBeFalse();
});

test('unknown amount is acknowledged as unmatched and nothing changes', function () {
    $payload = ['amount' => 999_999];

    $this->postJson('/webhooks/qris', $payload, qrisSign($payload))
        ->assertOk()
        ->assertJsonPath('status', 'unmatched');

    expect($this->installment->refresh()->paid)->toBeFalse();
});

test('replaying the same notification is idempotent', function () {
    $payload = ['amount' => 500_123];

    $this->postJson('/webhooks/qris', $payload, qrisSign($payload))->assertOk();
    $this->postJson('/webhooks/qris', $payload, qrisSign($payload))
        ->assertOk()
        ->assertJsonPath('status', 'already_paid');

    expect($this->installment->refresh()->paid)->toBeTrue();
});

test('accepts alternative amount keys like gross_amount', function () {
    $payload = ['gross_amount' => 500_123];

    $this->postJson('/webhooks/qris', $payload, qrisSign($payload))
        ->assertOk()
        ->assertJsonPath('status', 'matched');
});

test('webhook user without role cannot be used to mark others via manual endpoint remains protected', function () {
    // sanity: webhook does not exist for the interactive pay endpoint
    $finance = User::factory()->create(['role' => 'finance']);
    actingAs($finance);

    $this->post(\route('cash-advances.installments.pay', ['installment' => $this->installment->id]))
        ->assertRedirect();

    expect($this->installment->refresh()->paid)->toBeTrue();
});
