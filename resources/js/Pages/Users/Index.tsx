import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import DataTable, { ColumnDef } from '@/Components/DataTable';
import Badge from '@/Components/Badge';
import ActionDropdown, { ActionDropdownItem } from '@/Components/ActionDropdown';
import Modal from '@/Components/Modal';
import {
    Plus,
    Pencil,
    Power,
    Shield,
    KeyRound,
    UserCheck,
    CheckCircle2,
    XCircle,
    TestTubes,
} from 'lucide-react';
import type { PageProps, Pagination, User, Employee } from '@/types';

interface SampleStation {
    id: number;
    name: string;
    category: string;
}

interface RoleItem {
    id: number;
    name: string;
}

interface PermissionItem {
    id: number;
    name: string;
    label: string;
}

interface UsersIndexProps extends PageProps {
    users: Pagination<User>;
    filters: Record<string, any>;
    availableRoles: RoleItem[];
    availableEmployees: Array<{ id: number; nik: string; name: string; job_title?: string | null }>;
    groupedPermissions: Record<string, PermissionItem[]>;
    availableSampleStations: SampleStation[];
}

export default function UsersIndex({
    users,
    filters,
    availableRoles,
    availableEmployees,
    groupedPermissions,
    availableSampleStations,
}: UsersIndexProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState<'account' | 'roles' | 'permissions' | 'stations'>('account');

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        username: '',
        email: '',
        password: '',
        employee_id: '' as string | number,
        is_active: true,
        roles: [] as string[],
        permissions: [] as string[],
        sample_scopes: [] as number[],
    });

    const openCreateModal = () => {
        setEditingUser(null);
        reset();
        clearErrors();
        setActiveTab('account');
        setIsModalOpen(true);
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        clearErrors();
        setActiveTab('account');

        const userRoleNames = user.roles ? user.roles.map((r) => r.name) : [];
        const userPermNames = user.permissions ? user.permissions.map((p) => p.name) : [];
        const userScopeIds = (user as any).sample_scopes
            ? (user as any).sample_scopes.map((s: any) => s.sample_id)
            : (user as any).sampleScopes
            ? (user as any).sampleScopes.map((s: any) => s.sample_id)
            : [];

        setData({
            name: user.name || '',
            username: user.username || '',
            email: user.email || '',
            password: '',
            employee_id: user.employee_id || '',
            is_active: Boolean(user.is_active),
            roles: userRoleNames,
            permissions: userPermNames,
            sample_scopes: userScopeIds,
        });
        setIsModalOpen(true);
    };

    const handleRoleToggle = (roleName: string) => {
        const current = [...data.roles];
        const idx = current.indexOf(roleName);
        if (idx > -1) {
            current.splice(idx, 1);
        } else {
            current.push(roleName);
        }
        setData('roles', current);
    };

    const handlePermissionToggle = (permName: string) => {
        const current = [...data.permissions];
        const idx = current.indexOf(permName);
        if (idx > -1) {
            current.splice(idx, 1);
        } else {
            current.push(permName);
        }
        setData('permissions', current);
    };

    const handleSelectAllGroupPermissions = (groupPerms: PermissionItem[]) => {
        const permNames = groupPerms.map((p) => p.name);
        const allSelected = permNames.every((p) => data.permissions.includes(p));

        if (allSelected) {
            // Deselect group
            setData(
                'permissions',
                data.permissions.filter((p) => !permNames.includes(p))
            );
        } else {
            // Select all in group
            const merged = Array.from(new Set([...data.permissions, ...permNames]));
            setData('permissions', merged);
        }
    };

    const handleStationToggle = (stationId: number) => {
        const current = [...data.sample_scopes];
        const idx = current.indexOf(stationId);
        if (idx > -1) {
            current.splice(idx, 1);
        } else {
            current.push(stationId);
        }
        setData('sample_scopes', current);
    };

    const handleSelectAllStations = () => {
        const allIds = availableSampleStations.map((s) => s.id);
        if (data.sample_scopes.length === allIds.length) {
            setData('sample_scopes', []);
        } else {
            setData('sample_scopes', allIds);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingUser) {
            put(route('users.update', editingUser.id), {
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            post(route('users.store'), {
                onSuccess: () => setIsModalOpen(false),
            });
        }
    };

    const handleToggleStatus = (user: User) => {
        router.patch(route('users.toggle-status', user.id), {}, {
            preserveScroll: true,
        });
    };

    const handleRoleFilterChange = (role: string) => {
        const currentParams = new URLSearchParams(window.location.search);
        if (role === '') {
            currentParams.delete('role');
        } else {
            currentParams.set('role', role);
        }
        currentParams.delete('page');

        router.get(route('users.index'), Object.fromEntries(currentParams), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const columns: ColumnDef<User>[] = [
        {
            header: 'Pengguna',
            accessorKey: 'name',
            sortable: true,
            cell: ({ row }) => (
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-zinc-100 text-zinc-700 flex items-center justify-center text-xs font-semibold shrink-0">
                        {row.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-zinc-900 truncate">{row.name}</span>
                        <span className="text-[11px] font-mono text-zinc-400">@{row.username}</span>
                    </div>
                </div>
            ),
        },
        {
            header: 'Email & Login Terakhir',
            accessorKey: 'email',
            sortable: true,
            cell: ({ row }) => (
                <div className="flex flex-col text-[11px]">
                    <span className="text-zinc-700 font-mono">{row.email}</span>
                    <span className="text-zinc-400 tabular-nums">
                        {row.last_login_at
                            ? `Login: ${new Date(row.last_login_at).toLocaleString('id-ID')}`
                            : 'Belum pernah login'}
                    </span>
                </div>
            ),
        },
        {
            header: 'Pegawai Terkait',
            id: 'employee',
            cell: ({ row }) => {
                const emp = row.employee;
                if (!emp) {
                    return <span className="text-zinc-400 text-[11px]">—</span>;
                }
                return (
                    <div className="flex flex-col text-[11px]">
                        <span className="font-medium text-zinc-800">{emp.name}</span>
                        <span className="text-zinc-400 font-mono tabular-nums">NIK: {emp.nik}</span>
                    </div>
                );
            },
        },
        {
            header: 'Role Peran',
            id: 'roles',
            cell: ({ row }) => {
                const roleList = row.roles || [];
                if (roleList.length === 0) {
                    return <span className="text-zinc-400 text-[11px]">Tanpa Peran</span>;
                }
                return (
                    <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {roleList.map((r) => (
                            <span
                                key={r.id}
                                className="px-1.5 py-0.5 text-[10px] font-medium bg-zinc-100 text-zinc-700 rounded-sm"
                            >
                                {r.name}
                            </span>
                        ))}
                    </div>
                );
            },
        },
        {
            header: 'Stasiun Sampel',
            id: 'sample_scopes',
            width: '120px',
            align: 'center',
            cell: ({ row }) => {
                const scopes = (row as any).sampleScopes || (row as any).sample_scopes || [];
                return (
                    <span className="tabular-nums text-xs font-medium text-zinc-700 bg-zinc-50 px-2 py-0.5 rounded-sm">
                        {scopes.length} Stasiun
                    </span>
                );
            },
        },
        {
            header: 'Status',
            accessorKey: 'is_active',
            sortable: true,
            width: '90px',
            align: 'center',
            cell: ({ value }) => (
                <Badge
                    variant={value ? 'success' : 'neutral'}
                    label={value ? 'Aktif' : 'Non-Aktif'}
                    icon={value ? CheckCircle2 : XCircle}
                />
            ),
        },
        {
            header: 'Aksi',
            id: 'actions',
            align: 'right',
            width: '80px',
            cell: ({ row }) => {
                const items: ActionDropdownItem[] = [
                    {
                        label: 'Ubah & Hak Akses',
                        icon: Pencil,
                        onClick: () => openEditModal(row),
                    },
                    {
                        label: row.is_active ? 'Nonaktifkan' : 'Aktifkan',
                        icon: Power,
                        variant: row.is_active ? 'danger' : 'default',
                        onClick: () => handleToggleStatus(row),
                    },
                ];

                return <ActionDropdown items={items} align="right" />;
            },
        },
    ];

    return (
        <>
            <Head title="Master Pengguna" />

            <div className="space-y-4">
                {/* Header Title & Primary Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-200">
                    <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
                        Master Pengguna
                    </h1>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center gap-2 h-10 px-4 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-sm shadow-2xs transition-colors cursor-pointer shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Data</span>
                    </button>
                </div>

                {/* Filter Slot (Role filter selector) */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-600 font-medium">Filter Peran:</span>
                    <select
                        value={filters.role || ''}
                        onChange={(e) => handleRoleFilterChange(e.target.value)}
                        className="h-10 px-3 text-sm bg-white border border-zinc-200 rounded-sm text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                    >
                        <option value="">Semua Peran</option>
                        {availableRoles.map((r) => (
                            <option key={r.id} value={r.name}>
                                {r.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Main Table */}
                <DataTable
                    data={users}
                    columns={columns}
                    filters={filters}
                    searchPlaceholder="Cari nama, username, email, pegawai..."
                    routeName="users.index"
                />
            </div>

            {/* Modal Tambah / Ubah Pengguna & RBAC Checklist */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingUser ? `Ubah Pengguna — ${editingUser.name}` : 'Tambah Pengguna Baru'}
                subtitle="Atur kredensial akun, kombinasi multi-role, dan checklist izin granular"
                maxWidth="2xl"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            disabled={processing}
                            className="px-3 py-1.5 text-xs font-medium text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-100 rounded-sm transition-colors cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={processing}
                            className="px-4 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 rounded-sm shadow-2xs transition-colors cursor-pointer"
                        >
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </>
                }
            >
                <div>
                    {/* Modal Tab Navigation */}
                    <div className="flex items-center border-b border-zinc-200 mb-4 text-xs font-medium">
                        <button
                            type="button"
                            onClick={() => setActiveTab('account')}
                            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
                                activeTab === 'account'
                                    ? 'border-zinc-900 text-zinc-900 font-semibold'
                                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
                            }`}
                        >
                            1. Informasi Akun
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('roles')}
                            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
                                activeTab === 'roles'
                                    ? 'border-zinc-900 text-zinc-900 font-semibold'
                                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
                            }`}
                        >
                            2. Multi-Role ({data.roles.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('permissions')}
                            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
                                activeTab === 'permissions'
                                    ? 'border-zinc-900 text-zinc-900 font-semibold'
                                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
                            }`}
                        >
                            3. Izin Khusus ({data.permissions.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('stations')}
                            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
                                activeTab === 'stations'
                                    ? 'border-zinc-900 text-zinc-900 font-semibold'
                                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
                            }`}
                        >
                            4. Scope Sampel ({data.sample_scopes.length})
                        </button>
                    </div>

                    {/* Tab 1: Account Info */}
                    {activeTab === 'account' && (
                        <div className="space-y-3.5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                {/* Nama Lengkap */}
                                <div>
                                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                                        Nama Lengkap <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="dr. Ahmad Sujatmiko"
                                        required
                                        className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200/90 rounded-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors"
                                    />
                                    {errors.name && <p className="mt-1 text-[11px] text-rose-600">{errors.name}</p>}
                                </div>

                                {/* Username */}
                                <div>
                                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                                        Username Login <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.username}
                                        onChange={(e) => setData('username', e.target.value)}
                                        placeholder="ahmad_dok"
                                        required
                                        className="w-full px-3 py-1.5 text-xs font-mono bg-zinc-50 border border-zinc-200/90 rounded-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors"
                                    />
                                    {errors.username && <p className="mt-1 text-[11px] text-rose-600">{errors.username}</p>}
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                                        Email Akun <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="ahmad@mastersummit.co.id"
                                        required
                                        className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200/90 rounded-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors"
                                    />
                                    {errors.email && <p className="mt-1 text-[11px] text-rose-600">{errors.email}</p>}
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                                        {editingUser ? 'Password Baru (Kosongkan jika tidak diubah)' : 'Password Akun *'}
                                    </label>
                                    <input
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="••••••••"
                                        required={!editingUser}
                                        className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200/90 rounded-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors"
                                    />
                                    {errors.password && <p className="mt-1 text-[11px] text-rose-600">{errors.password}</p>}
                                </div>

                                {/* Link to Employee */}
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                                        Tautkan ke Master Pegawai (Opsional)
                                    </label>
                                    <select
                                        value={data.employee_id}
                                        onChange={(e) => {
                                            const empId = e.target.value;
                                            setData('employee_id', empId);
                                            // Auto-fill name if empty
                                            const emp = availableEmployees.find((item) => String(item.id) === String(empId));
                                            if (emp && !data.name) {
                                                setData((prev) => ({ ...prev, name: emp.name }));
                                            }
                                        }}
                                        className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200/90 rounded-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors"
                                    >
                                        <option value="">— Tidak ditautkan ke Pegawai —</option>
                                        {availableEmployees.map((emp) => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.name} (NIK: {emp.nik}) {emp.job_title ? `— ${emp.job_title}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[11px] text-zinc-400 mt-1">
                                        Menghubungkan akun dengan data pegawai akan otomatis menempelkan tanda tangan & stempel saat cetak hasil.
                                    </p>
                                </div>
                            </div>

                            {/* Status Aktif */}
                            <div className="pt-2 flex items-center justify-between border-t border-zinc-100 text-xs">
                                <div>
                                    <span className="font-medium text-zinc-800 block">Status Pengguna</span>
                                    <span className="text-[11px] text-zinc-400">
                                        Pengguna non-aktif akan ditolak saat mencoba login ke sistem.
                                    </span>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                        className="w-4 h-4 rounded-xs border-zinc-300 text-zinc-900 focus:ring-0"
                                    />
                                    <span className="text-zinc-700 font-medium">Aktif</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Multi-Role Assignment */}
                    {activeTab === 'roles' && (
                        <div className="space-y-3">
                            <p className="text-xs text-zinc-500">
                                Pengguna dapat memiliki **beberapa peran (multi-role) sekaligus** (contoh: Petugas Lab merangkap Petugas Elektromedis).
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto p-1">
                                {availableRoles.map((role) => {
                                    const isChecked = data.roles.includes(role.name);
                                    return (
                                        <label
                                            key={role.id}
                                            className={`flex items-start gap-3 p-3 rounded-sm border cursor-pointer select-none transition-colors ${
                                                isChecked
                                                    ? 'bg-zinc-50 border-zinc-400 text-zinc-900 font-medium'
                                                    : 'bg-white border-zinc-200/80 text-zinc-600 hover:bg-zinc-50'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => handleRoleToggle(role.name)}
                                                className="mt-0.5 w-4 h-4 rounded-xs border-zinc-300 text-zinc-900 focus:ring-0"
                                            />
                                            <div className="flex-1 text-xs">
                                                <span className="font-semibold block">{role.name}</span>
                                                <span className="text-[10px] text-zinc-400">
                                                    {role.name === 'Super Admin'
                                                        ? 'Akses penuh ke seluruh modul & bypass izin'
                                                        : 'Peran standar operasional klinik'}
                                                </span>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Granular Permission Checklist Matrix */}
                    {activeTab === 'permissions' && (
                        <div className="space-y-4">
                            <p className="text-xs text-zinc-500">
                                Centang izin khusus per modul sebagai **tambahan / override** dari hak akses bawaan role.
                            </p>

                            <div className="max-h-80 overflow-y-auto space-y-4 pr-1">
                                {Object.entries(groupedPermissions).map(([moduleName, perms]) => {
                                    const allChecked = perms.every((p) => data.permissions.includes(p.name));
                                    const someChecked = perms.some((p) => data.permissions.includes(p.name));

                                    return (
                                        <div
                                            key={moduleName}
                                            className="bg-zinc-50/70 p-3 rounded-sm border border-zinc-200/80 space-y-2.5"
                                        >
                                            <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200/60">
                                                <span className="text-xs font-semibold text-zinc-800 uppercase tracking-wider">
                                                    Modul: {moduleName.replace('_', ' ')}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSelectAllGroupPermissions(perms)}
                                                    className="text-[11px] font-medium text-zinc-600 hover:text-zinc-900 underline cursor-pointer"
                                                >
                                                    {allChecked ? 'Hapus Semua' : 'Pilih Semua'}
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {perms.map((perm) => {
                                                    const isChecked = data.permissions.includes(perm.name);
                                                    return (
                                                        <label
                                                            key={perm.id}
                                                            className="flex items-start gap-2 cursor-pointer select-none text-xs text-zinc-700"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => handlePermissionToggle(perm.name)}
                                                                className="mt-0.5 w-3.5 h-3.5 rounded-xs border-zinc-300 text-zinc-900 focus:ring-0"
                                                            />
                                                            <span className="text-[11px] font-mono leading-tight">
                                                                {perm.name}
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Tab 4: Station Scope (Ambil Sampel) */}
                    {activeTab === 'stations' && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-zinc-500">
                                    Pilih stasiun mana saja yang dapat diakses operator ini pada modul **Ambil Sampel** (Smart Barcode).
                                </p>
                                <button
                                    type="button"
                                    onClick={handleSelectAllStations}
                                    className="text-xs font-medium text-zinc-700 hover:text-zinc-900 underline cursor-pointer"
                                >
                                    {data.sample_scopes.length === availableSampleStations.length
                                        ? 'Batal Semua'
                                        : 'Pilih Semua Stasiun'}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto p-1">
                                {availableSampleStations.map((station) => {
                                    const isChecked = data.sample_scopes.includes(station.id);
                                    return (
                                        <label
                                            key={station.id}
                                            className={`flex items-start gap-3 p-2.5 rounded-sm border cursor-pointer select-none transition-colors ${
                                                isChecked
                                                    ? 'bg-zinc-50 border-zinc-400 text-zinc-900'
                                                    : 'bg-white border-zinc-200/80 text-zinc-600 hover:bg-zinc-50'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => handleStationToggle(station.id)}
                                                className="mt-0.5 w-4 h-4 rounded-xs border-zinc-300 text-zinc-900 focus:ring-0"
                                            />
                                            <div className="flex-1 text-xs">
                                                <span className="font-semibold block">{station.name}</span>
                                                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">
                                                    kategori: {station.category}
                                                </span>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
}
