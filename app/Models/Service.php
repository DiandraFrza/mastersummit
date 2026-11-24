<?php

namespace App\Models;

use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\Support\LogOptions;
use Spatie\Activitylog\Models\Concerns\LogsActivity;

class Service extends Model
{
    use HasFactory, HasAuditColumns, LogsActivity;

    protected $fillable = [
        'code',
        'name',
        'category',
        'sub_group',
        'sample_id',
        'base_price',
        'print_template',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'base_price' => 'decimal:2',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontLogEmptyChanges();
    }

    public function sample(): BelongsTo
    {
        return $this->belongsTo(Sample::class);
    }

    public function packageItems(): HasMany
    {
        return $this->hasMany(PackageItem::class);
    }

    public function packages(): BelongsToMany
    {
        return $this->belongsToMany(Package::class, 'package_items')
            ->withPivot('item_price_override')
            ->withTimestamps();
    }

    public function parameters(): HasMany
    {
        return $this->hasMany(ServiceParameter::class)->orderBy('sort_order')->orderBy('id');
    }
}
