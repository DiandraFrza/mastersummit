<?php

namespace App\Models;

use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Support\LogOptions;
use Spatie\Activitylog\Models\Concerns\LogsActivity;

class Vendor extends Model
{
    use HasFactory, HasAuditColumns, LogsActivity;

    protected $fillable = [
        'code',
        'name',
        'npwp',
        'address',
        'phone',
        'email',
        'website',
        'contract_number',
        'contract_type',
        'pic_name',
        'pic_phone',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
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
}
