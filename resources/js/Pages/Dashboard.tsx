import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DataTable, { ColumnDef } from '@/Components/DataTable';
import Badge, { BadgeVariant } from '@/Components/Badge';
import ActionDropdown, { ActionDropdownItem } from '@/Components/ActionDropdown';
import Modal from '@/Components/Modal';
import {
    Users,
    Contact2,
    Shield,
    Activity as ActivityIcon,
    Eye,
    Copy,
    Building2,
} from 'lucide-react';
import type { PageProps, Pagination, ActivityLog } from '@/types';

interface DashboardProps extends PageProps {
    stats: {
        total_users: number;
        active_employees: number;
        total_roles: number;
        clinic_name: string;
    };
    activities: Pagination<ActivityLog>;
    filters: Record<string, any>;
}

export default function Dashboard({ stats, activities, filters }: DashboardProps) {
    const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

    // Map log event to Badge variant
    const getEventBadgeVariant = (event?: string | null): BadgeVariant => {
        switch (event) {
            case 'created':
                return 'success';
            case 'updated':
                return 'warning';
            case 'deleted':
                return 'danger';
            default:
                return 'neutral';
        }
    };

    const columns: ColumnDef<ActivityLog>[] = [
        {
            header: 'ID',
            accessorKey: 'id',
            isNumeric: true,
            sortable: true,
            width: '70px',
            align: 'center',
            cell: ({ value }) => (
                <span className="font-mono text-zinc-500 tabular-nums">#{value}</span>
            ),
        },
        {
            header: 'Waktu',
            accessorKey: 'created_at',
            isNumeric: true,
            sortable: true,
            width: '160px',
            cell: ({ value }) => {
                const date = new Date(value);
                return (
                    <span className="tabular-nums text-zinc-600">
                        {date.toLocaleString('id-ID', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                        })}
                    </span>
                );
            },
        },
        {
            header: 'Event',
            accessorKey: 'event',
            sortable: true,
            width: '100px',
            cell: ({ value }) => (
                <Badge variant={getEventBadgeVariant(value)} label={value || 'system'} />
            ),
        },
        {
            header: 'Aktivitas / Deskripsi',
            accessorKey: 'description',
            sortable: true,
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium text-zinc-800">{row.description}</span>
                    {row.log_name && (
                        <span className="text-[10px] text-zinc-400 font-mono">
                            channel: {row.log_name}
                        </span>
                    )}
                </div>
            ),
        },
        {
            header: 'Operator / Causer',
            id: 'causer',
            sortable: false,
            width: '160px',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center text-[10px] font-semibold shrink-0">
                        {row.causer?.name?.charAt(0).toUpperCase() || 'S'}
                    </div>
                    <span className="truncate text-zinc-700">
                        {row.causer?.name || 'Sistem / Seeder'}
                    </span>
                </div>
            ),
        },
        {
            header: 'Aksi',
            id: 'actions',
            align: 'right',
            width: '90px',
            cell: ({ row }) => {
                const items: ActionDropdownItem[] = [
                    {
                        label: 'Lihat Detail',
                        icon: Eye,
                        onClick: () => setSelectedLog(row),
                    },
                    {
                        label: 'Salin ID Log',
                        icon: Copy,
                        onClick: () => {
                            navigator.clipboard.writeText(String(row.id));
                        },
                    },
                ];

                return <ActionDropdown items={items} align="right" />;
            },
        },
    ];

    return (
        <AuthenticatedLayout title="Dashboard">
            <Head title="Dashboard — Master Summit" />

            <div className="space-y-6">
                {/* Header Welcome Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-200/70">
                    <div>
                        <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
                            Ringkasan Operasional Klinik
                        </h2>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Status data master, pengguna aktif, dan riwayat aktivitas audit sistem.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-zinc-200/80 rounded-sm text-xs font-medium text-zinc-700 shadow-2xs">
                            <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{stats.clinic_name}</span>
                        </span>
                    </div>
                </div>

                {/* 4 Stat KPI Cards (Linear style: white surface, subtle border, tabular-nums) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    <div className="bg-white border border-zinc-200/80 rounded-md p-4 shadow-2xs">
                        <div className="flex items-center justify-between text-zinc-400 mb-2">
                            <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                                Total Pengguna
                            </span>
                            <Users className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div className="text-xl font-semibold text-zinc-900 tabular-nums">
                            {stats.total_users}
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1">Akun login aktif terdaftar</p>
                    </div>

                    <div className="bg-white border border-zinc-200/80 rounded-md p-4 shadow-2xs">
                        <div className="flex items-center justify-between text-zinc-400 mb-2">
                            <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                                Pegawai Aktif
                            </span>
                            <Contact2 className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div className="text-xl font-semibold text-zinc-900 tabular-nums">
                            {stats.active_employees}
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1">Dokter, analis, perawat & staff</p>
                    </div>

                    <div className="bg-white border border-zinc-200/80 rounded-md p-4 shadow-2xs">
                        <div className="flex items-center justify-between text-zinc-400 mb-2">
                            <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                                Role Akses
                            </span>
                            <Shield className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div className="text-xl font-semibold text-zinc-900 tabular-nums">
                            {stats.total_roles}
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1">Multi-role RBAC matrix</p>
                    </div>

                    <div className="bg-white border border-zinc-200/80 rounded-md p-4 shadow-2xs">
                        <div className="flex items-center justify-between text-zinc-400 mb-2">
                            <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                                Total Audit Log
                            </span>
                            <ActivityIcon className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="text-xl font-semibold text-zinc-900 tabular-nums">
                            {activities.total}
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1">Rekaman aktivitas termonitor</p>
                    </div>
                </div>

                {/* Audit Activity DataTable Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                                Audit Trail Aktivitas Sistem
                            </h3>
                            <p className="text-[11px] text-zinc-500">
                                Rekaman perubahan data transaksi dan master yang diverifikasi secara real-time.
                            </p>
                        </div>
                    </div>

                    {/* Full Server-Side DataTable */}
                    <DataTable
                        data={activities}
                        columns={columns}
                        filters={filters}
                        searchPlaceholder="Cari aktivitas, event, atau operator..."
                        routeName="dashboard"
                    />
                </div>
            </div>

            {/* Modal Detail Activity Log */}
            <Modal
                isOpen={!!selectedLog}
                onClose={() => setSelectedLog(null)}
                title={`Detail Log Aktivitas #${selectedLog?.id}`}
                subtitle="Informasi lengkap perubahan data dan operator"
                maxWidth="md"
                footer={
                    <button
                        type="button"
                        onClick={() => setSelectedLog(null)}
                        className="px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-100 rounded-sm transition-colors cursor-pointer"
                    >
                        Tutup
                    </button>
                }
            >
                {selectedLog && (
                    <div className="space-y-3 text-xs">
                        <div className="grid grid-cols-2 gap-2 bg-zinc-50 p-2.5 rounded-sm border border-zinc-200/70">
                            <div>
                                <span className="text-zinc-400 block text-[10px]">Event:</span>
                                <Badge
                                    variant={getEventBadgeVariant(selectedLog.event)}
                                    label={selectedLog.event || 'system'}
                                />
                            </div>
                            <div>
                                <span className="text-zinc-400 block text-[10px]">Log Name:</span>
                                <span className="font-mono text-zinc-700">{selectedLog.log_name}</span>
                            </div>
                            <div>
                                <span className="text-zinc-400 block text-[10px]">Operator:</span>
                                <span className="font-medium text-zinc-800">
                                    {selectedLog.causer?.name || 'Sistem'}
                                </span>
                            </div>
                            <div>
                                <span className="text-zinc-400 block text-[10px]">Waktu:</span>
                                <span className="tabular-nums text-zinc-700">
                                    {new Date(selectedLog.created_at).toLocaleString('id-ID')}
                                </span>
                            </div>
                        </div>

                        <div>
                            <span className="text-zinc-500 font-medium block mb-1">Deskripsi:</span>
                            <p className="bg-zinc-50 p-2 rounded-sm border border-zinc-200/70 text-zinc-800">
                                {selectedLog.description}
                            </p>
                        </div>

                        {selectedLog.properties && Object.keys(selectedLog.properties).length > 0 && (
                            <div>
                                <span className="text-zinc-500 font-medium block mb-1">
                                    Properties (Payload Perubahan):
                                </span>
                                <pre className="bg-zinc-900 text-zinc-200 p-2.5 rounded-sm text-[11px] font-mono overflow-x-auto max-h-48 leading-relaxed">
                                    {JSON.stringify(selectedLog.properties, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}
