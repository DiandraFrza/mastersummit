<?php

namespace App\Traits;

use App\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;

trait HasAuditColumns
{
    /**
     * Boot the trait to auto-fill created_by and updated_by.
     */
    public static function bootHasAuditColumns(): void
    {
        static::creating(function ($model) {
            if (Auth::check()) {
                $userId = Auth::id();
                if (array_key_exists('created_by', $model->getAttributes()) || in_array('created_by', $model->getFillable())) {
                    if (is_null($model->created_by)) {
                        $model->created_by = $userId;
                    }
                }
                if (array_key_exists('updated_by', $model->getAttributes()) || in_array('updated_by', $model->getFillable())) {
                    if (is_null($model->updated_by)) {
                        $model->updated_by = $userId;
                    }
                }
            }
        });

        static::updating(function ($model) {
            if (Auth::check()) {
                if (array_key_exists('updated_by', $model->getAttributes()) || in_array('updated_by', $model->getFillable())) {
                    $model->updated_by = Auth::id();
                }
            }
        });
    }

    /**
     * Relationship to the user who created the record.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Relationship to the user who last updated the record.
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
