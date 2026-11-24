<?php

namespace App\Models;

use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\Support\LogOptions;
use Spatie\Activitylog\Models\Concerns\LogsActivity;

class ParameterReferenceRange extends Model
{
    use HasFactory, HasAuditColumns, LogsActivity;

    protected $fillable = [
        'parameter_id',
        'gender',
        'min_age_years',
        'max_age_years',
        'min_value',
        'max_value',
        'normal_text_value',
        'display_reference',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'min_age_years' => 'integer',
            'max_age_years' => 'integer',
            'min_value' => 'decimal:4',
            'max_value' => 'decimal:4',
            'is_active' => 'boolean',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontLogEmptyChanges();
    }

    public function parameter(): BelongsTo
    {
        return $this->belongsTo(ServiceParameter::class, 'parameter_id');
    }
}
