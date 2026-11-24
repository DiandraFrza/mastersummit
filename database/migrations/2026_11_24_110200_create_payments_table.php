<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Table 27: payments - Recording payments, DP, installments, cashier, and corporate invoice tracking
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')->nullable()->constrained('registrations')->cascadeOnDelete();
            $table->foreignId('mcu_event_id')->nullable()->constrained('mcu_events')->nullOnDelete();
            $table->string('payment_no')->unique()->index();
            $table->dateTime('paid_at')->index();
            $table->decimal('amount', 15, 2);
            $table->enum('payment_method', ['cash', 'transfer', 'qris', 'edc', 'invoice_corporate'])->index();
            $table->foreignId('bank_id')->nullable()->constrained('banks')->nullOnDelete();
            $table->string('reference_no')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('received_by')->nullable()->constrained('users')->nullOnDelete();

            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
