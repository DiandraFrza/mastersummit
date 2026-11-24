import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DataTable, { ColumnDef } from '@/Components/DataTable';
import Badge from '@/Components/Badge';
import Modal from '@/Components/Modal';
import {
    ShieldAlert,
    History,
    CheckCircle2,
    Edit3,
    Trash2,
    Eye,
    User,
    Calendar,
    Layers,
    Clock,
    Search,
    Code,
    FileText,
    ArrowRight,
    Terminal,
} from 'lucide-react';
import type { PageProps, Pagination } from '@/types';

interface ActivityItem {
    id: number;
    log_name: string;
    description: string;
    event: string;
    subject_type: string;
    subject_id: number | string;
    causer?: { id: number; name: string; username: string } | null;
    changed_fields: string[];
    old_values: Record<string, any>;
    new_values: Record<string, any>;
    created_at: string;
    created_at_human: string;
}

interface AuditIndexProps extends PageProps {
    kpi: {
        total: number;
        created_count: number;
        updated_count: number;
        deleted_count: number;
    };
    activities: Pagination<ActivityItem>;
    subject_types: Array<{ value: string; label: string }>;
    causers: Array<{ id: number; name: string; username: string }>;
    filters: {
        start_date: string;
        end_date: string;
        event: string;
        subject_type: string;
        causer_id: string | number;
        search: string;
        per_page: number;
    };
}

