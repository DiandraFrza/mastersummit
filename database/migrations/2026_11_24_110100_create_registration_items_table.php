<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Table 22: registration_items - Unpacked package items + add-ons, split billing per item, and specimen tracking
     */
    public function up(): void
    {
        Schema::create('registration_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')->constrained('registrations')->cascadeOnDelete();
            $table->foreignId('service_id')->constrained('services');
            $table->string('service_name_snapshot');
            $table->enum('category', ['lab', 'radiology', 'electromedical', 'physical'])->index();
            $table->foreignId('sample_id')->constrained('samples');

            $table->decimal('price_snapshot', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('final_price', 15, 2)->default(0);

            $table->boolean('is_from_package')->default(false)->index();
            $table->enum('billed_to', ['corporate', 'personal', 'referrer'])->default('personal')->index();

            // Specimen check-in tracking
            $table->enum('sample_status', ['pending', 'taken', 'rejected'])->default('pending')->index();
            $table->dateTime('sample_taken_at')->nullable();
            $table->foreignId('sample_taken_by')->nullable()->constrained('users')->nullOnDelete();

            // Examination progress tracking
            $table->enum('result_status', ['pending', 'draft', 'entered', 'verified'])->default('pending')->index();
            $table->dateTime('result_entered_at')->nullable();
            $table->foreignId('result_entered_by')->nullable()->constrained('users')->nullOnDelete();

            $table->text('group_conclusion')->nullable();
            $table->text('group_suggestion')->nullable();

            $table->timestamps();

            // Composite index from ARCHITECTURE_DB.md for sub-20ms Ambil Sampel queries
            $table->index(['sample_id', 'sample_status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('registration_items');
    }
};
