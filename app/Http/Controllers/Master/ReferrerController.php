<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\StoreReferrerRequest;
use App\Http\Requests\Master\UpdateReferrerRequest;
use App\Models\Company;
use App\Models\Referrer;
use App\Models\ReferrerType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReferrerController extends Controller
{
    /**
     * Display a listing of referrers.
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
        $allowedSorts = ['id', 'name', 'marketing_name', 'fee_general_percent', 'is_active', 'created_at'];
        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'id';
        }

        $search = trim((string) $request->input('search', ''));
        $statusFilter = $request->input('status', 'all');
        $typeFilter = $request->input('type_id');

        $query = Referrer::query()->with(['referrerType', 'company']);

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('pic_name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('marketing_name', 'like', "%{$search}%");
            });
        }

        if ($typeFilter) {
            $query->where('referrer_type_id', $typeFilter);
        }

        if ($statusFilter === 'active') {
            $query->where('is_active', true);
        } elseif ($statusFilter === 'inactive') {
            $query->where('is_active', false);
        }

        $referrers = $query->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString();

        $referrerTypes = ReferrerType::where('is_active', true)->orderBy('name')->get();
        $companies = Company::where('is_active', true)->orderBy('name')->get(['id', 'name', 'branch_code']);

        return Inertia::render('Referrers/Index', [
            'referrers' => $referrers,
            'referrerTypes' => $referrerTypes,
            'companies' => $companies,
            'filters' => [
                'search' => $search,
                'status' => $statusFilter,
                'type_id' => $typeFilter,
                'sort' => $sort,
                'direction' => $direction,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Store a newly created referrer in storage.
     */
    public function store(StoreReferrerRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            $validated = $request->validated();
            $validated['fee_general_percent'] = $validated['fee_general_percent'] ?? 0;
            $validated['is_active'] = $request->boolean('is_active', true);
            Referrer::create($validated);
        });

        return redirect()->route('referrers.index')->with('success', 'Data perujuk baru berhasil ditambahkan.');
    }

    /**
     * Update the specified referrer in storage.
     */
    public function update(UpdateReferrerRequest $request, Referrer $referrer): RedirectResponse
    {
        DB::transaction(function () use ($request, $referrer) {
            $validated = $request->validated();
            $validated['fee_general_percent'] = $validated['fee_general_percent'] ?? 0;
            $validated['is_active'] = $request->boolean('is_active', true);
            $referrer->update($validated);
        });

        return redirect()->route('referrers.index')->with('success', 'Data perujuk berhasil diperbarui.');
    }

    /**
     * Toggle active/inactive status (No Hard Delete).
     */
    public function toggleStatus(Referrer $referrer): RedirectResponse
    {
        $referrer->is_active = ! $referrer->is_active;
        $referrer->save();

        $statusText = $referrer->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return redirect()->back()->with('success', "Status perujuk {$referrer->name} berhasil {$statusText}.");
    }
}
