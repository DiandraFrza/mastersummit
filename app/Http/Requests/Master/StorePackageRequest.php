<?php

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;

class StorePackageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:200'],
            'year' => ['required', 'integer', 'min:2020', 'max:2099'],
            'event_label' => ['nullable', 'string', 'max:150'],
            'referrer_id' => ['nullable', 'exists:referrers,id'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['boolean'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.service_id' => ['required', 'exists:services,id'],
            'items.*.item_price_override' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => 'Nama Paket Pemeriksaan',
            'year' => 'Tahun Berlaku',
            'event_label' => 'Label Event / Kontrak MCU',
            'referrer_id' => 'Perujuk / Rekanan Terikat',
            'discount_amount' => 'Nominal Diskon Paket (Rp)',
            'items' => 'Item Layanan Pemeriksaan',
            'items.*.service_id' => 'Pemeriksaan',
            'items.*.item_price_override' => 'Tarif Khusus Item',
        ];
    }
}
