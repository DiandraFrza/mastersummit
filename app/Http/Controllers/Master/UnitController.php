<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\StoreUnitRequest;
use App\Http\Requests\Master\UpdateUnitRequest;
use App\Models\Unit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class UnitController extends Controller
{
    /**
     * Display a listing of clinic units / branches.
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
        $allowedSorts = ['id', 'code', 'name', 'phone', 'is_active', 'created_at'];
        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'id';
        }

        $search = trim((string) $request->input('search', ''));
        $statusFilter = $request->input('status', 'all');

        $query = Unit::query();

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($statusFilter === 'active') {
            $query->where('is_active', true);
        } elseif ($statusFilter === 'inactive') {
            $query->where('is_active', false);
        }

        $units = $query->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Units/Index', [
            'units' => $units,
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
     * Store a newly created unit in storage.
     */
    public function store(StoreUnitRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            $validated = $request->validated();
            $validated['is_active'] = $request->boolean('is_active', true);
            Unit::create($validated);
        });

        return redirect()->route('units.index')->with('success', 'Unit / Cabang baru berhasil ditambahkan.');
    }

    /**
     * Update the specified unit in storage.
     */
    public function update(UpdateUnitRequest $request, Unit $unit): RedirectResponse
    {
        DB::transaction(function () use ($request, $unit) {
            $validated = $request->validated();
            $validated['is_active'] = $request->boolean('is_active', true);
            $unit->update($validated);
        });

        return redirect()->route('units.index')->with('success', 'Data unit / cabang berhasil diperbarui.');
    }

    /**
     * Toggle active/inactive status (No Hard Delete).
     */
    public function toggleStatus(Unit $unit): RedirectResponse
    {
        $unit->is_active = ! $unit->is_active;
        $unit->save();

        $statusText = $unit->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return redirect()->back()->with('success', "Status unit {$unit->name} berhasil {$statusText}.");
    }
}
