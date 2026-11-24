<?php

namespace App\Http\Requests\Registrations;

use Illuminate\Foundation\Http\FormRequest;

class StoreRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'patient_id' => ['required', 'exists:patients,id'],
            'service_type' => ['required', 'in:regular,mcu'],
            'payer_type' => ['required', 'in:aps,corporate,referrer'],
            'referrer_id' => ['nullable', 'exists:referrers,id'],
            'company_id' => ['nullable', 'exists:companies,id'],
            'mcu_event_id' => ['nullable', 'exists:mcu_events,id'],
            'package_id' => ['nullable', 'exists:packages,id'],
            'department_snapshot' => ['nullable', 'string', 'max:100'],
            'package_billed_to' => ['nullable', 'in:corporate,personal,referrer'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'additional_services' => ['nullable', 'array'],
            'additional_services.*.service_id' => ['required_with:additional_services', 'exists:services,id'],
            'additional_services.*.price' => ['nullable', 'numeric', 'min:0'],
            'additional_services.*.discount' => ['nullable', 'numeric', 'min:0'],
            'additional_services.*.billed_to' => ['nullable', 'in:corporate,personal,referrer'],
            'payment' => ['nullable', 'array'],
            'payment.amount' => ['nullable', 'numeric', 'min:0'],
            'payment.payment_method' => ['nullable', 'in:cash,transfer,qris,edc,invoice_corporate'],
            'payment.bank_id' => ['nullable', 'exists:banks,id'],
            'payment.reference_no' => ['nullable', 'string', 'max:100'],
            'payment.notes' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function attributes(): array
    {
        return [
            'patient_id' => 'Data Pasien',
            'service_type' => 'Jenis Layanan',
            'payer_type' => 'Tipe Pembayar',
            'referrer_id' => 'Perujuk',
            'company_id' => 'Perusahaan / Klien',
            'mcu_event_id' => 'Event MCU',
            'package_id' => 'Paket Pemeriksaan',
            'department_snapshot' => 'Departemen Pasien',
            'discount_amount' => 'Diskon Global (Rp)',
            'payment.amount' => 'Jumlah Pembayaran (Rp)',
            'payment.payment_method' => 'Metode Pembayaran',
        ];
    }
}
