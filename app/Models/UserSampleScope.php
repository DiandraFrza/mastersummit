<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserSampleScope extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'sample_id',
    ];

    /**
     * User owning this station scope.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Sample station reference.
     */
    public function sample(): BelongsTo
    {
        return $this->belongsTo(Sample::class);
    }
}
