import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DataTable, { ColumnDef } from '@/Components/DataTable';
import Badge from '@/Components/Badge';
import ActionDropdown, { ActionDropdownItem } from '@/Components/ActionDropdown';
import Modal from '@/Components/Modal';
import {
    Plus,
    Pencil,
    Trash2,
    CalendarDays,
    Building2,
    Share2,
    Users,
    MapPin,
    Stethoscope,
    ShieldCheck,
    CheckCircle2,
    Clock,
    FileCheck2,
    AlertCircle,
    UserCheck,
    FileSpreadsheet,
    Archive,
    Download,
    Loader2,
} from 'lucide-react';
import type {
    PageProps,
    Pagination,
    McuEvent,
    Company,
    Referrer,
    Employee,
    McuEventStatus,
} from '@/types';

interface EventsIndexProps extends PageProps {
    events: Pagination<McuEvent>;
    companies: Company[];
    referrers: Referrer[];
    employees: Employee[];
    filters: Record<string, any>;
    nextEventCode: string;
}

const statusBadges: Record<
    McuEventStatus,
    { label: string; variant: 'neutral' | 'info' | 'warning' | 'success' | 'danger'; icon: any }
> = {
    draft: { label: 'Draft', variant: 'neutral', icon: Clock },
    ongoing: { label: 'Sedang Berjalan', variant: 'info', icon: CalendarDays },
    review: { label: 'Tahap Review Medis', variant: 'warning', icon: AlertCircle },
    completed: { label: 'Selesai', variant: 'success', icon: CheckCircle2 },
    closed: { label: 'Ditutup (Arsip)', variant: 'neutral', icon: FileCheck2 },
};

