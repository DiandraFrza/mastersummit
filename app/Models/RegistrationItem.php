<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RegistrationItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'registration_id',
        'service_id',
        'service_name_snapshot',
        'category',
        'sample_id',
        'price_snapshot',
        'discount_amount',
        'final_price',
        'is_from_package',
        'billed_to',
        'sample_status',
        'sample_taken_at',
        'sample_taken_by',
        'result_status',
        'result_entered_at',
        'result_entered_by',
        'group_conclusion',
        'group_suggestion',
    ];

    protected function casts(): array
    {
        return [
            'is_from_package' => 'boolean',
            'price_snapshot' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'final_price' => 'decimal:2',
            'sample_taken_at' => 'datetime',
            'result_entered_at' => 'datetime',
        ];
    }

    public function registration(): BelongsTo
    {
        return $this->belongsTo(Registration::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function sample(): BelongsTo
    {
        return $this->belongsTo(Sample::class);
    }

    public function sampleTakenBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sample_taken_by');
    }

    public function collector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sample_taken_by');
    }

    public function resultEnteredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'result_entered_by');
    }

    public function examinationResults(): HasMany
    {
        return $this->hasMany(ExaminationResult::class);
    }

    public function resultAttachments(): HasMany
    {
        return $this->hasMany(ResultAttachment::class);
    }
}
