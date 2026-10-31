<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_advances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 15, 2);
            $table->text('reason');
            $table->integer('tenor_months');
            $table->decimal('installment_amount', 15, 2);
            $table->string('status')->default('pending'); // pending, approved_level1, approved_finance, rejected, disbursed, completed
            $table->foreignId('approved_level1_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_level1_at')->nullable();
            $table->foreignId('approved_finance_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_finance_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamp('disbursed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_advances');
    }
};
