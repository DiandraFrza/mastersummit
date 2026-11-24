<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Table 21: registrations - Unified registration transaction header for Regular, MCU Corporate, APS, and Referrer
     */
    public function up(): void
    {
        Schema::create('registrations', function (Blueprint $table) {
            $table->id();
            $table->string('reg_no')->unique()->index();
            $table->dateTime('registered_at')->index();
            $table->foreignId('patient_id')->constrained('patients');
            $table->enum('service_type', ['regular', 'mcu'])->default('regular')->index();
            $table->enum('payer_type', ['aps', 'corporate', 'referrer'])->default('aps')->index();
            $table->foreignId('referrer_id')->nullable()->constrained('referrers')->nullOnDelete();
            $table->foreignId('company_id')->nullable()->constrained('companies')->nullOnDelete();
            $table->foreignId('mcu_event_id')->nullable()->constrained('mcu_events')->nullOnDelete();
            $table->foreignId('package_id')->nullable()->constrained('packages')->nullOnDelete();

            $table->string('department_snapshot')->nullable();
            $table->integer('age_years_snapshot')->nullable();

            $table->decimal('total_amount', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('grand_total', 15, 2)->default(0);
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->decimal('remaining_amount', 15, 2)->default(0);

            $table->enum('payment_status', ['unpaid', 'partial', 'paid', 'corporate_billed'])->default('unpaid')->index();
            $table->enum('workflow_status', [
                'registered',
                'in_progress',
                'result_entered',
                'doctor_reviewed',
                'manager_approved',
                'completed',
                'void',
            ])->default('registered')->index();

            $table->text('void_reason')->nullable();
            $table->foreignId('voided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('voided_at')->nullable();

            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->softDeletes();
            $table->timestamps();

            // Composite indexes from ARCHITECTURE_DB.md
            $table->index(['registered_at', 'workflow_status']);
            $table->index(['mcu_event_id', 'workflow_status']);
            $table->index(['referrer_id', 'registered_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('registrations');
    }
};
