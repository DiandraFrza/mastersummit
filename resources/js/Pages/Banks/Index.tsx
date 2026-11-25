import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import DataTable, { ColumnDef } from '@/Components/DataTable';
import Badge from '@/Components/Badge';
import ActionDropdown, { ActionDropdownItem } from '@/Components/ActionDropdown';
import Modal from '@/Components/Modal';
import { Plus, Pencil, Power, CreditCard, CheckCircle2, XCircle } from 'lucide-react';
import type { PageProps, Pagination, Bank } from '@/types';

interface BanksIndexProps extends PageProps {
    banks: Pagination<Bank>;
    filters: Record<string, any>;
}

export default function BanksIndex({ banks, filters }: BanksIndexProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBank, setEditingBank] = useState<Bank | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        account_number: '',
        account_holder: '',
        is_active: true,
    });

    const openCreateModal = () => {
        setEditingBank(null);
        reset();
        clearErrors();
        setIsModalOpen(true);
    };

    const openEditModal = (bank: Bank) => {
        setEditingBank(bank);
        clearErrors();
        setData({
            name: bank.name,
            account_number: bank.account_number,
            account_holder: bank.account_holder,
            is_active: Boolean(bank.is_active),
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingBank) {
            put(route('banks.update', editingBank.id), {
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            post(route('banks.store'), {
                onSuccess: () => setIsModalOpen(false),
            });
        }
    };

    const handleToggleStatus = (bank: Bank) => {
        const action = bank.is_active ? 'menonaktifkan' : 'mengaktifkan';
        if (confirm(`Apakah Anda yakin ingin ${action} rekening "${bank.name} - ${bank.account_number}"?`)) {
            router.patch(route('banks.toggle-status', bank.id), {}, { preserveScroll: true });
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

        router.get(route('banks.index'), Object.fromEntries(currentParams), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const columns: ColumnDef<Bank>[] = [
        {
            header: 'Nama Bank / Institusi',
            accessorKey: 'name',
            sortable: true,
            cell: ({ value }) => (
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-sm bg-zinc-100 text-teal-700 font-bold text-xs uppercase border border-zinc-200">
                        {value?.slice(0, 3)}
                    </span>
                    <span className="font-semibold text-zinc-900">{value}</span>
                </div>
            ),
        },
        {
            header: 'Nomor Rekening',
            accessorKey: 'account_number',
            isNumeric: true,
            sortable: true,
            cell: ({ value }) => (
                <span className="font-mono text-zinc-900 font-medium tabular-nums text-xs">
                    {value}
                </span>
            ),
        },
        {
            header: 'Atas Nama (Pemilik)',
            accessorKey: 'account_holder',
            sortable: true,
            cell: ({ value }) => (
                <span className="text-xs font-medium text-zinc-800 uppercase tracking-wide">
                    {value}
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
                        label: 'Edit Rekening',
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
            <Head title="Master Bank" />

            <div className="space-y-4">
                {/* Header Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-md border border-zinc-200">
                    <div>
                        <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
                            Master Bank
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
                <DataTable<Bank>
                    data={banks.data}
                    columns={columns}
                    pagination={banks}
                    searchPlaceholder="Cari nama bank, nomor rekening, pemilik..."
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
                title={editingBank ? 'Edit Rekening Bank' : 'Tambah Rekening Bank Baru'}
                description="Informasi rekening tujuan transfer dan pencatatan kas kasir."
                maxWidth="md"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">
                            Nama Bank / Institusi <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Contoh: BCA, Bank Mandiri, BNI, BRI"
                            className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                        />
                        {errors.name && (
                            <p className="mt-1 text-[11px] text-red-600">{errors.name}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">
                            Nomor Rekening <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.account_number}
                            onChange={(e) => setData('account_number', e.target.value)}
                            placeholder="Contoh: 8880192837"
                            className="w-full text-xs font-mono px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                        />
                        {errors.account_number && (
                            <p className="mt-1 text-[11px] text-red-600">{errors.account_number}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">
                            Atas Nama (Pemilik Rekening) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.account_holder}
                            onChange={(e) => setData('account_holder', e.target.value.toUpperCase())}
                            placeholder="Contoh: PT KLINIK SUMMIT MEDIKA"
                            className="w-full text-xs uppercase px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                        />
                        {errors.account_holder && (
                            <p className="mt-1 text-[11px] text-red-600">{errors.account_holder}</p>
                        )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        <input
                            type="checkbox"
                            id="bank_is_active"
                            checked={data.is_active}
                            onChange={(e) => setData('is_active', e.target.checked)}
                            className="h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
                        />
                        <label htmlFor="bank_is_active" className="text-xs text-zinc-700 cursor-pointer select-none">
                            Rekening Aktif & Tampil pada Menu Kasir / Invoice
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
