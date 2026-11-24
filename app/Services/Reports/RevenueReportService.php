<?php

namespace App\Services\Reports;

use App\Models\Payment;
use App\Models\Registration;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class RevenueReportService
{
    /**
     * Get complete revenue report data (KPIs, recap, and paginated payments list).
     */
    public function getData(array $filters): array
    {
        $startDate = ! empty($filters['start_date'])
            ? Carbon::parse($filters['start_date'])->startOfDay()
            : now()->startOfMonth()->startOfDay();

        $endDate = ! empty($filters['end_date'])
            ? Carbon::parse($filters['end_date'])->endOfDay()
            : now()->endOfDay();

        $payerType = $filters['payer_type'] ?? 'all';
        $paymentMethod = $filters['payment_method'] ?? 'all';
        $paymentStatus = $filters['payment_status'] ?? 'all';
        $companyId = $filters['company_id'] ?? 'all';
        $search = trim((string) ($filters['search'] ?? ''));

        $allowedPerPage = [10, 20, 50, 100, 300, 500];
        $perPage = (int) ($filters['per_page'] ?? 20);
        if (! in_array($perPage, $allowedPerPage, true)) {
            $perPage = 20;
        }

        // 1. Build Base Payments Query
        $paymentsQuery = Payment::query()
            ->with([
                'registration.patient',
                'registration.company',
                'registration.referrer',
                'bank',
                'receivedBy',
            ])
            ->whereBetween('paid_at', [$startDate, $endDate]);

        // Filter by Payment Method
        if ($paymentMethod !== 'all') {
            $paymentsQuery->where('payment_method', $paymentMethod);
        }

        // Filter by Registration attributes (payer_type, payment_status, company, search)
        $paymentsQuery->whereHas('registration', function (Builder $q) use ($payerType, $paymentStatus, $companyId, $search) {
            $q->where('workflow_status', '!=', 'void');

            if ($payerType !== 'all') {
                $q->where('payer_type', $payerType);
            }

            if ($paymentStatus !== 'all') {
                $q->where('payment_status', $paymentStatus);
            }

            if ($companyId !== 'all' && is_numeric($companyId)) {
                $q->where('company_id', (int) $companyId);
            }

            if (! empty($search)) {
                $q->where(function (Builder $sq) use ($search) {
                    $sq->where('reg_no', 'like', "%{$search}%")
                        ->orWhereHas('patient', function (Builder $pq) use ($search) {
                            $pq->where('name', 'like', "%{$search}%")
                                ->orWhere('medical_record_no', 'like', "%{$search}%");
                        });
                });
            }
        });

        if (! empty($search)) {
            $paymentsQuery->orWhere(function (Builder $q) use ($search, $startDate, $endDate) {
                $q->whereBetween('paid_at', [$startDate, $endDate])
                    ->where(function (Builder $sq) use ($search) {
                        $sq->where('payment_no', 'like', "%{$search}%")
                            ->orWhere('reference_no', 'like', "%{$search}%");
                    });
            });
        }

        $payments = (clone $paymentsQuery)
            ->orderBy('paid_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        // 2. Registrations Query in date range for Billings & Receivables KPIs
        $registrationsQuery = Registration::query()
            ->where('workflow_status', '!=', 'void')
            ->whereNull('deleted_at')
            ->whereBetween('registered_at', [$startDate, $endDate]);

        if ($payerType !== 'all') {
            $registrationsQuery->where('payer_type', $payerType);
        }

        if ($companyId !== 'all' && is_numeric($companyId)) {
            $registrationsQuery->where('company_id', (int) $companyId);
        }

        // 3. Compute KPI Summary Cards
        $totalCollected = (float) (clone $paymentsQuery)->sum('amount');

        $apsCollected = (float) Payment::query()
            ->whereBetween('paid_at', [$startDate, $endDate])
            ->whereHas('registration', fn ($q) => $q->where('workflow_status', '!=', 'void')->where('payer_type', 'aps'))
            ->sum('amount');

        $corporateCollected = (float) Payment::query()
            ->whereBetween('paid_at', [$startDate, $endDate])
            ->whereHas('registration', fn ($q) => $q->where('workflow_status', '!=', 'void')->where('payer_type', 'corporate'))
            ->sum('amount');

        $referrerCollected = (float) Payment::query()
            ->whereBetween('paid_at', [$startDate, $endDate])
            ->whereHas('registration', fn ($q) => $q->where('workflow_status', '!=', 'void')->where('payer_type', 'referrer'))
            ->sum('amount');

        $totalBilled = (float) (clone $registrationsQuery)->sum('total_amount');
        $totalRemainingReceivables = (float) (clone $registrationsQuery)->sum('remaining_amount');

        $kpi = [
            'total_revenue' => $totalCollected,
            'aps_revenue' => $apsCollected,
            'corporate_revenue' => $corporateCollected,
            'referrer_revenue' => $referrerCollected,
            'total_billed' => $totalBilled,
            'remaining_receivables' => $totalRemainingReceivables,
        ];

        // 4. Compute Recap by Payer Type (APS, Corporate, Referrer, and Split Billing)
        $recapByPayer = $this->calculatePayerRecap($startDate, $endDate, $companyId);

        // 5. Compute Recap by Payment Method
        $recapByMethod = $this->calculateMethodRecap($startDate, $endDate);

        return [
            'kpi' => $kpi,
            'recap_by_payer' => $recapByPayer,
            'recap_by_method' => $recapByMethod,
            'payments' => $payments,
            'filters' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'payer_type' => $payerType,
                'payment_method' => $paymentMethod,
                'payment_status' => $paymentStatus,
                'company_id' => $companyId,
                'search' => $search,
                'per_page' => $perPage,
            ],
        ];
    }

    /**
     * Compute summary table grouped by payer types (APS, Corporate, Referrer, and Split Billing items).
     */
    protected function calculatePayerRecap(Carbon $startDate, Carbon $endDate, string|int $companyId): array
    {
        $baseQuery = Registration::query()
            ->where('workflow_status', '!=', 'void')
            ->whereNull('deleted_at')
            ->whereBetween('registered_at', [$startDate, $endDate]);

        if ($companyId !== 'all' && is_numeric($companyId)) {
            $baseQuery->where('company_id', (int) $companyId);
        }

        $categories = [
            'aps' => 'APS (Pribadi / Mandiri)',
            'corporate' => 'Corporate MCU',
            'referrer' => 'Rujukan Luar / Puskesmas',
        ];

        $recap = [];

        foreach ($categories as $type => $label) {
            $q = (clone $baseQuery)->where('payer_type', $type);
            $regCount = (int) $q->count();
            $finalAmount = (float) $q->sum('total_amount');
            $paidAmount = (float) $q->sum('paid_amount');
            $remainingAmount = (float) $q->sum('remaining_amount');

            $recap[] = [
                'type' => $type,
                'label' => $label,
                'reg_count' => $regCount,
                'total_final' => $finalAmount,
                'total_paid' => $paidAmount,
                'total_remaining' => $remainingAmount,
            ];
        }

        // Split Billing: Corporate patients with personal add-on services
        $splitQuery = (clone $baseQuery)
            ->where('payer_type', 'corporate')
            ->whereHas('items', fn ($iq) => $iq->where('billed_to', 'personal'));

        $splitRegCount = (int) $splitQuery->count();
        $splitPersonalSum = 0;
        if ($splitRegCount > 0) {
            $splitRegIds = $splitQuery->pluck('id');
            $splitPersonalSum = (float) DB::table('registration_items')
                ->whereIn('registration_id', $splitRegIds)
                ->where('billed_to', 'personal')
                ->sum('final_price');
        }

        $recap[] = [
            'type' => 'split_billing',
            'label' => 'Item Tambahan Pribadi (Split Billing Corporate)',
            'reg_count' => $splitRegCount,
            'total_final' => $splitPersonalSum,
            'total_paid' => $splitPersonalSum,
            'total_remaining' => 0,
        ];

        return $recap;
    }

    /**
     * Compute summary table grouped by payment methods.
     */
    protected function calculateMethodRecap(Carbon $startDate, Carbon $endDate): array
    {
        $methodLabels = [
            'cash' => 'Tunai (Cash)',
            'transfer' => 'Transfer Bank',
            'qris' => 'QRIS',
            'edc' => 'Kartu Debit / EDC',
            'invoice_corporate' => 'Invoice Perusahaan (Corporate Invoicing)',
        ];

        $rawMethods = Payment::query()
            ->select('payment_method', DB::raw('COUNT(*) as total_count'), DB::raw('SUM(amount) as total_amount'))
            ->whereBetween('paid_at', [$startDate, $endDate])
            ->groupBy('payment_method')
            ->get()
            ->keyBy('payment_method');

        $result = [];
        foreach ($methodLabels as $method => $label) {
            $item = $rawMethods->get($method);
            $result[] = [
                'method' => $method,
                'label' => $label,
                'count' => $item ? (int) $item->total_count : 0,
                'total_amount' => $item ? (float) $item->total_amount : 0,
            ];
        }

        return $result;
    }

    /**
     * Prepare data for Excel export.
     */
    public function getExportData(array $filters): array
    {
        $data = $this->getData(array_merge($filters, ['per_page' => 5000]));
        return $data;
    }
}
