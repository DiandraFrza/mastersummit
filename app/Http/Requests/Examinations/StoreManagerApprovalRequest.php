<?php

namespace App\Http\Requests\Examinations;

use Illuminate\Foundation\Http\FormRequest;

class StoreManagerApprovalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('mcu_reviews.manager') ?? false;
    }

    public function rules(): array
    {
        return [
            'manager_notes' => ['nullable', 'string'],
            'is_locked' => ['required', 'boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'manager_notes' => 'Catatan QC Manajer',
            'is_locked' => 'Kunci Hasil (Lock Approval)',
        ];
    }
}
