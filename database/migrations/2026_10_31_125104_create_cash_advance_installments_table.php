<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_advance_installments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cash_advance_id')->constrained()->cascadeOnDelete();
            $table->integer('period_number');
            $table->date('due_date');
            $table->decimal('amount', 15, 2);
            $table->boolean('paid')->default(false);
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_advance_installments');
    }
};
