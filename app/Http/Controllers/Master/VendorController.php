<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\StoreVendorRequest;
use App\Http\Requests\Master\UpdateVendorRequest;
use App\Models\Vendor;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class VendorController extends Controller
{
    /**
     * Display a listing of partners and vendors.
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
        $allowedSorts = ['id', 'code', 'name', 'contract_type', 'pic_name', 'is_active', 'created_at'];
        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'id';
        }

        $search = trim((string) $request->input('search', ''));
        $statusFilter = $request->input('status', 'all');

        $query = Vendor::query();

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('pic_name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('contract_number', 'like', "%{$search}%")
                    ->orWhere('contract_type', 'like', "%{$search}%");
            });
        }

        if ($statusFilter === 'active') {
            $query->where('is_active', true);
        } elseif ($statusFilter === 'inactive') {
            $query->where('is_active', false);
        }

        $vendors = $query->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Vendors/Index', [
            'vendors' => $vendors,
            'filters' => [
                'search' => $search,
                'status' => $statusFilter,
                'sort' => $sort,
                'direction' => $direction,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Store a newly created vendor in storage.
     */
    public function store(StoreVendorRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            $validated = $request->validated();
            $validated['is_active'] = $request->boolean('is_active', true);
            Vendor::create($validated);
        });

        return redirect()->route('vendors.index')->with('success', 'Data vendor / rekanan baru berhasil ditambahkan.');
    }

    /**
     * Update the specified vendor in storage.
     */
    public function update(UpdateVendorRequest $request, Vendor $vendor): RedirectResponse
    {
        DB::transaction(function () use ($request, $vendor) {
            $validated = $request->validated();
            $validated['is_active'] = $request->boolean('is_active', true);
            $vendor->update($validated);
        });

        return redirect()->route('vendors.index')->with('success', 'Data vendor / rekanan berhasil diperbarui.');
    }

    /**
     * Toggle active/inactive status (No Hard Delete).
     */
    public function toggleStatus(Vendor $vendor): RedirectResponse
    {
        $vendor->is_active = ! $vendor->is_active;
        $vendor->save();

        $statusText = $vendor->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return redirect()->back()->with('success', "Status vendor {$vendor->name} berhasil {$statusText}.");
    }
}
