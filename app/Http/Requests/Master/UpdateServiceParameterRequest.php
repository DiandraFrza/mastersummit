<?php

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateServiceParameterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $service = $this->route('service');
        $serviceId = $service ? (is_object($service) ? $service->id : $service) : null;
        $parameter = $this->route('parameter');
        $parameterId = $parameter ? (is_object($parameter) ? $parameter->id : $parameter) : null;

        return [
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('service_parameters', 'code')
                    ->where('service_id', $serviceId)
                    ->ignore($parameterId),
            ],
            'label' => ['required', 'string', 'max:150'],
            'group_name' => ['nullable', 'string', 'max:100'],
            'input_type' => [
                'required',
                Rule::in(['number', 'text', 'textarea', 'select', 'formula', 'audiogram_grid', 'checkbox_group']),
            ],
            'unit' => ['nullable', 'string', 'max:50'],
            'options_json' => ['nullable', 'array'],
            'formula_expression' => ['nullable', 'string', 'max:500'],
            'default_normal_text' => ['nullable', 'string', 'max:1000'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_required' => ['boolean'],
            'is_active' => ['boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'code' => 'Kode / Slug Parameter',
            'label' => 'Nama / Label Parameter',
            'group_name' => 'Kelompok / Sub-group',
            'input_type' => 'Tipe Input',
            'unit' => 'Satuan Nilai',
            'options_json' => 'Daftar Pilihan',
            'formula_expression' => 'Formula Perhitungan',
            'default_normal_text' => 'Teks Normal Default',
            'sort_order' => 'Urutan Tampilan',
            'is_required' => 'Wajib Diisi',
            'is_active' => 'Status Aktif',
        ];
    }
}
