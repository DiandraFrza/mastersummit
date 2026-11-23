<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\StoreEmployeeRequest;
use App\Http\Requests\Master\UpdateEmployeeRequest;
use App\Models\Employee;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeController extends Controller
{
    /**
     * Display a listing of employees.
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
        $allowedSorts = ['id', 'nik', 'name', 'job_title', 'nip', 'sip', 'is_active', 'created_at'];
        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'id';
        }

        $search = trim((string) $request->input('search', ''));
        $statusFilter = $request->input('status', 'all');

        $query = Employee::query()->with('user');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('nik', 'like', "%{$search}%")
                    ->orWhere('nip', 'like', "%{$search}%")
                    ->orWhere('sip', 'like', "%{$search}%")
                    ->orWhere('job_title', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($statusFilter === 'active') {
            $query->where('is_active', true);
        } elseif ($statusFilter === 'inactive') {
            $query->where('is_active', false);
        }

        $employees = $query->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Employees/Index', [
            'employees' => $employees,
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
     * Store a newly created employee in storage.
     */
    public function store(StoreEmployeeRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            $validated = $request->validated();

            if ($request->hasFile('signature_file')) {
                $path = Storage::disk('public')->putFile('signatures', $request->file('signature_file'));
                $validated['signature_path'] = $path;
            }

            if ($request->hasFile('stamp_file')) {
                $path = Storage::disk('public')->putFile('stamps', $request->file('stamp_file'));
                $validated['stamp_path'] = $path;
            }

            unset($validated['signature_file'], $validated['stamp_file']);

            $validated['is_active'] = $request->boolean('is_active', true);

            Employee::create($validated);
        });

        return redirect()->route('employees.index')->with('success', 'Pegawai baru berhasil ditambahkan.');
    }

    /**
     * Update the specified employee in storage.
     */
    public function update(UpdateEmployeeRequest $request, Employee $employee): RedirectResponse
    {
        DB::transaction(function () use ($request, $employee) {
            $validated = $request->validated();

            if ($request->hasFile('signature_file')) {
                if ($employee->signature_path && Storage::disk('public')->exists($employee->signature_path)) {
                    Storage::disk('public')->delete($employee->signature_path);
                }
                $path = Storage::disk('public')->putFile('signatures', $request->file('signature_file'));
                $validated['signature_path'] = $path;
            }

            if ($request->hasFile('stamp_file')) {
                if ($employee->stamp_path && Storage::disk('public')->exists($employee->stamp_path)) {
                    Storage::disk('public')->delete($employee->stamp_path);
                }
                $path = Storage::disk('public')->putFile('stamps', $request->file('stamp_file'));
                $validated['stamp_path'] = $path;
            }

            unset($validated['signature_file'], $validated['stamp_file']);

            $validated['is_active'] = $request->boolean('is_active', true);

            $employee->update($validated);
        });

        return redirect()->route('employees.index')->with('success', 'Data pegawai berhasil diperbarui.');
    }

    /**
     * Toggle active/inactive status (No Hard Delete).
     */
    public function toggleStatus(Employee $employee): RedirectResponse
    {
        $employee->is_active = ! $employee->is_active;
        $employee->save();

        $statusText = $employee->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return redirect()->back()->with('success', "Status pegawai {$employee->name} berhasil {$statusText}.");
    }
}
