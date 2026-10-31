<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CashAdvanceInstallment extends Model
{
    /** @use HasFactory<Factory> */
    use HasFactory;

    protected $fillable = [
        'cash_advance_id', 'period_number', 'due_date', 'amount', 'paid', 'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'amount' => 'decimal:2',
            'paid' => 'boolean',
            'paid_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<CashAdvance, $this> */
    public function cashAdvance(): BelongsTo
    {
        return $this->belongsTo(CashAdvance::class);
    }
}
