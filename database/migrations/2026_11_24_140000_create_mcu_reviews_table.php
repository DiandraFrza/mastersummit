<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('mcu_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')->unique()->constrained('registrations')->cascadeOnDelete();

            $table->json('abnormality_recap')->nullable();
            $table->enum('fit_status', [
                'fit',
                'fit_with_note',
                'temporary_unfit',
                'unfit',
                'pending',
            ])->default('pending')->index();

            $table->text('doctor_summary')->nullable();
            $table->text('doctor_advice')->nullable();
            $table->foreignId('doctor_reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('doctor_reviewed_at')->nullable();
            $table->text('doctor_notes')->nullable();

            $table->foreignId('manager_approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('manager_approved_at')->nullable();
            $table->text('manager_notes')->nullable();
            $table->boolean('is_locked')->default(false)->index();

            $table->timestamps();

            // Additional composite indexes for fast searching and queue filtering
            $table->index(['fit_status', 'is_locked']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mcu_reviews');
    }
};
