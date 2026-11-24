import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DataTable, { ColumnDef } from '@/Components/DataTable';
import Badge from '@/Components/Badge';
import {
    Stethoscope,
    Clock,
    CheckCircle2,
    ShieldCheck,
    Search,
    Calendar,
    Building2,
    Filter,
    ChevronRight,
    Users,
    Lock,
    Unlock,
    FileText,
    AlertTriangle,
} from 'lucide-react';
import type { PageProps, Pagination, Registration, FitStatus, WorkflowStatus } from '@/types';

interface McuEventOption {
    id: number;
    event_code: string;
    event_name: string;
}

interface DoctorReviewIndexProps extends PageProps {
    registrations: Pagination<Registration>;
    filters: {
        search: string;
        mcu_event_id: string;
        fit_status: string;
        workflow_status: string;
        per_page: number;
    };
    kpi: {
        waiting_review: number;
        reviewed_by_doctor: number;
        total_participants: number;
        locked_count: number;
    };
    mcuEvents: McuEventOption[];
    fitStatusOptions: Record<FitStatus, string>;
}

export default function Index({
    auth,
    registrations,
    filters,
    kpi,
    mcuEvents,
    fitStatusOptions,
}: DoctorReviewIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [mcuEventId, setMcuEventId] = useState(filters.mcu_event_id || 'all');
    const [fitStatus, setFitStatus] = useState(filters.fit_status || 'all');
    const [workflowStatus, setWorkflowStatus] = useState(filters.workflow_status || 'all');

    const applyFilter = (newFilters: Partial<typeof filters>) => {
        router.get(
            route('mcu.doctor-review.index'),
            {
                search,
                mcu_event_id: mcuEventId,
                fit_status: fitStatus,
                workflow_status: workflowStatus,
                ...newFilters,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilter({ search });
    };

    const handleReset = () => {
        setSearch('');
        setMcuEventId('all');
        setFitStatus('all');
        setWorkflowStatus('all');
        router.get(route('mcu.doctor-review.index'), {}, { replace: true });
    };

    const getFitStatusBadge = (status?: FitStatus | null) => {
        switch (status) {
            case 'fit':
                return <Badge variant="success" label="Fit (Laik Kerja)" />;
            case 'fit_with_note':
                return <Badge variant="warning" label="Fit with Note" />;
            case 'temporary_unfit':
                return <Badge variant="danger" label="Temporary Unfit" />;
            case 'unfit':
                return <Badge variant="danger" label="Unfit (Tidak Laik)" />;
            case 'pending':
                return <Badge variant="info" label="Pending" />;
            default:
                return <Badge variant="neutral" label="Belum Review" />;
        }
    };

    const getWorkflowBadge = (status: WorkflowStatus) => {
        switch (status) {
            case 'registered':
                return <Badge variant="neutral" label="Registered" />;
            case 'in_progress':
                return <Badge variant="info" label="In Progress" />;
            case 'result_entered':
                return <Badge variant="warning" label="Siap Direview" />;
            case 'doctor_reviewed':
                return <Badge variant="info" label="Dokter Selesai" />;
            case 'manager_approved':
                return <Badge variant="success" label="QC Approved" />;
            case 'completed':
                return <Badge variant="success" label="Completed" />;
            case 'void':
                return <Badge variant="danger" label="Void" />;
            default:
                return <Badge variant="neutral" label={status} />;
        }
    };

    const columns: ColumnDef<Registration>[] = [
        {
            header: 'No. Reg & Pasien',
            cell: ({ row: reg }) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-semibold text-emerald-600">
                            {reg.reg_no}
                        </span>
                        <span className="text-[10px] text-zinc-400">•</span>
                        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                            {reg.payer_type}
                        </span>
                    </div>
                    <div className="font-medium text-zinc-900 text-sm">
                        {reg.patient?.name || '—'}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                        <span>NRM: <span className="font-mono text-zinc-700">{reg.patient?.medical_record_no}</span></span>
                        <span>•</span>
                        <span>{reg.patient?.gender === 'L' ? 'Laki-laki' : 'Perempuan'}, {reg.age_years_snapshot || reg.patient?.age || '—'} thn</span>
                    </div>
                </div>
            ),
        },
        {
            header: 'Departemen / Event MCU',
            cell: ({ row: reg }) => (
                <div className="space-y-1 text-xs">
                    <div className="font-medium text-zinc-800">
                        {reg.mcu_event?.event_name || reg.company?.name || 'Walk-in / APS'}
                    </div>
                    {reg.department_snapshot && (
                        <div className="text-zinc-500 text-[11px] flex items-center gap-1">
                            <span className="px-1.5 py-0.5 bg-zinc-100 rounded text-zinc-600 font-mono text-[10px]">
                                {reg.department_snapshot}
                            </span>
                        </div>
                    )}
                    <div className="text-[11px] text-zinc-400">
                        Paket: {reg.package?.name || 'Custom'}
                    </div>
                </div>
            ),
        },
        {
            header: 'Dokter Reviewer',
            cell: ({ row: reg }) => {
                const review = reg.mcu_review || reg.mcuReview;
                if (!review || !review.doctor) {
                    return (
                        <span className="text-xs text-zinc-400 italic">
                            Belum direview
                        </span>
                    );
                }
                return (
                    <div className="space-y-0.5 text-xs">
                        <div className="font-medium text-zinc-800 flex items-center gap-1">
                            <Stethoscope className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{review.doctor.name}</span>
                        </div>
                        {review.doctor_reviewed_at && (
                            <div className="text-[10px] text-zinc-400 font-mono">
                                {new Date(review.doctor_reviewed_at).toLocaleDateString('id-ID', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            header: 'Fit Status',
            cell: ({ row: reg }) => {
                const review = reg.mcu_review || reg.mcuReview;
                return (
                    <div className="space-y-1">
                        {getFitStatusBadge(review?.fit_status)}
                    </div>
                );
            },
        },
        {
            header: 'Status & Lock',
            cell: ({ row: reg }) => {
                const review = reg.mcu_review || reg.mcuReview;
                const isLocked = review?.is_locked ?? false;
                return (
                    <div className="flex flex-col gap-1 items-start">
                        {getWorkflowBadge(reg.workflow_status)}
                        {isLocked ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded">
                                <Lock className="w-3 h-3 text-zinc-500" /> Locked (QC)
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                <Unlock className="w-3 h-3 text-amber-500" /> Open Edit
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            header: 'Aksi',
            cell: ({ row: reg }) => {
                const review = reg.mcu_review || reg.mcuReview;
                const isReviewed = Boolean(review?.doctor_reviewed_at);
                return (
                    <div className="flex items-center gap-2">
                        <Link
                            href={route('mcu.doctor-review.show', reg.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                                isReviewed
                                    ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                            }`}
                        >
                            <Stethoscope className="w-3.5 h-3.5" />
                            <span>{isReviewed ? 'Lihat / Edit' : 'Review Pasien'}</span>
                        </Link>
                    </div>
                );
            },
        },
    ];

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Review Dokter MCU" />

            <div className="space-y-6">
                {/* Header Title */}
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2.5">
                        <Stethoscope className="w-6 h-6 text-emerald-600" />
                        <span>Review Dokter MCU</span>
                    </h1>
                    <p className="mt-1 text-sm text-zinc-500">
                        Evaluasi rekapitulasi kelainan klinis, telaah hasil pemeriksaan penunjang, tentukan status kelaikan kerja (Fit to Work), serta susun anjuran medis.
                    </p>
                </div>

                {/* KPI Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-white border border-zinc-200 rounded-lg shadow-sm flex items-center justify-between">
                        <div>
                            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Menunggu Review</div>
                            <div className="text-2xl font-bold text-amber-600 mt-1 tabular-nums">
                                {kpi.waiting_review}
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">Hasil penunjang terisi</div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="p-4 bg-white border border-zinc-200 rounded-lg shadow-sm flex items-center justify-between">
                        <div>
                            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Sudah Direview</div>
                            <div className="text-2xl font-bold text-emerald-600 mt-1 tabular-nums">
                                {kpi.reviewed_by_doctor}
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">Diverifikasi dokter</div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <Stethoscope className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="p-4 bg-white border border-zinc-200 rounded-lg shadow-sm flex items-center justify-between">
                        <div>
                            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Sudah QC Lock</div>
                            <div className="text-2xl font-bold text-zinc-700 mt-1 tabular-nums">
                                {kpi.locked_count}
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">Kunci Manajer MCU</div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="p-4 bg-white border border-zinc-200 rounded-lg shadow-sm flex items-center justify-between">
                        <div>
                            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Peserta MCU</div>
                            <div className="text-2xl font-bold text-zinc-900 mt-1 tabular-nums">
                                {kpi.total_participants}
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">Seluruh batch event</div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center text-sky-600">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm space-y-3">
                    <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="relative">
                            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari No. Reg, NRM, Nama, NIK..."
                                className="w-full pl-9 pr-3 py-1.5 text-xs border border-zinc-300 rounded focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>

                        <div>
                            <select
                                value={mcuEventId}
                                onChange={(e) => {
                                    setMcuEventId(e.target.value);
                                    applyFilter({ mcu_event_id: e.target.value });
                                }}
                                className="w-full py-1.5 text-xs border border-zinc-300 rounded focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            >
                                <option value="all">Semua Event MCU</option>
                                {mcuEvents.map((evt) => (
                                    <option key={evt.id} value={evt.id}>
                                        {evt.event_code} - {evt.event_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <select
                                value={fitStatus}
                                onChange={(e) => {
                                    setFitStatus(e.target.value);
                                    applyFilter({ fit_status: e.target.value });
                                }}
                                className="w-full py-1.5 text-xs border border-zinc-300 rounded focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            >
                                <option value="all">Semua Fit Status</option>
                                <option value="fit">Fit (Laik Kerja)</option>
                                <option value="fit_with_note">Fit with Note</option>
                                <option value="temporary_unfit">Temporary Unfit</option>
                                <option value="unfit">Unfit (Tidak Laik)</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>

                        <div>
                            <select
                                value={workflowStatus}
                                onChange={(e) => {
                                    setWorkflowStatus(e.target.value);
                                    applyFilter({ workflow_status: e.target.value });
                                }}
                                className="w-full py-1.5 text-xs border border-zinc-300 rounded focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            >
                                <option value="all">Semua Status Workflow</option>
                                <option value="result_entered">Siap Direview (Result Entered)</option>
                                <option value="doctor_reviewed">Sudah Direview Dokter</option>
                                <option value="manager_approved">QC Approved</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </form>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-xs">
                        <div className="text-zinc-500">
                            Menampilkan <span className="font-semibold text-zinc-800">{registrations.total}</span> total peserta MCU
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="px-2.5 py-1 text-zinc-600 hover:text-zinc-900 border border-zinc-200 rounded hover:bg-zinc-50 transition-colors"
                            >
                                Reset Filter
                            </button>
                            <button
                                type="button"
                                onClick={() => applyFilter({ search })}
                                className="px-3 py-1 bg-zinc-900 text-white rounded hover:bg-zinc-800 transition-colors"
                            >
                                Terapkan
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Table */}
                <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
                    <DataTable
                        data={registrations.data}
                        columns={columns}
                        emptyMessage="Tidak ada data pendaftaran MCU yang cocok dengan filter yang dipilih."
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
