<?php

namespace App\Services\Portal;

use App\Models\ClinicSetting;
use App\Models\OnlineResultToken;
use App\Models\Registration;
use Carbon\Carbon;
use Illuminate\Support\Str;

class OnlineResultTokenService
{
    /**
     * Generate or return active online result token for a registration.
     */
    public function generateTokenForRegistration(Registration $registration, ?int $expiryDays = null): OnlineResultToken
    {
        $clinic = ClinicSetting::current();
        $days = $expiryDays ?: ($clinic->default_online_expiry_days ?? 30);

        // Check if an existing valid token already exists
        $existing = $registration->onlineResultTokens()
            ->where('is_revoked', false)
            ->where('expires_at', '>', now())
            ->latest()
            ->first();

        if ($existing) {
            return $existing;
        }

        // Generate 64-character secure hexadecimal token
        $tokenString = bin2hex(random_bytes(32));

        return OnlineResultToken::create([
            'registration_id' => $registration->id,
            'token' => $tokenString,
            'verification_type' => 'dob',
            'expires_at' => now()->addDays($days),
            'is_revoked' => false,
            'access_count' => 0,
        ]);
    }

    /**
     * Extend access validity by additional days (default +30 days).
     */
    public function extendAccess(Registration $registration, int $additionalDays = 30, ?int $userId = null): OnlineResultToken
    {
        $token = $registration->onlineResultTokens()->latest()->first();

        if (! $token) {
            return $this->generateTokenForRegistration($registration, $additionalDays);
        }

        // If expired in the past, add days from now. Otherwise, add days from current expires_at.
        $baseDate = $token->expires_at->isPast() ? now() : $token->expires_at;
        $newExpiry = Carbon::parse($baseDate)->addDays($additionalDays);

        $token->update([
            'expires_at' => $newExpiry,
            'is_revoked' => false,
            'extended_by' => $userId,
            'extended_at' => now(),
        ]);

        return $token->fresh();
    }

    /**
     * Revoke access token immediately for patient privacy.
     */
    public function revokeAccess(Registration $registration): bool
    {
        $token = $registration->onlineResultTokens()->latest()->first();
        if ($token) {
            return $token->update(['is_revoked' => true]);
        }
        return false;
    }

    /**
     * Verify patient credential against DOB (DDMMYYYY) or last 4 digits of phone.
     */
    public function verifyAccess(OnlineResultToken $token, string $input): bool
    {
        $registration = $token->registration;
        $patient = $registration->patient;
        if (! $patient) {
            return false;
        }

        $cleanInput = preg_replace('/[^0-9]/', '', trim($input));
        if (empty($cleanInput)) {
            return false;
        }

        // 1. Check Date of Birth (DDMMYYYY)
        if ($patient->birth_date) {
            $dobFormatted = Carbon::parse($patient->birth_date)->format('dmY');
            if ($cleanInput === $dobFormatted) {
                return true;
            }
        }

        // 2. Check Last 4 digits of phone
        if (! empty($patient->phone)) {
            $cleanPhone = preg_replace('/[^0-9]/', '', $patient->phone);
            if (strlen($cleanPhone) >= 4) {
                $last4 = substr($cleanPhone, -4);
                if ($cleanInput === $last4) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Generate WhatsApp sharing payload with pre-filled message and direct URL.
     */
    public function generateWhatsAppPayload(Registration $registration): array
    {
        $token = $this->generateTokenForRegistration($registration);
        $patient = $registration->patient;
        $clinic = ClinicSetting::current();

        $phone = preg_replace('/[^0-9]/', '', $patient->phone ?? '');
        if (str_starts_with($phone, '0')) {
            $phone = '62' . substr($phone, 1);
        }

        $clinicName = $clinic->clinic_name ?? 'Klinik Master Summit';
        $patientName = $patient->name;
        $portalUrl = $token->portal_url;
        $expiryDate = $token->expires_at->translatedFormat('d F Y');

        $message = "Halo {$patientName},\n\n";
        $message .= "Hasil pemeriksaan kesehatan Anda di {$clinicName} telah selesai dan dapat diakses secara online melalui tautan resmi:\n";
        $message .= "👉 {$portalUrl}\n\n";
        $message .= "Untuk keamanan data medis Anda, masukkan Tanggal Lahir (format: HHBBMMPP, contoh: 15081990) atau 4 digit terakhir nomor HP Anda saat membuka tautan.\n\n";
        $message .= "Tautan ini aktif hingga tanggal {$expiryDate}.\n";
        $message .= "Terima kasih telah mempercayakan layanan kesehatan Anda kepada kami.";

        $waLink = ! empty($phone)
            ? 'https://wa.me/' . $phone . '?text=' . urlencode($message)
            : 'https://wa.me/?text=' . urlencode($message);

        return [
            'patient_name' => $patientName,
            'phone' => $phone,
            'message' => $message,
            'wa_link' => $waLink,
            'whatsapp_url' => $waLink,
            'portal_url' => $portalUrl,
            'token' => $token,
        ];
    }
}
