<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\StoreUserRequest;
use App\Http\Requests\Master\UpdateUserRequest;
use App\Models\Employee;
use App\Models\User;
use App\Models\UserSampleScope;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    /**
     * Standard clinic sample stations for user_sample_scopes.
     */
    public static function getStandardSampleStations(): array
    {
        return [
            ['id' => 1, 'name' => 'Darah EDTA (Hematologi)', 'category' => 'lab'],
            ['id' => 2, 'name' => 'Darah Beku / CA (Kimia Darah & Serologi)', 'category' => 'lab'],
            ['id' => 3, 'name' => 'Urin Lengkap', 'category' => 'lab'],
            ['id' => 4, 'name' => 'Rontgen Thorax', 'category' => 'radiology'],
            ['id' => 5, 'name' => 'EKG 12-Lead', 'category' => 'electromedical'],
            ['id' => 6, 'name' => 'Audiometri Nada Murni', 'category' => 'electromedical'],
            ['id' => 7, 'name' => 'Spirometri', 'category' => 'electromedical'],
            ['id' => 8, 'name' => 'Pemeriksaan Fisik & Tanda Vital', 'category' => 'physical'],
            ['id' => 9, 'name' => 'Pemeriksaan Gigi', 'category' => 'physical'],
        ];
    }

    /**
     * Display a listing of users.
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
        $allowedSorts = ['id', 'username', 'name', 'email', 'is_active', 'last_login_at', 'created_at'];
        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'id';
        }

        $search = trim((string) $request->input('search', ''));
        $roleFilter = $request->input('role', '');
        $statusFilter = $request->input('status', 'all');

        $query = User::query()->with(['roles', 'permissions', 'employee', 'sampleScopes']);

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhereHas('employee', function ($eq) use ($search) {
                        $eq->where('nik', 'like', "%{$search}%")
                            ->orWhere('job_title', 'like', "%{$search}%");
                    });
            });
        }

        if ($roleFilter !== '') {
            $query->whereHas('roles', function ($rq) use ($roleFilter) {
                $rq->where('name', $roleFilter);
            });
        }

        if ($statusFilter === 'active') {
            $query->where('is_active', true);
        } elseif ($statusFilter === 'inactive') {
            $query->where('is_active', false);
        }

        $users = $query->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString();

        // Meta data for creating/editing users
        $roles = Role::orderBy('name')->get(['id', 'name']);
        $employees = Employee::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'nik', 'name', 'job_title']);

        // Group permissions by prefix module
        $rawPermissions = Permission::orderBy('name')->get(['id', 'name']);
        $groupedPermissions = [];
        foreach ($rawPermissions as $perm) {
            $parts = explode('.', $perm->name);
            $module = $parts[0] ?? 'lainnya';
            $groupedPermissions[$module][] = [
                'id' => $perm->id,
                'name' => $perm->name,
                'label' => $perm->name,
            ];
        }

        return Inertia::render('Users/Index', [
            'users' => $users,
            'filters' => [
                'search' => $search,
                'role' => $roleFilter,
                'status' => $statusFilter,
                'sort' => $sort,
                'direction' => $direction,
                'per_page' => $perPage,
            ],
            'availableRoles' => $roles,
            'availableEmployees' => $employees,
            'groupedPermissions' => $groupedPermissions,
            'availableSampleStations' => self::getStandardSampleStations(),
        ]);
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(StoreUserRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            $validated = $request->validated();
            $validated['password'] = Hash::make($validated['password']);
            $validated['is_active'] = $request->boolean('is_active', true);

            $roles = $request->input('roles', []);
            $permissions = $request->input('permissions', []);
            $sampleScopes = $request->input('sample_scopes', []);

            unset($validated['roles'], $validated['permissions'], $validated['sample_scopes']);

            $user = User::create($validated);

            if (! empty($roles)) {
                $user->syncRoles($roles);
            }

            if (! empty($permissions)) {
                $user->syncPermissions($permissions);
            }

            if (! empty($sampleScopes)) {
                $scopeData = array_map(fn ($stationId) => [
                    'user_id' => $user->id,
                    'sample_id' => $stationId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ], $sampleScopes);
                UserSampleScope::insert($scopeData);
            }
        });

        return redirect()->route('users.index')->with('success', 'Pengguna baru berhasil dibuat.');
    }

    /**
     * Update the specified user in storage.
     */
    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        DB::transaction(function () use ($request, $user) {
            $validated = $request->validated();

            if (! empty($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
            } else {
                unset($validated['password']);
            }

            $validated['is_active'] = $request->boolean('is_active', true);

            $roles = $request->input('roles', []);
            $permissions = $request->input('permissions', []);
            $sampleScopes = $request->input('sample_scopes', []);

            unset($validated['roles'], $validated['permissions'], $validated['sample_scopes']);

            $user->update($validated);

            $user->syncRoles($roles);
            $user->syncPermissions($permissions);

            // Sync user sample scopes
            UserSampleScope::where('user_id', $user->id)->delete();
            if (! empty($sampleScopes)) {
                $scopeData = array_map(fn ($stationId) => [
                    'user_id' => $user->id,
                    'sample_id' => $stationId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ], $sampleScopes);
                UserSampleScope::insert($scopeData);
            }
        });

        return redirect()->route('users.index')->with('success', 'Data pengguna berhasil diperbarui.');
    }

    /**
     * Toggle active/inactive status (No Hard Delete).
     */
    public function toggleStatus(User $user): RedirectResponse
    {
        if ($user->id === Auth::id()) {
            return redirect()->back()->with('error', 'Anda tidak dapat menonaktifkan akun yang sedang digunakan.');
        }

        $user->is_active = ! $user->is_active;
        $user->save();

        $statusText = $user->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return redirect()->back()->with('success', "Akun pengguna {$user->name} ({$user->username}) berhasil {$statusText}.");
    }
}
