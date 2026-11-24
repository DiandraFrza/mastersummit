<?php

namespace App\Http\Requests\Examinations;

use Illuminate\Foundation\Http\FormRequest;

class UploadResultAttachmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:20480', 'mimes:pdf,jpg,jpeg,png'], // max 20MB
            'attachment_type' => ['required', 'in:ekg_pdf,spiro_pdf,radiology_img,audiometry_pdf,other'],
            'registration_item_id' => ['nullable', 'exists:registration_items,id'],
            'merge_into_mcu_pdf' => ['nullable', 'boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'file' => 'Berkas Lampiran Hasil',
            'attachment_type' => 'Jenis Lampiran',
        ];
    }
}
