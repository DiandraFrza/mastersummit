import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import DataTable, { ColumnDef } from '@/Components/DataTable';
import Badge from '@/Components/Badge';
import {
    FileSpreadsheet,
    FlaskConical,
    ScanLine,
    Activity,
    HeartPulse,
    Download,
    Layers,
    ListFilter,
    Calendar,
    Building2,
    CheckCircle2,
    Clock,
    AlertCircle,
    User,
} from 'lucide-react';
import type { PageProps, Pagination, Company, Service } from '@/types';

interface ExamItem {
    id: number;
    registration_id: number;
    service_id: number;
    service_name_snapshot: string;
    category: 'lab' | 'radiology' | 'electromedical' | 'physical';
    price_snapshot: number | string;
    final_price: number | string;
    billed_to: string;
    sample_status: string;
    result_status: string;
    service?: { id: number; name: string; category: string } | null;
    registration?: {
        id: number;
        reg_no: string;
        registered_at: string;
        patient?: { id: number; name: string; medical_record_no: string; gender: string } | null;
        company?: { id: number; name: string } | null;
        mcuEvent?: { id: number; event_name: string } | null;
    } | null;
}

interface ServiceRecapItem {
    service_id: number;
    service_name: string;
    category: string;
    total_volume: number;
    personal_volume: number;
    corporate_volume: number;
    referrer_volume: number;
    total_revenue: number;
}

interface ExaminationsProps extends PageProps {
    kpi: {
        total_items: number;
        total_lab: number;
        total_radiology: number;
        total_electromedical: number;
        total_physical: number;
        total_nominal: number;
    };
    recap_by_service: ServiceRecapItem[];
    items: Pagination<ExamItem>;
    companies: Company[];
    services: Service[];
    filters: {
        start_date: string;
        end_date: string;
        category: string;
        service_id: string | number;
        billed_to: string;
        result_status: string;
        sample_status: string;
        company_id: string | number;
        search: string;
        per_page: number;
    };
}

