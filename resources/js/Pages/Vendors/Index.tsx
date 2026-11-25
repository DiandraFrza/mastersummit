import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import DataTable, { ColumnDef } from '@/Components/DataTable';
import Badge from '@/Components/Badge';
import ActionDropdown, { ActionDropdownItem } from '@/Components/ActionDropdown';
import Modal from '@/Components/Modal';
import { Plus, Pencil, Power, Truck, CheckCircle2, XCircle } from 'lucide-react';
import type { PageProps, Pagination, Vendor } from '@/types';

interface VendorsIndexProps extends PageProps {
    vendors: Pagination<Vendor>;
    filters: Record<string, any>;
}

export default function VendorsIndex({ vendors, filters }: VendorsIndexProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        code: '',
        name: '',
        npwp: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        contract_number: '',
        contract_type: '',
        pic_name: '',
        pic_phone: '',
        is_active: true,
    });

    const openCreateModal = () => {
        setEditingVendor(null);
        reset();
        clearErrors();
        setIsModalOpen(true);
    };

    const openEditModal = (vendor: Vendor) => {
        setEditingVendor(vendor);
        clearErrors();
        setData({
            code: vendor.code,
            name: vendor.name,
            npwp: vendor.npwp || '',
            address: vendor.address || '',
            phone: vendor.phone || '',
            email: vendor.email || '',
            website: vendor.website || '',
            contract_number: vendor.contract_number || '',
            contract_type: vendor.contract_type || '',
            pic_name: vendor.pic_name || '',
            pic_phone: vendor.pic_phone || '',
            is_active: Boolean(vendor.is_active),
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingVendor) {
            put(route('vendors.update', editingVendor.id), {
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            post(route('vendors.store'), {
                onSuccess: () => setIsModalOpen(false),
            });
        }
    };

    const handleToggleStatus = (vendor: Vendor) => {
        const action = vendor.is_active ? 'menonaktifkan' : 'mengaktifkan';
        if (confirm(`Apakah Anda yakin ingin ${action} vendor "${vendor.name}"?`)) {
            router.patch(route('vendors.toggle-status', vendor.id), {}, { preserveScroll: true });
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

        router.get(route('vendors.index'), Object.fromEntries(currentParams), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const columns: ColumnDef<Vendor>[] = [
        {
            header: 'Vendor / Rekanan',
            accessorKey: 'name',
            sortable: true,
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium text-zinc-900">{row.name}</span>
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-0.5">
                        <span className="font-mono bg-zinc-100 text-zinc-600 px-1 rounded tabular-nums">
                            {row.code}
                        </span>
                        {row.npwp && <span>NPWP: {row.npwp}</span>}
                    </div>
                </div>
            ),
        },
        {
            header: 'Kontrak / PKS',
            id: 'contract',
            cell: ({ row }) => (
                <div className="flex flex-col text-[11px] text-zinc-600">
                    <span className="font-medium text-zinc-800">
                        {row.contract_type || 'Kemitraan Umum'}
                    </span>
                    {row.contract_number ? (
                        <span className="text-zinc-400 font-mono text-[10px] tabular-nums">
                            {row.contract_number}
                        </span>
                    ) : (
                        <span className="text-zinc-400">—</span>
                    )}
                </div>
            ),
        },
        {
            header: 'Kontak & PIC',
            id: 'pic',
            cell: ({ row }) => (
                <div className="flex flex-col text-[11px] text-zinc-600">
                    {row.pic_name && <span className="font-medium text-zinc-800">{row.pic_name}</span>}
                    {row.pic_phone && <span className="tabular-nums font-mono">{row.pic_phone}</span>}
                    {!row.pic_name && !row.pic_phone && (
                        <span>{row.phone || <span className="text-zinc-400">—</span>}</span>
                    )}
                </div>
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
                        label: 'Edit Vendor',
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
            <Head title="Master Vendor" />

            <div className="space-y-4">
                {/* Header Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-200">
                    <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
                        Master Vendor
                    </h1>

                    <div className="flex items-center gap-3">
                        {/* Status Filter Tab Pills */}
                        <div className="flex items-center bg-zinc-100 p-0.5 rounded-sm border border-zinc-200 text-sm">
                            <button
                                type="button"
                                onClick={() => handleStatusFilterChange('all')}
                                className={`h-9 px-3 rounded-sm font-medium transition-colors ${
                                    (filters.status || 'all') === 'all'
                                        ? 'bg-white text-zinc-900 shadow-2xs'
                                        : 'text-zinc-600 hover:text-zinc-900'
                                }`}
                            >
                                Semua
                            </button>
                            <button
                                type="button"
                                onClick={() => handleStatusFilterChange('active')}
                                className={`h-9 px-3 rounded-sm font-medium transition-colors ${
                                    filters.status === 'active'
                                        ? 'bg-white text-zinc-900 shadow-2xs'
                                        : 'text-zinc-600 hover:text-zinc-900'
                                }`}
                            >
                                Aktif
                            </button>
                            <button
                                type="button"
                                onClick={() => handleStatusFilterChange('inactive')}
                                className={`h-9 px-3 rounded-sm font-medium transition-colors ${
                                    filters.status === 'inactive'
                                        ? 'bg-white text-zinc-900 shadow-2xs'
                                        : 'text-zinc-600 hover:text-zinc-900'
                                }`}
                            >
                                Nonaktif
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="inline-flex items-center justify-center gap-2 h-10 px-4 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-sm shadow-2xs transition-colors cursor-pointer shrink-0"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Tambah Data</span>
                        </button>
                    </div>
                </div>

                {/* Standard DataTable */}
                <DataTable<Vendor>
                    data={vendors.data}
                    columns={columns}
                    pagination={vendors}
                    searchPlaceholder="Cari kode, nama vendor, kontrak, PIC, NPWP..."
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
                title={editingVendor ? 'Edit Vendor / Rekanan' : 'Tambah Vendor Baru'}
                description="Informasi kontak rekanan eksternal, laboratorium rujukan, dan kontrak."
                maxWidth="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Kode Vendor <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                placeholder="Contoh: VND-001, LAB-KF"
                                className="w-full text-xs font-mono uppercase px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            />
                            {errors.code && (
                                <p className="mt-1 text-[11px] text-red-600">{errors.code}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Nama Vendor / Rekanan <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Contoh: PT Sysmex Indonesia"
                                className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            />
                            {errors.name && (
                                <p className="mt-1 text-[11px] text-red-600">{errors.name}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                NPWP Perusahaan
                            </label>
                            <input
                                type="text"
                                value={data.npwp}
                                onChange={(e) => setData('npwp', e.target.value)}
                                placeholder="Contoh: 01.345.678.9-012.000"
                                className="w-full text-xs font-mono px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Jenis Kontrak / Kerjasama
                            </label>
                            <input
                                type="text"
                                value={data.contract_type}
                                onChange={(e) => setData('contract_type', e.target.value)}
                                placeholder="Contoh: KSO Alat, Lab Rujukan Luar"
                                className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Nomor Kontrak / PKS
                            </label>
                            <input
                                type="text"
                                value={data.contract_number}
                                onChange={(e) => setData('contract_number', e.target.value)}
                                placeholder="Contoh: KTR/2026/SYS/001"
                                className="w-full text-xs font-mono px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Nama PIC Vendor
                            </label>
                            <input
                                type="text"
                                value={data.pic_name}
                                onChange={(e) => setData('pic_name', e.target.value)}
                                placeholder="Nama narahubung"
                                className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                No. HP / Telepon PIC
                            </label>
                            <input
                                type="text"
                                value={data.pic_phone}
                                onChange={(e) => setData('pic_phone', e.target.value)}
                                placeholder="Contoh: 0811223344"
                                className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Email Resmi
                            </label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="vendor@partner.co.id"
                                className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Alamat Kantor
                            </label>
                            <textarea
                                rows={2}
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                placeholder="Alamat kantor rekanan..."
                                className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        <input
                            type="checkbox"
                            id="vendor_is_active"
                            checked={data.is_active}
                            onChange={(e) => setData('is_active', e.target.checked)}
                            className="h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
                        />
                        <label htmlFor="vendor_is_active" className="text-xs text-zinc-700 cursor-pointer select-none">
                            Vendor Aktif & Memiliki Kerjasama Berjalan
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
                            className="px-4 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-md transition-colors shadow-xs"
                        >
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
