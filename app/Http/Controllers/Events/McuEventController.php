<?php

namespace App\Http\Controllers\Events;

use App\Http\Controllers\Controller;
use App\Http\Requests\Events\StoreMcuEventRequest;
use App\Http\Requests\Events\UpdateMcuEventRequest;
use App\Models\Company;
use App\Models\Employee;
use App\Models\McuEvent;
use App\Models\Referrer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class McuEventController extends Controller
{
    /**
     * Display a listing of corporate MCU events.
     */
    public function index(Request $request): Response
    {
        $allowedPerPage = [10, 20, 50, 100, 300, 500];
        $perPage = (int) $request->input('per_page', 10);
        if (! in_array($perPage, $allowedPerPage, true)) {
            $perPage = 10;
        }

        $sort = $request->input('sort', 'id');
        $direction = strtolower($request->input('direction', 'desc')) === 'asc' ? 'asc' : 'desc';
        $allowedSorts = ['id', 'year', 'event_code', 'event_name', 'target_participants', 'status', 'start_date', 'created_at'];
        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'id';
        }

        $search = trim((string) $request->input('search', ''));
        $statusFilter = $request->input('status', 'all');
        $yearFilter = $request->input('year', 'all');
        $companyFilter = $request->input('company_id', 'all');

        $query = McuEvent::query()->with([
            'referrer',
            'company',
            'picMcu',
            'doctorAnamnese',
            'doctorLab',
            'doctorRadiology',
            'qc1',
            'qc2',
        ]);

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('event_code', 'like', "%{$search}%")
                    ->orWhere('event_name', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%");
            });
        }

        if (in_array($statusFilter, ['draft', 'ongoing', 'review', 'completed', 'closed'], true)) {
            $query->where('status', $statusFilter);
        }

        if ($yearFilter !== 'all' && is_numeric($yearFilter)) {
            $query->where('year', (int) $yearFilter);
        }

        if ($companyFilter !== 'all' && is_numeric($companyFilter)) {
            $query->where('company_id', (int) $companyFilter);
        }

        $events = $query->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString();

        $companies = Company::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $referrers = Referrer::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $employees = Employee::where('is_active', true)->orderBy('name')->get(['id', 'name', 'job_title']);

        $currentYear = (int) date('Y');

        return Inertia::render('Events/Index', [
            'events' => $events,
            'companies' => $companies,
            'referrers' => $referrers,
            'employees' => $employees,
            'filters' => [
                'search' => $search,
                'status' => $statusFilter,
                'year' => $yearFilter,
                'company_id' => $companyFilter,
                'sort' => $sort,
                'direction' => $direction,
                'per_page' => $perPage,
            ],
            'nextEventCode' => McuEvent::generateNextEventCode($currentYear),
        ]);
    }

    /**
     * Store a newly created MCU event.
     */
    public function store(StoreMcuEventRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        if ($request->hasFile('virtual_bg')) {
            $validated['virtual_bg_path'] = $request->file('virtual_bg')->store('events/virtual_bgs', 'public');
        }

        $event = McuEvent::create($validated);

        return redirect()->back()->with('success', "Event MCU '{$event->event_name}' ({$event->event_code}) berhasil dibuat.");
    }

    /**
     * Update the specified MCU event.
     */
    public function update(UpdateMcuEventRequest $request, McuEvent $mcuEvent): RedirectResponse
    {
        $validated = $request->validated();

        if ($request->hasFile('virtual_bg')) {
            if ($mcuEvent->virtual_bg_path && Storage::disk('public')->exists($mcuEvent->virtual_bg_path)) {
                Storage::disk('public')->delete($mcuEvent->virtual_bg_path);
            }
            $validated['virtual_bg_path'] = $request->file('virtual_bg')->store('events/virtual_bgs', 'public');
        }

        $mcuEvent->update($validated);

        return redirect()->back()->with('success', "Event MCU '{$mcuEvent->event_name}' berhasil diperbarui.");
    }

    /**
     * Soft delete the specified MCU event.
     */
    public function destroy(McuEvent $mcuEvent): RedirectResponse
    {
        $name = $mcuEvent->event_name;
        $code = $mcuEvent->event_code;
        $mcuEvent->delete();

        return redirect()->back()->with('success', "Event MCU '{$name}' ({$code}) berhasil dihapus.");
    }

    /**
     * Fast update status for MCU event.
     */
    public function updateStatus(Request $request, McuEvent $mcuEvent): RedirectResponse
    {
        $request->validate([
            'status' => ['required', 'in:draft,ongoing,review,completed,closed'],
        ]);

        $mcuEvent->update(['status' => $request->input('status')]);

        return redirect()->back()->with('success', "Status Event MCU '{$mcuEvent->event_code}' berhasil diubah ke {$mcuEvent->status}.");
    }
}
