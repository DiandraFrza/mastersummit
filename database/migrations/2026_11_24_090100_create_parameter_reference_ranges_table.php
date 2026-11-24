<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Table 17: parameter_reference_ranges - Normal ranges dynamically resolved by patient gender and age
     */
    public function up(): void
    {
        Schema::create('parameter_reference_ranges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parameter_id')->constrained('service_parameters')->cascadeOnDelete();
            $table->enum('gender', ['ALL', 'L', 'P'])->default('ALL')->index();
            $table->integer('min_age_years')->nullable();
            $table->integer('max_age_years')->nullable();
            $table->decimal('min_value', 12, 4)->nullable();
            $table->decimal('max_value', 12, 4)->nullable();
            $table->string('normal_text_value')->nullable();
            $table->string('display_reference')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('parameter_reference_ranges');
    }
};
