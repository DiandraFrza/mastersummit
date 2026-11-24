<?php

namespace App\Http\Requests\Examinations;

use Illuminate\Foundation\Http\FormRequest;

class SaveExaminationResultsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'results' => ['required', 'array'],
            'results.*.registration_item_id' => ['required', 'exists:registration_items,id'],
            'results.*.parameter_id' => ['required', 'exists:service_parameters,id'],
            'results.*.value_numeric' => ['nullable', 'numeric'],
            'results.*.value_text' => ['nullable', 'string'],
            'results.*.value_json' => ['nullable', 'array'],
            'results.*.unit_snapshot' => ['nullable', 'string', 'max:50'],
            'results.*.reference_snapshot' => ['nullable', 'string', 'max:255'],
            'results.*.flag_status' => ['required', 'in:normal,low,high,abnormal,critical'],
            'results.*.auto_conclusion' => ['nullable', 'string'],
            'results.*.auto_suggestion' => ['nullable', 'string'],
            'results.*.is_manually_overridden' => ['nullable', 'boolean'],
            'group_conclusion' => ['nullable', 'string'],
            'group_suggestion' => ['nullable', 'string'],
        ];
    }

    public function attributes(): array
    {
        return [
            'results' => 'Daftar Hasil Pemeriksaan',
            'results.*.parameter_id' => 'Parameter Pemeriksaan',
            'results.*.flag_status' => 'Status Flag',
        ];
    }
}
