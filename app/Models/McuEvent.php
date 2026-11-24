<?php

namespace App\Models;

use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Support\LogOptions;
use Spatie\Activitylog\Models\Concerns\LogsActivity;

class McuEvent extends Model
{
    use HasFactory, HasAuditColumns, LogsActivity, SoftDeletes;

    protected $fillable = [
        'year',
        'event_code',
        'event_name',
        'referrer_id',
        'company_id',
        'target_participants',
        'city',
        'start_date',
        'end_date',
        'virtual_bg_path',
        'pic_mcu_id',
        'doctor_anamnese_id',
        'doctor_lab_id',
        'doctor_radiology_id',
        'doctor_electromedical_id',
        'doctor_ekg_id',
        'doctor_audiometry_id',
        'printed_by_id',
        'validator_id',
        'qc1_id',
        'qc2_id',
        'status',
        'notes',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'target_participants' => 'integer',
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (McuEvent $event) {
            if (empty($event->year)) {
                $event->year = (int) date('Y');
            }
            if (empty($event->event_code)) {
                $event->event_code = static::generateNextEventCode($event->year);
            }
        });
    }

    /**
     * Auto-generate sequential Event Code per year: MCU-YYYY-XXX
     */
    public static function generateNextEventCode(int $year): string
    {
        $prefix = "MCU-{$year}-";

        $latest = static::withTrashed()
            ->where('event_code', 'like', "{$prefix}%")
            ->orderBy('event_code', 'desc')
            ->first();

        if ($latest) {
            $lastSequence = (int) substr($latest->event_code, strlen($prefix));
            $nextSequence = $lastSequence + 1;
        } else {
            $nextSequence = 1;
        }

        return $prefix . str_pad((string) $nextSequence, 3, '0', STR_PAD_LEFT);
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
    public function referrer(): BelongsTo
    {
        return $this->belongsTo(Referrer::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function picMcu(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'pic_mcu_id');
    }

    public function doctorAnamnese(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'doctor_anamnese_id');
    }

    public function doctorLab(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'doctor_lab_id');
    }

    public function doctorRadiology(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'doctor_radiology_id');
    }

    public function doctorElectromedical(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'doctor_electromedical_id');
    }

    public function doctorEkg(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'doctor_ekg_id');
    }

    public function doctorAudiometry(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'doctor_audiometry_id');
    }

    public function printedBy(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'printed_by_id');
    }

    public function validator(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'validator_id');
    }

    public function qc1(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'qc1_id');
    }

    public function qc2(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'qc2_id');
    }

    public function registrations()
    {
        return $this->hasMany(Registration::class, 'mcu_event_id');
    }

    public function excelImportLogs()
    {
        return $this->hasMany(ExcelImportLog::class, 'mcu_event_id');
    }
}
