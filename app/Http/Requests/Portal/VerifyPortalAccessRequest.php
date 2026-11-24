<?php

namespace App\Http\Requests\Portal;

use Illuminate\Foundation\Http\FormRequest;

class VerifyPortalAccessRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'credential' => ['required', 'string', 'min:4', 'max:20'],
        ];
    }

    public function messages(): array
    {
        return [
            'credential.required' => 'Silakan masukkan Tanggal Lahir (DDMMYYYY) atau 4 digit nomor telepon Anda.',
            'credential.min' => 'Format verifikasi minimal 4 karakter.',
        ];
    }
}
