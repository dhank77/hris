<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CashAdvancePayment extends Model
{
    /** @use HasFactory<Factory> */
    use HasFactory;

    protected $fillable = [
        'cash_advance_installment_id', 'code', 'amount',
    ];

    protected function casts(): array
    {
        return [
            'code' => 'integer',
            'amount' => 'decimal:2',
        ];
    }

    /** @return BelongsTo<CashAdvanceInstallment, $this> */
    public function installment(): BelongsTo
    {
        return $this->belongsTo(CashAdvanceInstallment::class, 'cash_advance_installment_id');
    }
}
