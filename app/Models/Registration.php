<?php

namespace App\Models;

use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Support\LogOptions;
use Spatie\Activitylog\Models\Concerns\LogsActivity;

class Registration extends Model
{
    use HasFactory, HasAuditColumns, LogsActivity, SoftDeletes;

    protected $fillable = [
        'reg_no',
        'registered_at',
        'patient_id',
        'service_type',
        'payer_type',
        'referrer_id',
        'company_id',
        'mcu_event_id',
        'package_id',
        'department_snapshot',
        'age_years_snapshot',
        'total_amount',
        'discount_amount',
        'grand_total',
        'paid_amount',
        'remaining_amount',
        'payment_status',
        'workflow_status',
        'void_reason',
        'voided_by',
        'voided_at',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'registered_at' => 'datetime',
            'voided_at' => 'datetime',
            'age_years_snapshot' => 'integer',
            'total_amount' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'grand_total' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'remaining_amount' => 'decimal:2',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Registration $reg) {
            if (empty($reg->reg_no)) {
                $reg->reg_no = static::generateNextRegNo();
            }
            if (empty($reg->registered_at)) {
                $reg->registered_at = now();
            }
        });

        static::saved(function (Registration $reg) {
            if ($reg->wasChanged('workflow_status') && $reg->workflow_status === 'completed') {
                try {
                    app(\App\Services\Portal\OnlineResultTokenService::class)->generateTokenForRegistration($reg);
                } catch (\Throwable $e) {
                    logger()->warning("Could not auto-generate online result token for registration [{$reg->id}]: " . $e->getMessage());
                }
            }
        });
    }

    /**
     * Auto-generate sequential Barcode Registration Number per day: REG-YYYYMMDD-XXXX
     */
    public static function generateNextRegNo(): string
    {
        $dateStr = date('Ymd');
        $prefix = "REG-{$dateStr}-";

        $latest = static::withTrashed()
            ->where('reg_no', 'like', "{$prefix}%")
            ->orderBy('reg_no', 'desc')
            ->first();

        if ($latest) {
            $lastSequence = (int) substr($latest->reg_no, strlen($prefix));
            $nextSequence = $lastSequence + 1;
        } else {
            $nextSequence = 1;
        }

        return $prefix . str_pad((string) $nextSequence, 4, '0', STR_PAD_LEFT);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontLogEmptyChanges();
    }

    // ==========================================
    // Relationships
    // ==========================================
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function referrer(): BelongsTo
    {
        return $this->belongsTo(Referrer::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function mcuEvent(): BelongsTo
    {
        return $this->belongsTo(McuEvent::class);
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(Package::class);
    }

    public function voidedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'voided_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(RegistrationItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function examinationResults(): HasMany
    {
        return $this->hasMany(ExaminationResult::class);
    }

    public function resultAttachments(): HasMany
    {
        return $this->hasMany(ResultAttachment::class);
    }

    public function mcuReview(): HasOne
    {
        return $this->hasOne(McuReview::class);
    }

    public function onlineResultToken(): HasOne
    {
        return $this->hasOne(OnlineResultToken::class)->latestOfMany();
    }

    public function onlineResultTokens(): HasMany
    {
        return $this->hasMany(OnlineResultToken::class);
    }

    // ==========================================
    // Business Logic
    // ==========================================

    /**
     * Recalculate registration totals based on items and recorded payments.
     */
    public function recalculateFinancials(): void
    {
        $itemsTotal = (float) $this->items()->sum('final_price');
        $this->total_amount = $itemsTotal;

        $discount = (float) $this->discount_amount;
        $grandTotal = max(0, $itemsTotal - $discount);
        $this->grand_total = $grandTotal;

        $paid = (float) $this->payments()->sum('amount');
        $this->paid_amount = $paid;

        $remaining = max(0, $grandTotal - $paid);
        $this->remaining_amount = $remaining;

        if ($this->payer_type === 'corporate') {
            $this->payment_status = $paid >= $grandTotal ? 'paid' : 'corporate_billed';
        } else {
            if ($paid >= $grandTotal && $grandTotal > 0) {
                $this->payment_status = 'paid';
            } elseif ($paid > 0) {
                $this->payment_status = 'partial';
            } else {
                $this->payment_status = 'unpaid';
            }
        }

        $this->saveQuietly();
    }

    /**
     * Mark registration as void with mandatory reason.
     */
    public function markAsVoid(string $reason, int $userId): void
    {
        $this->update([
            'workflow_status' => 'void',
            'void_reason' => $reason,
            'voided_by' => $userId,
            'voided_at' => now(),
        ]);
    }

    /**
     * Transition workflow status from 'registered' to 'in_progress' when first station checks in.
     */
    public function transitionToInProgressIfRegistered(): void
    {
        if ($this->workflow_status === 'registered') {
            $this->update(['workflow_status' => 'in_progress']);
        }
    }
}
