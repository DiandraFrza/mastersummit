<?php

namespace App\Models;

use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\Support\LogOptions;
use Spatie\Activitylog\Models\Concerns\LogsActivity;

class ServiceParameter extends Model
{
    use HasFactory, HasAuditColumns, LogsActivity;

    protected $fillable = [
        'service_id',
        'code',
        'label',
        'group_name',
        'input_type',
        'unit',
        'options_json',
        'formula_expression',
        'default_normal_text',
        'sort_order',
        'is_required',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'options_json' => 'array',
            'sort_order' => 'integer',
            'is_required' => 'boolean',
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

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function referenceRanges(): HasMany
    {
        return $this->hasMany(ParameterReferenceRange::class, 'parameter_id');
    }

    public function autoRules(): HasMany
    {
        return $this->hasMany(ParameterAutoRule::class, 'parameter_id');
    }
}
