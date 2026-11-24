<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\Support\LogOptions;
use Spatie\Activitylog\Models\Concerns\LogsActivity;

class ExcelImportLog extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'mcu_event_id',
        'import_type',
        'file_path',
        'original_filename',
        'total_rows',
        'success_rows',
        'failed_rows',
        'error_details_json',
        'uploaded_by',
    ];

    protected $casts = [
        'total_rows' => 'integer',
        'success_rows' => 'integer',
        'failed_rows' => 'integer',
        'error_details_json' => 'array',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->dontLogEmptyChanges();
    }

    public function mcuEvent(): BelongsTo
    {
        return $this->belongsTo(McuEvent::class, 'mcu_event_id');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
