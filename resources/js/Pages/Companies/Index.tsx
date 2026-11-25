import React, { useState, useRef } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import DataTable, { ColumnDef } from '@/Components/DataTable';
import Badge from '@/Components/Badge';
import ActionDropdown, { ActionDropdownItem } from '@/Components/ActionDropdown';
import Modal from '@/Components/Modal';
import { Plus, Pencil, Power, Briefcase, CheckCircle2, XCircle, UploadCloud, X } from 'lucide-react';
import type { PageProps, Pagination, Company } from '@/types';

interface CompaniesIndexProps extends PageProps {
    companies: Pagination<Company>;
    filters: Record<string, any>;
}

export default function CompaniesIndex({ companies, filters }: CompaniesIndexProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: '',
        branch_code: '',
        address: '',
        city: '',
        phone: '',
        email: '',
        website: '',
        director_name: '',
        is_active: true,
        logo_file: null as File | null,
    });

    const openCreateModal = () => {
        setEditingCompany(null);
        reset();
        clearErrors();
        setLogoPreview(null);
        setIsModalOpen(true);
    };

    const openEditModal = (company: Company) => {
        setEditingCompany(company);
        clearErrors();
        setData({
            name: company.name,
            branch_code: company.branch_code || '',
            address: company.address || '',
            city: company.city || '',
            phone: company.phone || '',
            email: company.email || '',
            website: company.website || '',
            director_name: company.director_name || '',
            is_active: Boolean(company.is_active),
            logo_file: null,
        });
        setLogoPreview(company.logo_path ? `/storage/${company.logo_path}` : null);
        setIsModalOpen(true);
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('logo_file', file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const removeLogo = () => {
        setData('logo_file', null);
        setLogoPreview(null);
        if (logoInputRef.current) {
            logoInputRef.current.value = '';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingCompany) {
            // Use POST with _method spoofing if needed, or controller accepts direct POST to update
            post(route('companies.update', editingCompany.id), {
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            post(route('companies.store'), {
                onSuccess: () => setIsModalOpen(false),
            });
        }
    };

    const handleToggleStatus = (company: Company) => {
        const action = company.is_active ? 'menonaktifkan' : 'mengaktifkan';
        if (confirm(`Apakah Anda yakin ingin ${action} perusahaan "${company.name}"?`)) {
            router.patch(route('companies.toggle-status', company.id), {}, { preserveScroll: true });
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

        router.get(route('companies.index'), Object.fromEntries(currentParams), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const columns: ColumnDef<Company>[] = [
        {
            header: 'Perusahaan',
            accessorKey: 'name',
            sortable: true,
            cell: ({ row }) => (
                <div className="flex items-center gap-2.5">
                    {row.logo_path ? (
                        <img
                            src={`/storage/${row.logo_path}`}
                            alt={row.name}
                            className="w-8 h-8 rounded-sm object-contain border border-zinc-200 bg-white p-0.5 shrink-0"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-sm bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-zinc-400 shrink-0">
                            <Briefcase className="w-4 h-4 text-zinc-400" />
                        </div>
                    )}
                    <div className="flex flex-col min-w-0">
                        <span className="font-medium text-zinc-900 truncate">{row.name}</span>
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                            {row.branch_code && (
                                <span className="font-mono bg-zinc-100 px-1 rounded text-zinc-600 tabular-nums">
                                    {row.branch_code}
                                </span>
                            )}
                            {row.city && <span>{row.city}</span>}
                        </div>
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
                    {row.email && <span className="text-zinc-400 truncate max-w-[160px]">{row.email}</span>}
                    {row.director_name && (
                        <span className="text-zinc-500 font-medium truncate">P: {row.director_name}</span>
                    )}
                    {!row.phone && !row.email && !row.director_name && <span className="text-zinc-400">—</span>}
                </div>
            ),
        },
        {
            header: 'Perujuk Terkait',
            accessorKey: 'referrers_count',
            align: 'center',
            width: '120px',
            cell: ({ value }) => (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-zinc-100 text-zinc-700 tabular-nums">
                    {value || 0} Perujuk
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
                        label: 'Edit Perusahaan',
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
            <Head title="Master Perusahaan" />

            <div className="space-y-4">
                {/* Header Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-md border border-zinc-200">
                    <div>
                        <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
                            Master Perusahaan
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
                <DataTable<Company>
                    data={companies.data}
                    columns={columns}
                    pagination={companies}
                    searchPlaceholder="Cari nama, kode cabang, kota, telepon, email, direktur..."
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
                title={editingCompany ? 'Edit Perusahaan' : 'Tambah Perusahaan Baru'}
                description="Profil institusi korporasi dan entitas penagihan MCU."
                maxWidth="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Nama Perusahaan <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Contoh: PT Sumber Petro Energi Tbk"
                                className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            />
                            {errors.name && (
                                <p className="mt-1 text-[11px] text-red-600">{errors.name}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Kode Cabang / Entitas
                            </label>
                            <input
                                type="text"
                                value={data.branch_code}
                                onChange={(e) => setData('branch_code', e.target.value.toUpperCase())}
                                placeholder="Contoh: CORP-001, HQ-JKT"
                                className="w-full text-xs font-mono uppercase px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            />
                            {errors.branch_code && (
                                <p className="mt-1 text-[11px] text-red-600">{errors.branch_code}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Kota Lokasi
                            </label>
                            <input
                                type="text"
                                value={data.city}
                                onChange={(e) => setData('city', e.target.value)}
                                placeholder="Contoh: Jakarta Pusat, Cikarang"
                                className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            />
                            {errors.city && (
                                <p className="mt-1 text-[11px] text-red-600">{errors.city}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                No. Telepon / Fax
                            </label>
                            <input
                                type="text"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                placeholder="Contoh: 021-5259988"
                                className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            />
                            {errors.phone && (
                                <p className="mt-1 text-[11px] text-red-600">{errors.phone}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Email Perusahaan / HRD
                            </label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="hrd@perusahaan.co.id"
                                className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            />
                            {errors.email && (
                                <p className="mt-1 text-[11px] text-red-600">{errors.email}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Website
                            </label>
                            <input
                                type="text"
                                value={data.website}
                                onChange={(e) => setData('website', e.target.value)}
                                placeholder="https://perusahaan.co.id"
                                className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Nama Direktur / Penanggung Jawab
                            </label>
                            <input
                                type="text"
                                value={data.director_name}
                                onChange={(e) => setData('director_name', e.target.value)}
                                placeholder="Nama pimpinan atau PIC utama"
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
                                placeholder="Alamat jalan, gedung, kawasan industri..."
                                className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>

                        {/* Upload Logo Perusahaan */}
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Logo Perusahaan (Opsional)
                            </label>
                            <div className="flex items-center gap-3">
                                {logoPreview ? (
                                    <div className="relative w-16 h-16 rounded border border-zinc-200 bg-white p-1 flex items-center justify-center">
                                        <img
                                            src={logoPreview}
                                            alt="Preview"
                                            className="max-h-full max-w-full object-contain"
                                        />
                                        <button
                                            type="button"
                                            onClick={removeLogo}
                                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 shadow-xs"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => logoInputRef.current?.click()}
                                        className="h-16 px-4 border border-dashed border-zinc-300 rounded-md hover:bg-zinc-50 flex flex-col items-center justify-center text-zinc-500 text-xs gap-1"
                                    >
                                        <UploadCloud className="w-4 h-4 text-zinc-400" />
                                        <span>Pilih Berkas Logo</span>
                                    </button>
                                )}
                                <input
                                    ref={logoInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    onChange={handleLogoChange}
                                    className="hidden"
                                />
                                <span className="text-[11px] text-zinc-400">
                                    PNG, JPG atau WEBP maks 2MB. Tampil pada laporan penagihan & buku MCU.
                                </span>
                            </div>
                            {errors.logo_file && (
                                <p className="mt-1 text-[11px] text-red-600">{errors.logo_file}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        <input
                            type="checkbox"
                            id="company_is_active"
                            checked={data.is_active}
                            onChange={(e) => setData('is_active', e.target.checked)}
                            className="h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
                        />
                        <label htmlFor="company_is_active" className="text-xs text-zinc-700 cursor-pointer select-none">
                            Perusahaan Aktif & Dapat Digunakan pada Pendaftaran MCU
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
