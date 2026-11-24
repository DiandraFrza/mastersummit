<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Table 14: packages - Master Tarif Paket with auto-calculated total minus discount
     */
    public function up(): void
    {
        Schema::create('packages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('referrer_id')->nullable()->constrained('referrers')->nullOnDelete();
            $table->smallInteger('year')->index();
            $table->string('event_label')->nullable();
            $table->string('name');
            $table->decimal('total_price', 15, 2)->default(0.00);
            $table->decimal('discount_amount', 15, 2)->default(0.00);
            $table->decimal('final_price', 15, 2)->default(0.00);
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
        Schema::dropIfExists('packages');
    }
};
