<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class UpdateClinicSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'clinic_name' => ['required', 'string', 'max:150'],
            'clinic_subtitle' => ['nullable', 'string', 'max:255'],
            'izin_klinik_no' => ['nullable', 'string', 'max:100'],
            'address' => ['nullable', 'string', 'max:500'],
            'city' => ['nullable', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:100'],
            'website' => ['nullable', 'string', 'max:150'],
            'watermark_opacity' => ['required', 'numeric', 'min:0.01', 'max:0.50'],
            'footer_text' => ['nullable', 'string', 'max:1000'],
            'control_card_paper_size' => ['required', 'string', 'in:A5,A6,A4_2IN1'],
            'default_online_expiry_days' => ['required', 'integer', 'min:1', 'max:365'],
            'logo_file' => ['nullable', 'image', 'mimes:png,jpg,jpeg,webp', 'max:2048'],
            'watermark_file' => ['nullable', 'image', 'mimes:png,webp', 'max:2048'],
            'header_layout_json' => ['nullable', 'array'],
            'mcu_cover_template' => ['nullable', 'array'],
        ];
    }

    public function attributes(): array
    {
        return [
            'clinic_name' => 'Nama Klinik',
            'clinic_subtitle' => 'Slogan / Subtitle Klinik',
            'izin_klinik_no' => 'Nomor Izin Klinik',
            'address' => 'Alamat Lengkap',
            'city' => 'Kota / Kabupaten',
            'phone' => 'Nomor Telepon / WhatsApp',
            'email' => 'Email Resmi',
            'website' => 'Website Klinik',
            'watermark_opacity' => 'Transparansi Watermark',
            'control_card_paper_size' => 'Ukuran Kertas Kartu Kontrol',
            'default_online_expiry_days' => 'Masa Berlaku Hasil Online',
            'logo_file' => 'Berkas Logo Klinik',
            'watermark_file' => 'Berkas Watermark',
        ];
    }
}
