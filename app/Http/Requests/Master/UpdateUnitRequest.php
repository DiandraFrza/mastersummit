<?php

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUnitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $unitId = $this->route('unit')?->id ?? $this->route('unit');

        return [
            'code' => ['required', 'string', 'max:50', Rule::unique('units', 'code')->ignore($unitId)],
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
