<?php

use App\Models\CashAdvance;
use App\Models\CashAdvanceInstallment;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Carbon;
use QrisDinamis\Crc16;

function qrisStaticForTest(): string
{
    $parts = [
        '00' => '01',
        '01' => '11',
        '26' => '0015ID.BCA.WWW0211DUMMY-1234',
        '52' => '5812',
        '53' => '360',
        '58' => 'ID',
        '59' => 'PT CAHAYA ABADI',
        '60' => 'MAKASSAR',
    ];
    $str = '';
    foreach ($parts as $tag => $value) {
        $str .= $tag.str_pad((string) strlen($value), 2, '0', STR_PAD_LEFT).$value;
    }

    return $str.'6304'.Crc16::calculate($str.'6304');
}

function disbursedAdvance(User $owner, int $tenor = 2): CashAdvance
{
    $advance = CashAdvance::create([
        'user_id' => $owner->id,
        'amount' => 1_000_000,
        'reason' => 'tunjangan biaya',
        'tenor_months' => $tenor,
        'installment_amount' => 1_000_000 / $tenor,
        'status' => 'disbursed',
        'disbursed_at' => Carbon::now(),
    ]);

    foreach (range(1, $tenor) as $period) {
        CashAdvanceInstallment::create([
            'cash_advance_id' => $advance->id,
            'period_number' => $period,
            'due_date' => Carbon::today()->addMonths($period - 1),
            'amount' => 1_000_000 / $tenor,
            'paid' => false,
        ]);
    }

    return $advance;
}

test('employee cannot mark own installment paid but can generate qris with unique code', function () {
    $employee = User::factory()->create();
    $advance = disbursedAdvance($employee);
    $installment = $advance->installments()->first();
    Setting::put('qris_static_payload', qrisStaticForTest());

    $this->actingAs($employee);

    $this->post(route('cash-advances.installments.pay', ['installment' => $installment->id]))
        ->assertForbidden();

    $response = $this->post(route('cash-advances.installments.qris', ['installment' => $installment->id]));

    $data = $response->json();
    $base = (int) $installment->amount;

    $response->assertOk();
    expect($data['base_amount'])->toBe($base)
        ->and($data['amount'])->toBe($base + $data['code'])
        ->and($data['code'])->toBeInt()->toBeGreaterThanOrEqual(1)->toBeLessThanOrEqual(999)
        ->and($data['image'])->toStartWith('data:image/')
        ->and($data['merchant'])->toBe('PT CAHAYA ABADI');

    // pressing again reuses the same pinned code and does not add a new row
    $this->post(route('cash-advances.installments.qris', ['installment' => $installment->id]))
        ->assertOk()
        ->assertJson(['code' => $data['code'], 'amount' => $data['amount']]);

    expect($installment->payments()->count())->toBe(1)
        ->and($data['base_amount'])->toBe($base)
        ->and(CashAdvanceInstallment::query()->find($installment->id)->paid)->toBeFalse();
});

test('employee cannot generate qris of anothers installment', function () {
    $employee = User::factory()->create();
    $other = User::factory()->create();
    $advance = disbursedAdvance($other);
    $installment = $advance->installments()->first();

    $this->actingAs($employee);

    $this->post(route('cash-advances.installments.qris', ['installment' => $installment->id]))
        ->assertForbidden();
});

test('finance can mark installment paid and advance completes when all paid', function () {
    $employee = User::factory()->create(['kasbon_used' => 1_000_000]);
    $finance = User::factory()->create(['role' => 'finance']);
    $advance = disbursedAdvance($employee);
    $installment = $advance->installments()->first();

    $this->actingAs($finance);

    $this->post(route('cash-advances.installments.pay', ['installment' => $installment->id]));

    expect(CashAdvanceInstallment::query()->find($installment->id)->paid)->toBeTrue();

    $second = $advance->installments()->where('id', '!=', $installment->id)->first();
    $this->post(route('cash-advances.installments.pay', ['installment' => $second->id]));

    $advance->refresh();
    $employee->refresh();

    expect($advance->status)->toBe('completed')
        ->and($employee->kasbon_used)->toBe('0.00');
});

test('only admin can save qris settings', function () {
    $employee = User::factory()->create();
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($employee);
    $this->put(route('qris.update'), ['qris_payload' => qrisStaticForTest()])
        ->assertForbidden();

    $this->actingAs($admin);
    $this->put(route('qris.update'), ['qris_payload' => 'not-a-qris'])
        ->assertSessionHasErrors('qris_payload');

    $this->put(route('qris.update'), ['qris_payload' => qrisStaticForTest()])
        ->assertRedirect(route('qris.edit'));

    expect(Setting::get('qris_static_payload'))->toBe(qrisStaticForTest());
});
