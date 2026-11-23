import React, { useState, useRef } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DataTable, { ColumnDef } from '@/Components/DataTable';
import Badge from '@/Components/Badge';
import ActionDropdown, { ActionDropdownItem } from '@/Components/ActionDropdown';
import Modal from '@/Components/Modal';
import {
    Plus,
    Pencil,
    Power,
    UploadCloud,
    X,
    FileCheck,
    Contact2,
    CheckCircle2,
    XCircle,
} from 'lucide-react';
import type { PageProps, Pagination, Employee } from '@/types';

interface EmployeesIndexProps extends PageProps {
    employees: Pagination<Employee>;
    filters: Record<string, any>;
}

export default function EmployeesIndex({ employees, filters }: EmployeesIndexProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

    // Image previews
    const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
    const [stampPreview, setStampPreview] = useState<string | null>(null);
    const signatureInputRef = useRef<HTMLInputElement>(null);
    const stampInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        nik: '',
        nip: '',
        sip: '',
        name: '',
        job_title: '',
        phone: '',
        email: '',
        address: '',
        is_active: true,
        signature_file: null as File | null,
        stamp_file: null as File | null,
    });

    const openCreateModal = () => {
        setEditingEmployee(null);
        reset();
        clearErrors();
        setSignaturePreview(null);
        setStampPreview(null);
        setIsModalOpen(true);
    };

    const openEditModal = (employee: Employee) => {
        setEditingEmployee(employee);
        clearErrors();
        setData({
            nik: employee.nik || '',
            nip: employee.nip || '',
            sip: employee.sip || '',
            name: employee.name || '',
            job_title: employee.job_title || '',
            phone: employee.phone || '',
            email: employee.email || '',
            address: employee.address || '',
            is_active: Boolean(employee.is_active),
            signature_file: null,
            stamp_file: null,
        });
        setSignaturePreview(employee.signature_path ? `/storage/${employee.signature_path}` : null);
        setStampPreview(employee.stamp_path ? `/storage/${employee.stamp_path}` : null);
        setIsModalOpen(true);
    };

    const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('signature_file', file);
            setSignaturePreview(URL.createObjectURL(file));
        }
    };

    const handleStampChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('stamp_file', file);
            setStampPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingEmployee) {
            // Update via POST with multipart/form-data
            post(route('employees.update', editingEmployee.id), {
                forceFormData: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                },
            });
        } else {
            post(route('employees.store'), {
                forceFormData: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                },
            });
        }
    };

    const handleToggleStatus = (employee: Employee) => {
        router.patch(route('employees.toggle-status', employee.id), {}, {
            preserveScroll: true,
        });
    };

    const handleStatusFilterChange = (status: string) => {
        const currentParams = new URLSearchParams(window.location.search);
        if (status === 'all') {
            currentParams.delete('status');
        } else {
            currentParams.set('status', status);
        }
        currentParams.delete('page');

        router.get(route('employees.index'), Object.fromEntries(currentParams), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const columns: ColumnDef<Employee>[] = [
        {
            header: 'NIK',
            accessorKey: 'nik',
            isNumeric: true,
            sortable: true,
            width: '160px',
            cell: ({ value }) => (
                <span className="font-mono text-zinc-900 font-medium tabular-nums">{value}</span>
            ),
        },
        {
            header: 'Nama Pegawai',
            accessorKey: 'name',
            sortable: true,
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium text-zinc-900">{row.name}</span>
                    <span className="text-[11px] text-zinc-400">
                        {row.job_title || 'Staff Medis / Operasional'}
                    </span>
                </div>
            ),
        },
        {
            header: 'NIP / SIP',
            id: 'nip_sip',
            cell: ({ row }) => (
                <div className="flex flex-col text-[11px] tabular-nums text-zinc-600">
                    {row.sip && <span>SIP: {row.sip}</span>}
                    {row.nip && <span>NIP: {row.nip}</span>}
                    {!row.sip && !row.nip && <span className="text-zinc-400">—</span>}
                </div>
            ),
        },
        {
            header: 'Kontak',
            id: 'contact',
            cell: ({ row }) => (
                <div className="flex flex-col text-[11px] text-zinc-600">
                    {row.phone && <span className="tabular-nums">{row.phone}</span>}
                    {row.email && <span className="text-zinc-400 truncate max-w-[180px]">{row.email}</span>}
                    {!row.phone && !row.email && <span className="text-zinc-400">—</span>}
                </div>
            ),
        },
        {
            header: 'Tanda Tangan & Stempel',
            id: 'assets',
            align: 'center',
            width: '140px',
            cell: ({ row }) => (
                <div className="flex items-center justify-center gap-1.5">
                    {row.signature_path ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm" title="TTD Digital Tersedia">
                            <FileCheck className="w-3 h-3 text-emerald-600" />
                            <span>TTD</span>
                        </span>
                    ) : (
                        <span className="text-[10px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-sm">
                            No TTD
                        </span>
                    )}

                    {row.stamp_path ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded-sm" title="Stempel Digital Tersedia">
                            <FileCheck className="w-3 h-3 text-sky-600" />
                            <span>Stempel</span>
                        </span>
                    ) : null}
                </div>
            ),
        },
        {
            header: 'Status',
            accessorKey: 'is_active',
            sortable: true,
            width: '100px',
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
                        label: 'Ubah Data',
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
        <AuthenticatedLayout title="Master Pegawai">
            <Head title="Master Pegawai — Master Summit" />

            <div className="space-y-4">
                {/* Header Title & Primary Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-200/70">
                    <div>
                        <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
                            Master Data Pegawai
                        </h2>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Data dokter penanggung jawab, analis laboratorium, radiografer, perawat, dan tanda tangan digital.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-sm shadow-2xs transition-colors cursor-pointer shrink-0"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Pegawai</span>
                    </button>
                </div>

                {/* Filter Slot component */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 font-medium">Status:</span>
                    <div className="inline-flex bg-zinc-100 p-0.5 rounded-sm text-xs">
                        {['all', 'active', 'inactive'].map((st) => (
                            <button
                                key={st}
                                type="button"
                                onClick={() => handleStatusFilterChange(st)}
                                className={`px-2.5 py-1 rounded-sm text-xs transition-colors ${
                                    (filters.status || 'all') === st
                                        ? 'bg-white text-zinc-900 font-medium shadow-2xs'
                                        : 'text-zinc-600 hover:text-zinc-900'
                                }`}
                            >
                                {st === 'all' ? 'Semua' : st === 'active' ? 'Aktif' : 'Non-Aktif'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Table */}
                <DataTable
                    data={employees}
                    columns={columns}
                    filters={filters}
                    searchPlaceholder="Cari NIK, nama pegawai, jabatan, SIP..."
                    routeName="employees.index"
                />
            </div>

            {/* Modal Tambah / Ubah Pegawai */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingEmployee ? 'Ubah Data Pegawai' : 'Tambah Pegawai Baru'}
                subtitle="Isi data kepegawaian dan unggah berkas PNG tanda tangan / stempel digital"
                maxWidth="xl"
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
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* NIK */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                NIK (Nomor Induk Kependudukan) <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.nik}
                                onChange={(e) => setData('nik', e.target.value)}
                                placeholder="3201xxxxxxxxxxxx"
                                required
                                className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-zinc-50 border border-zinc-200/90 rounded-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors"
                            />
                            {errors.nik && <p className="mt-1 text-[11px] text-rose-600">{errors.nik}</p>}
                        </div>

                        {/* Nama */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="dr. Budi Santoso, Sp.PK"
                                required
                                className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200/90 rounded-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors"
                            />
                            {errors.name && <p className="mt-1 text-[11px] text-rose-600">{errors.name}</p>}
                        </div>

                        {/* Jabatan */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Jabatan / Peran
                            </label>
                            <input
                                type="text"
                                value={data.job_title}
                                onChange={(e) => setData('job_title', e.target.value)}
                                placeholder="Dokter Penanggung Jawab Lab / Analis"
                                className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200/90 rounded-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors"
                            />
                            {errors.job_title && <p className="mt-1 text-[11px] text-rose-600">{errors.job_title}</p>}
                        </div>

                        {/* Telepon */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                No. Telepon / WhatsApp
                            </label>
                            <input
                                type="text"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                placeholder="081234567890"
                                className="w-full px-3 py-1.5 text-xs tabular-nums bg-zinc-50 border border-zinc-200/90 rounded-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors"
                            />
                            {errors.phone && <p className="mt-1 text-[11px] text-rose-600">{errors.phone}</p>}
                        </div>

                        {/* NIP */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                NIP (Nomor Induk Pegawai)
                            </label>
                            <input
                                type="text"
                                value={data.nip}
                                onChange={(e) => setData('nip', e.target.value)}
                                placeholder="NIP-102938"
                                className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-zinc-50 border border-zinc-200/90 rounded-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors"
                            />
                            {errors.nip && <p className="mt-1 text-[11px] text-rose-600">{errors.nip}</p>}
                        </div>

                        {/* SIP */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                SIP (Surat Izin Praktik)
                            </label>
                            <input
                                type="text"
                                value={data.sip}
                                onChange={(e) => setData('sip', e.target.value)}
                                placeholder="446.1/123/SIP-D/2026"
                                className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-zinc-50 border border-zinc-200/90 rounded-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors"
                            />
                            {errors.sip && <p className="mt-1 text-[11px] text-rose-600">{errors.sip}</p>}
                        </div>

                        {/* Email */}
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="dokter@mastersummit.co.id"
                                className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200/90 rounded-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors"
                            />
                            {errors.email && <p className="mt-1 text-[11px] text-rose-600">{errors.email}</p>}
                        </div>

                        {/* Alamat */}
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Alamat Domisili
                            </label>
                            <textarea
                                rows={2}
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                placeholder="Alamat lengkap tempat tinggal"
                                className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200/90 rounded-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors resize-none"
                            />
                            {errors.address && <p className="mt-1 text-[11px] text-rose-600">{errors.address}</p>}
                        </div>
                    </div>

                    {/* Digital Signature & Stamp Upload Box */}
                    <div className="pt-2 border-t border-zinc-100">
                        <div className="text-xs font-semibold text-zinc-800 mb-2">
                            Aset Berkas Cetak (Tanda Tangan & Stempel)
                        </div>
                        <p className="text-[11px] text-zinc-500 mb-3">
                            Format berkas PNG transparan resolusi tinggi (maks. 2MB). Berkas akan otomatis dicetak pada hasil lab dan lembar resume dokter MCU.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Signature Upload */}
                            <div className="p-3 bg-zinc-50/70 border border-zinc-200/80 rounded-sm flex flex-col items-center justify-center text-center">
                                <span className="text-xs font-medium text-zinc-700 mb-1">Tanda Tangan (PNG)</span>
                                {signaturePreview ? (
                                    <div className="relative my-2 p-2 bg-white border border-zinc-200 rounded-sm">
                                        <img
                                            src={signaturePreview}
                                            alt="Preview TTD"
                                            className="h-16 max-w-full object-contain"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSignaturePreview(null);
                                                setData('signature_file', null);
                                                if (signatureInputRef.current) signatureInputRef.current.value = '';
                                            }}
                                            className="absolute -top-1.5 -right-1.5 p-0.5 bg-zinc-900 text-white rounded-full hover:bg-rose-600 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="my-2 flex flex-col items-center text-zinc-400">
                                        <UploadCloud className="w-6 h-6 mb-1 text-zinc-300" />
                                        <span className="text-[10px]">Belum ada tanda tangan</span>
                                    </div>
                                )}
                                <input
                                    ref={signatureInputRef}
                                    type="file"
                                    accept="image/png,image/webp"
                                    onChange={handleSignatureChange}
                                    className="hidden"
                                    id="signature_file"
                                />
                                <label
                                    htmlFor="signature_file"
                                    className="cursor-pointer text-[11px] font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-100 px-2.5 py-1 rounded-sm transition-colors mt-1"
                                >
                                    Pilih Berkas TTD
                                </label>
                                {errors.signature_file && (
                                    <p className="mt-1 text-[10px] text-rose-600">{errors.signature_file}</p>
                                )}
                            </div>

                            {/* Stamp Upload */}
                            <div className="p-3 bg-zinc-50/70 border border-zinc-200/80 rounded-sm flex flex-col items-center justify-center text-center">
                                <span className="text-xs font-medium text-zinc-700 mb-1">Stempel Stasiun (PNG)</span>
                                {stampPreview ? (
                                    <div className="relative my-2 p-2 bg-white border border-zinc-200 rounded-sm">
                                        <img
                                            src={stampPreview}
                                            alt="Preview Stempel"
                                            className="h-16 max-w-full object-contain"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setStampPreview(null);
                                                setData('stamp_file', null);
                                                if (stampInputRef.current) stampInputRef.current.value = '';
                                            }}
                                            className="absolute -top-1.5 -right-1.5 p-0.5 bg-zinc-900 text-white rounded-full hover:bg-rose-600 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="my-2 flex flex-col items-center text-zinc-400">
                                        <UploadCloud className="w-6 h-6 mb-1 text-zinc-300" />
                                        <span className="text-[10px]">Belum ada stempel</span>
                                    </div>
                                )}
                                <input
                                    ref={stampInputRef}
                                    type="file"
                                    accept="image/png,image/webp"
                                    onChange={handleStampChange}
                                    className="hidden"
                                    id="stamp_file"
                                />
                                <label
                                    htmlFor="stamp_file"
                                    className="cursor-pointer text-[11px] font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-100 px-2.5 py-1 rounded-sm transition-colors mt-1"
                                >
                                    Pilih Berkas Stempel
                                </label>
                                {errors.stamp_file && (
                                    <p className="mt-1 text-[10px] text-rose-600">{errors.stamp_file}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Status Aktif Toggle */}
                    <div className="pt-2 flex items-center justify-between border-t border-zinc-100 text-xs">
                        <div>
                            <span className="font-medium text-zinc-800 block">Status Pegawai</span>
                            <span className="text-[11px] text-zinc-400">
                                Pegawai non-aktif tidak dapat dipilih saat pembuatan jadwal dokter atau PIC MCU.
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
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
