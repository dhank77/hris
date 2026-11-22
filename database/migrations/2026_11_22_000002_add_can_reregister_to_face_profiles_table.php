<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('face_profiles', function (Blueprint $table): void {
            $table->boolean('can_reregister')->default(false)->after('model_version');
        });
    }

    public function down(): void
    {
        Schema::table('face_profiles', function (Blueprint $table): void {
            $table->dropColumn('can_reregister');
        });
    }
};
