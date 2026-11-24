import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DataTable, { ColumnDef } from '@/Components/DataTable';
import Badge from '@/Components/Badge';
import ActionDropdown, { ActionDropdownItem } from '@/Components/ActionDropdown';
import Modal from '@/Components/Modal';
import { Plus, Pencil, Power, Share2, CheckCircle2, XCircle, Percent } from 'lucide-react';
import type { PageProps, Pagination, Referrer, ReferrerType, Company } from '@/types';

interface ReferrersIndexProps extends PageProps {
    referrers: Pagination<Referrer>;
    referrerTypes: ReferrerType[];
    companies: Array<Pick<Company, 'id' | 'name' | 'branch_code'>>;
    filters: Record<string, any>;
}

export default function ReferrersIndex({
    referrers,
    referrerTypes,
    companies,
    filters,
}: ReferrersIndexProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingReferrer, setEditingReferrer] = useState<Referrer | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        referrer_type_id: referrerTypes[0]?.id || '',
        company_id: '' as string | number,
        name: '',
        pic_name: '',
        phone: '',
        email: '',
        address: '',
        marketing_name: '',
        fee_general_percent: 0,
        fee_special_note: '',
        marketing_note: '',
        is_active: true,
    });

    const openCreateModal = () => {
        setEditingReferrer(null);
        reset();
        clearErrors();
        if (referrerTypes.length > 0) {
            setData('referrer_type_id', referrerTypes[0].id);
        }
        setIsModalOpen(true);
    };

    const openEditModal = (referrer: Referrer) => {
        setEditingReferrer(referrer);
        clearErrors();
        setData({
            referrer_type_id: referrer.referrer_type_id,
            company_id: referrer.company_id || '',
            name: referrer.name,
            pic_name: referrer.pic_name || '',
            phone: referrer.phone || '',
            email: referrer.email || '',
            address: referrer.address || '',
            marketing_name: referrer.marketing_name || '',
            fee_general_percent: Number(referrer.fee_general_percent) || 0,
            fee_special_note: referrer.fee_special_note || '',
            marketing_note: referrer.marketing_note || '',
            is_active: Boolean(referrer.is_active),
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            ...data,
            company_id: data.company_id === '' ? null : data.company_id,
        };

        if (editingReferrer) {
            put(route('referrers.update', editingReferrer.id), {
                data: payload as any,
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            post(route('referrers.store'), {
                data: payload as any,
                onSuccess: () => setIsModalOpen(false),
            });
        }
    };

    const handleToggleStatus = (referrer: Referrer) => {
        const action = referrer.is_active ? 'menonaktifkan' : 'mengaktifkan';
        if (confirm(`Apakah Anda yakin ingin ${action} perujuk "${referrer.name}"?`)) {
            router.patch(route('referrers.toggle-status', referrer.id), {}, { preserveScroll: true });
        }
    };

    const handleFilterChange = (key: string, value: string) => {
        const currentParams = new URLSearchParams(window.location.search);
        if (!value || value === 'all') {
            currentParams.delete(key);
        } else {
            currentParams.set(key, value);
        }
        currentParams.delete('page');

        router.get(route('referrers.index'), Object.fromEntries(currentParams), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const columns: ColumnDef<Referrer>[] = [
        {
            header: 'Nama Perujuk',
            accessorKey: 'name',
            sortable: true,
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium text-zinc-900">{row.name}</span>
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mt-0.5">
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] bg-zinc-100 text-zinc-600 font-medium">
                            {row.referrer_type?.name || 'Umum'}
                        </span>
                        {row.company && (
                            <span className="text-zinc-400 truncate max-w-[150px]">
                                • {row.company.name}
                            </span>
                        )}
                    </div>
                </div>
            ),
        },
        {
            header: 'Kontak & PIC',
            id: 'contacts',
            cell: ({ row }) => (
                <div className="flex flex-col text-[11px] text-zinc-600">
                    {row.phone && <span className="tabular-nums font-mono">{row.phone}</span>}
                    {row.pic_name && <span className="text-zinc-500">PIC: {row.pic_name}</span>}
                    {!row.phone && !row.pic_name && <span className="text-zinc-400">—</span>}
                </div>
            ),
        },
        {
            header: 'Marketing PIC',
            accessorKey: 'marketing_name',
            cell: ({ value }) => (
                <span className="text-xs text-zinc-700">
                    {value || <span className="text-zinc-400">—</span>}
                </span>
            ),
        },
        {
            header: 'Komisi Fee',
            accessorKey: 'fee_general_percent',
            sortable: true,
            align: 'right',
            width: '110px',
            cell: ({ value }) => (
                <div className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-zinc-800 tabular-nums">
                    <Percent className="w-3 h-3 text-teal-600" />
                    <span>{Number(value || 0).toFixed(1)}%</span>
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
                        label: 'Edit Perujuk',
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
        <AuthenticatedLayout
            title="Master Perujuk & Dokter Rujukan"
            breadcrumb={[
                { label: 'Data Master' },
                { label: 'Perujuk' },
            ]}
        >
            <Head title="Master Perujuk" />

            <div className="space-y-4">
                {/* Header Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-md border border-zinc-200/80">
                    <div>
                        <h1 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                            <Share2 className="w-5 h-5 text-teal-600" />
                            <span>Master Dokter & Faskes Perujuk</span>
                        </h1>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Dokter pengirim, puskesmas, klinik jejaring, komisi rujukan, dan catatan marketing.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Type Filter Select */}
                        <select
                            value={filters.type_id || ''}
                            onChange={(e) => handleFilterChange('type_id', e.target.value)}
                            className="text-xs px-2.5 py-1.5 bg-white border border-zinc-200/80 rounded-md text-zinc-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        >
                            <option value="">Semua Kategori Perujuk</option>
                            {referrerTypes.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>

                        {/* Status Filter Tab Pills */}
                        <div className="flex items-center bg-zinc-100 p-0.5 rounded-md border border-zinc-200/80 text-xs">
                            <button
                                type="button"
                                onClick={() => handleFilterChange('status', 'all')}
                                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                                    (filters.status || 'all') === 'all'
                                        ? 'bg-white text-zinc-900 shadow-xs'
                                        : 'text-zinc-600 hover:text-zinc-900'
                                }`}
                            >
                                Semua
                            </button>
                            <button
                                type="button"
                                onClick={() => handleFilterChange('status', 'active')}
                                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                                    filters.status === 'active'
                                        ? 'bg-white text-emerald-700 shadow-xs'
                                        : 'text-zinc-600 hover:text-zinc-900'
                                }`}
                            >
                                Aktif
                            </button>
                            <button
                                type="button"
                                onClick={() => handleFilterChange('status', 'inactive')}
                                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                                    filters.status === 'inactive'
                                        ? 'bg-white text-zinc-700 shadow-xs'
                                        : 'text-zinc-600 hover:text-zinc-900'
                                }`}
                            >
                                Non-Aktif
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-md transition-colors shadow-xs"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Tambah Perujuk</span>
                        </button>
                    </div>
                </div>

                {/* Standard DataTable */}
                <DataTable<Referrer>
                    data={referrers.data}
                    columns={columns}
                    pagination={referrers}
                    searchPlaceholder="Cari nama perujuk, PIC, telepon, marketing..."
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
                title={editingReferrer ? 'Edit Data Perujuk' : 'Tambah Perujuk Baru'}
                description="Informasi relasi rujukan, dokter pengirim, dan ketentuan komisi."
                maxWidth="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Kategori Perujuk <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={data.referrer_type_id}
                                onChange={(e) => setData('referrer_type_id', Number(e.target.value))}
                                className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            >
                                {referrerTypes.map((type) => (
                                    <option key={type.id} value={type.id}>
                                        {type.name}
                                    </option>
                                ))}
                            </select>
                            {errors.referrer_type_id && (
                                <p className="mt-1 text-[11px] text-red-600">{errors.referrer_type_id}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Perusahaan Terkait (Opsional)
                            </label>
                            <select
                                value={data.company_id || ''}
                                onChange={(e) => setData('company_id', e.target.value)}
                                className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            >
                                <option value="">— Tidak Terikat Perusahaan —</option>
                                {companies.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} {c.branch_code ? `(${c.branch_code})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Nama Perujuk / Faskes <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Contoh: dr. Bambang Hariyadi, Sp.A / Klinik Pratama Sehat"
                                className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            />
                            {errors.name && (
                                <p className="mt-1 text-[11px] text-red-600">{errors.name}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Nama PIC / Kontak Rujukan
                            </label>
                            <input
                                type="text"
                                value={data.pic_name}
                                onChange={(e) => setData('pic_name', e.target.value)}
                                placeholder="Nama perawat / admin rujukan"
                                className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                No. Telepon / WhatsApp
                            </label>
                            <input
                                type="text"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                placeholder="Contoh: 08123456789"
                                className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            />
                            {errors.phone && (
                                <p className="mt-1 text-[11px] text-red-600">{errors.phone}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Email Perujuk
                            </label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="dokter@email.com"
                                className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Marketing Penanggung Jawab
                            </label>
                            <input
                                type="text"
                                value={data.marketing_name}
                                onChange={(e) => setData('marketing_name', e.target.value)}
                                placeholder="Nama staf marketing klinik"
                                className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Komisi Umum / Fee (%)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    value={data.fee_general_percent}
                                    onChange={(e) => setData('fee_general_percent', parseFloat(e.target.value) || 0)}
                                    placeholder="0"
                                    className="w-full text-xs font-mono px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 pr-8"
                                />
                                <span className="absolute right-3 top-2 text-xs font-mono text-zinc-400">%</span>
                            </div>
                            {errors.fee_general_percent && (
                                <p className="mt-1 text-[11px] text-red-600">{errors.fee_general_percent}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Catatan Khusus Fee / Pencairan
                            </label>
                            <input
                                type="text"
                                value={data.fee_special_note}
                                onChange={(e) => setData('fee_special_note', e.target.value)}
                                placeholder="Misal: Dicairkan tgl 25 via transfer BCA"
                                className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Alamat Praktik / Instansi
                            </label>
                            <textarea
                                rows={2}
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                placeholder="Alamat lengkap klinik atau tempat praktik..."
                                className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Catatan Marketing Internal
                            </label>
                            <input
                                type="text"
                                value={data.marketing_note}
                                onChange={(e) => setData('marketing_note', e.target.value)}
                                placeholder="Preferensi dokter, jadwal praktik, dll."
                                className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        <input
                            type="checkbox"
                            id="referrer_is_active"
                            checked={data.is_active}
                            onChange={(e) => setData('is_active', e.target.checked)}
                            className="h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
                        />
                        <label htmlFor="referrer_is_active" className="text-xs text-zinc-700 cursor-pointer select-none">
                            Perujuk Aktif & Dapat Dipilih pada Pendaftaran Pasien
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
        </AuthenticatedLayout>
    );
}
