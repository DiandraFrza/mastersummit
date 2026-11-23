<?php

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;

class StoreEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nik' => ['required', 'string', 'max:20', 'unique:employees,nik'],
            'nip' => ['nullable', 'string', 'max:50'],
            'sip' => ['nullable', 'string', 'max:50'],
            'name' => ['required', 'string', 'max:150'],
            'address' => ['nullable', 'string', 'max:500'],
            'phone' => ['nullable', 'string', 'max:25'],
            'email' => ['nullable', 'email', 'max:100'],
            'job_title' => ['nullable', 'string', 'max:100'],
            'signature_file' => ['nullable', 'image', 'mimes:png,webp', 'max:2048'],
            'stamp_file' => ['nullable', 'image', 'mimes:png,webp', 'max:2048'],
            'is_active' => ['boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'nik' => 'NIK',
            'nip' => 'NIP',
            'sip' => 'SIP',
            'name' => 'Nama Pegawai',
            'job_title' => 'Jabatan / Posisi',
            'signature_file' => 'Tanda Tangan Digital (PNG)',
            'stamp_file' => 'Stempel Digital (PNG)',
        ];
    }
}
