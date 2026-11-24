<?php

namespace App\Services\Reports;

use App\Models\RegistrationItem;
use App\Models\Service;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ExaminationReportService
{
    /**
     * Get complete examination report data (KPIs, volume recap, and paginated item list).
     */
    public function getData(array $filters): array
    {
        $startDate = ! empty($filters['start_date'])
            ? Carbon::parse($filters['start_date'])->startOfDay()
            : now()->startOfMonth()->startOfDay();

        $endDate = ! empty($filters['end_date'])
            ? Carbon::parse($filters['end_date'])->endOfDay()
            : now()->endOfDay();

        $category = $filters['category'] ?? 'all';
        $serviceId = $filters['service_id'] ?? 'all';
        $billedTo = $filters['billed_to'] ?? 'all';
        $resultStatus = $filters['result_status'] ?? 'all';
        $sampleStatus = $filters['sample_status'] ?? 'all';
        $companyId = $filters['company_id'] ?? 'all';
        $search = trim((string) ($filters['search'] ?? ''));

        $allowedPerPage = [10, 20, 50, 100, 300, 500];
        $perPage = (int) ($filters['per_page'] ?? 20);
        if (! in_array($perPage, $allowedPerPage, true)) {
            $perPage = 20;
        }

        // 1. Build Base Query for Registration Items
        $itemsQuery = RegistrationItem::query()
            ->with([
                'registration.patient',
                'registration.company',
                'registration.mcuEvent',
                'service',
                'sample',
            ])
            ->whereHas('registration', function (Builder $q) use ($startDate, $endDate, $companyId, $search) {
                $q->where('workflow_status', '!=', 'void')
                    ->whereNull('deleted_at')
                    ->whereBetween('registered_at', [$startDate, $endDate]);

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

        // Filter by Category
        if ($category !== 'all') {
            $itemsQuery->where('category', $category);
        }

        // Filter by Service
        if ($serviceId !== 'all' && is_numeric($serviceId)) {
            $itemsQuery->where('service_id', (int) $serviceId);
        }

        // Filter by Billed To (corporate / personal / referrer)
        if ($billedTo !== 'all') {
            $itemsQuery->where('billed_to', $billedTo);
        }

        // Filter by Result Status
        if ($resultStatus !== 'all') {
            $itemsQuery->where('result_status', $resultStatus);
        }

        // Filter by Sample Status
        if ($sampleStatus !== 'all') {
            $itemsQuery->where('sample_status', $sampleStatus);
        }

        if (! empty($search)) {
            $itemsQuery->orWhere(function (Builder $q) use ($search, $startDate, $endDate) {
                $q->where('service_name_snapshot', 'like', "%{$search}%")
                    ->whereHas('registration', fn ($rq) => $rq->where('workflow_status', '!=', 'void')->whereBetween('registered_at', [$startDate, $endDate]));
            });
        }

        // 2. Paginated Items
        $items = (clone $itemsQuery)
            ->orderBy('id', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        // 3. Compute KPI Summary Cards
        $totalItems = (int) (clone $itemsQuery)->count();
        $totalLab = (int) (clone $itemsQuery)->where('category', 'lab')->count();
        $totalRadiology = (int) (clone $itemsQuery)->where('category', 'radiology')->count();
        $totalElectro = (int) (clone $itemsQuery)->where('category', 'electromedical')->count();
        $totalPhysical = (int) (clone $itemsQuery)->where('category', 'physical')->count();
        $totalNominal = (float) (clone $itemsQuery)->sum('final_price');

        $kpi = [
            'total_items' => $totalItems,
            'total_lab' => $totalLab,
            'total_radiology' => $totalRadiology,
            'total_electromedical' => $totalElectro,
            'total_physical' => $totalPhysical,
            'total_nominal' => $totalNominal,
        ];

        // 4. Compute Volume & Revenue Recap per Service
        $recapByService = $this->calculateServiceRecap($startDate, $endDate, $companyId, $category);

        return [
            'kpi' => $kpi,
            'recap_by_service' => $recapByService,
            'items' => $items,
            'filters' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'category' => $category,
                'service_id' => $serviceId,
                'billed_to' => $billedTo,
                'result_status' => $resultStatus,
                'sample_status' => $sampleStatus,
                'company_id' => $companyId,
                'search' => $search,
                'per_page' => $perPage,
            ],
        ];
    }

    /**
     * Compute volume and revenue breakdown grouped by service.
     */
    protected function calculateServiceRecap(Carbon $startDate, Carbon $endDate, string|int $companyId, string $category): Collection
    {
        $query = DB::table('registration_items')
            ->join('registrations', 'registration_items.registration_id', '=', 'registrations.id')
            ->where('registrations.workflow_status', '!=', 'void')
            ->whereNull('registrations.deleted_at')
            ->whereBetween('registrations.registered_at', [$startDate, $endDate]);

        if ($companyId !== 'all' && is_numeric($companyId)) {
            $query->where('registrations.company_id', (int) $companyId);
        }

        if ($category !== 'all') {
            $query->where('registration_items.category', $category);
        }

        return $query
            ->select([
                'registration_items.service_id',
                'registration_items.service_name_snapshot as service_name',
                'registration_items.category',
                DB::raw('COUNT(*) as total_volume'),
                DB::raw("SUM(CASE WHEN registration_items.billed_to = 'personal' THEN 1 ELSE 0 END) as personal_volume"),
                DB::raw("SUM(CASE WHEN registration_items.billed_to = 'corporate' THEN 1 ELSE 0 END) as corporate_volume"),
                DB::raw("SUM(CASE WHEN registration_items.billed_to = 'referrer' THEN 1 ELSE 0 END) as referrer_volume"),
                DB::raw('SUM(registration_items.final_price) as total_revenue'),
            ])
            ->groupBy([
                'registration_items.service_id',
                'registration_items.service_name_snapshot',
                'registration_items.category',
            ])
            ->orderBy('total_volume', 'desc')
            ->get();
    }

    /**
     * Prepare data for Excel export.
     */
    public function getExportData(array $filters): array
    {
        return $this->getData(array_merge($filters, ['per_page' => 10000]));
    }
}
