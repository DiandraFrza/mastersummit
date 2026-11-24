<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\StoreCompanyRequest;
use App\Http\Requests\Master\UpdateCompanyRequest;
use App\Models\Company;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CompanyController extends Controller
{
    /**
     * Display a listing of client companies.
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
        $allowedSorts = ['id', 'name', 'branch_code', 'city', 'phone', 'is_active', 'created_at'];
        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'id';
        }

        $search = trim((string) $request->input('search', ''));
        $statusFilter = $request->input('status', 'all');

        $query = Company::query()->withCount('referrers');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('branch_code', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('director_name', 'like', "%{$search}%");
            });
        }

        if ($statusFilter === 'active') {
            $query->where('is_active', true);
        } elseif ($statusFilter === 'inactive') {
            $query->where('is_active', false);
        }

        $companies = $query->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Companies/Index', [
            'companies' => $companies,
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
     * Store a newly created company in storage.
     */
    public function store(StoreCompanyRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            $validated = $request->validated();

            if ($request->hasFile('logo_file')) {
                $path = Storage::disk('public')->putFile('company_logos', $request->file('logo_file'));
                $validated['logo_path'] = $path;
            }
            unset($validated['logo_file']);

            $validated['is_active'] = $request->boolean('is_active', true);
            Company::create($validated);
        });

        return redirect()->route('companies.index')->with('success', 'Data perusahaan rekanan berhasil ditambahkan.');
    }

    /**
     * Update the specified company in storage.
     */
    public function update(UpdateCompanyRequest $request, Company $company): RedirectResponse
    {
        DB::transaction(function () use ($request, $company) {
            $validated = $request->validated();

            if ($request->hasFile('logo_file')) {
                if ($company->logo_path && Storage::disk('public')->exists($company->logo_path)) {
                    Storage::disk('public')->delete($company->logo_path);
                }
                $path = Storage::disk('public')->putFile('company_logos', $request->file('logo_file'));
                $validated['logo_path'] = $path;
            }
            unset($validated['logo_file']);

            $validated['is_active'] = $request->boolean('is_active', true);
            $company->update($validated);
        });

        return redirect()->route('companies.index')->with('success', 'Data perusahaan berhasil diperbarui.');
    }

    /**
     * Toggle active/inactive status (No Hard Delete).
     */
    public function toggleStatus(Company $company): RedirectResponse
    {
        $company->is_active = ! $company->is_active;
        $company->save();

        $statusText = $company->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return redirect()->back()->with('success', "Status perusahaan {$company->name} berhasil {$statusText}.");
    }
}
