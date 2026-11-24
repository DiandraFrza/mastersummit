<?php

namespace App\Models;

use App\Traits\HasAuditColumns;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Support\LogOptions;
use Spatie\Activitylog\Models\Concerns\LogsActivity;

class Patient extends Model
{
    use HasFactory, HasAuditColumns, LogsActivity, SoftDeletes;

    protected $fillable = [
        'medical_record_no',
        'nik',
        'name',
        'gender',
        'birth_date',
        'address',
        'phone',
        'email',
        'photo_path',
        'default_company_id',
        'default_department',
        'created_by',
        'updated_by',
    ];

    protected $appends = ['age'];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Patient $patient) {
            if (empty($patient->medical_record_no)) {
                $patient->medical_record_no = static::generateNextMedicalRecordNo();
            }
        });
    }

    /**
     * Auto-generate sequential Medical Record Number (NRM) per year: NRM-YYYY-XXXXX
     */
    public static function generateNextMedicalRecordNo(): string
    {
        $year = date('Y');
        $prefix = "NRM-{$year}-";

        $latest = static::withTrashed()
            ->where('medical_record_no', 'like', "{$prefix}%")
            ->orderBy('medical_record_no', 'desc')
            ->first();

        if ($latest) {
            $lastSequence = (int) substr($latest->medical_record_no, strlen($prefix));
            $nextSequence = $lastSequence + 1;
        } else {
            $nextSequence = 1;
        }

        return $prefix . str_pad((string) $nextSequence, 5, '0', STR_PAD_LEFT);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontLogEmptyChanges();
    }

    /**
     * Calculated age in full years from birth_date.
     */
    protected function age(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->birth_date ? Carbon::parse($this->birth_date)->age : null,
        );
    }

    public function defaultCompany(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'default_company_id');
    }
}
