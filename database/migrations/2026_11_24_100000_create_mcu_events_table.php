<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Table 19: mcu_events - Corporate MCU event batch configuration, assigned medical team, QC signers, and virtual background
     */
    public function up(): void
    {
        Schema::create('mcu_events', function (Blueprint $table) {
            $table->id();
            $table->smallInteger('year')->index();
            $table->string('event_code')->unique();
            $table->string('event_name');
            $table->foreignId('referrer_id')->constrained('referrers');
            $table->foreignId('company_id')->nullable()->constrained('companies')->nullOnDelete();
            $table->integer('target_participants')->default(0);
            $table->string('city')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('virtual_bg_path')->nullable();

            // Medical Team & Signers (FK to employees)
            $table->foreignId('pic_mcu_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->foreignId('doctor_anamnese_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->foreignId('doctor_lab_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->foreignId('doctor_radiology_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->foreignId('doctor_electromedical_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->foreignId('doctor_ekg_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->foreignId('doctor_audiometry_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->foreignId('printed_by_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->foreignId('validator_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->foreignId('qc1_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->foreignId('qc2_id')->nullable()->constrained('employees')->nullOnDelete();

            $table->enum('status', ['draft', 'ongoing', 'review', 'completed', 'closed'])->default('draft')->index();
            $table->text('notes')->nullable();

            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mcu_events');
    }
};
