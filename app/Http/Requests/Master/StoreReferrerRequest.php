<?php

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;

class StoreReferrerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'referrer_type_id' => ['required', 'exists:referrer_types,id'],
            'company_id' => ['nullable', 'exists:companies,id'],
            'name' => ['required', 'string', 'max:200'],
            'pic_name' => ['nullable', 'string', 'max:150'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:100'],
            'address' => ['nullable', 'string', 'max:500'],
            'marketing_name' => ['nullable', 'string', 'max:150'],
            'fee_general_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'fee_special_note' => ['nullable', 'string', 'max:500'],
            'marketing_note' => ['nullable', 'string', 'max:500'],
            'is_active' => ['boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'referrer_type_id' => 'Kategori / Tipe Perujuk',
            'company_id' => 'Perusahaan Terkait',
            'name' => 'Nama Perujuk',
            'pic_name' => 'Nama PIC / Kontak',
            'marketing_name' => 'Marketing PIC',
            'fee_general_percent' => 'Persentase Komisi (%)',
        ];
    }
}
