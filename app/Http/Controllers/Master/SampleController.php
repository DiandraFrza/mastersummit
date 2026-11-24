<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\StoreSampleRequest;
use App\Http\Requests\Master\UpdateSampleRequest;
use App\Models\Sample;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SampleController extends Controller
{
    /**
     * Display a listing of specimen & stations.
     */
    public function index(Request $request): Response
    {
        $allowedPerPage = [10, 20, 50, 100, 300, 500];
        $perPage = (int) $request->input('per_page', 10);
        if (! in_array($perPage, $allowedPerPage, true)) {
            $perPage = 10;
        }

        $sort = $request->input('sort', 'sort_order');
        $direction = strtolower($request->input('direction', 'asc')) === 'desc' ? 'desc' : 'asc';
        $allowedSorts = ['id', 'code', 'name', 'category', 'sort_order', 'is_active', 'created_at'];
        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'sort_order';
        }

        $search = trim((string) $request->input('search', ''));
        $statusFilter = $request->input('status', 'all');
        $categoryFilter = $request->input('category', 'all');

        $query = Sample::query();

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
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

        $samples = $query->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Samples/Index', [
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
     * Store a newly created specimen station in storage.
     */
    public function store(StoreSampleRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            $validated = $request->validated();
            $validated['sort_order'] = $validated['sort_order'] ?? 0;
            $validated['is_active'] = $request->boolean('is_active', true);
            Sample::create($validated);
        });

        return redirect()->route('samples.index')->with('success', 'Stasiun sampel baru berhasil ditambahkan.');
    }

    /**
     * Update the specified specimen station in storage.
     */
    public function update(UpdateSampleRequest $request, Sample $sample): RedirectResponse
    {
        DB::transaction(function () use ($request, $sample) {
            $validated = $request->validated();
            $validated['sort_order'] = $validated['sort_order'] ?? 0;
            $validated['is_active'] = $request->boolean('is_active', true);
            $sample->update($validated);
        });

        return redirect()->route('samples.index')->with('success', 'Data stasiun sampel berhasil diperbarui.');
    }

    /**
     * Toggle active/inactive status (No Hard Delete).
     */
    public function toggleStatus(Sample $sample): RedirectResponse
    {
        $sample->is_active = ! $sample->is_active;
        $sample->save();

        $statusText = $sample->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return redirect()->back()->with('success', "Status stasiun {$sample->name} berhasil {$statusText}.");
    }
}
