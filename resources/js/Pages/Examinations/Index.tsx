import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import DataTable, { ColumnDef } from '@/Components/DataTable';
import Badge from '@/Components/Badge';
import {
    ClipboardCheck,
    FlaskConical,
    ScanLine,
    Activity,
    HeartPulse,
    Search,
    Calendar,
    Building2,
    Filter,
    ChevronRight,
    CheckCircle2,
    Clock,
    UserCheck,
    ShieldCheck,
    FileCheck2,
    AlertCircle,
} from 'lucide-react';
import type { PageProps, Pagination, Registration, Company, WorkflowStatus } from '@/types';

interface ExaminationsIndexProps extends PageProps {
    registrations: Pagination<Registration>;
    companies: Company[];
    filters: {
        category: string;
        status: string;
        company_id: string;
        date: string;
        search: string;
        per_page: number;
    };
}

export default function Index({
    auth,
    registrations,
    companies,
    filters,
}: ExaminationsIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [date, setDate] = useState(filters.date || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [companyId, setCompanyId] = useState(filters.company_id || 'all');
    const [category, setCategory] = useState(filters.category || 'all');

    const applyFilter = (newFilters: Partial<typeof filters>) => {
        router.get(
            route('examinations.index'),
            {
                category,
                status,
                company_id: companyId,
                date,
                search,
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

    const handleCategoryClick = (cat: string) => {
        setCategory(cat);
        applyFilter({ category: cat });
    };

    const categories = [
        { id: 'all', name: 'Semua Kategori', icon: ClipboardCheck },
        { id: 'lab', name: 'Laboratorium', icon: FlaskConical },
        { id: 'radiology', name: 'Radiologi', icon: ScanLine },
        { id: 'electromedical', name: 'Elektromedis', icon: Activity },
        { id: 'physical', name: 'Pemeriksaan Fisik', icon: HeartPulse },
    ];

    const getWorkflowBadge = (wfStatus: WorkflowStatus) => {
        switch (wfStatus) {
            case 'registered':
                return (
                    <Badge variant="zinc">
                        <Clock className="w-3 h-3 mr-1" />
                        Terdaftar
                    </Badge>
                );
            case 'in_progress':
                return (
                    <Badge variant="amber">
                        <Activity className="w-3 h-3 mr-1" />
                        Sedang Berjalan
                    </Badge>
                );
            case 'result_entered':
                return (
                    <Badge variant="blue">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Hasil Diinput
                    </Badge>
                );
            case 'doctor_reviewed':
                return (
                    <Badge variant="purple">
                        <UserCheck className="w-3 h-3 mr-1" />
                        Review Dokter
                    </Badge>
                );
            case 'manager_approved':
                return (
                    <Badge variant="emerald">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        Disetujui Manajer
                    </Badge>
                );
            case 'completed':
                return (
                    <Badge variant="emerald">
                        <FileCheck2 className="w-3 h-3 mr-1" />
                        Selesai
                    </Badge>
                );
            case 'void':
                return (
                    <Badge variant="red">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Dibatalkan (Void)
                    </Badge>
                );
            default:
                return <Badge variant="zinc">{wfStatus}</Badge>;
        }
    };

    const columns: ColumnDef<Registration>[] = [
        {
            header: 'No. Reg & Tanggal',
            accessor: (row) => (
                <div>
                    <div className="font-mono font-semibold text-zinc-900 tabular-nums">
                        {row.reg_no}
                    </div>
                    <div className="text-[11px] text-zinc-500 tabular-nums">
                        {row.registered_at ? new Date(row.registered_at).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                        }) : '-'}
                    </div>
                </div>
            ),
        },
        {
            header: 'Pasien',
            accessor: (row) => (
                <div>
                    <div className="font-medium text-zinc-900">{row.patient?.name || '-'}</div>
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 tabular-nums">
                        <span className="font-mono">{row.patient?.medical_record_no || '-'}</span>
                        <span>•</span>
                        <span
                            className={`font-semibold px-1 py-0.2 rounded text-[10px] ${
                                row.patient?.gender === 'L'
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'bg-rose-50 text-rose-700'
                            }`}
                        >
                            {row.patient?.gender || '-'}
                        </span>
                        <span>•</span>
                        <span>{row.age_years_snapshot || row.patient?.age || '-'} th</span>
                    </div>
                </div>
            ),
        },
        {
            header: 'Perusahaan / Payer',
            accessor: (row) => (
                <div>
                    <div className="text-xs font-medium text-zinc-800">
                        {row.company?.name || (row.payer_type === 'corporate' ? 'Perusahaan' : 'Pribadi / APS')}
                    </div>
                    {row.department_snapshot && (
                        <div className="text-[11px] text-zinc-500">{row.department_snapshot}</div>
                    )}
                </div>
            ),
        },
        {
            header: 'Paket / Layanan',
            accessor: (row) => (
                <div>
                    <div className="text-xs font-medium text-zinc-900">
                        {row.package?.name || (row.service_type === 'mcu' ? 'Paket MCU' : 'Pemeriksaan Rutin')}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                        {row.items?.slice(0, 3).map((item) => (
                            <span
                                key={item.id}
                                className="inline-block px-1.5 py-0.5 text-[10px] rounded bg-zinc-100 text-zinc-600 truncate max-w-[130px]"
                                title={item.service_name_snapshot}
                            >
                                {item.service_name_snapshot}
                            </span>
                        ))}
                        {(row.items?.length || 0) > 3 && (
                            <span className="text-[10px] text-zinc-400 self-center">
                                +{(row.items?.length || 0) - 3} lagi
                            </span>
                        )}
                    </div>
                </div>
            ),
        },
        {
            header: 'Progres Hasil',
            accessor: (row) => {
                const totalItems = row.items?.length || 0;
                const enteredItems =
                    row.items?.filter((it) => it.result_status === 'entered' || it.result_status === 'verified')
                        .length || 0;
                const percent = totalItems > 0 ? Math.round((enteredItems / totalItems) * 100) : 0;
                const isComplete = totalItems > 0 && enteredItems === totalItems;

                return (
                    <div className="w-32">
                        <div className="flex items-center justify-between text-[11px] mb-1 tabular-nums">
                            <span className={isComplete ? 'font-semibold text-emerald-700' : 'text-zinc-600'}>
                                {enteredItems} / {totalItems} item
                            </span>
                            <span className="font-mono text-zinc-500">{percent}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-300 rounded-full ${
                                    isComplete
                                        ? 'bg-emerald-500'
                                        : enteredItems > 0
                                        ? 'bg-blue-500'
                                        : 'bg-zinc-200'
                                }`}
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                    </div>
                );
            },
        },
        {
            header: 'Status Alur',
            accessor: (row) => getWorkflowBadge(row.workflow_status),
        },
        {
            header: 'Aksi',
            align: 'right',
            accessor: (row) => {
                const targetCat = category !== 'all' ? category : 'lab';
                return (
                    <Link
                        href={`/examinations/${row.id}?category=${targetCat}`}
                        className="inline-flex items-center gap-1 rounded-sm border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-50 hover:border-zinc-300 transition-colors shadow-2xs"
                    >
                        <span>Input Hasil</span>
                        <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
                    </Link>
                );
            },
        },
    ];

    return (
        <>
            <Head title="Input Hasil MCU" />

            <div className="space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-200 pb-3">
                    <div>
                        <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
                            Input Hasil MCU
                        </h1>
                    </div>
                </div>

                {/* Category Navigation Pills */}
                <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 pb-3">
                    {categories.map((cat) => {
                        const Icon = cat.icon;
                        const isActive = category === cat.id;
                        return (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => handleCategoryClick(cat.id)}
                                className={`inline-flex items-center gap-2 h-10 px-4 text-sm font-medium rounded-md transition-colors ${
                                    isActive
                                        ? 'bg-zinc-900 text-white shadow-xs'
                                        : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{cat.name}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Filter Toolbar */}
                <div className="rounded border border-zinc-200/80 bg-white p-3 shadow-2xs space-y-3">
                    <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        {/* Search Input */}
                        <div className="md:col-span-4 relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari No. Reg, NRM, Nama Pasien, NIK..."
                                className="w-full pl-8 pr-3 py-1.5 text-xs rounded border border-zinc-200 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 placeholder:text-zinc-400"
                            />
                        </div>

                        {/* Date Filter */}
                        <div className="md:col-span-2 relative">
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => {
                                    setDate(e.target.value);
                                    applyFilter({ date: e.target.value });
                                }}
                                className="w-full px-2.5 py-1.5 text-xs rounded border border-zinc-200 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 text-zinc-700"
                            />
                        </div>

                        {/* Company Filter */}
                        <div className="md:col-span-3">
                            <select
                                value={companyId}
                                onChange={(e) => {
                                    setCompanyId(e.target.value);
                                    applyFilter({ company_id: e.target.value });
                                }}
                                className="w-full px-2.5 py-1.5 text-xs rounded border border-zinc-200 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 text-zinc-700"
                            >
                                <option value="all">Semua Perusahaan</option>
                                {companies.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div className="md:col-span-3">
                            <select
                                value={status}
                                onChange={(e) => {
                                    setStatus(e.target.value);
                                    applyFilter({ status: e.target.value });
                                }}
                                className="w-full px-2.5 py-1.5 text-xs rounded border border-zinc-200 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 text-zinc-700"
                            >
                                <option value="all">Semua Status Alur</option>
                                <option value="in_progress">Sedang Berjalan (Sample Diambil)</option>
                                <option value="result_entered">Hasil Selesai Diinput</option>
                                <option value="doctor_reviewed">Review Dokter</option>
                                <option value="completed">Selesai</option>
                            </select>
                        </div>
                    </form>
                </div>

                {/* DataTable */}
                <div className="rounded border border-zinc-200/80 bg-white shadow-2xs overflow-hidden">
                    <DataTable<Registration>
                        data={registrations}
                        columns={columns}
                        searchable={false}
                        filtersSlot={null}
                    />
                </div>
            </div>
        </>
    );
}
