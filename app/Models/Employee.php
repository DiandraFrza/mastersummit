<?php

namespace App\Models;

use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Spatie\Activitylog\Support\LogOptions;
use Spatie\Activitylog\Models\Concerns\LogsActivity;

class Employee extends Model
{
    use HasFactory, HasAuditColumns, LogsActivity;

    protected $fillable = [
        'nik',
        'nip',
        'sip',
        'name',
        'address',
        'phone',
        'email',
        'job_title',
        'signature_path',
        'stamp_path',
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

    /**
     * Relationship to login account.
     */
    public function user(): HasOne
    {
        return $this->hasOne(User::class);
    }
}
