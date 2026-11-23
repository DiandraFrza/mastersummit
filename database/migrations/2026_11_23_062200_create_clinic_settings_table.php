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
        Schema::create('clinic_settings', function (Blueprint $table) {
            $table->id();
            $table->string('clinic_name');
            $table->string('clinic_subtitle')->nullable();
            $table->string('izin_klinik_no')->nullable();
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('website')->nullable();
            $table->string('logo_path')->nullable();
            $table->string('watermark_path')->nullable();
            $table->decimal('watermark_opacity', 3, 2)->default(0.08);
            $table->json('header_layout_json')->nullable();
            $table->text('footer_text')->nullable();
            $table->enum('control_card_paper_size', ['A5', 'A6', 'A4_2IN1'])->default('A5');
            $table->json('mcu_cover_template')->nullable();
            $table->unsignedInteger('default_online_expiry_days')->default(30);
            $table->unsignedBigInteger('updated_by')->nullable()->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clinic_settings');
    }
};
