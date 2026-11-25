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
    TestTubes,
    FlaskConical,
    ScanLine,
    Activity,
    HeartPulse,
    CheckCircle2,
    XCircle,
} from 'lucide-react';
import type { PageProps, Pagination, Sample } from '@/types';

interface SamplesIndexProps extends PageProps {
    samples: Pagination<Sample>;
    filters: Record<string, any>;
}

export default function SamplesIndex({ samples, filters }: SamplesIndexProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSample, setEditingSample] = useState<Sample | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        code: '',
        name: '',
        category: 'lab' as 'lab' | 'radiology' | 'electromedical' | 'physical',
        sort_order: 0,
        is_active: true,
    });

    const openCreateModal = () => {
        setEditingSample(null);
        reset();
        clearErrors();
        setIsModalOpen(true);
    };

    const openEditModal = (sample: Sample) => {
        setEditingSample(sample);
        clearErrors();
        setData({
            code: sample.code,
            name: sample.name,
            category: sample.category,
            sort_order: sample.sort_order || 0,
            is_active: Boolean(sample.is_active),
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingSample) {
            put(route('samples.update', editingSample.id), {
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            post(route('samples.store'), {
                onSuccess: () => setIsModalOpen(false),
            });
        }
    };

    const handleToggleStatus = (sample: Sample) => {
        const action = sample.is_active ? 'menonaktifkan' : 'mengaktifkan';
        if (confirm(`Apakah Anda yakin ingin ${action} stasiun sampel "${sample.name}"?`)) {
            router.patch(route('samples.toggle-status', sample.id), {}, { preserveScroll: true });
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

        router.get(route('samples.index'), Object.fromEntries(currentParams), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const categoryBadges: Record<string, { label: string; icon: any; variant: 'info' | 'neutral' | 'warning' | 'success' }> = {
        lab: { label: 'Laboratorium', icon: FlaskConical, variant: 'info' },
        radiology: { label: 'Radiologi', icon: ScanLine, variant: 'neutral' },
        electromedical: { label: 'Elektromedis', icon: Activity, variant: 'warning' },
        physical: { label: 'Pemeriksaan Fisik', icon: HeartPulse, variant: 'success' },
    };

    const columns: ColumnDef<Sample>[] = [
        {
            header: 'No',
            accessorKey: 'id',
            isNumeric: true,
            width: '70px',
            align: 'center',
            cell: ({ index }) => {
                const currentNumber = ((samples.current_page - 1) * samples.per_page) + index + 1;
                return (
                    <span className="font-mono text-zinc-500 font-semibold tabular-nums text-xs">
                        {currentNumber}
                    </span>
                );
            },
        },
        {
            header: 'Nama Sampel',
            accessorKey: 'name',
            sortable: true,
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium text-zinc-900">{row.name}</span>
                    <span className="font-mono text-[11px] text-zinc-400 tabular-nums">
                        {row.code}
                    </span>
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
            width: '180px',
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-1.5">
                    <button
                        type="button"
                        onClick={() => openEditModal(row)}
                        className="inline-flex items-center gap-1 h-8 px-2.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-100 rounded-sm transition-colors cursor-pointer"
                        title="Ubah data sampel"
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
                        title={row.is_active ? 'Nonaktifkan sampel' : 'Aktifkan sampel'}
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
            <Head title="Sampel" />

            <div className="space-y-4">
                {/* Header Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-md border border-zinc-200">
                    <div>
                        <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
                            Sampel
                        </h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Category Filter Select */}
                        <select
                            value={filters.category || 'all'}
                            onChange={(e) => handleFilterChange('category', e.target.value)}
                            className="h-10 text-sm px-3 bg-white border border-zinc-200 rounded-md text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-medium"
                        >
                            <option value="all">Semua Kategori</option>
                            <option value="lab">Laboratorium</option>
                            <option value="radiology">Radiologi</option>
                            <option value="electromedical">Elektromedis</option>
                            <option value="physical">Pemeriksaan Fisik</option>
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
                <DataTable<Sample>
                    data={samples.data}
                    columns={columns}
                    pagination={samples}
                    searchPlaceholder="Cari spesimen atau stasiun..."
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
                title={editingSample ? 'Edit Stasiun Sampel' : 'Tambah Stasiun Sampel Baru'}
                description="Konfigurasi stasiun pengambilan spesimen dan pemeriksaan antrean."
                maxWidth="md"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">
                            Kode Stasiun / Spesimen <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value.toUpperCase())}
                            placeholder="Contoh: SMP-EDTA, SMP-RO, SMP-EKG"
                            className="w-full text-xs font-mono uppercase px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                        />
                        {errors.code && (
                            <p className="mt-1 text-[11px] text-red-600">{errors.code}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">
                            Nama Stasiun / Spesimen <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Contoh: Darah EDTA, Rontgen Thorax, Audiometri"
                            className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                        />
                        {errors.name && (
                            <p className="mt-1 text-[11px] text-red-600">{errors.name}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Kategori Modul <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={data.category}
                                onChange={(e) => setData('category', e.target.value as any)}
                                className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            >
                                <option value="lab">Laboratorium</option>
                                <option value="radiology">Radiologi</option>
                                <option value="electromedical">Elektromedis</option>
                                <option value="physical">Pemeriksaan Fisik</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Urutan Tampilan
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={data.sort_order}
                                onChange={(e) => setData('sort_order', parseInt(e.target.value, 10) || 0)}
                                placeholder="0"
                                className="w-full text-xs font-mono px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        <input
                            type="checkbox"
                            id="sample_is_active"
                            checked={data.is_active}
                            onChange={(e) => setData('is_active', e.target.checked)}
                            className="h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
                        />
                        <label htmlFor="sample_is_active" className="text-xs text-zinc-700 cursor-pointer select-none">
                            Stasiun Aktif & Muncul pada Modul Ambil Sampel
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
