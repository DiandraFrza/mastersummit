<?php

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;

class StoreSampleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:50', 'unique:samples,code'],
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
