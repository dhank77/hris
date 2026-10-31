<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CashAdvance extends Model
{
    /** @use HasFactory<Factory> */
    use HasFactory;

    protected $fillable = [
        'user_id', 'amount', 'reason', 'tenor_months', 'installment_amount',
        'status', 'approved_level1_by', 'approved_level1_at',
        'approved_finance_by', 'approved_finance_at', 'rejection_reason', 'disbursed_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'installment_amount' => 'decimal:2',
            'approved_level1_at' => 'datetime',
            'approved_finance_at' => 'datetime',
            'disbursed_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<User, $this> */
    public function level1Approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_level1_by');
    }

    /** @return BelongsTo<User, $this> */
    public function financeApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_finance_by');
    }

    /** @return HasMany<CashAdvanceInstallment, $this> */
    public function installments(): HasMany
    {
        return $this->hasMany(CashAdvanceInstallment::class);
    }
}
