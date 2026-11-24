<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\Support\LogOptions;
use Spatie\Activitylog\Models\Concerns\LogsActivity;

class McuReview extends Model
{
    use HasFactory, LogsActivity;

    public const FIT_STATUS_FIT = 'fit';
    public const FIT_STATUS_FIT_WITH_NOTE = 'fit_with_note';
    public const FIT_STATUS_TEMPORARY_UNFIT = 'temporary_unfit';
    public const FIT_STATUS_UNFIT = 'unfit';
    public const FIT_STATUS_PENDING = 'pending';

    public const FIT_STATUS_LABELS = [
        self::FIT_STATUS_FIT => 'Fit (Laik Kerja)',
        self::FIT_STATUS_FIT_WITH_NOTE => 'Fit with Note (Laik dengan Catatan)',
        self::FIT_STATUS_TEMPORARY_UNFIT => 'Temporary Unfit (Tidak Laik Sementara)',
        self::FIT_STATUS_UNFIT => 'Unfit (Tidak Laik Kerja)',
        self::FIT_STATUS_PENDING => 'Pending (Menunggu Tambahan/Konsul)',
    ];

    protected $fillable = [
        'registration_id',
        'abnormality_recap',
        'fit_status',
        'doctor_summary',
        'doctor_advice',
        'doctor_reviewed_by',
        'doctor_reviewed_at',
        'doctor_notes',
        'manager_approved_by',
        'manager_approved_at',
        'manager_notes',
        'is_locked',
    ];

    protected function casts(): array
    {
        return [
            'abnormality_recap' => 'array',
            'doctor_reviewed_at' => 'datetime',
            'manager_approved_at' => 'datetime',
            'is_locked' => 'boolean',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontLogEmptyChanges();
    }

    public function registration(): BelongsTo
    {
        return $this->belongsTo(Registration::class);
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'doctor_reviewed_by');
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_approved_by');
    }
}
