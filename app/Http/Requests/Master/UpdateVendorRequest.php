<?php

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateVendorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $vendorId = $this->route('vendor')?->id ?? $this->route('vendor');

        return [
            'code' => ['required', 'string', 'max:50', Rule::unique('vendors', 'code')->ignore($vendorId)],
            'name' => ['required', 'string', 'max:200'],
            'npwp' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:100'],
            'website' => ['nullable', 'string', 'max:150'],
            'contract_number' => ['nullable', 'string', 'max:100'],
            'contract_type' => ['nullable', 'string', 'max:100'],
            'pic_name' => ['nullable', 'string', 'max:150'],
            'pic_phone' => ['nullable', 'string', 'max:50'],
            'is_active' => ['boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'code' => 'Kode Vendor',
            'name' => 'Nama Vendor / Rekanan',
            'npwp' => 'NPWP',
            'contract_number' => 'No. Kontrak / PKS',
            'contract_type' => 'Jenis Kontrak / Kerjasama',
            'pic_name' => 'Nama PIC',
            'pic_phone' => 'No. HP PIC',
        ];
    }
}
