<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\StoreBankRequest;
use App\Http\Requests\Master\UpdateBankRequest;
use App\Models\Bank;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class BankController extends Controller
{
    /**
     * Display a listing of bank accounts.
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
        $allowedSorts = ['id', 'name', 'account_number', 'account_holder', 'is_active', 'created_at'];
        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'id';
        }

        $search = trim((string) $request->input('search', ''));
        $statusFilter = $request->input('status', 'all');

        $query = Bank::query();

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('account_number', 'like', "%{$search}%")
                    ->orWhere('account_holder', 'like', "%{$search}%");
            });
        }

        if ($statusFilter === 'active') {
            $query->where('is_active', true);
        } elseif ($statusFilter === 'inactive') {
            $query->where('is_active', false);
        }

        $banks = $query->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Banks/Index', [
            'banks' => $banks,
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
     * Store a newly created bank account in storage.
     */
    public function store(StoreBankRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            $validated = $request->validated();
            $validated['is_active'] = $request->boolean('is_active', true);
            Bank::create($validated);
        });

        return redirect()->route('banks.index')->with('success', 'Rekening bank baru berhasil ditambahkan.');
    }

    /**
     * Update the specified bank account in storage.
     */
    public function update(UpdateBankRequest $request, Bank $bank): RedirectResponse
    {
        DB::transaction(function () use ($request, $bank) {
            $validated = $request->validated();
            $validated['is_active'] = $request->boolean('is_active', true);
            $bank->update($validated);
        });

        return redirect()->route('banks.index')->with('success', 'Data rekening bank berhasil diperbarui.');
    }

    /**
     * Toggle active/inactive status (No Hard Delete).
     */
    public function toggleStatus(Bank $bank): RedirectResponse
    {
        $bank->is_active = ! $bank->is_active;
        $bank->save();

        $statusText = $bank->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return redirect()->back()->with('success', "Status rekening {$bank->name} ({$bank->account_number}) berhasil {$statusText}.");
    }
}