export default function Index({
    kpi,
    activities,
    subject_types,
    causers,
    filters,
}: AuditIndexProps) {
    const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
    const [showRawJson, setShowRawJson] = useState(false);

    const handleFilterUpdate = (key: string, value: string) => {
        const currentParams = { ...filters, [key]: value, page: 1 };
        router.get(route('audit-logs.index'), currentParams, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const getEventBadge = (event: string) => {
        switch (event.toLowerCase()) {
            case 'created':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">CREATED</span>;
            case 'updated':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">UPDATED</span>;
            case 'deleted':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">DELETED</span>;
            default:
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600 uppercase">{event}</span>;
        }
    };

    const columns: ColumnDef<ActivityItem>[] = [
        {
            header: 'Waktu & ID',
            id: 'time',
            width: '150px',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-mono text-xs text-zinc-900 font-medium tabular-nums">
                        {row.created_at_human}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                        Log #{row.id}
                    </span>
                </div>
            ),
        },
        {
            header: 'Operator / User',
            id: 'causer',
            width: '140px',
            cell: ({ row }) => (
                <div className="flex flex-col text-xs">
                    {row.causer ? (
                        <>
                            <span className="font-semibold text-zinc-800 truncate">
                                {row.causer.name}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono">
                                @{row.causer.username}
                            </span>
                        </>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 italic">
                            <Terminal className="w-3 h-3 text-zinc-400" />
                            Sistem
                        </span>
                    )}
                </div>
            ),
        },
        {
            header: 'Aksi',
            accessorKey: 'event',
            align: 'center',
            width: '90px',
            cell: ({ row }) => getEventBadge(row.event),
        },
        {
            header: 'Modul / Objek',
            id: 'subject',
            width: '150px',
            cell: ({ row }) => (
                <div className="flex flex-col text-xs">
                    <span className="font-semibold text-zinc-900">
                        {row.subject_type}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                        ID: #{row.subject_id}
                    </span>
                </div>
            ),
        },
        {
            header: 'Perubahan Kolom',
            id: 'changes',
            cell: ({ row }) => {
                if (row.changed_fields.length === 0) {
                    return (
                        <span className="text-xs text-zinc-400 italic">
                            {row.description}
                        </span>
                    );
                }

                return (
                    <div className="flex flex-wrap gap-1 items-center">
                        {row.changed_fields.slice(0, 4).map((f) => (
                            <span
                                key={f}
                                className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-100 text-zinc-700 border border-zinc-200/80"
                            >
                                {f}
                            </span>
                        ))}
                        {row.changed_fields.length > 4 && (
                            <span className="text-[10px] text-zinc-500 font-medium">
                                +{row.changed_fields.length - 4} lainnya
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            header: 'Detail',
            id: 'action',
            align: 'right',
            width: '80px',
            cell: ({ row }) => (
                <button
                    onClick={() => {
                        setSelectedActivity(row);
                        setShowRawJson(false);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded transition-colors"
                >
                    <Eye className="w-3.5 h-3.5 text-zinc-600" />
                    <span>Lihat</span>
                </button>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Audit Trail / Log Aktivitas Sistem" />

            <div className="space-y-4">
                {/* Header Title */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-zinc-200/80">
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-zinc-700" />
                            Audit Trail / Log Aktivitas Sistem
                        </h1>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Rekam jejak riwayat mutasi database, modifikasi tarif/parameter, validasi klinis, dan aktivitas pengguna.
                        </p>
                    </div>
                </div>

                {/* 4 KPI Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-white p-4 rounded-lg border border-zinc-200/80 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-zinc-500">Total Log Aktivitas</span>
                            <div className="w-7 h-7 rounded-full bg-zinc-100 text-zinc-700 flex items-center justify-center">
                                <History className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-xl font-bold font-mono text-zinc-900 mt-1 tabular-nums">
                            {kpi.total.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">Seluruh peristiwa terarsip</div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-zinc-200/80 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-zinc-500">Entitas Dibuat (Created)</span>
                            <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-xl font-bold font-mono text-zinc-900 mt-1 tabular-nums">
                            {kpi.created_count.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">Data baru ditambahkan</div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-zinc-200/80 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-zinc-500">Perubahan (Updated)</span>
                            <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Edit3 className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-xl font-bold font-mono text-zinc-900 mt-1 tabular-nums">
                            {kpi.updated_count.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">Modifikasi nilai kolom &amp; status</div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-zinc-200/80 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-zinc-500">Dihapus / Void (Deleted)</span>
                            <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                                <Trash2 className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-xl font-bold font-mono text-zinc-900 mt-1 tabular-nums">
                            {kpi.deleted_count.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">Pembatalan dan penghapusan</div>
                    </div>
                </div>

                {/* Filter Toolbar */}
                <div className="p-3 bg-white border border-zinc-200/80 rounded-lg shadow-xs space-y-3">
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5">
                            <span className="text-zinc-500 text-[11px]">Rentang Waktu:</span>
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
                            <span className="text-zinc-500 text-[11px]">Aksi / Event:</span>
                            <select
                                value={filters.event}
                                onChange={(e) => handleFilterUpdate('event', e.target.value)}
                                className="px-2 py-1 text-xs border border-zinc-300 rounded bg-white"
                            >
                                <option value="all">Semua Aksi</option>
                                <option value="created">Created (Baru)</option>
                                <option value="updated">Updated (Diubah)</option>
                                <option value="deleted">Deleted (Dihapus)</option>
                            </select>
                        </div>

                        {subject_types.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-zinc-500 text-[11px]">Modul / Entitas:</span>
                                <select
                                    value={filters.subject_type}
                                    onChange={(e) => handleFilterUpdate('subject_type', e.target.value)}
                                    className="px-2 py-1 text-xs border border-zinc-300 rounded bg-white max-w-[150px] truncate"
                                >
                                    <option value="all">Semua Modul</option>
                                    {subject_types.map((st) => (
                                        <option key={st.value} value={st.value}>
                                            {st.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {causers.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-zinc-500 text-[11px]">Operator:</span>
                                <select
                                    value={filters.causer_id}
                                    onChange={(e) => handleFilterUpdate('causer_id', e.target.value)}
                                    className="px-2 py-1 text-xs border border-zinc-300 rounded bg-white max-w-[150px] truncate"
                                >
                                    <option value="all">Semua Operator</option>
                                    {causers.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Activity DataTable */}
                <div className="bg-white rounded-lg border border-zinc-200/80 shadow-xs overflow-hidden">
                    <DataTable
                        columns={columns}
                        data={activities}
                        filters={filters}
                        searchPlaceholder="Cari ID, subjek, deskripsi, atau nama operator..."
                        routeName="audit-logs.index"
                        emptyMessage="Belum ada riwayat aktivitas yang sesuai dengan filter ini."
                    />
                </div>
            </div>

            {/* DIFF / DETAIL MODAL */}
            <Modal
                isOpen={Boolean(selectedActivity)}
                onClose={() => setSelectedActivity(null)}
                title={
                    selectedActivity
                        ? `Detail Log #${selectedActivity.id} — ${selectedActivity.event.toUpperCase()} ${selectedActivity.subject_type}`
                        : 'Detail Log'
                }
                maxWidth="3xl"
            >
                {selectedActivity && (
                    <div className="space-y-4">
                        {/* Metadata Header */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-50 p-3 rounded-lg border border-zinc-100 text-xs">
                            <div>
                                <span className="text-[10px] text-zinc-400 block uppercase">Waktu Aktivitas</span>
                                <span className="font-semibold text-zinc-900 font-mono">
                                    {selectedActivity.created_at_human}
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] text-zinc-400 block uppercase">Operator</span>
                                <span className="font-semibold text-zinc-900">
                                    {selectedActivity.causer?.name || 'Sistem (Otomatis)'}
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] text-zinc-400 block uppercase">Modul / Entitas</span>
                                <span className="font-semibold text-zinc-900">
                                    {selectedActivity.subject_type} #{selectedActivity.subject_id}
                                </span>
                            </div>
                            <div>
                                <span className="text-[10px] text-zinc-400 block uppercase">Peristiwa (Event)</span>
                                <div>{getEventBadge(selectedActivity.event)}</div>
                            </div>
                        </div>

                        {/* View Mode Toggle: Table Diff vs JSON Raw */}
                        <div className="flex items-center justify-between pb-1 border-b border-zinc-200 text-xs">
                            <span className="font-semibold text-zinc-800">
                                {showRawJson ? 'Struktur JSON Raw' : 'Perbandingan Nilai Kolom (Diff)'}
                            </span>
                            <button
                                onClick={() => setShowRawJson(!showRawJson)}
                                className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                            >
                                <Code className="w-3.5 h-3.5" />
                                <span>{showRawJson ? 'Tampilkan Mode Tabel' : 'Tampilkan Format JSON'}</span>
                            </button>
                        </div>

                        {/* Content: Diff Table */}
                        {!showRawJson ? (
                            selectedActivity.changed_fields.length > 0 ? (
                                <div className="border border-zinc-200 rounded-lg overflow-hidden text-xs">
                                    <table className="w-full text-left">
                                        <thead className="bg-zinc-50 border-b border-zinc-200 text-[11px] text-zinc-500 font-medium">
                                            <tr>
                                                <th className="py-2 px-3 w-1/4">Nama Kolom</th>
                                                <th className="py-2 px-3 w-3/8 text-rose-800 bg-rose-50/40">
                                                    Nilai Sebelumnya (Old)
                                                </th>
                                                <th className="py-2 px-3 w-3/8 text-emerald-800 bg-emerald-50/40">
                                                    Nilai Baru (New)
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100 font-mono text-[11px]">
                                            {selectedActivity.changed_fields.map((field) => {
                                                const oldVal = selectedActivity.old_values[field];
                                                const newVal = selectedActivity.new_values[field];

                                                const formatVal = (v: any) => {
                                                    if (v === null || v === undefined) return <span className="text-zinc-400 italic">null</span>;
                                                    if (typeof v === 'boolean') return v ? 'true' : 'false';
                                                    if (typeof v === 'object') return JSON.stringify(v);
                                                    return String(v);
                                                };

                                                return (
                                                    <tr key={field} className="hover:bg-zinc-50/50">
                                                        <td className="py-2 px-3 font-semibold text-zinc-800 bg-zinc-50/30">
                                                            {field}
                                                        </td>
                                                        <td className="py-2 px-3 text-rose-700 bg-rose-50/20 break-all">
                                                            {formatVal(oldVal)}
                                                        </td>
                                                        <td className="py-2 px-3 text-emerald-700 bg-emerald-50/20 break-all font-medium">
                                                            {formatVal(newVal)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200/80 text-xs text-zinc-600">
                                    <span className="font-semibold block mb-1">Keterangan:</span>
                                    <span>{selectedActivity.description}</span>
                                </div>
                            )
                        ) : (
                            /* Content: Raw JSON */
                            <pre className="p-3.5 bg-zinc-950 text-zinc-100 rounded-lg text-[11px] font-mono overflow-x-auto max-h-[350px]">
                                {JSON.stringify(
                                    {
                                        old_values: selectedActivity.old_values,
                                        new_values: selectedActivity.new_values,
                                    },
                                    null,
                                    2
                                )}
                            </pre>
                        )}

                        <div className="flex justify-end pt-2">
                            <button
                                onClick={() => setSelectedActivity(null)}
                                className="px-4 py-1.5 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded transition-colors"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}
