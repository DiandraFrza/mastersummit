<?php

namespace App\Http\Requests\Events;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMcuEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $event = $this->route('mcuEvent') ?? $this->route('event');
        $eventId = $event ? (is_object($event) ? $event->id : $event) : null;

        return [
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'event_code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('mcu_events', 'event_code')->ignore($eventId),
            ],
            'event_name' => ['required', 'string', 'max:200'],
            'referrer_id' => ['required', 'exists:referrers,id'],
            'company_id' => ['nullable', 'exists:companies,id'],
            'target_participants' => ['nullable', 'integer', 'min:0'],
            'city' => ['nullable', 'string', 'max:100'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'virtual_bg' => ['nullable', 'image', 'max:4096'],
            'pic_mcu_id' => ['nullable', 'exists:employees,id'],
            'doctor_anamnese_id' => ['nullable', 'exists:employees,id'],
            'doctor_lab_id' => ['nullable', 'exists:employees,id'],
            'doctor_radiology_id' => ['nullable', 'exists:employees,id'],
            'doctor_electromedical_id' => ['nullable', 'exists:employees,id'],
            'doctor_ekg_id' => ['nullable', 'exists:employees,id'],
            'doctor_audiometry_id' => ['nullable', 'exists:employees,id'],
            'printed_by_id' => ['nullable', 'exists:employees,id'],
            'validator_id' => ['nullable', 'exists:employees,id'],
            'qc1_id' => ['nullable', 'exists:employees,id'],
            'qc2_id' => ['nullable', 'exists:employees,id'],
            'status' => ['required', 'in:draft,ongoing,review,completed,closed'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function attributes(): array
    {
        return [
            'year' => 'Tahun Pelaksanaan',
            'event_code' => 'Kode Event MCU',
            'event_name' => 'Nama Event MCU',
            'referrer_id' => 'Perujuk / Rekanan',
            'company_id' => 'Perusahaan / Klien',
            'target_participants' => 'Target Peserta',
            'city' => 'Kota Pelaksanaan',
            'start_date' => 'Tanggal Mulai',
            'end_date' => 'Tanggal Selesai',
            'virtual_bg' => 'Virtual Background Foto',
            'pic_mcu_id' => 'PIC MCU',
            'doctor_anamnese_id' => 'Dokter Anamnese / Fisik',
            'doctor_lab_id' => 'Dokter Penanggung Jawab Lab',
            'doctor_radiology_id' => 'Dokter Radiologi',
            'doctor_electromedical_id' => 'Dokter Elektromedis',
            'doctor_ekg_id' => 'Dokter Baca EKG',
            'doctor_audiometry_id' => 'Dokter Audiometri',
            'printed_by_id' => 'Petugas Cetak Hasil',
            'validator_id' => 'Validator Medis',
            'qc1_id' => 'Quality Control 1',
            'qc2_id' => 'Quality Control 2',
            'status' => 'Status Event',
            'notes' => 'Catatan Tambahan',
        ];
    }
}
