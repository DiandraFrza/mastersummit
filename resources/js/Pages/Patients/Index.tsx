import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import DataTable, { ColumnDef } from '@/Components/DataTable';
import Badge from '@/Components/Badge';
import ActionDropdown, { ActionDropdownItem } from '@/Components/ActionDropdown';
import Modal from '@/Components/Modal';
import {
    Plus,
    Pencil,
    Trash2,
    Download,
    Users,
    User,
    Calendar,
    Phone,
    Mail,
    Building2,
    MapPin,
    Camera,
} from 'lucide-react';
import type { PageProps, Pagination, Patient, Company, PatientGender } from '@/types';

interface PatientsIndexProps extends PageProps {
    patients: Pagination<Patient>;
    companies: Company[];
    filters: Record<string, any>;
    nextNrm: string;
}

export default function PatientsIndex({
    patients,
    companies,
    filters,
    nextNrm,
}: PatientsIndexProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        medical_record_no: '',
        nik: '',
        name: '',
        gender: 'L' as PatientGender,
        birth_date: '',
        phone: '',
        email: '',
        address: '',
        default_company_id: '' as string | number,
        default_department: '',
        photo: null as File | null,
        _method: 'POST',
    });

    const openCreateModal = () => {
        setEditingPatient(null);
        reset();
        setData({
            medical_record_no: nextNrm,
            nik: '',
            name: '',
            gender: 'L',
            birth_date: '',
            phone: '',
            email: '',
            address: '',
            default_company_id: '',
            default_department: '',
            photo: null,
            _method: 'POST',
        });
        clearErrors();
        setIsModalOpen(true);
    };

    const openEditModal = (patient: Patient) => {
        setEditingPatient(patient);
        setData({
            medical_record_no: patient.medical_record_no,
            nik: patient.nik || '',
            name: patient.name,
            gender: patient.gender,
            birth_date: patient.birth_date ? patient.birth_date.substring(0, 10) : '',
            phone: patient.phone || '',
            email: patient.email || '',
            address: patient.address || '',
            default_company_id: patient.default_company_id || '',
            default_department: patient.default_department || '',
            photo: null,
            _method: 'PUT',
        });
        clearErrors();
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingPatient) {
            post(route('patients.update', editingPatient.id), {
                forceFormData: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        } else {
            post(route('patients.store'), {
                forceFormData: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        }
    };

    const handleDelete = (patient: Patient) => {
        if (confirm(`Apakah Anda yakin ingin menghapus data pasien "${patient.name}" (${patient.medical_record_no})?`)) {
            router.delete(route('patients.destroy', patient.id), {
                preserveScroll: true,
            });
        }
    };

    const handleExport = () => {
        const params = new URLSearchParams(window.location.search);
        window.location.href = route('patients.export') + '?' + params.toString();
    };

    const columns: ColumnDef<Patient>[] = [
        {
            header: 'No. Rekam Medis (NRM)',
            accessorKey: 'medical_record_no',
            isNumeric: true,
            sortable: true,
            width: '160px',
            cell: ({ value }) => (
                <span className="font-mono text-zinc-900 font-semibold tabular-nums text-xs">
                    {value}
                </span>
            ),
        },
        {
            header: 'Nama Pasien & NIK',
            accessorKey: 'name',
            sortable: true,
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium text-zinc-900">{row.name}</span>
                    <span className="text-[11px] font-mono text-zinc-400 tabular-nums">
                        {row.nik ? `NIK: ${row.nik}` : 'NIK: —'}
                    </span>
                </div>
            ),
        },
        {
            header: 'Gender',
            accessorKey: 'gender',
            width: '110px',
            cell: ({ value }) => (
                <Badge variant={value === 'L' ? 'info' : 'warning'}>
                    {value === 'L' ? 'Laki-laki' : 'Perempuan'}
                </Badge>
            ),
        },
        {
            header: 'Tanggal Lahir & Usia',
            accessorKey: 'birth_date',
            sortable: true,
            width: '170px',
            cell: ({ row }) => (
                <div className="flex flex-col text-xs">
                    <span className="text-zinc-800 font-mono tabular-nums">
                        {row.birth_date ? row.birth_date.substring(0, 10) : '—'}
                    </span>
                    <span className="text-[11px] text-zinc-400">
                        {row.age !== undefined && row.age !== null ? `${row.age} tahun` : '—'}
                    </span>
                </div>
            ),
        },
        {
            header: 'Kontak',
            id: 'contact',
            cell: ({ row }) => (
                <div className="flex flex-col text-xs">
                    <span className="text-zinc-800 font-mono tabular-nums">
                        {row.phone || '—'}
                    </span>
                    {row.email && (
                        <span className="text-[11px] text-zinc-400 truncate max-w-[150px]">
                            {row.email}
                        </span>
                    )}
                </div>
            ),
        },
        {
            header: 'Perusahaan & Divisi',
            id: 'company',
            cell: ({ row }) => (
                <div className="flex flex-col text-xs">
                    <span className="font-medium text-zinc-800">
                        {row.default_company?.name || <span className="text-zinc-400">Pasien Umum / APS</span>}
                    </span>
                    {row.default_department && (
                        <span className="text-[11px] text-zinc-400">
                            {row.default_department}
                        </span>
                    )}
                </div>
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
                        label: 'Edit Pasien',
                        icon: Pencil,
                        onClick: () => openEditModal(row),
                    },
                    {
                        label: 'Hapus Pasien',
                        icon: Trash2,
                        variant: 'danger',
                        onClick: () => handleDelete(row),
                    },
                ];

                return <ActionDropdown items={items} align="right" />;
            },
        },
    ];

    return (
        <>
            <Head title="Master Pasien" />

            <div className="space-y-4">
                {/* Header Page */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-zinc-200">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-zinc-900">
                            Master Pasien
                        </h1>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={handleExport}
                            className="inline-flex items-center justify-center gap-2 h-10 px-4 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors shadow-xs"
                        >
                            <Download className="w-4 h-4" />
                            <span>Ekspor CSV</span>
                        </button>
                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="inline-flex items-center justify-center gap-2 h-10 px-4 text-sm font-semibold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors shadow-xs"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Tambah Data</span>
                        </button>
                    </div>
                </div>

                {/* Filter bar */}
                <div className="bg-white p-3 rounded-lg border border-zinc-200/80 shadow-xs flex flex-wrap items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500 font-medium">Gender:</span>
                        <select
                            value={filters.gender || 'all'}
                            onChange={(e) => {
                                router.get(
                                    route('patients.index'),
                                    { ...filters, gender: e.target.value, page: 1 },
                                    { preserveState: true, preserveScroll: true }
                                );
                            }}
                            className="px-2.5 py-1 text-xs rounded-md border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                        >
                            <option value="all">Semua Gender</option>
                            <option value="L">Laki-laki</option>
                            <option value="P">Perempuan</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500 font-medium">Perusahaan:</span>
                        <select
                            value={filters.company_id || 'all'}
                            onChange={(e) => {
                                router.get(
                                    route('patients.index'),
                                    { ...filters, company_id: e.target.value, page: 1 },
                                    { preserveState: true, preserveScroll: true }
                                );
                            }}
                            className="px-2.5 py-1 text-xs rounded-md border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                        >
                            <option value="all">Semua Perusahaan</option>
                            {companies.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table */}
                <DataTable<Patient>
                    columns={columns}
                    data={patients.data}
                    pagination={patients}
                    searchPlaceholder="Cari NRM, NIK, nama pasien, HP..."
                    routeParams={filters}
                />
            </div>

            {/* Modal: Create & Edit Patient */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingPatient ? 'Edit Data Pasien' : 'Registrasi Pasien Baru'}
                subtitle={editingPatient ? `NRM: ${editingPatient.medical_record_no}` : 'Buat master data pasien baru'}
                maxWidth="2xl"
                footer={
                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-3 py-1.5 text-xs font-medium text-zinc-600 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            form="patient-form"
                            disabled={processing}
                            className="px-4 py-1.5 text-xs font-semibold text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-colors shadow-xs disabled:opacity-50"
                        >
                            {processing ? 'Menyimpan...' : 'Simpan Pasien'}
                        </button>
                    </div>
                }
            >
                <form id="patient-form" onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                No. Rekam Medis (NRM) <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.medical_record_no}
                                onChange={(e) => setData('medical_record_no', e.target.value)}
                                placeholder="Auto-generate jika kosong"
                                className="w-full px-3 py-1.5 text-xs font-mono rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums"
                            />
                            {errors.medical_record_no && (
                                <p className="mt-1 text-[11px] text-rose-500">{errors.medical_record_no}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                NIK (Nomor Induk Kependudukan)
                            </label>
                            <input
                                type="text"
                                maxLength={20}
                                value={data.nik}
                                onChange={(e) => setData('nik', e.target.value)}
                                placeholder="16 digit NIK KTP"
                                className="w-full px-3 py-1.5 text-xs font-mono rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums"
                            />
                            {errors.nik && (
                                <p className="mt-1 text-[11px] text-rose-500">{errors.nik}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Nama Lengkap Pasien <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Nama lengkap sesuai KTP"
                                className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                                required
                            />
                            {errors.name && (
                                <p className="mt-1 text-[11px] text-rose-500">{errors.name}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Jenis Kelamin <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={data.gender}
                                onChange={(e) => setData('gender', e.target.value as PatientGender)}
                                className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            >
                                <option value="L">Laki-laki (L)</option>
                                <option value="P">Perempuan (P)</option>
                            </select>
                            {errors.gender && (
                                <p className="mt-1 text-[11px] text-rose-500">{errors.gender}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Tanggal Lahir <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={data.birth_date}
                                onChange={(e) => setData('birth_date', e.target.value)}
                                className="w-full px-3 py-1.5 text-xs font-mono rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                                required
                            />
                            {errors.birth_date && (
                                <p className="mt-1 text-[11px] text-rose-500">{errors.birth_date}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                No. Telepon / WhatsApp
                            </label>
                            <input
                                type="text"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                placeholder="08xxxxxxxxxx"
                                className="w-full px-3 py-1.5 text-xs font-mono rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums"
                            />
                            {errors.phone && (
                                <p className="mt-1 text-[11px] text-rose-500">{errors.phone}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Alamat Email
                            </label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="pasien@email.com"
                                className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            />
                            {errors.email && (
                                <p className="mt-1 text-[11px] text-rose-500">{errors.email}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Perusahaan / Klien Korporat
                            </label>
                            <select
                                value={data.default_company_id}
                                onChange={(e) => setData('default_company_id', e.target.value)}
                                className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            >
                                <option value="">— Tidak Terikat / Pasien Umum —</option>
                                {companies.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Departemen / Divisi Kerja
                            </label>
                            <input
                                type="text"
                                value={data.default_department}
                                onChange={(e) => setData('default_department', e.target.value)}
                                placeholder="misal: Finance, IT, Operasional Pabrik"
                                className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">
                            Alamat Domisili
                        </label>
                        <textarea
                            rows={2}
                            value={data.address}
                            onChange={(e) => setData('address', e.target.value)}
                            placeholder="Alamat tempat tinggal lengkap"
                            className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">
                            Foto Profil Pasien (Opsional)
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setData('photo', e.target.files ? e.target.files[0] : null)}
                            className="w-full text-xs text-zinc-500 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200"
                        />
                        {errors.photo && (
                            <p className="mt-1 text-[11px] text-rose-500">{errors.photo}</p>
                        )}
                    </div>
                </form>
            </Modal>
        </>
    );
}