export default function EventsIndex({
    events,
    companies,
    referrers,
    employees,
    filters,
    nextEventCode,
}: EventsIndexProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<McuEvent | null>(null);

    const [bulkZipEvent, setBulkZipEvent] = useState<McuEvent | null>(null);
    const [bulkZipStatus, setBulkZipStatus] = useState<{
        status: string;
        progress: number;
        message?: string;
        download_url?: string;
        error?: string;
    } | null>(null);
    const [isBulkZipModalOpen, setIsBulkZipModalOpen] = useState(false);

    const handleTriggerBulkZip = (event: McuEvent) => {
        setBulkZipEvent(event);
        setBulkZipStatus({ status: 'dispatching', progress: 0, message: 'Menghubungi antrean server...' });
        setIsBulkZipModalOpen(true);

        fetch(route('events.bulk-zip.dispatch', event.id), {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        })
            .then((res) => res.json())
            .then(() => {
                const pollInterval = setInterval(() => {
                    fetch(route('events.bulk-zip.status', event.id), {
                        headers: { Accept: 'application/json' },
                    })
                        .then((res) => res.json())
                        .then((data) => {
                            setBulkZipStatus(data);
                            if (data.status === 'completed' || data.status === 'failed') {
                                clearInterval(pollInterval);
                            }
                        })
                        .catch(() => clearInterval(pollInterval));
                }, 1500);
            })
            .catch((err) => {
                setBulkZipStatus({ status: 'failed', progress: 0, error: err.message });
            });
    };

    const currentYear = new Date().getFullYear();

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        year: currentYear,
        event_code: '',
        event_name: '',
        referrer_id: referrers[0]?.id || '',
        company_id: '' as string | number,
        target_participants: 0,
        city: '',
        start_date: '',
        end_date: '',
        virtual_bg: null as File | null,
        pic_mcu_id: '' as string | number,
        doctor_anamnese_id: '' as string | number,
        doctor_lab_id: '' as string | number,
        doctor_radiology_id: '' as string | number,
        doctor_electromedical_id: '' as string | number,
        doctor_ekg_id: '' as string | number,
        doctor_audiometry_id: '' as string | number,
        printed_by_id: '' as string | number,
        validator_id: '' as string | number,
        qc1_id: '' as string | number,
        qc2_id: '' as string | number,
        status: 'draft' as McuEventStatus,
        notes: '',
        _method: 'POST',
    });

    const openCreateModal = () => {
        setEditingEvent(null);
        reset();
        setData({
            year: currentYear,
            event_code: nextEventCode,
            event_name: '',
            referrer_id: referrers[0]?.id || '',
            company_id: '',
            target_participants: 100,
            city: '',
            start_date: '',
            end_date: '',
            virtual_bg: null,
            pic_mcu_id: '',
            doctor_anamnese_id: '',
            doctor_lab_id: '',
            doctor_radiology_id: '',
            doctor_electromedical_id: '',
            doctor_ekg_id: '',
            doctor_audiometry_id: '',
            printed_by_id: '',
            validator_id: '',
            qc1_id: '',
            qc2_id: '',
            status: 'draft',
            notes: '',
            _method: 'POST',
        });
        clearErrors();
        setIsModalOpen(true);
    };

    const openEditModal = (event: McuEvent) => {
        setEditingEvent(event);
        setData({
            year: event.year,
            event_code: event.event_code,
            event_name: event.event_name,
            referrer_id: event.referrer_id,
            company_id: event.company_id || '',
            target_participants: event.target_participants,
            city: event.city || '',
            start_date: event.start_date ? event.start_date.substring(0, 10) : '',
            end_date: event.end_date ? event.end_date.substring(0, 10) : '',
            virtual_bg: null,
            pic_mcu_id: event.pic_mcu_id || '',
            doctor_anamnese_id: event.doctor_anamnese_id || '',
            doctor_lab_id: event.doctor_lab_id || '',
            doctor_radiology_id: event.doctor_radiology_id || '',
            doctor_electromedical_id: event.doctor_electromedical_id || '',
            doctor_ekg_id: event.doctor_ekg_id || '',
            doctor_audiometry_id: event.doctor_audiometry_id || '',
            printed_by_id: event.printed_by_id || '',
            validator_id: event.validator_id || '',
            qc1_id: event.qc1_id || '',
            qc2_id: event.qc2_id || '',
            status: event.status,
            notes: event.notes || '',
            _method: 'PUT',
        });
        clearErrors();
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingEvent) {
            post(route('events.update', editingEvent.id), {
                forceFormData: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        } else {
            post(route('events.store'), {
                forceFormData: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        }
    };

    const handleDelete = (event: McuEvent) => {
        if (confirm(`Apakah Anda yakin ingin menghapus Event MCU "${event.event_name}" (${event.event_code})?`)) {
            router.delete(route('events.destroy', event.id), {
                preserveScroll: true,
            });
        }
    };

    const handleUpdateStatus = (event: McuEvent, status: McuEventStatus) => {
        router.patch(
            route('events.update-status', event.id),
            { status },
            { preserveScroll: true }
        );
    };

    const columns: ColumnDef<McuEvent>[] = [
        {
            header: 'Kode Event',
            accessorKey: 'event_code',
            isNumeric: true,
            sortable: true,
            width: '130px',
            cell: ({ value }) => (
                <span className="font-mono text-zinc-900 font-semibold tabular-nums text-xs">
                    {value}
                </span>
            ),
        },
        {
            header: 'Nama Event & Klien Perusahaan',
            accessorKey: 'event_name',
            sortable: true,
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium text-zinc-900">{row.event_name}</span>
                    <span className="text-[11px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                        <Building2 className="w-3 h-3 text-zinc-400" />
                        {row.company?.name || <span className="text-zinc-400">Umum / Non-Perusahaan</span>}
                        {row.city && <span>• {row.city}</span>}
                    </span>
                </div>
            ),
        },
        {
            header: 'Target Peserta',
            accessorKey: 'target_participants',
            sortable: true,
            align: 'right',
            width: '120px',
            cell: ({ value }) => (
                <span className="font-mono font-semibold text-zinc-900 tabular-nums text-xs">
                    {Number(value).toLocaleString('id-ID')} <span className="text-[11px] font-normal text-zinc-400">org</span>
                </span>
            ),
        },
        {
            header: 'Jadwal Pelaksanaan',
            accessorKey: 'start_date',
            sortable: true,
            width: '170px',
            cell: ({ row }) => {
                if (!row.start_date) return <span className="text-zinc-400 text-xs">—</span>;
                const start = row.start_date.substring(0, 10);
                const end = row.end_date ? row.end_date.substring(0, 10) : start;
                return (
                    <div className="flex flex-col text-xs font-mono tabular-nums text-zinc-700">
                        <span>{start}</span>
                        {end !== start && <span className="text-[11px] text-zinc-400">s/d {end}</span>}
                    </div>
                );
            },
        },
        {
            header: 'PIC & Tim Dokter',
            id: 'medical_team',
            cell: ({ row }) => (
                <div className="flex flex-col text-xs">
                    <span className="text-zinc-800 font-medium truncate max-w-[170px]">
                        PIC: {row.pic_mcu?.name || '—'}
                    </span>
                    <span className="text-[11px] text-zinc-400 truncate max-w-[170px]">
                        Dr: {row.doctor_anamnese?.name || row.doctor_lab?.name || '—'}
                    </span>
                </div>
            ),
        },
        {
            header: 'Status',
            accessorKey: 'status',
            sortable: true,
            width: '140px',
            align: 'center',
            cell: ({ value }) => {
                const conf = statusBadges[value] || statusBadges.draft;
                return (
                    <Badge variant={conf.variant} icon={conf.icon}>
                        {conf.label}
                    </Badge>
                );
            },
        },
        {
            header: 'Aksi',
            id: 'actions',
            align: 'right',
            width: '80px',
            cell: ({ row }) => {
                const items: ActionDropdownItem[] = [
                    {
                        label: 'Import/Export Excel Hasil',
                        icon: FileSpreadsheet,
                        onClick: () => router.get(route('events.bulk-results.index', row.id)),
                    },
                    {
                        label: 'Download Bulk MCU (ZIP)',
                        icon: Archive,
                        onClick: () => handleTriggerBulkZip(row),
                    },
                    {
                        label: 'Edit Event MCU',
                        icon: Pencil,
                        onClick: () => openEditModal(row),
                    },
                    {
                        label: 'Set Status: Berjalan',
                        icon: CalendarDays,
                        onClick: () => handleUpdateStatus(row, 'ongoing'),
                    },
                    {
                        label: 'Set Status: Review Medis',
                        icon: AlertCircle,
                        onClick: () => handleUpdateStatus(row, 'review'),
                    },
                    {
                        label: 'Set Status: Selesai',
                        icon: CheckCircle2,
                        onClick: () => handleUpdateStatus(row, 'completed'),
                    },
                    {
                        label: 'Hapus Event',
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
        <AuthenticatedLayout>
            <Head title="Event MCU Perusahaan" />

            <div className="space-y-4">
                {/* Header Page */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-zinc-200/80">
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                            <CalendarDays className="w-5 h-5 text-zinc-700" />
                            Event MCU Perusahaan
                        </h1>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Konfigurasi proyek MCU massal/korporat, jadwal, kuota target peserta, dan penugasan tim medis penanggung jawab.
                        </p>
                    </div>

                    <div>
                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-colors shadow-xs"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Event MCU Baru
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-3 rounded-lg border border-zinc-200/80 shadow-xs flex flex-wrap items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500 font-medium">Status:</span>
                        <select
                            value={filters.status || 'all'}
                            onChange={(e) => {
                                router.get(
                                    route('events.index'),
                                    { ...filters, status: e.target.value, page: 1 },
                                    { preserveState: true, preserveScroll: true }
                                );
                            }}
                            className="px-2.5 py-1 text-xs rounded-md border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                        >
                            <option value="all">Semua Status</option>
                            <option value="draft">Draft</option>
                            <option value="ongoing">Sedang Berjalan</option>
                            <option value="review">Tahap Review Medis</option>
                            <option value="completed">Selesai</option>
                            <option value="closed">Ditutup</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500 font-medium">Perusahaan:</span>
                        <select
                            value={filters.company_id || 'all'}
                            onChange={(e) => {
                                router.get(
                                    route('events.index'),
                                    { ...filters, company_id: e.target.value, page: 1 },
                                    { preserveState: true, preserveScroll: true }
                                );
                            }}
                            className="px-2.5 py-1 text-xs rounded-md border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                        >
                            <option value="all">Semua Klien</option>
                            {companies.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table */}
                <DataTable<McuEvent>
                    columns={columns}
                    data={events.data}
                    pagination={events}
                    searchPlaceholder="Cari kode event, nama MCU, kota..."
                    routeParams={filters}
                />
            </div>

            {/* Modal: Create & Edit MCU Event */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingEvent ? 'Edit Event MCU' : 'Buat Event MCU Baru'}
                subtitle="Konfigurasi pelaksanaan MCU korporat dan delegasi dokter"
                maxWidth="3xl"
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
                            form="event-form"
                            disabled={processing}
                            className="px-4 py-1.5 text-xs font-semibold text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-colors shadow-xs disabled:opacity-50"
                        >
                            {processing ? 'Menyimpan...' : 'Simpan Event MCU'}
                        </button>
                    </div>
                }
            >
                <form id="event-form" onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Tahun Pelaksanaan <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="number"
                                min={2000}
                                max={2100}
                                value={data.year}
                                onChange={(e) => setData('year', Number(e.target.value))}
                                className="w-full px-3 py-1.5 text-xs font-mono rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Kode Event MCU <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.event_code}
                                onChange={(e) => setData('event_code', e.target.value)}
                                placeholder="misal: MCU-2026-001"
                                className="w-full px-3 py-1.5 text-xs font-mono rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                                required
                            />
                            {errors.event_code && (
                                <p className="mt-1 text-[11px] text-rose-500">{errors.event_code}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Status Event <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value as McuEventStatus)}
                                className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            >
                                <option value="draft">Draft</option>
                                <option value="ongoing">Sedang Berjalan</option>
                                <option value="review">Tahap Review Medis</option>
                                <option value="completed">Selesai</option>
                                <option value="closed">Ditutup</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">
                            Nama Event MCU <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.event_name}
                            onChange={(e) => setData('event_name', e.target.value)}
                            placeholder="misal: MCU Tahunan Karyawan PT Telkom Indonesia 2026"
                            className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            required
                        />
                        {errors.event_name && (
                            <p className="mt-1 text-[11px] text-rose-500">{errors.event_name}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Perusahaan / Klien Korporat
                            </label>
                            <select
                                value={data.company_id}
                                onChange={(e) => setData('company_id', e.target.value)}
                                className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            >
                                <option value="">— Non Perusahaan / Mandiri —</option>
                                {companies.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Perujuk / Partner Marketing <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={data.referrer_id}
                                onChange={(e) => setData('referrer_id', e.target.value)}
                                className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                                required
                            >
                                {referrers.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Target Peserta (Orang)
                            </label>
                            <input
                                type="number"
                                min={0}
                                value={data.target_participants}
                                onChange={(e) => setData('target_participants', Number(e.target.value))}
                                className="w-full px-3 py-1.5 text-xs font-mono rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Kota Lokasi Pelaksanaan
                            </label>
                            <input
                                type="text"
                                value={data.city}
                                onChange={(e) => setData('city', e.target.value)}
                                placeholder="misal: Jakarta, Surabaya, Balikpapan"
                                className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Tanggal Mulai
                            </label>
                            <input
                                type="date"
                                value={data.start_date}
                                onChange={(e) => setData('start_date', e.target.value)}
                                className="w-full px-3 py-1.5 text-xs font-mono rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Tanggal Selesai
                            </label>
                            <input
                                type="date"
                                value={data.end_date}
                                onChange={(e) => setData('end_date', e.target.value)}
                                className="w-full px-3 py-1.5 text-xs font-mono rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            />
                        </div>
                    </div>

                    {/* Section: Penugasan Tim Medis & QC */}
                    <div className="pt-2 border-t border-zinc-100">
                        <span className="text-xs font-semibold text-zinc-800 block mb-2">
                            Penugasan PIC &amp; Dokter Penanggung Jawab Stasiun
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                                    PIC MCU (Project Manager)
                                </label>
                                <select
                                    value={data.pic_mcu_id}
                                    onChange={(e) => setData('pic_mcu_id', e.target.value)}
                                    className="w-full px-2.5 py-1 text-xs rounded border border-zinc-300 focus:ring-1 focus:ring-zinc-900"
                                >
                                    <option value="">— Pilih PIC —</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.name} ({emp.job_title})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                                    Dokter Fisik / Anamnese
                                </label>
                                <select
                                    value={data.doctor_anamnese_id}
                                    onChange={(e) => setData('doctor_anamnese_id', e.target.value)}
                                    className="w-full px-2.5 py-1 text-xs rounded border border-zinc-300 focus:ring-1 focus:ring-zinc-900"
                                >
                                    <option value="">— Pilih Dokter —</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                                    Dokter PJ Laboratorium
                                </label>
                                <select
                                    value={data.doctor_lab_id}
                                    onChange={(e) => setData('doctor_lab_id', e.target.value)}
                                    className="w-full px-2.5 py-1 text-xs rounded border border-zinc-300 focus:ring-1 focus:ring-zinc-900"
                                >
                                    <option value="">— Pilih Dokter Lab —</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                                    Dokter Radiologi
                                </label>
                                <select
                                    value={data.doctor_radiology_id}
                                    onChange={(e) => setData('doctor_radiology_id', e.target.value)}
                                    className="w-full px-2.5 py-1 text-xs rounded border border-zinc-300 focus:ring-1 focus:ring-zinc-900"
                                >
                                    <option value="">— Pilih Dokter Radiologi —</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                                    QC Medis 1
                                </label>
                                <select
                                    value={data.qc1_id}
                                    onChange={(e) => setData('qc1_id', e.target.value)}
                                    className="w-full px-2.5 py-1 text-xs rounded border border-zinc-300 focus:ring-1 focus:ring-zinc-900"
                                >
                                    <option value="">— Pilih QC 1 —</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                                    QC Medis 2
                                </label>
                                <select
                                    value={data.qc2_id}
                                    onChange={(e) => setData('qc2_id', e.target.value)}
                                    className="w-full px-2.5 py-1 text-xs rounded border border-zinc-300 focus:ring-1 focus:ring-zinc-900"
                                >
                                    <option value="">— Pilih QC 2 —</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">
                            Virtual Background Foto Peserta (Opsional)
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setData('virtual_bg', e.target.files ? e.target.files[0] : null)}
                            className="w-full text-xs text-zinc-500 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200"
                        />
                        <p className="mt-1 text-[11px] text-zinc-400">
                            Backdrop digital dengan logo perusahaan yang otomatis dipasangkan di foto peserta MCU.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">
                            Catatan Tambahan
                        </label>
                        <textarea
                            rows={2}
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            placeholder="Catatan teknis lapangan, briefing vendor, PIC vendor..."
                            className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                        />
                    </div>
                </form>
            </Modal>

            {/* Modal: Bulk ZIP Export Progress */}
            <Modal
                isOpen={isBulkZipModalOpen}
                onClose={() => setIsBulkZipModalOpen(false)}
                title={`Ekspor Massal Buku MCU: ${bulkZipEvent?.event_code || ''}`}
                subtitle={bulkZipEvent?.event_name}
                maxWidth="md"
                footer={
                    <div className="flex items-center justify-end gap-2 w-full">
                        {bulkZipStatus?.status === 'completed' && bulkZipStatus?.download_url && (
                            <a
                                href={bulkZipStatus.download_url}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors shadow-xs"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Unduh File ZIP
                            </a>
                        )}
                        <button
                            type="button"
                            onClick={() => setIsBulkZipModalOpen(false)}
                            className="px-3.5 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors"
                        >
                            Tutup
                        </button>
                    </div>
                }
            >
                <div className="space-y-4 py-2 text-xs">
                    {bulkZipStatus?.status === 'processing' || bulkZipStatus?.status === 'dispatching' ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Loader2 className="w-5 h-5 text-zinc-700 animate-spin" />
                                <div>
                                    <div className="font-semibold text-zinc-900">
                                        Sedang Memproses Buku MCU...
                                    </div>
                                    <div className="text-zinc-500 text-[11px]">
                                        {bulkZipStatus.message || 'Harap tunggu, proses kompilasi PDF dan penggabungan berkas ZIP sedang berjalan di antrean server.'}
                                    </div>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
                                    <span>Kemajuan:</span>
                                    <span>{bulkZipStatus.progress || 0}%</span>
                                </div>
                                <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-zinc-900 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${bulkZipStatus.progress || 5}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : bulkZipStatus?.status === 'completed' ? (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                                <div className="font-bold">Ekspor Massal Selesai!</div>
                                <div className="text-emerald-700 text-[11px] mt-0.5">
                                    {bulkZipStatus.message || 'Seluruh Buku MCU peserta berhasil dikompilasi ke dalam file ZIP.'}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                                <div className="font-bold">Gagal Membuat Ekspor ZIP</div>
                                <div className="text-rose-700 text-[11px] mt-0.5">
                                    {bulkZipStatus?.error || bulkZipStatus?.message || 'Terjadi kesalahan sistem saat memproses antrean.'}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
