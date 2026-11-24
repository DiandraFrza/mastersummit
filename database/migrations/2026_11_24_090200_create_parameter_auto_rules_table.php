<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Table 18: parameter_auto_rules - Evaluates flags, fills default conclusion & advice, and feeds REKAPITULASI KELAINAN
     */
    public function up(): void
    {
        Schema::create('parameter_auto_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parameter_id')->constrained('service_parameters')->cascadeOnDelete();
            $table->enum('condition_operator', [
                '<',
                '<=',
                '>',
                '>=',
                '==',
                '!=',
                'between',
                'contains',
            ])->index();
            $table->string('compare_value_1')->nullable();
            $table->string('compare_value_2')->nullable();
            $table->enum('gender', ['ALL', 'L', 'P'])->default('ALL')->index();
            $table->enum('flag_status', [
                'normal',
                'low',
                'high',
                'abnormal',
                'critical',
            ])->default('normal')->index();
            $table->text('auto_conclusion')->nullable();
            $table->text('auto_suggestion')->nullable();
            $table->boolean('include_in_abnormality_recap')->default(false)->index();
            $table->integer('priority')->default(0);
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
        Schema::dropIfExists('parameter_auto_rules');
    }
};
