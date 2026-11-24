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

class Package extends Model
{
    use HasFactory, HasAuditColumns, LogsActivity;

    protected $fillable = [
        'referrer_id',
        'year',
        'event_label',
        'name',
        'total_price',
        'discount_amount',
        'final_price',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'year' => 'integer',
            'total_price' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'final_price' => 'decimal:2',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontLogEmptyChanges();
    }

    public function referrer(): BelongsTo
    {
        return $this->belongsTo(Referrer::class);
    }

    public function packageItems(): HasMany
    {
        return $this->hasMany(PackageItem::class);
    }

    public function services(): BelongsToMany
    {
        return $this->belongsToMany(Service::class, 'package_items')
            ->withPivot('item_price_override')
            ->withTimestamps();
    }

    /**
     * Recalculate and persist total_price and final_price based on attached items.
     */
    public function recalculateTotals(): void
    {
        $this->loadMissing('packageItems.service');

        $total = 0;
        foreach ($this->packageItems as $item) {
            $price = ! is_null($item->item_price_override)
                ? (float) $item->item_price_override
                : (float) ($item->service?->base_price ?? 0);
            $total += $price;
        }

        $discount = (float) ($this->discount_amount ?? 0);
        $final = max(0, $total - $discount);

        $this->updateQuietly([
            'total_price' => $total,
            'final_price' => $final,
        ]);
    }
}
