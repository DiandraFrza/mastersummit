<?php

namespace App\Http\Controllers\Examinations;

use App\Http\Controllers\Controller;
use App\Http\Requests\Examinations\StoreDoctorReviewRequest;
use App\Http\Requests\Examinations\StoreManagerApprovalRequest;
use App\Models\McuEvent;
use App\Models\McuReview;
use App\Models\Registration;
use App\Services\Examinations\CompileAbnormalityRecapService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class McuReviewController extends Controller
{
    public function __construct(
        protected CompileAbnormalityRecapService $compilationService
    ) {}

    // ==========================================
    // 1. DOCTOR REVIEW PIPELINE
    // ==========================================

    /**
     * Display work queue of registrations for Doctor MCU review.
     */
    public function doctorIndex(Request $request): Response
    {
        abort_unless($request->user()->can('mcu_reviews.doctor'), 403, 'Anda tidak memiliki hak akses Review Dokter MCU.');

        $search = trim((string) $request->input('search', ''));
        $mcuEventId = $request->input('mcu_event_id', 'all');
        $fitStatus = $request->input('fit_status', 'all');
        $workflowStatus = $request->input('workflow_status', 'all');

        $allowedPerPage = [10, 20, 50, 100, 300, 500];
        $perPage = (int) $request->input('per_page', 20);
        if (! in_array($perPage, $allowedPerPage, true)) {
            $perPage = 20;
        }

        $query = Registration::query()
            ->with([
                'patient',
                'company',
                'mcuEvent.company',
                'package',
                'mcuReview.doctor',
            ])
            ->where('service_type', 'mcu')
            ->where('workflow_status', '!=', 'void')
            ->whereNull('deleted_at');

        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('reg_no', 'like', "%{$search}%")
                    ->orWhere('department_snapshot', 'like', "%{$search}%")
                    ->orWhereHas('patient', function ($p) use ($search) {
                        $p->where('name', 'like', "%{$search}%")
                            ->orWhere('medical_record_no', 'like', "%{$search}%")
                            ->orWhere('nik', 'like', "%{$search}%");
                    });
            });
        }

        if ($mcuEventId !== 'all' && is_numeric($mcuEventId)) {
            $query->where('mcu_event_id', (int) $mcuEventId);
        }

        if ($workflowStatus !== 'all') {
            $query->where('workflow_status', $workflowStatus);
        }

        if ($fitStatus !== 'all') {
            $query->whereHas('mcuReview', function ($q) use ($fitStatus) {
                $q->where('fit_status', $fitStatus);
            });
        }

        $registrations = $query->latest('registered_at')->paginate($perPage)->withQueryString();

        // KPI Counts
        $kpi = [
            'waiting_review' => Registration::where('service_type', 'mcu')->where('workflow_status', 'result_entered')->count(),
            'reviewed_by_doctor' => Registration::where('service_type', 'mcu')->whereIn('workflow_status', ['doctor_reviewed', 'manager_approved', 'completed'])->count(),
            'total_participants' => Registration::where('service_type', 'mcu')->where('workflow_status', '!=', 'void')->count(),
            'locked_count' => McuReview::where('is_locked', true)->count(),
        ];

        $mcuEvents = McuEvent::query()->where('status', '!=', 'closed')->select('id', 'event_code', 'event_name')->get();

        return Inertia::render('Mcu/DoctorReview/Index', [
            'registrations' => $registrations,
            'filters' => [
                'search' => $search,
                'mcu_event_id' => $mcuEventId,
                'fit_status' => $fitStatus,
                'workflow_status' => $workflowStatus,
                'per_page' => $perPage,
            ],
            'kpi' => $kpi,
            'mcuEvents' => $mcuEvents,
            'fitStatusOptions' => McuReview::FIT_STATUS_LABELS,
        ]);
    }

    /**
     * Show registration details, auto-compiled abnormality recap & doctor review form.
     */
    public function doctorShow(Registration $registration): Response
    {
        abort_unless(Auth::user()->can('mcu_reviews.doctor'), 403, 'Anda tidak memiliki hak akses Review Dokter MCU.');

        $registration->load([
            'patient',
            'company',
            'mcuEvent.company',
            'package',
            'items.service',
            'items.examinationResults.parameter',
            'resultAttachments',
            'mcuReview.doctor',
            'mcuReview.manager',
        ]);

        $compiledRecap = $this->compilationService->compile($registration);

        return Inertia::render('Mcu/DoctorReview/Show', [
            'registration' => $registration,
            'compiledRecap' => $compiledRecap,
            'fitStatusOptions' => McuReview::FIT_STATUS_LABELS,
        ]);
    }

    /**
     * Save doctor review, conclusions, advice, and fit status.
     */
    public function doctorStore(StoreDoctorReviewRequest $request, Registration $registration): RedirectResponse
    {
        $existingReview = $registration->mcuReview;
        if ($existingReview && $existingReview->is_locked) {
            return back()->with('error', 'Pemeriksaan ini sudah di-lock oleh Manajer MCU dan tidak dapat diubah.');
        }

        $compiled = $this->compilationService->compile($registration);

        $abnormalityRecap = $request->input('abnormality_recap', $compiled['items']);

        $registration->mcuReview()->updateOrCreate(
            ['registration_id' => $registration->id],
            [
                'fit_status' => $request->validated('fit_status'),
                'doctor_summary' => $request->validated('doctor_summary'),
                'doctor_advice' => $request->validated('doctor_advice'),
                'doctor_notes' => $request->validated('doctor_notes'),
                'abnormality_recap' => $abnormalityRecap,
                'doctor_reviewed_by' => Auth::id(),
                'doctor_reviewed_at' => now(),
            ]
        );

        // State transition to 'doctor_reviewed' if not yet advanced
        if (in_array($registration->workflow_status, ['registered', 'in_progress', 'result_entered'], true)) {
            $registration->update(['workflow_status' => 'doctor_reviewed']);
        }

        return redirect()->route('mcu.doctor-review.show', $registration)
            ->with('success', 'Review Dokter MCU berhasil disimpan dan diteruskan ke tahap QC Manajer.');
    }

    // ==========================================
    // 2. MANAGER MCU REVIEW & QC LOCK PIPELINE
    // ==========================================

    /**
     * Display work queue of registrations for Manager MCU QC & Approval.
     */
    public function managerIndex(Request $request): Response
    {
        abort_unless($request->user()->can('mcu_reviews.manager'), 403, 'Anda tidak memiliki hak akses Review Manajer MCU.');

        $search = trim((string) $request->input('search', ''));
        $mcuEventId = $request->input('mcu_event_id', 'all');
        $lockStatus = $request->input('lock_status', 'all');
        $fitStatus = $request->input('fit_status', 'all');
        $workflowStatus = $request->input('workflow_status', 'all');

        $allowedPerPage = [10, 20, 50, 100, 300, 500];
        $perPage = (int) $request->input('per_page', 20);
        if (! in_array($perPage, $allowedPerPage, true)) {
            $perPage = 20;
        }

        $query = Registration::query()
            ->with([
                'patient',
                'company',
                'mcuEvent.company',
                'package',
                'mcuReview.doctor',
                'mcuReview.manager',
            ])
            ->where('service_type', 'mcu')
            ->where('workflow_status', '!=', 'void')
            ->whereNull('deleted_at');

        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('reg_no', 'like', "%{$search}%")
                    ->orWhere('department_snapshot', 'like', "%{$search}%")
                    ->orWhereHas('patient', function ($p) use ($search) {
                        $p->where('name', 'like', "%{$search}%")
                            ->orWhere('medical_record_no', 'like', "%{$search}%")
                            ->orWhere('nik', 'like', "%{$search}%");
                    });
            });
        }

        if ($mcuEventId !== 'all' && is_numeric($mcuEventId)) {
            $query->where('mcu_event_id', (int) $mcuEventId);
        }

        if ($workflowStatus !== 'all') {
            $query->where('workflow_status', $workflowStatus);
        }

        if ($fitStatus !== 'all') {
            $query->whereHas('mcuReview', function ($q) use ($fitStatus) {
                $q->where('fit_status', $fitStatus);
            });
        }

        if ($lockStatus === 'locked') {
            $query->whereHas('mcuReview', function ($q) {
                $q->where('is_locked', true);
            });
        } elseif ($lockStatus === 'unlocked') {
            $query->where(function ($q) {
                $q->whereDoesntHave('mcuReview')
                    ->orWhereHas('mcuReview', function ($sub) {
                        $sub->where('is_locked', false);
                    });
            });
        }

        $registrations = $query->latest('registered_at')->paginate($perPage)->withQueryString();

        // KPI Counts
        $kpi = [
            'waiting_qc' => Registration::where('service_type', 'mcu')
                ->where('workflow_status', 'doctor_reviewed')
                ->where(function ($q) {
                    $q->whereDoesntHave('mcuReview')
                        ->orWhereHas('mcuReview', fn($sub) => $sub->where('is_locked', false));
                })->count(),
            'approved_and_locked' => McuReview::where('is_locked', true)->count(),
            'total_participants' => Registration::where('service_type', 'mcu')->where('workflow_status', '!=', 'void')->count(),
            'fit_with_notes' => McuReview::where('fit_status', 'fit_with_note')->count(),
            'unfit_count' => McuReview::whereIn('fit_status', ['unfit', 'temporary_unfit'])->count(),
        ];

        $mcuEvents = McuEvent::query()->where('status', '!=', 'closed')->select('id', 'event_code', 'event_name')->get();

        return Inertia::render('Mcu/ManagerReview/Index', [
            'registrations' => $registrations,
            'filters' => [
                'search' => $search,
                'mcu_event_id' => $mcuEventId,
                'lock_status' => $lockStatus,
                'fit_status' => $fitStatus,
                'workflow_status' => $workflowStatus,
                'per_page' => $perPage,
            ],
            'kpi' => $kpi,
            'mcuEvents' => $mcuEvents,
            'fitStatusOptions' => McuReview::FIT_STATUS_LABELS,
        ]);
    }

    /**
     * Show registration details for Manager QC and final approval lock.
     */
    public function managerShow(Registration $registration): Response
    {
        abort_unless(Auth::user()->can('mcu_reviews.manager'), 403, 'Anda tidak memiliki hak akses Review Manajer MCU.');

        $registration->load([
            'patient',
            'company',
            'mcuEvent.company',
            'package',
            'items.service',
            'items.examinationResults.parameter',
            'resultAttachments',
            'mcuReview.doctor',
            'mcuReview.manager',
        ]);

        $compiledRecap = $this->compilationService->compile($registration);

        return Inertia::render('Mcu/ManagerReview/Show', [
            'registration' => $registration,
            'compiledRecap' => $compiledRecap,
            'fitStatusOptions' => McuReview::FIT_STATUS_LABELS,
        ]);
    }

    /**
     * Approve and lock MCU review by Manager, completing the registration workflow.
     */
    public function managerApprove(StoreManagerApprovalRequest $request, Registration $registration): RedirectResponse
    {
        $lockRequested = $request->validated('is_locked');

        $registration->mcuReview()->updateOrCreate(
            ['registration_id' => $registration->id],
            [
                'manager_approved_by' => Auth::id(),
                'manager_approved_at' => now(),
                'manager_notes' => $request->validated('manager_notes'),
                'is_locked' => $lockRequested,
            ]
        );

        if ($lockRequested) {
            $registration->update(['workflow_status' => 'completed']);
            $msg = 'Pemeriksaan MCU berhasil disetujui, di-lock (QC Pass), dan status workflow diselesaikan (Completed).';
        } else {
            $registration->update(['workflow_status' => 'manager_approved']);
            $msg = 'Catatan QC Manajer berhasil disimpan.';
        }

        return redirect()->route('mcu.manager-review.show', $registration)->with('success', $msg);
    }

    /**
     * Unlock an MCU review to allow doctor modifications (with audit logging).
     */
    public function managerUnlock(Request $request, Registration $registration): RedirectResponse
    {
        abort_unless($request->user()->can('mcu_reviews.manager'), 403, 'Hanya Manajer MCU yang dapat membuka kunci (unlock) hasil.');

        if ($registration->mcuReview) {
            $registration->mcuReview->update([
                'is_locked' => false,
            ]);
        }

        $registration->update([
            'workflow_status' => 'doctor_reviewed',
        ]);

        return redirect()->route('mcu.manager-review.show', $registration)
            ->with('success', 'Kunci hasil berhasil dibuka (Unlocked). Dokter kini dapat melakukan revisi catatan atau status kelaikan kerja.');
    }
}
