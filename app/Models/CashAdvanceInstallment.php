<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

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

    /** @return HasMany<CashAdvancePayment, $this> */
    public function payments(): HasMany
    {
        return $this->hasMany(CashAdvancePayment::class, 'cash_advance_installment_id');
    }

    /**
     * Mark this installment paid, complete the advance when it is the last
     * unpaid one, and release the employee's kasbon limit.
     */
    public function markAsPaid(): void
    {
        $this->update(['paid' => true, 'paid_at' => Carbon::now()]);

        $advance = $this->cashAdvance;
        if ($advance->installments()->where('paid', false)->doesntExist()) {
            $advance->update(['status' => 'completed']);
            $advance->user->decrement('kasbon_used', $advance->amount);
        }
    }
}
