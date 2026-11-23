<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;
use Spatie\Activitylog\Support\LogOptions;
use Spatie\Activitylog\Models\Concerns\LogsActivity;

class ClinicSetting extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'clinic_name',
        'clinic_subtitle',
        'izin_klinik_no',
        'address',
        'city',
        'phone',
        'email',
        'website',
        'logo_path',
        'watermark_path',
        'watermark_opacity',
        'header_layout_json',
        'footer_text',
        'control_card_paper_size',
        'mcu_cover_template',
        'default_online_expiry_days',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'header_layout_json' => 'array',
            'mcu_cover_template' => 'array',
            'watermark_opacity' => 'float',
            'default_online_expiry_days' => 'integer',
        ];
    }

    public static function boot(): void
    {
        parent::boot();

        static::saving(function ($model) {
            if (Auth::check()) {
                $model->updated_by = Auth::id();
            }
        });
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontLogEmptyChanges();
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Singleton getter for clinic settings.
     */
    public static function current(): self
    {
        return static::firstOrCreate([], [
            'clinic_name' => 'Master Summit Clinic & Lab',
            'clinic_subtitle' => 'Pusat Layanan Kesehatan, Laboratorium & Medical Check-Up Terpadu',
            'izin_klinik_no' => '440/012/KLINIK-UTAMA/2026',
            'address' => 'Jl. Summit Medical No. 88',
            'city' => 'Jakarta Selatan',
            'phone' => '(021) 7890-1234',
            'email' => 'info@mastersummit.co.id',
            'website' => 'https://mastersummit.co.id',
            'watermark_opacity' => 0.08,
            'control_card_paper_size' => 'A5',
            'default_online_expiry_days' => 30,
            'footer_text' => 'Dokumen hasil pemeriksaan ini diterbitkan secara elektronik dan sah tanpa tanda tangan basah.',
        ]);
    }
}
