<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Table 13: services - Unified examination catalog with specific print template mapping
     */
    public function up(): void
    {
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->enum('category', ['lab', 'radiology', 'electromedical', 'physical'])->index();
            $table->string('sub_group')->nullable()->index();
            $table->foreignId('sample_id')->constrained('samples')->cascadeOnUpdate();
            $table->decimal('base_price', 15, 2)->default(0.00);
            $table->enum('print_template', [
                'standard_lab',
                'antigen',
                'pcr',
                'narkoba',
                'radiology',
                'electromedical',
                'physical',
            ])->default('standard_lab');
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
        Schema::dropIfExists('services');
    }
};
