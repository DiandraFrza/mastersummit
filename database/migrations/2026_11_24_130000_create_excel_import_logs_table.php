<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Table 28: excel_import_logs - Tracks bulk Excel uploads per MCU event with per-row error reporting
     */
    public function up(): void
    {
        Schema::create('excel_import_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mcu_event_id')->nullable()->constrained('mcu_events')->cascadeOnDelete();
            $table->string('import_type')->index(); // 'participants', 'lab_results', 'audiometry', 'physical'
            $table->string('file_path');
            $table->string('original_filename')->nullable();
            $table->integer('total_rows')->default(0);
            $table->integer('success_rows')->default(0);
            $table->integer('failed_rows')->default(0);
            $table->json('error_details_json')->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('excel_import_logs');
    }
};
