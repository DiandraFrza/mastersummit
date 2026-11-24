<?php

namespace App\Http\Requests\Samples;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSampleStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'sample_status' => ['required', 'in:pending,taken,rejected'],
            'rejection_reason' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function attributes(): array
    {
        return [
            'sample_status' => 'Status Sampel',
            'rejection_reason' => 'Alasan Penolakan Sampel',
        ];
    }
}
