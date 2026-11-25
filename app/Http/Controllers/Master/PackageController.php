<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\StorePackageRequest;
use App\Http\Requests\Master\UpdatePackageRequest;
use App\Models\Package;
use App\Models\PackageItem;
use App\Models\Referrer;
use App\Models\Service;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PackageController extends Controller
{
    /**
     * Display a listing of examination packages.
     */
    public function index(Request $request): Response
    {
        $allowedPerPage = [10, 20, 50, 100, 300, 500];
        $perPage = (int) $request->input('per_page', 10);
        if (! in_array($perPage, $allowedPerPage, true)) {
            $perPage = 10;
        }

        $sort = $request->input('sort', 'year');
        $direction = strtolower($request->input('direction', 'desc')) === 'asc' ? 'asc' : 'desc';
        $allowedSorts = ['id', 'name', 'year', 'total_price', 'discount_amount', 'final_price', 'is_active', 'created_at'];
        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'year';
        }

        $search = trim((string) $request->input('search', ''));
        $statusFilter = $request->input('status', 'all');
        $yearFilter = $request->input('year');

        $query = Package::query()->with(['referrer', 'packageItems.service.sample']);

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('event_label', 'like', "%{$search}%");
            });
        }

        if ($yearFilter) {
            $query->where('year', (int) $yearFilter);
        }

        if ($statusFilter === 'active') {
            $query->where('is_active', true);
        } elseif ($statusFilter === 'inactive') {
            $query->where('is_active', false);
        }

        $packages = $query->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString();

        $referrers = Referrer::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $services = Service::where('is_active', true)->with('sample')->orderBy('category')->orderBy('name')->get([
            'id', 'code', 'name', 'category', 'sub_group', 'base_price', 'sample_id',
        ]);

        $existingEvents = Package::whereNotNull('event_label')->where('event_label', '!=', '')->distinct()->pluck('event_label')->values();

        return Inertia::render('Packages/Index', [
            'packages' => $packages,
            'referrers' => $referrers,
            'services' => $services,
            'existingEvents' => $existingEvents,
            'filters' => [
                'search' => $search,
                'status' => $statusFilter,
                'year' => $yearFilter,
                'sort' => $sort,
                'direction' => $direction,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Store a newly created package in storage.
     */
    public function store(StorePackageRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            $validated = $request->validated();
            $items = $validated['items'];
            unset($validated['items']);

            $validated['discount_amount'] = $validated['discount_amount'] ?? 0;
            $validated['is_active'] = $request->boolean('is_active', true);

            $package = Package::create($validated);

            foreach ($items as $item) {
                PackageItem::create([
                    'package_id' => $package->id,
                    'service_id' => $item['service_id'],
                    'item_price_override' => $item['item_price_override'] ?? null,
                ]);
            }

            $package->recalculateTotals();
        });

        return redirect()->route('packages.index')->with('success', 'Paket pemeriksaan baru berhasil ditambahkan.');
    }

    /**
     * Update the specified package in storage.
     */
    public function update(UpdatePackageRequest $request, Package $package): RedirectResponse
    {
        DB::transaction(function () use ($request, $package) {
            $validated = $request->validated();
            $items = $validated['items'];
            unset($validated['items']);

            $validated['discount_amount'] = $validated['discount_amount'] ?? 0;
            $validated['is_active'] = $request->boolean('is_active', true);

            $package->update($validated);

            // Sync package items
            $package->packageItems()->delete();
            foreach ($items as $item) {
                PackageItem::create([
                    'package_id' => $package->id,
                    'service_id' => $item['service_id'],
                    'item_price_override' => $item['item_price_override'] ?? null,
                ]);
            }

            $package->recalculateTotals();
        });

        return redirect()->route('packages.index')->with('success', 'Data paket pemeriksaan berhasil diperbarui.');
    }

    /**
     * Toggle active/inactive status (No Hard Delete).
     */
    public function toggleStatus(Package $package): RedirectResponse
    {
        $package->is_active = ! $package->is_active;
        $package->save();

        $statusText = $package->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return redirect()->back()->with('success', "Status paket {$package->name} berhasil {$statusText}.");
    }
}
