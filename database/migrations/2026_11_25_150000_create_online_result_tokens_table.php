<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Table 26: online_result_tokens - Secure tokenized patient result link valid for 30 days
     */
    public function up(): void
    {
        Schema::create('online_result_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')->constrained('registrations')->cascadeOnDelete();
            $table->string('token', 64)->unique();
            $table->enum('verification_type', ['dob', 'phone_last4'])->default('dob');
            $table->timestamp('expires_at')->index();
            $table->boolean('is_revoked')->default(false)->index();
            $table->unsignedInteger('access_count')->default(0);
            $table->timestamp('last_accessed_at')->nullable();
            $table->string('last_accessed_ip', 45)->nullable();
            $table->foreignId('extended_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('extended_at')->nullable();
            $table->timestamps();

            $table->index(['registration_id', 'is_revoked']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('online_result_tokens');
    }
};
