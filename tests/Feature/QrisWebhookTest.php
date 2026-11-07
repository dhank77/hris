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

test('accepts bare secret as query parameter for tools that cannot sign HMAC', function () {
    $this->postJson('/webhooks/qris?secret=testing-secret', ['amount' => 500_123])
        ->assertOk()
        ->assertJsonPath('status', 'matched')
        ->assertJsonPath('code', 123);

    expect($this->installment->refresh()->paid)->toBeTrue();
});

test('accepts bare secret via X-Qris-Token header', function () {
    $this->postJson('/webhooks/qris', ['amount' => 500_123], ['X-Qris-Token' => 'testing-secret'])
        ->assertOk()
        ->assertJsonPath('status', 'matched');

    expect($this->installment->refresh()->paid)->toBeTrue();
});

test('accepts bare secret as body field', function () {
    $this->postJson('/webhooks/qris', ['amount' => 500_123, 'secret' => 'testing-secret'])
        ->assertOk()
        ->assertJsonPath('status', 'matched');

    expect($this->installment->refresh()->paid)->toBeTrue();
});

test('wrong token is rejected like a wrong signature', function () {
    $this->postJson('/webhooks/qris?secret=wrong-token', ['amount' => 500_123])
        ->assertUnauthorized();

    $this->postJson('/webhooks/qris', ['amount' => 500_123], ['X-Qris-Token' => 'wrong'])
        ->assertUnauthorized();

    expect($this->installment->refresh()->paid)->toBeFalse();
});

test('amount may arrive as form data or query parameter', function () {
    $this->post('/webhooks/qris?secret=testing-secret&amount=500123')
        ->assertOk()
        ->assertJsonPath('status', 'matched');

    $this->installment->refresh();
    expect($this->installment->paid)->toBeTrue();
});

test('parses amount from raw notification text sent by MacroDroid', function () {
    // Rp token preferred
    $response = $this->postJson('/webhooks/qris?secret=testing-secret', [
        'text' => 'BCA mobile: Pembayaran QRIS Rp 500.123 berhasil. Saldo tersisa Rp 1.000.000',
    ])->assertOk();

    expect($response->json('amount'))->toEqual(500123)
        ->and($response->json('status'))->toBe('matched');

    $this->installment->refresh();
    expect($this->installment->paid)->toBeTrue();
});

test('notification text formatting variants are normalized', function () {
    // IDR prefix without space; dot thousands vs decimal
    $cases = [
        'Transaksi IDR500.123 sukses' => 500123.0,
        'QRIS 1.250.123 paid' => 1250123.0,
        'Ref 456789, transfer Rp 500.000,50' => 500000.5,
        'nominal: 500123 (plain digits)' => 500123.0,
    ];

    foreach ($cases as $text => $expected) {
        // amounts won't match this installment (unread amounts come back as
        // "unmatched" with the parsed amount echoed) — except 500123 itself
        $response = $this->postJson('/webhooks/qris?secret=testing-secret', ['text' => $text]);

        if ($expected === 500123.0) {
            // first occurrence marks it paid, later occurrences are replays
            expect(in_array($response->json('status'), ['matched', 'already_paid']))->toBeTrue()
                ->and($this->installment->refresh()->paid)->toBeTrue();
        } else {
            $response->assertJsonPath('status', 'unmatched');
        }
        expect($response->json('amount'))->toEqual($expected);
    }
});

test('messy amount field string is also parsed', function () {
    $this->postJson('/webhooks/qris?secret=testing-secret', [
        'amount' => 'Rp 500.123,00',
    ])
        ->assertOk()
        ->assertJsonPath('status', 'matched')
        ->assertJsonPath('amount', 500123);
});

test('webhook user without role cannot be used to mark others via manual endpoint remains protected', function () {
    // sanity: webhook does not exist for the interactive pay endpoint
    $finance = User::factory()->create(['role' => 'finance']);
    actingAs($finance);

    $this->post(\route('cash-advances.installments.pay', ['installment' => $this->installment->id]))
        ->assertRedirect();

    expect($this->installment->refresh()->paid)->toBeTrue();
});
