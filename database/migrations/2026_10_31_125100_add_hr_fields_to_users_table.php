<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('employee'); // employee, supervisor, hr, finance, admin
            $table->string('department')->nullable();
            $table->string('position')->nullable();
            $table->foreignId('supervisor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('kasbon_limit', 15, 2)->default(0);
            $table->decimal('kasbon_used', 15, 2)->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['supervisor_id']);
            $table->dropColumn(['role', 'department', 'position', 'supervisor_id', 'kasbon_limit', 'kasbon_used']);
        });
    }
};
