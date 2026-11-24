<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Table 24: result_attachments - Uploaded diagnostic machine outputs auto-merged into MCU PDF
     */
    public function up(): void
    {
        Schema::create('result_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')->constrained('registrations')->cascadeOnDelete();
            $table->foreignId('registration_item_id')->nullable()->constrained('registration_items')->nullOnDelete();

            $table->enum('attachment_type', [
                'ekg_pdf',
                'spiro_pdf',
                'radiology_img',
                'audiometry_pdf',
                'other',
            ])->default('other')->index();

            $table->string('file_path');
            $table->string('original_filename');
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('file_size');
            $table->boolean('merge_into_mcu_pdf')->default(true);
            $table->integer('sort_order')->default(0);

            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['registration_id', 'attachment_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('result_attachments');
    }
};
