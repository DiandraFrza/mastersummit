<?php

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSampleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $sampleId = $this->route('sample')?->id ?? $this->route('sample');

        return [
            'code' => ['required', 'string', 'max:50', Rule::unique('samples', 'code')->ignore($sampleId)],
            'name' => ['required', 'string', 'max:150'],
            'category' => ['required', 'in:lab,radiology,electromedical,physical'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'code' => 'Kode Stasiun / Sampel',
            'name' => 'Nama Stasiun / Sampel',
            'category' => 'Kategori Pemeriksaan',
            'sort_order' => 'Urutan Tampilan',
        ];
    }
}
