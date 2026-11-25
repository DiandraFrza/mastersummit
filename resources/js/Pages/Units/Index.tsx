import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import DataTable, { ColumnDef } from '@/Components/DataTable';
import Badge from '@/Components/Badge';
import ActionDropdown, { ActionDropdownItem } from '@/Components/ActionDropdown';
import Modal from '@/Components/Modal';
import { Plus, Pencil, Power, Building2, CheckCircle2, XCircle } from 'lucide-react';
import type { PageProps, Pagination, Unit } from '@/types';

interface UnitsIndexProps extends PageProps {
    units: Pagination<Unit>;
    filters: Record<string, any>;
}

export default function UnitsIndex({ units, filters }: UnitsIndexProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        code: '',
        name: '',
        phone: '',
        address: '',
        is_active: true,
    });

    const openCreateModal = () => {
        setEditingUnit(null);
        reset();
        clearErrors();
        setIsModalOpen(true);
    };

    const openEditModal = (unit: Unit) => {
        setEditingUnit(unit);
        clearErrors();
        setData({
            code: unit.code,
            name: unit.name,
            phone: unit.phone || '',
            address: unit.address || '',
            is_active: Boolean(unit.is_active),
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingUnit) {
            put(route('units.update', editingUnit.id), {
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            post(route('units.store'), {
                onSuccess: () => setIsModalOpen(false),
            });
        }
    };

    const handleToggleStatus = (unit: Unit) => {
        const action = unit.is_active ? 'menonaktifkan' : 'mengaktifkan';
        if (confirm(`Apakah Anda yakin ingin ${action} unit "${unit.name}"?`)) {
            router.patch(route('units.toggle-status', unit.id), {}, { preserveScroll: true });
        }
    };

    const handleStatusFilterChange = (status: string) => {
        const currentParams = new URLSearchParams(window.location.search);
        if (status === 'all') {
            currentParams.delete('status');
        } else {
            currentParams.set('status', status);
        }
        currentParams.delete('page');

        router.get(route('units.index'), Object.fromEntries(currentParams), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const columns: ColumnDef<Unit>[] = [
        {
            header: 'Kode Unit',
            accessorKey: 'code',
            isNumeric: true,
            sortable: true,
            width: '140px',
            cell: ({ value }) => (
                <span className="font-mono text-zinc-900 font-medium tabular-nums">{value}</span>
            ),
        },
        {
            header: 'Nama Unit / Cabang',
            accessorKey: 'name',
            sortable: true,
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium text-zinc-900">{row.name}</span>
                    <span className="text-[11px] text-zinc-400 truncate max-w-sm">
                        {row.address || 'Alamat belum diatur'}
                    </span>
                </div>
            ),
        },
        {
            header: 'No. Telepon',
            accessorKey: 'phone',
            cell: ({ value }) => (
                <span className="text-[12px] text-zinc-600 tabular-nums">
                    {value || <span className="text-zinc-400">—</span>}
                </span>
            ),
        },
        {
            header: 'Status',
            accessorKey: 'is_active',
            sortable: true,
            width: '110px',
            align: 'center',
            cell: ({ value }) => (
                <Badge
                    variant={value ? 'success' : 'neutral'}
                    icon={value ? CheckCircle2 : XCircle}
                >
                    {value ? 'Aktif' : 'Non-Aktif'}
                </Badge>
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
                        label: 'Edit Unit',
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
            <Head title="Master Unit" />

            <div className="space-y-4">
                {/* Header Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-md border border-zinc-200">
                    <div>
                        <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
                            Master Unit
                        </h1>
                    </div>

                    <div className="flex items-center gap-2.5">
                        {/* Status Filter Tab Pills */}
                        <div className="flex items-center bg-zinc-100 p-1 rounded-md border border-zinc-200 text-sm h-10">
                            <button
                                type="button"
                                onClick={() => handleStatusFilterChange('all')}
                                className={`px-3 py-1 rounded-sm font-medium transition-colors ${
                                    (filters.status || 'all') === 'all'
                                        ? 'bg-white text-zinc-900 shadow-xs'
                                        : 'text-zinc-600 hover:text-zinc-900'
                                }`}
                            >
                                Semua
                            </button>
                            <button
                                type="button"
                                onClick={() => handleStatusFilterChange('active')}
                                className={`px-3 py-1 rounded-sm font-medium transition-colors ${
                                    filters.status === 'active'
                                        ? 'bg-white text-emerald-700 shadow-xs'
                                        : 'text-zinc-600 hover:text-zinc-900'
                                }`}
                            >
                                Aktif
                            </button>
                            <button
                                type="button"
                                onClick={() => handleStatusFilterChange('inactive')}
                                className={`px-3 py-1 rounded-sm font-medium transition-colors ${
                                    filters.status === 'inactive'
                                        ? 'bg-white text-zinc-700 shadow-xs'
                                        : 'text-zinc-600 hover:text-zinc-900'
                                }`}
                            >
                                Nonaktif
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="inline-flex items-center gap-2 h-10 px-4 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-md transition-colors shadow-xs"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Tambah Data</span>
                        </button>
                    </div>
                </div>

                {/* Standard DataTable */}
                <DataTable<Unit>
                    data={units.data}
                    columns={columns}
                    pagination={units}
                    searchPlaceholder="Cari kode, nama unit, alamat, telepon..."
                    currentSearch={filters.search}
                    currentSort={filters.sort}
                    currentDirection={filters.direction}
                    currentPerPage={filters.per_page}
                />
            </div>

            {/* Modal Form Tambah / Edit */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingUnit ? 'Edit Unit / Cabang' : 'Tambah Unit / Cabang Baru'}
                description="Informasi lokasi cabang operasional dan kontak faskes."
                maxWidth="md"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">
                            Kode Unit <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value.toUpperCase())}
                            placeholder="Contoh: PST-01, CBG-BKS"
                            className="w-full text-xs font-mono uppercase px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                        />
                        {errors.code && (
                            <p className="mt-1 text-[11px] text-red-600">{errors.code}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">
                            Nama Unit / Cabang <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Contoh: Klinik Summit Cabang Bekasi"
                            className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                        />
                        {errors.name && (
                            <p className="mt-1 text-[11px] text-red-600">{errors.name}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">
                            No. Telepon
                        </label>
                        <input
                            type="text"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            placeholder="Contoh: 021-88991234"
                            className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                        />
                        {errors.phone && (
                            <p className="mt-1 text-[11px] text-red-600">{errors.phone}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">
                            Alamat Lengkap
                        </label>
                        <textarea
                            rows={3}
                            value={data.address}
                            onChange={(e) => setData('address', e.target.value)}
                            placeholder="Alamat jalan, gedung, nomor..."
                            className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                        />
                        {errors.address && (
                            <p className="mt-1 text-[11px] text-red-600">{errors.address}</p>
                        )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        <input
                            type="checkbox"
                            id="unit_is_active"
                            checked={data.is_active}
                            onChange={(e) => setData('is_active', e.target.checked)}
                            className="h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
                        />
                        <label htmlFor="unit_is_active" className="text-xs text-zinc-700 cursor-pointer select-none">
                            Unit Aktif & Menerima Layanan
                        </label>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-md transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="h-10 px-4 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-md transition-colors shadow-xs"
                        >
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
