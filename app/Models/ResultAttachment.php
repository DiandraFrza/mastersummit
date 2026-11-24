<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;
use Spatie\Activitylog\Support\LogOptions;
use Spatie\Activitylog\Models\Concerns\LogsActivity;

class ResultAttachment extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'registration_id',
        'registration_item_id',
        'attachment_type',
        'file_path',
        'original_filename',
        'mime_type',
        'file_size',
        'merge_into_mcu_pdf',
        'sort_order',
        'uploaded_by',
    ];

    protected $appends = ['file_url'];

    protected function casts(): array
    {
        return [
            'merge_into_mcu_pdf' => 'boolean',
            'file_size' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontLogEmptyChanges();
    }

    public function getFileUrlAttribute(): string
    {
        return Storage::disk('public')->url($this->file_path);
    }

    public function registration(): BelongsTo
    {
        return $this->belongsTo(Registration::class);
    }

    public function registrationItem(): BelongsTo
    {
        return $this->belongsTo(RegistrationItem::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
