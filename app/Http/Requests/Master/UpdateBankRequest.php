<?php

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBankRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'account_number' => ['required', 'string', 'max:50'],
            'account_holder' => ['required', 'string', 'max:150'],
            'is_active' => ['boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => 'Nama Bank / Institusi',
            'account_number' => 'Nomor Rekening',
            'account_holder' => 'Atas Nama (Pemilik Rekening)',
        ];
    }
}
