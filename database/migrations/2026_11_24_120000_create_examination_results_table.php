<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Table 23: examination_results - Dynamic parameter values supporting single entry & bulk imports
     */
    public function up(): void
    {
        Schema::create('examination_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')->constrained('registrations')->cascadeOnDelete();
            $table->foreignId('registration_item_id')->constrained('registration_items')->cascadeOnDelete();
            $table->foreignId('parameter_id')->constrained('service_parameters')->cascadeOnDelete();

            $table->decimal('value_numeric', 15, 4)->nullable();
            $table->text('value_text')->nullable();
            $table->json('value_json')->nullable();

            $table->string('unit_snapshot', 50)->nullable();
            $table->string('reference_snapshot', 255)->nullable();
            $table->enum('flag_status', ['normal', 'low', 'high', 'abnormal', 'critical'])->default('normal')->index();

            $table->text('auto_conclusion')->nullable();
            $table->text('auto_suggestion')->nullable();
            $table->boolean('is_manually_overridden')->default(false);
            $table->enum('input_source', ['web_single', 'excel_bulk'])->default('web_single');

            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            // Unique composite index from ARCHITECTURE_DB.md for fast atomic bulk upserts
            $table->unique(['registration_item_id', 'parameter_id']);
            $table->index(['registration_id', 'flag_status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('examination_results');
    }
};
