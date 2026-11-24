<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Table 16: service_parameters - Admin-configurable fields inside each examination
     */
    public function up(): void
    {
        Schema::create('service_parameters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained('services')->cascadeOnDelete();
            $table->string('code')->index();
            $table->string('label');
            $table->string('group_name')->nullable()->index();
            $table->enum('input_type', [
                'number',
                'text',
                'textarea',
                'select',
                'formula',
                'audiogram_grid',
                'checkbox_group',
            ])->default('number');
            $table->string('unit')->nullable();
            $table->json('options_json')->nullable();
            $table->text('formula_expression')->nullable();
            $table->text('default_normal_text')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_required')->default(false);
            $table->boolean('is_active')->default(true)->index();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            $table->unique(['service_id', 'code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_parameters');
    }
};
