import React, { useState, useMemo } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import DataTable, { ColumnDef } from '@/Components/DataTable';
import Badge from '@/Components/Badge';
import ActionDropdown, { ActionDropdownItem } from '@/Components/ActionDropdown';
import Modal from '@/Components/Modal';
import {
    Plus,
    Pencil,
    Power,
    PackageCheck,
    CheckCircle2,
    XCircle,
    Trash2,
    Calculator,
    Tag,
} from 'lucide-react';
import type { PageProps, Pagination, Package, Service, Referrer } from '@/types';

interface PackagesIndexProps extends PageProps {
    packages: Pagination<Package>;
    services: Service[];
    referrers: Referrer[];
    existingEvents?: string[];
    filters: Record<string, any>;
}

interface FormItem {
    service_id: number;
    item_price_override: number | string | null;
}

export default function PackagesIndex({
    packages,
    services,
    referrers,
    existingEvents = [],
    filters,
}: PackagesIndexProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<Package | null>(null);

    // Selected service for the quick-add selector in modal
    const [selectedServiceIdToAdd, setSelectedServiceIdToAdd] = useState<number | string>(
        services[0]?.id || ''
    );

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        year: new Date().getFullYear(),
        event_label: '',
        referrer_id: '' as string | number,
        discount_amount: 0,
        is_active: true,
        items: [] as FormItem[],
    });

    const openCreateModal = () => {
        setEditingPackage(null);
        reset();
        clearErrors();
        setData({
            name: '',
            year: new Date().getFullYear(),
            event_label: '',
            referrer_id: '',
            discount_amount: 0,
            is_active: true,
            items: [],
        });
        setIsModalOpen(true);
    };

    const openEditModal = (pkg: Package) => {
        setEditingPackage(pkg);
        clearErrors();

        const mappedItems: FormItem[] = (pkg.package_items || []).map((pi) => ({
            service_id: pi.service_id,
            item_price_override: pi.item_price_override !== null ? Number(pi.item_price_override) : null,
        }));

        setData({
            name: pkg.name,
            year: pkg.year,
            event_label: pkg.event_label || '',
            referrer_id: pkg.referrer_id || '',
            discount_amount: Number(pkg.discount_amount) || 0,
            is_active: Boolean(pkg.is_active),
            items: mappedItems,
        });
        setIsModalOpen(true);
    };

    const handleAddItem = () => {
        const sid = Number(selectedServiceIdToAdd);
        if (!sid) return;

        // Check if already added
        if (data.items.some((it) => it.service_id === sid)) {
            alert('Layanan pemeriksaan ini sudah ditambahkan ke dalam paket.');
            return;
        }

        const svc = services.find((s) => s.id === sid);
        const nextItems = [
            ...data.items,
            {
                service_id: sid,
                item_price_override: null,
            },
        ];
        setData('items', nextItems);
    };

    const handleRemoveItem = (index: number) => {
        const next = [...data.items];
        next.splice(index, 1);
        setData('items', next);
    };

    const handlePriceOverrideChange = (index: number, val: string) => {
        const next = [...data.items];
        next[index].item_price_override = val === '' ? null : parseFloat(val) || 0;
        setData('items', next);
    };

    // Live calculated totals inside modal
    const calculatedTotal = useMemo(() => {
        let sum = 0;
        for (const item of data.items) {
            if (item.item_price_override !== null && item.item_price_override !== '') {
                sum += Number(item.item_price_override) || 0;
            } else {
                const s = services.find((srv) => srv.id === item.service_id);
                sum += Number(s?.base_price) || 0;
            }
        }
        return sum;
    }, [data.items, services]);

    const calculatedFinal = useMemo(() => {
        const disc = Number(data.discount_amount) || 0;
        return Math.max(0, calculatedTotal - disc);
    }, [calculatedTotal, data.discount_amount]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (data.items.length === 0) {
            alert('Paket harus memiliki minimal 1 item layanan pemeriksaan.');
            return;
        }

        const payload = {
            ...data,
            referrer_id: data.referrer_id === '' ? null : data.referrer_id,
        };

        if (editingPackage) {
            put(route('packages.update', editingPackage.id), {
                data: payload as any,
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            post(route('packages.store'), {
                data: payload as any,
                onSuccess: () => setIsModalOpen(false),
            });
        }
    };

    const handleToggleStatus = (pkg: Package) => {
        const action = pkg.is_active ? 'menonaktifkan' : 'mengaktifkan';
        if (confirm(`Apakah Anda yakin ingin ${action} paket "${pkg.name}"?`)) {
            router.patch(route('packages.toggle-status', pkg.id), {}, { preserveScroll: true });
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

        router.get(route('packages.index'), Object.fromEntries(currentParams), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const formatCurrency = (amount: number | string) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(Number(amount) || 0);
    };

    const columns: ColumnDef<Package>[] = [
        {
            header: 'Nama Perujuk',
            id: 'referrer',
            width: '160px',
            cell: ({ row }) => (
                <span className="text-xs font-medium text-zinc-900 truncate">
                    {row.referrer?.name || <span className="text-zinc-400">Umum / Reguler</span>}
                </span>
            ),
        },
        {
            header: 'Tahun',
            accessorKey: 'year',
            isNumeric: true,
            sortable: true,
            width: '85px',
            align: 'center',
            cell: ({ value }) => (
                <span className="font-mono text-xs font-semibold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-sm tabular-nums">
                    {value}
                </span>
            ),
        },
        {
            header: 'Event',
            accessorKey: 'event_label',
            sortable: true,
            width: '180px',
            cell: ({ value }) => (
                <span className="text-xs font-medium text-zinc-800 truncate" title={value || '—'}>
                    {value || <span className="text-zinc-400">—</span>}
                </span>
            ),
        },
        {
            header: 'Nama Paket',
            accessorKey: 'name',
            sortable: true,
            cell: ({ row }) => {
                const count = row.package_items?.length || 0;
                return (
                    <div className="flex flex-col">
                        <span className="font-semibold text-zinc-900">{row.name}</span>
                        <span className="text-[11px] text-zinc-400">
                            {count} Layanan ({row.package_items?.slice(0, 2).map((p: any) => p.service?.name).join(', ')}{count > 2 ? ` +${count - 2}` : ''})
                        </span>
                    </div>
                );
            },
        },
        {
            header: 'Tarif Total',
            accessorKey: 'total_price',
            sortable: true,
            align: 'right',
            width: '130px',
            cell: ({ value }) => (
                <span className="font-mono text-xs text-zinc-700 tabular-nums">
                    {formatCurrency(value)}
                </span>
            ),
        },
        {
            header: 'Diskon',
            accessorKey: 'discount_amount',
            align: 'right',
            width: '120px',
            cell: ({ value }) => (
                <span className="font-mono text-xs text-rose-600 tabular-nums">
                    {Number(value) > 0 ? `-${formatCurrency(value)}` : '0'}
                </span>
            ),
        },
        {
            header: 'Tarif Akhir',
            accessorKey: 'final_price',
            sortable: true,
            align: 'right',
            width: '140px',
            cell: ({ value }) => (
                <span className="font-mono text-xs font-bold text-emerald-700 tabular-nums">
                    {formatCurrency(value)}
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
            width: '170px',
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-1.5">
                    <button
                        type="button"
                        onClick={() => openEditModal(row)}
                        className="inline-flex items-center gap-1 h-8 px-2.5 text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-sm transition-colors cursor-pointer"
                        title="Ubah tarif paket"
                    >
                        <Pencil className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Ubah</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleToggleStatus(row)}
                        className={`inline-flex items-center gap-1 h-8 px-2.5 text-xs font-semibold rounded-sm transition-colors cursor-pointer ${
                            row.is_active
                                ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80'
                                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80'
                        }`}
                        title={row.is_active ? 'Nonaktifkan paket' : 'Aktifkan paket'}
                    >
                        <Power className="w-3.5 h-3.5" />
                        <span>{row.is_active ? 'Nonaktif' : 'Aktifkan'}</span>
                    </button>
                </div>
            ),
        },
    ];

    return (
        <>
            <Head title="Tarif Paket" />

            <div className="space-y-4">
                {/* Header Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-md border border-zinc-200">
                    <div>
                        <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
                            Tarif Paket
                        </h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Year Filter Select */}
                        <select
                            value={filters.year || ''}
                            onChange={(e) => handleFilterChange('year', e.target.value)}
                            className="h-10 text-sm px-3 bg-white border border-zinc-200 rounded-md text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-medium"
                        >
                            <option value="">Semua Tahun</option>
                            {[2024, 2025, 2026, 2027].map((yr) => (
                                <option key={yr} value={yr}>
                                    Tahun {yr}
                                </option>
                            ))}
                        </select>

                        {/* Status Filter Tab Pills */}
                        <div className="flex items-center bg-zinc-100 p-1 rounded-md border border-zinc-200 text-sm h-10">
                            <button
                                type="button"
                                onClick={() => handleFilterChange('status', 'all')}
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
                                onClick={() => handleFilterChange('status', 'active')}
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
                                onClick={() => handleFilterChange('status', 'inactive')}
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
                <DataTable<Package>
                    data={packages.data}
                    columns={columns}
                    pagination={packages}
                    searchPlaceholder="Cari nama paket, label event kontrak..."
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
                title={editingPackage ? 'Ubah Tarif Paket' : 'Tambah Tarif Paket'}
                maxWidth="3xl"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Perujuk
                            </label>
                            <select
                                value={data.referrer_id || ''}
                                onChange={(e) => setData('referrer_id', e.target.value)}
                                className="w-full h-10 text-sm px-3 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            >
                                <option value="">Umum</option>
                                {referrers.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.name}
                                    </option>
                                ))}
                            </select>
                            {errors.referrer_id && (
                                <p className="mt-1 text-[11px] text-red-600">{errors.referrer_id}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Tahun <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="2020"
                                max="2099"
                                value={data.year}
                                onChange={(e) => setData('year', parseInt(e.target.value, 10) || new Date().getFullYear())}
                                className="w-full h-10 text-sm font-mono px-3 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums"
                            />
                            {errors.year && (
                                <p className="mt-1 text-[11px] text-red-600">{errors.year}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Nama Event
                            </label>
                            <input
                                type="text"
                                list="existing-events-datalist"
                                value={data.event_label}
                                onChange={(e) => setData('event_label', e.target.value)}
                                placeholder="Pilih atau ketik event..."
                                className="w-full h-10 text-sm px-3 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            />
                            <datalist id="existing-events-datalist">
                                {existingEvents.map((evt) => (
                                    <option key={evt} value={evt} />
                                ))}
                            </datalist>
                            {errors.event_label && (
                                <p className="mt-1 text-[11px] text-red-600">{errors.event_label}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Nama Paket <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Nama paket pemeriksaan"
                                className="w-full h-10 text-sm px-3 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            />
                            {errors.name && (
                                <p className="mt-1 text-[11px] text-red-600">{errors.name}</p>
                            )}
                        </div>
                    </div>

                    {/* Section Item Pemeriksaan */}
                    <div className="pt-2 border-t border-zinc-200">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5 text-zinc-600" />
                                <span>Pilihan Pemeriksaan ({data.items.length} item)</span>
                            </label>
                        </div>

                        {/* Quick Add Bar */}
                        <div className="flex items-center gap-2 mb-3 bg-zinc-50 p-2.5 rounded-md border border-zinc-200">
                            <select
                                value={selectedServiceIdToAdd}
                                onChange={(e) => setSelectedServiceIdToAdd(e.target.value)}
                                className="flex-1 h-10 text-sm px-3 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            >
                                <option value="">Pilih Layanan</option>
                                {services.map((svc) => (
                                    <option key={svc.id} value={svc.id}>
                                        [{svc.code}] {svc.name} ({svc.category}) — {formatCurrency(svc.base_price)}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="inline-flex items-center gap-1.5 h-10 px-4 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Tambah</span>
                            </button>
                        </div>

                        {errors.items && (
                            <p className="mb-2 text-[11px] text-red-600 font-medium">{errors.items}</p>
                        )}

                        {/* Table Selected Items */}
                        <div className="max-h-56 overflow-y-auto border border-zinc-200 rounded-md">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-zinc-100 text-zinc-600 font-medium border-b border-zinc-200 sticky top-0">
                                    <tr>
                                        <th className="py-2 px-3">Pemeriksaan</th>
                                        <th className="py-2 px-3 text-right w-28">Tarif Dasar</th>
                                        <th className="py-2 px-3 text-right w-36">Tarif Khusus (Override)</th>
                                        <th className="py-2 px-2 text-center w-12">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200/80 bg-white">
                                    {data.items.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-6 text-center text-zinc-400">
                                                Belum ada layanan yang dimasukkan. Pilih layanan di atas untuk mulai menyusun paket.
                                            </td>
                                        </tr>
                                    ) : (
                                        data.items.map((item, idx) => {
                                            const s = services.find((srv) => srv.id === item.service_id);
                                            return (
                                                <tr key={item.service_id} className="hover:bg-zinc-50/70">
                                                    <td className="py-2 px-3">
                                                        <div className="font-medium text-zinc-900">{s?.name || 'Pemeriksaan'}</div>
                                                        <div className="text-[10px] text-zinc-400 font-mono">{s?.code}</div>
                                                    </td>
                                                    <td className="py-2 px-3 text-right font-mono tabular-nums text-zinc-600">
                                                        {formatCurrency(s?.base_price || 0)}
                                                    </td>
                                                    <td className="py-1.5 px-3 text-right">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="1000"
                                                            value={item.item_price_override ?? ''}
                                                            onChange={(e) => handlePriceOverrideChange(idx, e.target.value)}
                                                            placeholder="Ikuti dasar"
                                                            className="w-full text-right text-xs font-mono px-2 py-1 bg-white border border-zinc-200 rounded focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums placeholder:text-zinc-300"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-2 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveItem(idx)}
                                                            className="text-zinc-400 hover:text-red-600 p-1 transition-colors"
                                                            title="Hapus"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Calculation Summary Card */}
                    <div className="bg-zinc-50 p-3.5 rounded-md border border-zinc-200 space-y-2.5">
                        <div className="flex items-center justify-between text-sm text-zinc-700">
                            <span className="font-medium">Tarif Total:</span>
                            <span className="font-mono font-semibold tabular-nums text-zinc-900 text-base">
                                {formatCurrency(calculatedTotal)}
                            </span>
                        </div>

                        <div className="flex items-center justify-between text-sm text-zinc-700">
                            <span className="font-medium flex items-center gap-1.5">
                                <Calculator className="w-4 h-4 text-zinc-600" />
                                <span>Diskon (Rp):</span>
                            </span>
                            <div className="w-48">
                                <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={data.discount_amount}
                                    onChange={(e) => setData('discount_amount', parseFloat(e.target.value) || 0)}
                                    placeholder="0"
                                    className="w-full h-10 text-right text-sm font-mono px-3 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums text-rose-600 font-semibold"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm font-bold text-zinc-900 pt-2.5 border-t border-zinc-200">
                            <span>Tarif Akhir:</span>
                            <span className="font-mono text-base tabular-nums text-emerald-700">
                                {formatCurrency(calculatedFinal)}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        <input
                            type="checkbox"
                            id="pkg_is_active"
                            checked={data.is_active}
                            onChange={(e) => setData('is_active', e.target.checked)}
                            className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <label htmlFor="pkg_is_active" className="text-xs text-zinc-700 cursor-pointer select-none">
                            Aktif
                        </label>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="h-10 px-4 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-md transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="h-10 px-5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-md transition-colors shadow-xs"
                        >
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
