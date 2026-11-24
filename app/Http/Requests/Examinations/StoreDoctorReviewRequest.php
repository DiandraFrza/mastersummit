<?php

namespace App\Http\Requests\Examinations;

use Illuminate\Foundation\Http\FormRequest;

class StoreDoctorReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('mcu_reviews.doctor') ?? false;
    }

    public function rules(): array
    {
        return [
            'fit_status' => ['required', 'in:fit,fit_with_note,temporary_unfit,unfit,pending'],
            'doctor_summary' => ['nullable', 'string'],
            'doctor_advice' => ['nullable', 'string'],
            'doctor_notes' => ['nullable', 'string'],
            'abnormality_recap' => ['nullable', 'array'],
        ];
    }

    public function attributes(): array
    {
        return [
            'fit_status' => 'Status Kelaikan Kerja (Fit Status)',
            'doctor_summary' => 'Kesimpulan Medis Dokter',
            'doctor_advice' => 'Saran & Anjuran Dokter',
            'doctor_notes' => 'Catatan Tambahan Dokter',
            'abnormality_recap' => 'Rekapitulasi Kelainan',
        ];
    }
}
