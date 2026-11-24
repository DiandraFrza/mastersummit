<?php

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:200'],
            'branch_code' => ['nullable', 'string', 'max:50'],
            'logo_file' => ['nullable', 'image', 'mimes:png,jpg,jpeg,webp', 'max:2048'],
            'address' => ['nullable', 'string', 'max:500'],
            'city' => ['nullable', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:100'],
            'website' => ['nullable', 'string', 'max:150'],
            'director_name' => ['nullable', 'string', 'max:150'],
            'is_active' => ['boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => 'Nama Perusahaan',
            'branch_code' => 'Kode Cabang / Entitas',
            'logo_file' => 'Logo Perusahaan',
            'director_name' => 'Nama Direktur / Penanggung Jawab',
        ];
    }
}
