<?php

namespace App\Models;

use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\Support\LogOptions;
use Spatie\Activitylog\Models\Concerns\LogsActivity;

class ParameterAutoRule extends Model
{
    use HasFactory, HasAuditColumns, LogsActivity;

    protected $fillable = [
        'parameter_id',
        'condition_operator',
        'compare_value_1',
        'compare_value_2',
        'gender',
        'flag_status',
        'auto_conclusion',
        'auto_suggestion',
        'include_in_abnormality_recap',
        'priority',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'include_in_abnormality_recap' => 'boolean',
            'priority' => 'integer',
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
