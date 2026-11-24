<?php

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAutoRuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'condition_operator' => [
                'required',
                Rule::in(['<', '<=', '>', '>=', '==', '!=', 'between', 'contains']),
            ],
            'compare_value_1' => ['nullable', 'string', 'max:255'],
            'compare_value_2' => ['nullable', 'string', 'max:255'],
            'gender' => ['required', Rule::in(['ALL', 'L', 'P'])],
            'flag_status' => [
                'required',
                Rule::in(['normal', 'low', 'high', 'abnormal', 'critical']),
            ],
            'auto_conclusion' => ['nullable', 'string', 'max:1000'],
            'auto_suggestion' => ['nullable', 'string', 'max:1000'],
            'include_in_abnormality_recap' => ['boolean'],
            'priority' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'condition_operator' => 'Operator Kondisi',
            'compare_value_1' => 'Nilai Pembanding 1',
            'compare_value_2' => 'Nilai Pembanding 2',
            'gender' => 'Jenis Kelamin',
            'flag_status' => 'Status Flag',
            'auto_conclusion' => 'Kesimpulan Otomatis',
            'auto_suggestion' => 'Saran / Anjuran Otomatis',
            'include_in_abnormality_recap' => 'Masuk Rekapitulasi Kelainan',
            'priority' => 'Prioritas Evaluasi',
            'is_active' => 'Status Aktif',
        ];
    }
}
