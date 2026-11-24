<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Table 12: samples - Dynamic specimen & execution stations
     */
    public function up(): void
    {
        Schema::create('samples', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->enum('category', ['lab', 'radiology', 'electromedical', 'physical'])->index();
            $table->integer('sort_order')->default(0);
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
        Schema::dropIfExists('samples');
    }
};
