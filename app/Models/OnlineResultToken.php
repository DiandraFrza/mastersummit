<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OnlineResultToken extends Model
{
    use HasFactory;

    protected $table = 'online_result_tokens';

    protected $fillable = [
        'registration_id',
        'token',
        'verification_type',
        'expires_at',
        'is_revoked',
        'access_count',
        'last_accessed_at',
        'last_accessed_ip',
        'extended_by',
        'extended_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'last_accessed_at' => 'datetime',
            'extended_at' => 'datetime',
            'is_revoked' => 'boolean',
            'access_count' => 'integer',
        ];
    }

    /**
     * Parent registration relation.
     */
    public function registration(): BelongsTo
    {
        return $this->belongsTo(Registration::class);
    }

    /**
     * User who extended the token validity.
     */
    public function extendedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'extended_by');
    }

    /**
     * Check if token is expired.
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * Check if token is currently valid and active.
     */
    public function isValid(): bool
    {
        return ! $this->is_revoked && ! $this->isExpired();
    }

    /**
     * Calculate remaining active days.
     */
    public function getDaysRemainingAttribute(): int
    {
        if ($this->isExpired() || $this->is_revoked) {
            return 0;
        }

        return (int) ceil(now()->diffInSeconds($this->expires_at, false) / 86400);
    }

    /**
     * Get full public web URL.
     */
    public function getPortalUrlAttribute(): string
    {
        return url('/r/' . $this->token);
    }
}
