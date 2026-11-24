<?php

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;

class StoreUnitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:50', 'unique:units,code'],
            'name' => ['required', 'string', 'max:150'],
            'address' => ['nullable', 'string', 'max:500'],
            'phone' => ['nullable', 'string', 'max:50'],
            'is_active' => ['boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'code' => 'Kode Unit / Cabang',
            'name' => 'Nama Unit / Cabang',
            'address' => 'Alamat',
            'phone' => 'No. Telepon',
        ];
    }
}