export default function Examinations({
    kpi,
    recap_by_service,
    items,
    companies,
    services,
    filters,
}: ExaminationsProps) {
    const [activeTab, setActiveTab] = useState<'items' | 'recap'>('items');

    const formatIdr = (val: number | string | undefined | null) => {
        const num = Number(val || 0);
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num);
    };

    const handleFilterUpdate = (key: string, value: string) => {
        const currentParams = { ...filters, [key]: value, page: 1 };
        router.get(route('reports.examinations.index'), currentParams, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleExportExcel = () => {
        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') {
                queryParams.append(k, String(v));
            }
        });
        window.open(`${route('reports.examinations.export')}?${queryParams.toString()}`, '_blank');
    };

    const getCategoryBadge = (cat: string) => {
        switch (cat) {
            case 'lab':
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200"><FlaskConical className="w-3 h-3" />Lab</span>;
            case 'radiology':
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"><ScanLine className="w-3 h-3" />Radiologi</span>;
            case 'electromedical':
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200"><Activity className="w-3 h-3" />Elektromedis</span>;
            case 'physical':
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><HeartPulse className="w-3 h-3" />Fisik</span>;
            default:
                return <Badge variant="neutral" label={cat} />;
        }
    };

    const getBilledBadge = (billedTo: string) => {
        switch (billedTo) {
            case 'corporate':
                return <Badge variant="info" label="Corporate" />;
            case 'referrer':
                return <Badge variant="neutral" label="Rujukan" />;
            default:
                return <Badge variant="success" label="Pribadi" />;
        }
    };

    const getSampleStatusBadge = (status: string) => {
        switch (status) {
            case 'taken':
                return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Diambil</span>;
            case 'rejected':
                return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">Ditolak</span>;
            default:
                return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600">Pending</span>;
        }
    };

    const getResultStatusBadge = (status: string) => {
        switch (status) {
            case 'verified':
                return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Terverifikasi</span>;
            case 'entered':
                return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">Terinput</span>;
            case 'draft':
                return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Draft</span>;
            default:
                return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600">Menunggu</span>;
        }
    };

    const columns: ColumnDef<ExamItem>[] = [
        {
            header: 'Pasien & Registrasi',
            id: 'patient',
            cell: ({ row }) => {
                const reg = row.registration;
                const patient = reg?.patient;
                return (
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs text-zinc-900">
                                {patient?.name || 'Pasien'}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono tabular-nums">
                                ({patient?.medical_record_no})
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-500 font-mono tabular-nums">
                            <span>{reg?.reg_no}</span>
                            {reg?.registered_at && (
                                <>
                                    <span>&bull;</span>
                                    <span>
                                        {new Date(reg.registered_at).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            header: 'Layanan Pemeriksaan',
            accessorKey: 'service_name_snapshot',
            cell: ({ row }) => (
                <div className="flex flex-col gap-1">
                    <span className="font-semibold text-xs text-zinc-900">
                        {row.service_name_snapshot}
                    </span>
                    <div>{getCategoryBadge(row.category)}</div>
                </div>
            ),
        },
        {
            header: 'Penjamin & Entitas',
            id: 'billed_to',
            cell: ({ row }) => (
                <div className="flex flex-col gap-1 text-xs">
                    <div>{getBilledBadge(row.billed_to)}</div>
                    {(row.registration?.company || row.registration?.mcuEvent) && (
                        <span className="text-[10px] text-zinc-500 truncate max-w-[150px]">
                            {row.registration?.company?.name || row.registration?.mcuEvent?.event_name}
                        </span>
                    )}
                </div>
            ),
        },
        {
            header: 'Tarif / Nilai',
            accessorKey: 'final_price',
            align: 'right',
            width: '110px',
            cell: ({ row }) => (
                <span className="font-mono font-bold text-xs text-zinc-900 tabular-nums">
                    {formatIdr(row.final_price)}
                </span>
            ),
        },
        {
            header: 'Status Sampel',
            accessorKey: 'sample_status',
            align: 'center',
            width: '100px',
            cell: ({ row }) => getSampleStatusBadge(row.sample_status),
        },
        {
            header: 'Status Hasil',
            accessorKey: 'result_status',
            align: 'center',
            width: '110px',
            cell: ({ row }) => getResultStatusBadge(row.result_status),
        },
    ];

    return (
        <>
            <Head title="Laporan Pemeriksaan" />

            <div className="space-y-4">
                {/* Header Title & Actions */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-zinc-200">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-zinc-900">
                            Laporan Pemeriksaan
                        </h1>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExportExcel}
                            className="inline-flex items-center gap-2 h-10 px-4 text-sm font-semibold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-md transition-colors shadow-xs"
                        >
                            <Download className="w-4 h-4 text-emerald-600" />
                            <span>Ekspor Excel</span>
                        </button>
                    </div>
                </div>

                {/* 4 KPI Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-white p-4 rounded-lg border border-zinc-200/80 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-zinc-500">Total Item Diperiksa</span>
                            <div className="w-7 h-7 rounded-full bg-zinc-100 text-zinc-700 flex items-center justify-center">
                                <Layers className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-xl font-bold font-mono text-zinc-900 mt-1 tabular-nums">
                            {kpi.total_items.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">Nilai: {formatIdr(kpi.total_nominal)}</div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-zinc-200/80 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-zinc-500">Pemeriksaan Lab</span>
                            <div className="w-7 h-7 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                                <FlaskConical className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-xl font-bold font-mono text-zinc-900 mt-1 tabular-nums">
                            {kpi.total_lab.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">Darah, Urin, Imunoserologi</div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-zinc-200/80 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-zinc-500">Pemeriksaan Radiologi</span>
                            <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <ScanLine className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-xl font-bold font-mono text-zinc-900 mt-1 tabular-nums">
                            {kpi.total_radiology.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">Rontgen Thorax &amp; Foto Diagnostik</div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-zinc-200/80 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-zinc-500">Elektromedis &amp; Fisik</span>
                            <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                                <Activity className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-xl font-bold font-mono text-zinc-900 mt-1 tabular-nums">
                            {(kpi.total_electromedical + kpi.total_physical).toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">EKG, Spiro, Audio &amp; Tanda Vital</div>
                    </div>
                </div>

                {/* Filter Toolbar */}
                <div className="p-3 bg-white border border-zinc-200/80 rounded-lg shadow-xs space-y-3">
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5">
                            <span className="text-zinc-500 text-[11px]">Periode:</span>
                            <input
                                type="date"
                                value={filters.start_date}
                                onChange={(e) => handleFilterUpdate('start_date', e.target.value)}
                                className="px-2.5 py-1 text-xs border border-zinc-300 rounded font-mono"
                            />
                            <span className="text-zinc-400">s/d</span>
                            <input
                                type="date"
                                value={filters.end_date}
                                onChange={(e) => handleFilterUpdate('end_date', e.target.value)}
                                className="px-2.5 py-1 text-xs border border-zinc-300 rounded font-mono"
                            />
                        </div>

                        <div className="h-4 w-px bg-zinc-200" />

                        <div className="flex items-center gap-1.5">
                            <span className="text-zinc-500 text-[11px]">Kategori:</span>
                            <select
                                value={filters.category}
                                onChange={(e) => handleFilterUpdate('category', e.target.value)}
                                className="px-2 py-1 text-xs border border-zinc-300 rounded bg-white"
                            >
                                <option value="all">Semua Kategori</option>
                                <option value="lab">Laboratorium</option>
                                <option value="radiology">Radiologi</option>
                                <option value="electromedical">Elektromedis</option>
                                <option value="physical">Pemeriksaan Fisik</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <span className="text-zinc-500 text-[11px]">Penjamin:</span>
                            <select
                                value={filters.billed_to}
                                onChange={(e) => handleFilterUpdate('billed_to', e.target.value)}
                                className="px-2 py-1 text-xs border border-zinc-300 rounded bg-white"
                            >
                                <option value="all">Semua Penjamin</option>
                                <option value="corporate">Corporate</option>
                                <option value="personal">Pribadi</option>
                                <option value="referrer">Rujukan</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <span className="text-zinc-500 text-[11px]">Status Hasil:</span>
                            <select
                                value={filters.result_status}
                                onChange={(e) => handleFilterUpdate('result_status', e.target.value)}
                                className="px-2 py-1 text-xs border border-zinc-300 rounded bg-white"
                            >
                                <option value="all">Semua Status</option>
                                <option value="verified">Terverifikasi</option>
                                <option value="entered">Terinput</option>
                                <option value="draft">Draft</option>
                                <option value="pending">Menunggu</option>
                            </select>
                        </div>

                        {companies.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-zinc-500 text-[11px]">Perusahaan:</span>
                                <select
                                    value={filters.company_id}
                                    onChange={(e) => handleFilterUpdate('company_id', e.target.value)}
                                    className="px-2 py-1 text-xs border border-zinc-300 rounded bg-white max-w-[150px] truncate"
                                >
                                    <option value="all">Semua Perusahaan</option>
                                    {companies.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex items-center gap-1 border-b border-zinc-200 text-xs">
                    <button
                        onClick={() => setActiveTab('items')}
                        className={`px-3.5 py-2 font-semibold transition-all border-b-2 flex items-center gap-2 ${
                            activeTab === 'items'
                                ? 'border-zinc-900 text-zinc-900 bg-white rounded-t border-t border-l border-r border-b-white -mb-px'
                                : 'border-transparent text-zinc-500 hover:text-zinc-800'
                        }`}
                    >
                        <ListFilter className="w-3.5 h-3.5" />
                        <span>Rincian Item Pasien</span>
                        <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-100 text-zinc-700 font-mono">
                            {items.total}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('recap')}
                        className={`px-3.5 py-2 font-semibold transition-all border-b-2 flex items-center gap-2 ${
                            activeTab === 'recap'
                                ? 'border-zinc-900 text-zinc-900 bg-white rounded-t border-t border-l border-r border-b-white -mb-px'
                                : 'border-transparent text-zinc-500 hover:text-zinc-800'
                        }`}
                    >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Rekapitulasi Volume &amp; Nilai Layanan</span>
                        <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-100 text-zinc-700 font-mono">
                            {recap_by_service.length}
                        </span>
                    </button>
                </div>

                {/* TAB 1: ITEMS TABLE */}
                {activeTab === 'items' && (
                    <div className="bg-white rounded-lg border border-zinc-200/80 shadow-xs overflow-hidden">
                        <DataTable
                            columns={columns}
                            data={items}
                            filters={filters}
                            searchPlaceholder="Cari no. reg, nama..."
                            routeName="reports.examinations.index"
                            emptyMessage="Belum ada item pemeriksaan pada rentang tanggal dan filter ini."
                        />
                    </div>
                )}

                {/* TAB 2: RECAP BY SERVICE */}
                {activeTab === 'recap' && (
                    <div className="bg-white rounded-lg border border-zinc-200/80 shadow-xs overflow-hidden">
                        <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200/80">
                            <h2 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                                Rekapitulasi Frekuensi Pemeriksaan &amp; Realisasi Nilai per Layanan
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-zinc-50/80 text-[11px] text-zinc-500 font-medium border-b border-zinc-200/80">
                                    <tr>
                                        <th className="py-2.5 px-4">Nama Layanan / Pemeriksaan</th>
                                        <th className="py-2.5 px-4">Kategori</th>
                                        <th className="py-2.5 px-4 text-center">Total Volume</th>
                                        <th className="py-2.5 px-4 text-center">Volume APS</th>
                                        <th className="py-2.5 px-4 text-center">Volume Corporate</th>
                                        <th className="py-2.5 px-4 text-right">Total Pendapatan (Rp)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {recap_by_service.map((s) => (
                                        <tr key={s.service_id + s.service_name} className="hover:bg-zinc-50/50">
                                            <td className="py-3 px-4 font-semibold text-zinc-900">
                                                {s.service_name}
                                            </td>
                                            <td className="py-3 px-4">
                                                {getCategoryBadge(s.category)}
                                            </td>
                                            <td className="py-3 px-4 text-center font-mono font-bold tabular-nums text-zinc-900">
                                                {s.total_volume}
                                            </td>
                                            <td className="py-3 px-4 text-center font-mono tabular-nums text-zinc-600">
                                                {s.personal_volume}
                                            </td>
                                            <td className="py-3 px-4 text-center font-mono tabular-nums text-zinc-600">
                                                {s.corporate_volume}
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-zinc-900">
                                                {formatIdr(s.total_revenue)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-zinc-50 border-t-2 border-zinc-200 font-bold">
                                    <tr>
                                        <td className="py-3 px-4 text-zinc-900" colSpan={2}>
                                            TOTAL SELURUH LAYANAN
                                        </td>
                                        <td className="py-3 px-4 text-center font-mono tabular-nums text-zinc-900">
                                            {recap_by_service.reduce((acc, c) => acc + Number(c.total_volume), 0)}
                                        </td>
                                        <td className="py-3 px-4 text-center font-mono tabular-nums text-zinc-700">
                                            {recap_by_service.reduce((acc, c) => acc + Number(c.personal_volume), 0)}
                                        </td>
                                        <td className="py-3 px-4 text-center font-mono tabular-nums text-zinc-700">
                                            {recap_by_service.reduce((acc, c) => acc + Number(c.corporate_volume), 0)}
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700">
                                            {formatIdr(kpi.total_nominal)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
