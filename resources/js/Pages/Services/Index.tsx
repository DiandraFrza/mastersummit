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
    Layers,
    FlaskConical,
    ScanLine,
    Activity,
    HeartPulse,
    CheckCircle2,
    XCircle,
    FileText,
    SlidersHorizontal,
} from 'lucide-react';
import type { PageProps, Pagination, Service, Sample } from '@/types';

interface ServicesIndexProps extends PageProps {
    services: Pagination<Service>;
    samples: Sample[];
    filters: Record<string, any>;
}

export default function ServicesIndex({
    services,
    samples,
    filters,
}: ServicesIndexProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        code: '',
        name: '',
        category: 'lab' as 'lab' | 'radiology' | 'electromedical' | 'physical',
        sub_group: '',
        sample_id: samples[0]?.id || '',
        base_price: 0,
        print_template: 'standard_lab' as 'standard_lab' | 'antigen' | 'pcr' | 'narkoba' | 'radiology' | 'electromedical' | 'physical',
        is_active: true,
    });

    const openCreateModal = () => {
        setEditingService(null);
        reset();
        clearErrors();
        const activeCategory = ['lab', 'radiology', 'electromedical', 'physical'].includes(filters.category)
            ? filters.category
            : 'lab';
        setData({
            code: '',
            name: '',
            category: activeCategory as any,
            sub_group: '',
            sample_id: samples[0]?.id || '',
            base_price: 0,
            print_template: activeCategory === 'lab' ? 'standard_lab' : (activeCategory === 'radiology' ? 'radiology' : (activeCategory === 'electromedical' ? 'electromedical' : 'physical')),
            is_active: true,
        });
        setIsModalOpen(true);
    };

    const openEditModal = (service: Service) => {
        setEditingService(service);
        clearErrors();
        setData({
            code: service.code,
            name: service.name,
            category: service.category,
            sub_group: service.sub_group || '',
            sample_id: service.sample_id,
            base_price: Number(service.base_price) || 0,
            print_template: service.print_template,
            is_active: Boolean(service.is_active),
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingService) {
            put(route('services.update', editingService.id), {
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            post(route('services.store'), {
                onSuccess: () => setIsModalOpen(false),
            });
        }
    };

    const handleToggleStatus = (service: Service) => {
        const action = service.is_active ? 'menonaktifkan' : 'mengaktifkan';
        if (confirm(`Apakah Anda yakin ingin ${action} pemeriksaan "${service.name}"?`)) {
            router.patch(route('services.toggle-status', service.id), {}, { preserveScroll: true });
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

        router.get(route('services.index'), Object.fromEntries(currentParams), {
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

    const printTemplateLabels: Record<string, string> = {
        standard_lab: 'Lab Standard (Kop & Nilai Rujukan)',
        antigen: 'Sertifikat Rapid / Swab Antigen',
        pcr: 'Sertifikat Hasil Real-Time PCR',
        narkoba: 'Surat Bebas Narkoba (Multi-Param)',
        radiology: 'Expertise Radiologi (Kesan + Ekspertis)',
        electromedical: 'Hasil Elektromedis (Grafik/EKG)',
        physical: 'Resume Fisik & Kesimpulan Dokter',
    };

    const formatCurrency = (amount: number | string) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(Number(amount) || 0);
    };

    const columns: ColumnDef<Service>[] = [
        {
            header: 'Nama Layanan',
            accessorKey: 'name',
            sortable: true,
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-zinc-900">{row.name}</span>
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
                        <span>{row.code}</span>
                        {row.sub_group && <span>• {row.sub_group}</span>}
                    </div>
                </div>
            ),
        },
        {
            header: 'Sampel',
            id: 'sample',
            cell: ({ row }) => (
                <span className="text-xs text-zinc-700 font-medium">
                    {row.sample?.name || <span className="text-zinc-400">—</span>}
                </span>
            ),
        },
        {
            header: 'Tarif',
            accessorKey: 'base_price',
            sortable: true,
            align: 'right',
            width: '130px',
            cell: ({ value }) => (
                <span className="font-mono text-xs font-semibold text-zinc-900 tabular-nums">
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
            header: 'User Update',
            id: 'user_update',
            width: '140px',
            cell: ({ row }: { row: any }) => (
                <span className="text-xs text-zinc-700 font-medium">
                    {row.updater?.name || '—'}
                </span>
            ),
        },
        {
            header: 'Waktu Update',
            accessorKey: 'updated_at',
            isNumeric: true,
            sortable: true,
            width: '160px',
            cell: ({ value }) => {
                if (!value) return <span className="text-zinc-400">—</span>;
                const date = new Date(value);
                return (
                    <span className="text-xs text-zinc-600 tabular-nums">
                        {date.toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                        })}{' '}
                        {date.toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </span>
                );
            },
        },
        {
            header: 'Aksi',
            id: 'actions',
            align: 'right',
            width: '260px',
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-1.5">
                    {/* Tombol Parameter */}
                    <button
                        type="button"
                        onClick={() => router.visit(route('services.parameters.index', row.id))}
                        className="inline-flex items-center gap-1 h-8 px-2.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-sm transition-colors cursor-pointer"
                        title="Kelola parameter, nilai rujukan, dan aturan kesimpulan"
                    >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Parameter</span>
                    </button>

                    {/* Tombol Ubah */}
                    <button
                        type="button"
                        onClick={() => openEditModal(row)}
                        className="inline-flex items-center gap-1 h-8 px-2.5 text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-sm transition-colors cursor-pointer"
                        title="Ubah nama layanan, sampel, tarif"
                    >
                        <Pencil className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Ubah</span>
                    </button>

                    {/* Tombol Nonaktifkan / Aktifkan */}
                    <button
                        type="button"
                        onClick={() => handleToggleStatus(row)}
                        className={`inline-flex items-center gap-1 h-8 px-2.5 text-xs font-semibold rounded-sm transition-colors cursor-pointer ${
                            row.is_active
                                ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80'
                                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80'
                        }`}
                        title={row.is_active ? 'Nonaktifkan layanan' : 'Aktifkan layanan'}
                    >
                        <Power className="w-3.5 h-3.5" />
                        <span>{row.is_active ? 'Nonaktif' : 'Aktifkan'}</span>
                    </button>
                </div>
            ),
        },
    ];

    const getPageTitle = () => {
        switch (filters.category) {
            case 'lab':
                return 'Laboratorium';
            case 'radiology':
                return 'Radiologi';
            case 'electromedical':
                return 'Elektromedis';
            case 'physical':
                return 'Pemeriksaan Fisik';
            default:
                return 'Pemeriksaan';
        }
    };

    return (
        <>
            <Head title={getPageTitle()} />

            <div className="space-y-4">
                {/* Header Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-md border border-zinc-200">
                    <div>
                        <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
                            {getPageTitle()}
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
                <DataTable<Service>
                    data={services.data}
                    columns={columns}
                    pagination={services}
                    searchPlaceholder="Cari kode, nama pemeriksaan, sub-grup..."
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
                title={editingService ? 'Ubah Layanan' : 'Tambah Layanan'}
                maxWidth="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Kode Pemeriksaan <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                placeholder="Contoh: LAB-HEMA, RAD-THORAX"
                                className="w-full text-xs font-mono uppercase px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            />
                            {errors.code && (
                                <p className="mt-1 text-[11px] text-red-600">{errors.code}</p>
                            )}
                        </div>

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

                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Nama Pemeriksaan <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Contoh: Hematologi Lengkap (CBC + Diff)"
                                className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            />
                            {errors.name && (
                                <p className="mt-1 text-[11px] text-red-600">{errors.name}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Sub Grup / Bidang Pemeriksaan
                            </label>
                            <input
                                type="text"
                                value={data.sub_group}
                                onChange={(e) => setData('sub_group', e.target.value)}
                                placeholder="Contoh: Kimia Darah, Profil Lipid, Foto Polos"
                                className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Stasiun Sampel & Spesimen <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={data.sample_id}
                                onChange={(e) => setData('sample_id', Number(e.target.value))}
                                className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            >
                                {samples.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} ({s.code}) — {s.category}
                                    </option>
                                ))}
                            </select>
                            {errors.sample_id && (
                                <p className="mt-1 text-[11px] text-red-600">{errors.sample_id}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Tarif Dasar Standar (Rp) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-xs font-mono text-zinc-500">Rp</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={data.base_price}
                                    onChange={(e) => setData('base_price', parseFloat(e.target.value) || 0)}
                                    placeholder="0"
                                    className="w-full text-xs font-mono pl-9 pr-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 tabular-nums"
                                />
                            </div>
                            {errors.base_price && (
                                <p className="mt-1 text-[11px] text-red-600">{errors.base_price}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Format Template Cetak <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={data.print_template}
                                onChange={(e) => setData('print_template', e.target.value as any)}
                                className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            >
                                {Object.entries(printTemplateLabels).map(([val, label]) => (
                                    <option key={val} value={val}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        <input
                            type="checkbox"
                            id="service_is_active"
                            checked={data.is_active}
                            onChange={(e) => setData('is_active', e.target.checked)}
                            className="h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
                        />
                        <label htmlFor="service_is_active" className="text-xs text-zinc-700 cursor-pointer select-none">
                            Layanan Aktif & Dapat Dipilih pada Pendaftaran Pasien / Paket MCU
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
