<?php

namespace App\Http\Controllers\Samples;

use App\Http\Controllers\Controller;
use App\Http\Requests\Samples\ScanBarcodeRequest;
use App\Http\Requests\Samples\UpdateSampleStatusRequest;
use App\Models\Company;
use App\Models\Registration;
use App\Models\RegistrationItem;
use App\Models\Sample;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SampleCollectionController extends Controller
{
    /**
     * Display Ambil Sampel smart dashboard with dynamic station tabs and queue table.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        // 1. Resolve Permitted Sample Stations based on user_sample_scopes
        $isSuperAdmin = $user->hasRole('superadmin') || $user->hasRole('admin_mcu');
        $userScopeIds = $user->sampleScopes()->pluck('sample_id')->toArray();

        $stationQuery = Sample::where('is_active', true)->orderBy('sort_order')->orderBy('name');
        if (! $isSuperAdmin && ! empty($userScopeIds)) {
            $stationQuery->whereIn('id', $userScopeIds);
        }
        $permittedStations = $stationQuery->get(['id', 'code', 'name', 'category', 'sort_order']);

        // 2. Active Station Tab Selection
        $currentStation = $request->input('station');
        if (empty($currentStation)) {
            $currentStation = 'all';
        }

        // 3. Date & Query Filters
        $date = $request->input('date', date('Y-m-d'));
        $search = trim((string) $request->input('search', ''));
        $status = $request->input('status', 'all');
        $companyId = $request->input('company_id', 'all');

        $allowedPerPage = [10, 20, 50, 100, 300, 500];
        $perPage = (int) $request->input('per_page', 20);
        if (! in_array($perPage, $allowedPerPage, true)) {
            $perPage = 20;
        }

        // 4. Calculate KPI for the selected station & date
        $kpiQuery = RegistrationItem::query()
            ->whereHas('registration', function ($q) use ($date) {
                $q->whereNull('deleted_at')
                    ->where('workflow_status', '!=', 'void');
                if (! empty($date)) {
                    $q->whereDate('registered_at', $date);
                }
            });

        if ($currentStation !== 'all' && is_numeric($currentStation)) {
            $kpiQuery->where('sample_id', (int) $currentStation);
        } elseif (! $isSuperAdmin && ! empty($userScopeIds)) {
            $kpiQuery->whereIn('sample_id', $userScopeIds);
        }

        $kpi = [
            'total' => (clone $kpiQuery)->count(),
            'taken' => (clone $kpiQuery)->where('sample_status', 'taken')->count(),
            'pending' => (clone $kpiQuery)->where('sample_status', 'pending')->count(),
            'rejected' => (clone $kpiQuery)->where('sample_status', 'rejected')->count(),
        ];

        // 5. Calculate pending counters for each station tab badge
        $stationCounts = [];
        $basePendingQuery = RegistrationItem::query()
            ->where('sample_status', 'pending')
            ->whereHas('registration', function ($q) use ($date) {
                $q->whereNull('deleted_at')
                    ->where('workflow_status', '!=', 'void');
                if (! empty($date)) {
                    $q->whereDate('registered_at', $date);
                }
            });

        foreach ($permittedStations as $station) {
            $stationCounts[$station->id] = (clone $basePendingQuery)
                ->where('sample_id', $station->id)
                ->count();
        }

        // 6. Build Registration Items Queue Query
        $itemsQuery = RegistrationItem::query()
            ->with([
                'registration.patient',
                'registration.company',
                'service',
                'sample',
                'sampleTakenBy',
                'collector',
            ])
            ->whereHas('registration', function ($q) use ($date, $search, $companyId) {
                $q->whereNull('deleted_at')
                    ->where('workflow_status', '!=', 'void');

                if (! empty($date)) {
                    $q->whereDate('registered_at', $date);
                }

                if ($companyId !== 'all' && is_numeric($companyId)) {
                    $q->where('company_id', (int) $companyId);
                }

                if ($search !== '') {
                    $q->where(function ($sub) use ($search) {
                        $sub->where('reg_no', 'like', "%{$search}%")
                            ->orWhereHas('patient', function ($pq) use ($search) {
                                $pq->where('name', 'like', "%{$search}%")
                                    ->orWhere('medical_record_no', 'like', "%{$search}%")
                                    ->orWhere('nik', 'like', "%{$search}%");
                            });
                    });
                }
            });

        if ($currentStation !== 'all' && is_numeric($currentStation)) {
            $itemsQuery->where('sample_id', (int) $currentStation);
        } elseif (! $isSuperAdmin && ! empty($userScopeIds)) {
            $itemsQuery->whereIn('sample_id', $userScopeIds);
        }

        if (in_array($status, ['pending', 'taken', 'rejected'], true)) {
            $itemsQuery->where('sample_status', $status);
        }

        // Order: pending first, then latest taken
        $items = $itemsQuery
            ->orderByRaw("CASE WHEN sample_status = 'pending' THEN 0 WHEN sample_status = 'taken' THEN 1 ELSE 2 END")
            ->orderBy('id', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        $companies = Company::where('is_active', true)->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Samples/Collect', [
            'stations' => $permittedStations,
            'stationCounts' => $stationCounts,
            'currentStation' => $currentStation,
            'kpi' => $kpi,
            'items' => $items,
            'companies' => $companies,
            'filters' => [
                'date' => $date,
                'search' => $search,
                'status' => $status,
                'station' => $currentStation,
                'company_id' => $companyId,
                'per_page' => $perPage,
            ],
            'isSuperAdmin' => $isSuperAdmin,
        ]);
    }

    /**
     * Process USB/Camera Smart Barcode scan and check in specimen.
     */
    public function scan(ScanBarcodeRequest $request): RedirectResponse
    {
        $barcode = trim($request->input('barcode'));
        $user = $request->user();
        $stationParam = $request->input('sample_id');

        // 1. Resolve Registration by reg_no, patient medical_record_no, or NIK
        $registration = Registration::with(['patient', 'items.service', 'items.sample'])
            ->where('reg_no', $barcode)
            ->orWhereHas('patient', function ($q) use ($barcode) {
                $q->where('medical_record_no', $barcode)
                    ->orWhere('nik', $barcode);
            })
            ->latest('registered_at')
            ->first();

        if (! $registration) {
            return redirect()->back()->with('error', "Barcode / Nomor '{$barcode}' tidak ditemukan dalam sistem pendaftaran.");
        }

        if ($registration->workflow_status === 'void') {
            return redirect()->back()->with('error', "Pendaftaran {$registration->reg_no} ({$registration->patient->name}) telah dibatalkan (Status: Void).");
        }

        // 2. Identify candidate items to collect
        $isSuperAdmin = $user->hasRole('superadmin') || $user->hasRole('admin_mcu');
        $userScopeIds = $user->sampleScopes()->pluck('sample_id')->toArray();

        $itemsQuery = $registration->items();

        if (! empty($stationParam) && is_numeric($stationParam)) {
            $itemsQuery->where('sample_id', (int) $stationParam);
        } elseif (! $isSuperAdmin && ! empty($userScopeIds)) {
            $itemsQuery->whereIn('sample_id', $userScopeIds);
        }

        $candidateItems = $itemsQuery->get();

        if ($candidateItems->isEmpty()) {
            return redirect()->back()->with('error', "Pasien {$registration->patient->name} ({$registration->reg_no}) tidak memiliki pemeriksaan di stasiun ini.");
        }

        $pendingItems = $candidateItems->where('sample_status', 'pending');

        if ($pendingItems->isEmpty()) {
            $alreadyTaken = $candidateItems->where('sample_status', 'taken');
            if ($alreadyTaken->isNotEmpty()) {
                $lastTime = $alreadyTaken->first()->sample_taken_at?->translatedFormat('H:i') ?? '-';
                return redirect()->back()->with('info', "Seluruh sampel untuk {$registration->patient->name} ({$registration->reg_no}) di stasiun ini sudah diambil sebelumnya pada pukul {$lastTime} WIB.");
            }

            return redirect()->back()->with('info', "Semua sampel pasien {$registration->patient->name} telah diproses (status: {$candidateItems->pluck('sample_status')->unique()->implode(', ')}).");
        }

        // 3. Mark Pending Items as Taken
        $now = now();
        $updatedCount = 0;
        $takenNames = [];

        foreach ($pendingItems as $item) {
            $item->update([
                'sample_status' => 'taken',
                'sample_taken_at' => $now,
                'sample_taken_by' => $user->id,
            ]);
            $updatedCount++;
            $takenNames[] = $item->service_name_snapshot;
        }

        // 4. Trigger Automatic Workflow Transition: registered -> in_progress
        $registration->transitionToInProgressIfRegistered();

        $sampleList = implode(', ', array_slice($takenNames, 0, 3));
        if (count($takenNames) > 3) {
            $sampleList .= ' (+' . (count($takenNames) - 3) . ' lainnya)';
        }

        return redirect()->back()->with('success', "CHECK-IN BERHASIL: {$updatedCount} sampel untuk {$registration->patient->name} ({$registration->reg_no}) berhasil diambil [{$sampleList}].");
    }

    /**
     * Manually update single specimen status (taken, pending/reset, rejected).
     */
    public function updateStatus(UpdateSampleStatusRequest $request, RegistrationItem $registrationItem): RedirectResponse
    {
        $status = $request->input('sample_status');
        $user = $request->user();

        if ($status === 'taken') {
            $registrationItem->update([
                'sample_status' => 'taken',
                'sample_taken_at' => now(),
                'sample_taken_by' => $user->id,
            ]);

            // Transition registration workflow status to in_progress
            $registrationItem->registration?->transitionToInProgressIfRegistered();

            return redirect()->back()->with('success', "Sampel {$registrationItem->service_name_snapshot} ({$registrationItem->registration?->patient?->name}) berhasil ditandai telah diambil.");
        }

        if ($status === 'pending') {
            $registrationItem->update([
                'sample_status' => 'pending',
                'sample_taken_at' => null,
                'sample_taken_by' => null,
            ]);

            return redirect()->back()->with('success', "Status sampel {$registrationItem->service_name_snapshot} direset ke Menunggu (Pending).");
        }

        if ($status === 'rejected') {
            $reason = $request->input('rejection_reason', 'Spesimen tidak memenuhi syarat');
            $registrationItem->update([
                'sample_status' => 'rejected',
                'group_conclusion' => "Ditolak: {$reason}",
            ]);

            return redirect()->back()->with('success', "Sampel {$registrationItem->service_name_snapshot} berhasil ditolak (Status: Rejected). Alasan: {$reason}.");
        }

        return redirect()->back();
    }
}
