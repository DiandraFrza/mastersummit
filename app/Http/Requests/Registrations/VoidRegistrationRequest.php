<?php

namespace App\Http\Requests\Registrations;

use Illuminate\Foundation\Http\FormRequest;

class VoidRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'void_reason' => ['required', 'string', 'min:5', 'max:500'],
        ];
    }

    public function attributes(): array
    {
        return [
            'void_reason' => 'Alasan Pembatalan (Void Reason)',
        ];
    }
}
