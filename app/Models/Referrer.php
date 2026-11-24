<?php

namespace App\Models;

use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\Support\LogOptions;
use Spatie\Activitylog\Models\Concerns\LogsActivity;

class Referrer extends Model
{
    use HasFactory, HasAuditColumns, LogsActivity;

    protected $fillable = [
        'referrer_type_id',
        'company_id',
        'name',
        'pic_name',
        'phone',
        'email',
        'address',
        'marketing_name',
        'fee_general_percent',
        'fee_special_note',
        'marketing_note',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'fee_general_percent' => 'decimal:2',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontLogEmptyChanges();
    }

    public function referrerType(): BelongsTo
    {
        return $this->belongsTo(ReferrerType::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
