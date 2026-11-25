<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE registrations MODIFY reg_no VARCHAR(255) NULL, MODIFY registered_at DATETIME NULL");
            DB::statement("ALTER TABLE registrations MODIFY workflow_status ENUM('pending', 'registered', 'in_progress', 'result_entered', 'doctor_reviewed', 'manager_approved', 'completed', 'void') NOT NULL DEFAULT 'registered'");
        } else {
            Schema::table('registrations', function (Blueprint $table) {
                $table->string('reg_no')->nullable()->change();
                $table->dateTime('registered_at')->nullable()->change();
                $table->string('workflow_status')->default('registered')->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE registrations MODIFY reg_no VARCHAR(255) NOT NULL, MODIFY registered_at DATETIME NOT NULL");
            DB::statement("ALTER TABLE registrations MODIFY workflow_status ENUM('registered', 'in_progress', 'result_entered', 'doctor_reviewed', 'manager_approved', 'completed', 'void') NOT NULL DEFAULT 'registered'");
        } else {
            Schema::table('registrations', function (Blueprint $table) {
                $table->string('reg_no')->nullable(false)->change();
                $table->dateTime('registered_at')->nullable(false)->change();
            });
        }
    }
};
