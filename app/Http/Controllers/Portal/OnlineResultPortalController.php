<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\Portal\VerifyPortalAccessRequest;
use App\Models\ClinicSetting;
use App\Models\OnlineResultToken;
use App\Services\Portal\OnlineResultTokenService;
use App\Services\Prints\GenerateMcuBookPdfService;
use App\Services\Prints\SinglePrintTemplateService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;

class OnlineResultPortalController extends Controller
{
    public function __construct(
        protected OnlineResultTokenService $tokenService,
        protected GenerateMcuBookPdfService $mcuBookService,
        protected SinglePrintTemplateService $singlePrintService
    ) {}

    /**
     * Display public gatekeeper verification or verified patient result portal.
     */
    public function show(string $tokenString, Request $request): Response
    {
        $token = OnlineResultToken::where('token', $tokenString)
            ->with(['registration.patient', 'registration.company'])
            ->firstOrFail();

        $clinic = ClinicSetting::current();

        // 1. Check if Revoked
        if ($token->is_revoked) {
            return Inertia::render('Portal/Status', [
                'status' => 'revoked',
                'title' => 'Akses Hasil Online Telah Dicabut',
                'message' => 'Tautan dokumen medis ini telah dinonaktifkan oleh pihak klinik demi keamanan dan privasi pasien.',
                'clinic' => $clinic,
            ]);
        }

        // 2. Check if Expired
        if ($token->isExpired()) {
            return Inertia::render('Portal/Status', [
                'status' => 'expired',
                'title' => 'Tautan Akses Telah Kedaluwarsa',
                'message' => 'Masa berlaku tautan online 30 hari telah berakhir. Silakan hubungi bagian administrasi klinik untuk melakukan perpanjangan masa aktif akses.',
                'clinic' => $clinic,
            ]);
        }

        // 3. Check Session Verification
        $isVerified = (bool) $request->session()->get('verified_portal_token_' . $token->id, false);

        if (! $isVerified) {
            // Mask patient name for privacy, e.g. "Budi Santoso" -> "B*** S******"
            $patient = $token->registration->patient;
            $maskedName = $this->maskName($patient?->name ?? 'Pasien');

            return Inertia::render('Portal/Verify', [
                'token' => $token->token,
                'patientMasked' => $maskedName,
                'regNoMasked' => $this->maskRegNo($token->registration->reg_no),
                'clinic' => $clinic,
                'expiresAt' => $token->expires_at->translatedFormat('d F Y'),
            ]);
        }

        // 4. Verified: Load complete medical data
        $registration = $token->registration;
        $registration->load([
            'patient',
            'company',
            'mcuEvent',
            'package',
            'mcuReview.doctor',
            'mcuReview.manager',
            'items' => function ($q) {
                $q->with([
                    'service.sample',
                    'examinationResults.parameter',
                ]);
            },
            'resultAttachments' => function ($q) {
                $q->where('merge_into_mcu_pdf', true);
            },
        ]);

        return Inertia::render('Portal/Show', [
            'token' => $token->token,
            'registration' => $registration,
            'clinic' => $clinic,
            'expiresAt' => $token->expires_at->translatedFormat('d F Y'),
            'daysRemaining' => $token->days_remaining,
        ]);
    }

    /**
     * Verify patient credential (DOB or phone last 4).
     */
    public function verify(string $tokenString, VerifyPortalAccessRequest $request): RedirectResponse
    {
        $token = OnlineResultToken::where('token', $tokenString)->firstOrFail();

        if ($token->is_revoked || $token->isExpired()) {
            return redirect()->route('portal.show', $tokenString);
        }

        $credential = $request->validated('credential');
        $valid = $this->tokenService->verifyAccess($token, $credential);

        if (! $valid) {
            return back()->withErrors([
                'credential' => 'Kredensial tidak cocok. Masukkan tanggal lahir (format: HHBBMMPP, contoh: 17081995) atau 4 digit nomor HP yang terdaftar.',
            ]);
        }

        // Store verification in session
        $request->session()->put('verified_portal_token_' . $token->id, true);

        // Update audit telemetry
        $token->increment('access_count');
        $token->update([
            'last_accessed_at' => now(),
            'last_accessed_ip' => $request->ip(),
        ]);

        return redirect()->route('portal.show', $tokenString);
    }

    /**
     * Download official PDF report via token.
     */
    public function downloadPdf(string $tokenString, Request $request): HttpResponse
    {
        $token = OnlineResultToken::where('token', $tokenString)->firstOrFail();

        if ($token->is_revoked || $token->isExpired()) {
            abort(403, 'Tautan akses online tidak aktif atau kedaluwarsa.');
        }

        $isVerified = (bool) $request->session()->get('verified_portal_token_' . $token->id, false);
        if (! $isVerified) {
            abort(403, 'Silakan selesaikan verifikasi identitas terlebih dahulu.');
        }

        $registration = $token->registration;

        if ($registration->service_type === 'mcu') {
            $pdfBinary = $this->mcuBookService->generatePdf($registration);
            $filename = 'Hasil_MCU_' . $registration->reg_no . '.pdf';
        } else {
            $firstItem = $registration->items->first();
            if ($firstItem) {
                $pdfBinary = $this->singlePrintService->generatePdf($registration, $firstItem);
                $filename = 'Hasil_' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $firstItem->service_name_snapshot) . '_' . $registration->reg_no . '.pdf';
            } else {
                abort(404, 'Item hasil tidak ditemukan.');
            }
        }

        return response($pdfBinary, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * Mask name for public gatekeeper display.
     */
    protected function maskName(string $name): string
    {
        $parts = explode(' ', trim($name));
        $masked = [];
        foreach ($parts as $p) {
            if (strlen($p) <= 2) {
                $masked[] = $p;
            } else {
                $masked[] = substr($p, 0, 1) . str_repeat('*', strlen($p) - 1);
            }
        }
        return implode(' ', $masked);
    }

    /**
     * Mask Registration Number.
     */
    protected function maskRegNo(string $regNo): string
    {
        if (strlen($regNo) <= 6) {
            return $regNo;
        }
        return substr($regNo, 0, 4) . '****' . substr($regNo, -3);
    }
}
