<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\Support\LogOptions;
use Spatie\Activitylog\Models\Concerns\LogsActivity;

class ExaminationResult extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'registration_id',
        'registration_item_id',
        'parameter_id',
        'value_numeric',
        'value_text',
        'value_json',
        'unit_snapshot',
        'reference_snapshot',
        'flag_status',
        'auto_conclusion',
        'auto_suggestion',
        'is_manually_overridden',
        'input_source',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'value_numeric' => 'float',
            'value_json' => 'array',
            'is_manually_overridden' => 'boolean',
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

    public function registrationItem(): BelongsTo
    {
        return $this->belongsTo(RegistrationItem::class);
    }

    public function parameter(): BelongsTo
    {
        return $this->belongsTo(ServiceParameter::class, 'parameter_id');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
