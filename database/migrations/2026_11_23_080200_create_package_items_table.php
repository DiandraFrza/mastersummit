<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Table 15: package_items - Many-to-many breakdown of services inside a package
     */
    public function up(): void
    {
        Schema::create('package_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('package_id')->constrained('packages')->cascadeOnDelete();
            $table->foreignId('service_id')->constrained('services')->cascadeOnUpdate();
            $table->decimal('item_price_override', 15, 2)->nullable();
            $table->timestamps();

            $table->unique(['package_id', 'service_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('package_items');
    }
};
