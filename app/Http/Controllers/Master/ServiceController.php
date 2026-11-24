<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\StoreServiceRequest;
use App\Http\Requests\Master\UpdateServiceRequest;
use App\Models\Sample;
use App\Models\Service;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ServiceController extends Controller
{
    /**
     * Display a listing of examination services.
     */
    public function index(Request $request): Response
    {
        $allowedPerPage = [10, 20, 50, 100, 300, 500];
        $perPage = (int) $request->input('per_page', 10);
        if (! in_array($perPage, $allowedPerPage, true)) {
            $perPage = 10;
        }

        $sort = $request->input('sort', 'code');
        $direction = strtolower($request->input('direction', 'asc')) === 'desc' ? 'desc' : 'asc';
        $allowedSorts = ['id', 'code', 'name', 'category', 'sub_group', 'base_price', 'is_active', 'created_at'];
        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'code';
        }

        $search = trim((string) $request->input('search', ''));
        $statusFilter = $request->input('status', 'all');
        $categoryFilter = $request->input('category', 'all');

        $query = Service::query()->with('sample');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('sub_group', 'like', "%{$search}%");
            });
        }

        if (in_array($categoryFilter, ['lab', 'radiology', 'electromedical', 'physical'], true)) {
            $query->where('category', $categoryFilter);
        }

        if ($statusFilter === 'active') {
            $query->where('is_active', true);
        } elseif ($statusFilter === 'inactive') {
            $query->where('is_active', false);
        }

        $services = $query->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString();

        $samples = Sample::where('is_active', true)->orderBy('sort_order')->get(['id', 'code', 'name', 'category']);

        return Inertia::render('Services/Index', [
            'services' => $services,
            'samples' => $samples,
            'filters' => [
                'search' => $search,
                'status' => $statusFilter,
                'category' => $categoryFilter,
                'sort' => $sort,
                'direction' => $direction,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Store a newly created service in storage.
     */
    public function store(StoreServiceRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            $validated = $request->validated();
            $validated['is_active'] = $request->boolean('is_active', true);
            Service::create($validated);
        });

        return redirect()->route('services.index')->with('success', 'Layanan pemeriksaan baru berhasil ditambahkan.');
    }

    /**
     * Update the specified service in storage.
     */
    public function update(UpdateServiceRequest $request, Service $service): RedirectResponse
    {
        DB::transaction(function () use ($request, $service) {
            $validated = $request->validated();
            $validated['is_active'] = $request->boolean('is_active', true);
            $service->update($validated);
        });

        return redirect()->route('services.index')->with('success', 'Data pemeriksaan berhasil diperbarui.');
    }

    /**
     * Toggle active/inactive status (No Hard Delete).
     */
    public function toggleStatus(Service $service): RedirectResponse
    {
        $service->is_active = ! $service->is_active;
        $service->save();

        $statusText = $service->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return redirect()->back()->with('success', "Status pemeriksaan {$service->name} berhasil {$statusText}.");
    }
}
