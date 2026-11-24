<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Table 20: patients - Master patient registry with medical record number and demographics
     */
    public function up(): void
    {
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->string('medical_record_no')->unique()->index();
            $table->string('nik', 20)->nullable()->index();
            $table->string('name')->index();
            $table->enum('gender', ['L', 'P'])->index();
            $table->date('birth_date');
            $table->text('address')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('photo_path')->nullable();
            $table->foreignId('default_company_id')->nullable()->constrained('companies')->nullOnDelete();
            $table->string('default_department')->nullable();

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
        Schema::dropIfExists('patients');
    }
};
