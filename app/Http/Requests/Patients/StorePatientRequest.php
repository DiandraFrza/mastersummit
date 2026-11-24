<?php

namespace App\Http\Requests\Patients;

use Illuminate\Foundation\Http\FormRequest;

class StorePatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'medical_record_no' => ['nullable', 'string', 'max:50', 'unique:patients,medical_record_no'],
            'nik' => ['nullable', 'string', 'max:20'],
            'name' => ['required', 'string', 'max:150'],
            'gender' => ['required', 'in:L,P'],
            'birth_date' => ['required', 'date', 'before_or_equal:today'],
            'address' => ['nullable', 'string', 'max:500'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:100'],
            'default_company_id' => ['nullable', 'exists:companies,id'],
            'default_department' => ['nullable', 'string', 'max:100'],
            'photo' => ['nullable', 'image', 'max:2048'],
        ];
    }

    public function attributes(): array
    {
        return [
            'medical_record_no' => 'No. Rekam Medis (NRM)',
            'nik' => 'Nomor Induk Kependudukan (NIK)',
            'name' => 'Nama Pasien',
            'gender' => 'Jenis Kelamin',
            'birth_date' => 'Tanggal Lahir',
            'address' => 'Alamat Domisili',
            'phone' => 'Nomor Telepon / WhatsApp',
            'email' => 'Alamat Email',
            'default_company_id' => 'Perusahaan / Instansi',
            'default_department' => 'Departemen / Bagian',
            'photo' => 'Foto Pasien',
        ];
    }
}
