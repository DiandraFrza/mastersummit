<?php

namespace App\Models;

use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\Support\LogOptions;
use Spatie\Activitylog\Models\Concerns\LogsActivity;

class Company extends Model
{
    use HasFactory, HasAuditColumns, LogsActivity;

    protected $fillable = [
        'branch_code',
        'name',
        'logo_path',
        'address',
        'city',
        'phone',
        'email',
        'website',
        'director_name',
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

    public function referrers(): HasMany
    {
        return $this->hasMany(Referrer::class);
    }
}
