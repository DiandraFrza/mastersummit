<?php

namespace App\Http\Controllers\Results;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\OnlineResultToken;
use App\Models\Registration;
use App\Services\Portal\OnlineResultTokenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ResultHandoverController extends Controller
{
    public function __construct(
        protected OnlineResultTokenService $tokenService
    ) {}

    /**
     * Display work queue and index for result handover & online portal tokens.
     */
    public function index(Request $request): Response
    {
        $status = $request->input('status', 'all');
        $serviceType = $request->input('service_type', 'all');
        $tokenStatus = $request->input('token_status', 'all');
        $companyId = $request->input('company_id', 'all');
        $date = $request->input('date', '');
        $search = trim((string) $request->input('search', ''));

        $allowedPerPage = [10, 20, 50, 100, 300, 500];
        $perPage = (int) $request->input('per_page', 20);
        if (! in_array($perPage, $allowedPerPage, true)) {
            $perPage = 20;
        }

        $query = Registration::query()
            ->with([
                'patient',
                'company',
                'package',
                'mcuEvent',
                'mcuReview.doctor',
                'onlineResultToken.extendedBy',
            ])
            ->where('workflow_status', '!=', 'void')
            ->whereNull('deleted_at');

        if (! empty($date)) {
            $query->whereDate('registered_at', $date);
        }

        if ($companyId !== 'all' && is_numeric($companyId)) {
            $query->where('company_id', (int) $companyId);
        }

        if ($serviceType !== 'all') {
            $query->where('service_type', $serviceType);
        }

        if ($status !== 'all') {
            $query->where('workflow_status', $status);
        }

        // Filter by token status
        if ($tokenStatus === 'active') {
            $query->whereHas('onlineResultToken', function ($q) {
                $q->where('is_revoked', false)->where('expires_at', '>', now());
            });
        } elseif ($tokenStatus === 'expired') {
            $query->whereHas('onlineResultToken', function ($q) {
                $q->where('is_revoked', false)->where('expires_at', '<=', now());
            });
        } elseif ($tokenStatus === 'revoked') {
            $query->whereHas('onlineResultToken', function ($q) {
                $q->where('is_revoked', true);
            });
        } elseif ($tokenStatus === 'none') {
            $query->whereDoesntHave('onlineResultToken');
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('reg_no', 'like', "%{$search}%")
                    ->orWhere('department_snapshot', 'like', "%{$search}%")
                    ->orWhereHas('patient', function ($pq) use ($search) {
                        $pq->where('name', 'like', "%{$search}%")
                            ->orWhere('medical_record_no', 'like', "%{$search}%")
                            ->orWhere('nik', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    });
            });
        }

        $registrations = $query
            ->orderByRaw("CASE WHEN workflow_status = 'completed' THEN 0 WHEN workflow_status = 'manager_approved' THEN 1 ELSE 2 END")
            ->orderBy('registered_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        // Append token metadata to response items
        $registrations->getCollection()->transform(function ($reg) {
            $token = $reg->onlineResultToken;
            $tokenData = null;
            if ($token) {
                $tokenData = [
                    'id' => $token->id,
                    'token' => $token->token,
                    'portal_url' => $token->portal_url,
                    'expires_at' => $token->expires_at->toISOString(),
                    'is_revoked' => $token->is_revoked,
                    'is_expired' => $token->isExpired(),
                    'is_valid' => $token->isValid(),
                    'days_remaining' => $token->days_remaining,
                    'access_count' => $token->access_count,
                    'last_accessed_at' => $token->last_accessed_at?->toISOString(),
                    'extended_at' => $token->extended_at?->toISOString(),
                    'extended_by' => $token->extendedBy?->name,
                ];
            }
            $reg->token_info = $tokenData;
            return $reg;
        });

        // KPI Counts
        $kpi = [
            'total_completed' => Registration::where('workflow_status', 'completed')->count(),
            'active_tokens' => OnlineResultToken::where('is_revoked', false)->where('expires_at', '>', now())->count(),
            'expired_tokens' => OnlineResultToken::where('is_revoked', false)->where('expires_at', '<=', now())->count(),
            'revoked_tokens' => OnlineResultToken::where('is_revoked', true)->count(),
        ];

        $companies = Company::where('is_active', true)->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Results/Index', [
            'registrations' => $registrations,
            'companies' => $companies,
            'kpi' => $kpi,
            'filters' => [
                'status' => $status,
                'service_type' => $serviceType,
                'token_status' => $tokenStatus,
                'company_id' => $companyId,
                'date' => $date,
                'search' => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Extend portal access by +30 days.
     */
    public function extendToken(Registration $registration, Request $request): RedirectResponse
    {
        $token = $this->tokenService->extendAccess($registration, 30, $request->user()->id);
        $newExpiryFormatted = $token->expires_at->translatedFormat('d F Y');

        return redirect()->back()->with('success', "Masa aktif hasil online pasien berhasil diperpanjang +30 hari (berlaku hingga {$newExpiryFormatted}).");
    }

    /**
     * Revoke access token immediately.
     */
    public function revokeToken(Registration $registration): RedirectResponse
    {
        $this->tokenService->revokeAccess($registration);

        return redirect()->back()->with('success', 'Akses tautan online pasien berhasil dicabut demi privasi medis.');
    }

    /**
     * Generate or reactivate portal token manually.
     */
    public function generateToken(Registration $registration): RedirectResponse
    {
        $this->tokenService->generateTokenForRegistration($registration);

        return redirect()->back()->with('success', 'Tautan hasil online berhasil di-generate.');
    }

    /**
     * Get WhatsApp message template and direct link payload.
     */
    public function whatsappInfo(Registration $registration): JsonResponse
    {
        $payload = $this->tokenService->generateWhatsAppPayload($registration);

        return response()->json($payload);
    }
}
