<?php

namespace App\Http\Controllers\Registrations;

use App\Actions\Registrations\RegisterPatientAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Registrations\StoreRegistrationRequest;
use App\Http\Requests\Registrations\VoidRegistrationRequest;
use App\Models\Bank;
use App\Models\Company;
use App\Models\McuEvent;
use App\Models\Package;
use App\Models\Patient;
use App\Models\Referrer;
use App\Models\Registration;
use App\Models\Service;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RegistrationController extends Controller
{
    /**
     * Display a listing of registrations with server-side filtering.
     */
    public function index(Request $request): Response
    {
        $allowedPerPage = [10, 20, 50, 100, 300, 500];
        $perPage = (int) $request->input('per_page', 10);
        if (! in_array($perPage, $allowedPerPage, true)) {
            $perPage = 10;
        }

        $sort = $request->input('sort', 'registered_at');
        $direction = strtolower($request->input('direction', 'desc')) === 'asc' ? 'asc' : 'desc';
        $allowedSorts = ['id', 'reg_no', 'registered_at', 'service_type', 'payer_type', 'grand_total', 'payment_status', 'workflow_status'];
        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'registered_at';
        }

        $search = trim((string) $request->input('search', ''));
        $serviceType = $request->input('service_type', 'all');
        $payerType = $request->input('payer_type', 'all');
        $workflowStatus = $request->input('workflow_status', 'all');
        $paymentStatus = $request->input('payment_status', 'all');
        $companyId = $request->input('company_id', 'all');
        $dateFilter = $request->input('date', '');

        $query = Registration::query()->with([
            'patient',
            'company',
            'referrer',
            'package',
            'mcuEvent',
            'items.service',
            'payments.bank',
            'voidedBy',
        ]);

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('reg_no', 'like', "%{$search}%")
                    ->orWhereHas('patient', function ($pq) use ($search) {
                        $pq->where('name', 'like', "%{$search}%")
                            ->orWhere('medical_record_no', 'like', "%{$search}%")
                            ->orWhere('nik', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    });
            });
        }

        if (in_array($serviceType, ['regular', 'mcu'], true)) {
            $query->where('service_type', $serviceType);
        }

        if (in_array($payerType, ['aps', 'corporate', 'referrer'], true)) {
            $query->where('payer_type', $payerType);
        }

        if (in_array($workflowStatus, ['registered', 'in_progress', 'result_entered', 'doctor_reviewed', 'manager_approved', 'completed', 'void'], true)) {
            $query->where('workflow_status', $workflowStatus);
        }

        if (in_array($paymentStatus, ['unpaid', 'partial', 'paid', 'corporate_billed'], true)) {
            $query->where('payment_status', $paymentStatus);
        }

        if ($companyId !== 'all' && is_numeric($companyId)) {
            $query->where('company_id', (int) $companyId);
        }

        if (! empty($dateFilter)) {
            $query->whereDate('registered_at', $dateFilter);
        }

        $registrations = $query->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString();

        $companies = Company::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $referrers = Referrer::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $packages = Package::where('is_active', true)
            ->with(['packageItems.service'])
            ->orderBy('name')
            ->get(['id', 'name', 'total_price', 'discount_amount', 'final_price']);
        $services = Service::where('is_active', true)
            ->orderBy('category')
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'category', 'base_price']);
        $mcuEvents = McuEvent::whereIn('status', ['draft', 'ongoing', 'review'])
            ->orderBy('year', 'desc')
            ->orderBy('event_name')
            ->get(['id', 'event_code', 'event_name', 'company_id']);
        $banks = Bank::where('is_active', true)->orderBy('name')->get(['id', 'name', 'account_number']);

        return Inertia::render('Registrations/Index', [
            'registrations' => $registrations,
            'companies' => $companies,
            'referrers' => $referrers,
            'packages' => $packages,
            'services' => $services,
            'mcuEvents' => $mcuEvents,
            'banks' => $banks,
            'filters' => [
                'search' => $search,
                'service_type' => $serviceType,
                'payer_type' => $payerType,
                'workflow_status' => $workflowStatus,
                'payment_status' => $paymentStatus,
                'company_id' => $companyId,
                'date' => $dateFilter,
                'sort' => $sort,
                'direction' => $direction,
                'per_page' => $perPage,
            ],
            'nextRegNo' => Registration::generateNextRegNo(),
        ]);
    }

    /**
     * Store patient registration via single-door action.
     */
    public function store(StoreRegistrationRequest $request, RegisterPatientAction $action): RedirectResponse
    {
        $registration = $action->execute($request->validated(), $request->user()->id);

        return redirect()->back()->with('success', "Pendaftaran {$registration->reg_no} untuk pasien {$registration->patient->name} berhasil diproses.");
    }

    /**
     * Cancel/Void registration with mandatory reason.
     */
    public function void(VoidRegistrationRequest $request, Registration $registration): RedirectResponse
    {
        if ($registration->workflow_status === 'completed') {
            return redirect()->back()->with('error', 'Pendaftaran yang telah berstatus Completed tidak dapat dibatalkan.');
        }

        if ($registration->workflow_status === 'void') {
            return redirect()->back()->with('error', 'Pendaftaran ini sudah dibatalkan sebelumnya.');
        }

        $registration->markAsVoid($request->input('void_reason'), $request->user()->id);

        return redirect()->back()->with('success', "Pendaftaran {$registration->reg_no} berhasil dibatalkan (Status: Void).");
    }
}
