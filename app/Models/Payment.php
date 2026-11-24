<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Payment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'registration_id',
        'mcu_event_id',
        'payment_no',
        'paid_at',
        'amount',
        'payment_method',
        'bank_id',
        'reference_no',
        'notes',
        'received_by',
    ];

    protected function casts(): array
    {
        return [
            'paid_at' => 'datetime',
            'amount' => 'decimal:2',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Payment $payment) {
            if (empty($payment->payment_no)) {
                $payment->payment_no = static::generateNextPaymentNo();
            }
            if (empty($payment->paid_at)) {
                $payment->paid_at = now();
            }
        });
    }

    /**
     * Auto-generate sequential Payment Number: PAY-YYYYMMDD-XXXX
     */
    public static function generateNextPaymentNo(): string
    {
        $dateStr = date('Ymd');
        $prefix = "PAY-{$dateStr}-";

        $latest = static::withTrashed()
            ->where('payment_no', 'like', "{$prefix}%")
            ->orderBy('payment_no', 'desc')
            ->first();

        if ($latest) {
            $lastSequence = (int) substr($latest->payment_no, strlen($prefix));
            $nextSequence = $lastSequence + 1;
        } else {
            $nextSequence = 1;
        }

        return $prefix . str_pad((string) $nextSequence, 4, '0', STR_PAD_LEFT);
    }

    public function registration(): BelongsTo
    {
        return $this->belongsTo(Registration::class);
    }

    public function mcuEvent(): BelongsTo
    {
        return $this->belongsTo(McuEvent::class);
    }

    public function bank(): BelongsTo
    {
        return $this->belongsTo(Bank::class);
    }

    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }
}
