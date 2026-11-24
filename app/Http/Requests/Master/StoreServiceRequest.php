<?php

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;

class StoreServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:50', 'unique:services,code'],
            'name' => ['required', 'string', 'max:150'],
            'category' => ['required', 'in:lab,radiology,electromedical,physical'],
            'sub_group' => ['nullable', 'string', 'max:100'],
            'sample_id' => ['required', 'exists:samples,id'],
            'base_price' => ['required', 'numeric', 'min:0'],
            'print_template' => ['required', 'in:standard_lab,antigen,pcr,narkoba,radiology,electromedical,physical'],
            'is_active' => ['boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'code' => 'Kode Pemeriksaan',
            'name' => 'Nama Pemeriksaan',
            'category' => 'Kategori Pemeriksaan',
            'sub_group' => 'Sub Grup / Bidang',
            'sample_id' => 'Stasiun / Jenis Sampel',
            'base_price' => 'Tarif Dasar (Rp)',
            'print_template' => 'Format Template Cetak',
        ];
    }
}
