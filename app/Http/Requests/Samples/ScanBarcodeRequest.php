<?php

namespace App\Http\Requests\Samples;

use Illuminate\Foundation\Http\FormRequest;

class ScanBarcodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'barcode' => ['required', 'string', 'max:100'],
            'sample_id' => ['nullable'],
        ];
    }

    public function attributes(): array
    {
        return [
            'barcode' => 'Kode Barcode / No. Registrasi / NRM',
            'sample_id' => 'Stasiun Sampel',
        ];
    }
}
