<?php

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReferenceRangeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'gender' => ['required', Rule::in(['ALL', 'L', 'P'])],
            'min_age_years' => ['nullable', 'integer', 'min:0', 'max:150'],
            'max_age_years' => ['nullable', 'integer', 'min:0', 'max:150'],
            'min_value' => ['nullable', 'numeric'],
            'max_value' => ['nullable', 'numeric'],
            'normal_text_value' => ['nullable', 'string', 'max:255'],
            'display_reference' => ['nullable', 'string', 'max:255'],
            'is_active' => ['boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'gender' => 'Jenis Kelamin',
            'min_age_years' => 'Usia Minimal (Tahun)',
            'max_age_years' => 'Usia Maksimal (Tahun)',
            'min_value' => 'Nilai Batas Bawah',
            'max_value' => 'Nilai Batas Atas',
            'normal_text_value' => 'Nilai Teks Normal',
            'display_reference' => 'Tampilan Nilai Rujukan',
            'is_active' => 'Status Aktif',
        ];
    }
}
