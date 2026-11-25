import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import DataTable, { ColumnDef } from '@/Components/DataTable';
import Badge from '@/Components/Badge';
import ActionDropdown, { ActionDropdownItem } from '@/Components/ActionDropdown';
import Modal from '@/Components/Modal';
import {
    FileCheck2,
    Search,
    Share2,
    Copy,
    ExternalLink,
    Clock,
    CheckCircle2,
    AlertTriangle,
    ShieldAlert,
    Ban,
    RotateCw,
    Download,
    Printer,
    FileText,
    MessageCircle,
    Building2,
    Calendar,
    User,
    Check,
} from 'lucide-react';
import type {
    PageProps,
    Pagination,
    Registration,
    Company,
    WorkflowStatus,
} from '@/types';

interface TokenInfo {
    id: number;
    token: string;
    portal_url: string;
    expires_at: string;
    is_revoked: boolean;
    is_expired: boolean;
    is_valid: boolean;
    days_remaining: number;
    access_count: number;
    last_accessed_at?: string;
    extended_at?: string;
    extended_by?: string;
}

interface RegistrationWithToken extends Registration {
    token_info?: TokenInfo | null;
}

interface ResultsIndexProps extends PageProps {
    registrations: Pagination<RegistrationWithToken>;
    companies: Company[];
    kpi: {
        total_completed: number;
        active_tokens: number;
        expired_tokens: number;
        revoked_tokens: number;
    };
    filters: {
        status?: string;
        service_type?: string;
        token_status?: string;
        company_id?: string | number;
        date?: string;
        search?: string;
        per_page?: number;
    };
}

export default function ResultsIndex({
    registrations,
    companies,
    kpi,
    filters,
}: ResultsIndexProps) {
    // WhatsApp modal state
    const [selectedWaReg, setSelectedWaReg] = useState<RegistrationWithToken | null>(null);
    const [waPayload, setWaPayload] = useState<{
        phone: string;
        message: string;
        wa_link: string;
        portal_url: string;
    } | null>(null);
    const [isWaModalOpen, setIsWaModalOpen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const handleCopyUrl = (url: string) => {
        navigator.clipboard.writeText(url);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleOpenWaModal = (reg: RegistrationWithToken) => {
        setSelectedWaReg(reg);
        setIsWaModalOpen(true);
        fetch(route('results.whatsapp-info', reg.id))
            .then((res) => res.json())
            .then((data) => setWaPayload(data))
            .catch(() => setWaPayload(null));
    };

    const handleExtendToken = (reg: RegistrationWithToken) => {
        if (confirm(`Perpanjang masa aktif hasil online untuk ${reg.patient?.name} selama +30 hari?`)) {
            router.post(route('results.extend-token', reg.id), {}, { preserveScroll: true });
        }
    };

    const handleRevokeToken = (reg: RegistrationWithToken) => {
        if (confirm(`Cabut akses tautan hasil online untuk ${reg.patient?.name}? Pasien tidak akan dapat mengakses dokumen secara online sampai diperpanjang kembali.`)) {
            router.post(route('results.revoke-token', reg.id), {}, { preserveScroll: true });
        }
    };

    const handleGenerateToken = (reg: RegistrationWithToken) => {
        router.post(route('results.generate-token', reg.id), {}, { preserveScroll: true });
    };

    const columns: ColumnDef<RegistrationWithToken>[] = [
        {
            header: 'No. Registrasi',
            accessorKey: 'reg_no',
            isNumeric: true,
            sortable: true,
            width: '140px',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-mono font-bold text-zinc-900 tabular-nums text-xs">
                        {row.reg_no}
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono tabular-nums">
                        {row.registered_at?.substring(0, 16)}
                    </span>
                </div>
            ),
        },
        {
            header: 'Pasien & Identitas',
            id: 'patient_identity',
            cell: ({ row }) => (
                <div className="flex flex-col text-xs">
                    <span className="font-semibold text-zinc-900">{row.patient?.name}</span>
                    <span className="text-[11px] text-zinc-500 font-mono flex items-center gap-2 mt-0.5">
                        <span>NRM: {row.patient?.medical_record_no}</span>
                        {row.patient?.phone && <span>• HP: {row.patient.phone}</span>}
                    </span>
                </div>
            ),
        },
        {
            header: 'Layanan & Klien',
            id: 'service_client',
            cell: ({ row }) => (
                <div className="flex flex-col text-xs">
                    <span className="font-medium text-zinc-800 capitalize">
                        {row.service_type === 'mcu' ? 'MCU Korporat' : 'Reguler / APS'}
                    </span>
                    <span className="text-[11px] text-zinc-500 truncate max-w-[180px]">
                        {row.company?.name || row.mcu_event?.company?.name || 'Pasien Umum / Mandiri'}
                    </span>
                </div>
            ),
        },
        {
            header: 'Status Alur Kerja',
            accessorKey: 'workflow_status',
            width: '130px',
            align: 'center',
            cell: ({ value }) => {
                if (value === 'completed') {
                    return <Badge variant="success" icon={CheckCircle2} label="Selesai (Completed)" />;
                }
                if (value === 'manager_approved') {
                    return <Badge variant="info" icon={Clock} label="QC Approved" />;
                }
                if (value === 'doctor_reviewed') {
                    return <Badge variant="warning" icon={Clock} label="Review Dokter" />;
                }
                return <Badge variant="neutral" label={value} />;
            },
        },
        {
            header: 'Status Portal Online (30 Hari)',
            id: 'token_status',
            width: '200px',
            cell: ({ row }) => {
                const token = row.token_info;
                if (!token) {
                    return (
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-zinc-400 italic">Belum dibuatkan</span>
                            <button
                                type="button"
                                onClick={() => handleGenerateToken(row)}
                                className="text-[10px] text-blue-600 hover:underline font-medium"
                            >
                                (Buat Token)
                            </button>
                        </div>
                    );
                }

                if (token.is_revoked) {
                    return (
                        <div className="flex flex-col text-xs">
                            <Badge variant="danger" icon={Ban} label="Akses Dicabut" />
                            <span className="text-[10px] text-zinc-400 mt-0.5">Dinonaktifkan admin</span>
                        </div>
                    );
                }

                if (token.is_expired) {
                    return (
                        <div className="flex flex-col text-xs">
                            <Badge variant="warning" icon={AlertTriangle} label="Kedaluwarsa" />
                            <span className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                                Habis: {token.expires_at.substring(0, 10)}
                            </span>
                        </div>
                    );
                }

                return (
                    <div className="flex flex-col text-xs">
                        <div className="flex items-center gap-1.5">
                            <Badge variant="success" icon={CheckCircle2} label={`Aktif (${token.days_remaining} hari)`} />
                        </div>
                        <span className="text-[10px] text-zinc-500 mt-0.5 font-mono">
                            Hingga: {token.expires_at.substring(0, 10)} ({token.access_count}x diakses)
                        </span>
                    </div>
                );
            },
        },
        {
            header: 'Aksi',
            id: 'actions',
            align: 'right',
            width: '80px',
            cell: ({ row }) => {
                const token = row.token_info;
                const items: ActionDropdownItem[] = [];

                if (token && token.is_valid) {
                    items.push({
                        label: 'Bagikan via WhatsApp',
                        icon: MessageCircle,
                        onClick: () => handleOpenWaModal(row),
                    });
                    items.push({
                        label: 'Salin Link Online',
                        icon: Copy,
                        onClick: () => handleCopyUrl(token.portal_url),
                    });
                    items.push({
                        label: 'Buka Portal Pasien',
                        icon: ExternalLink,
                        onClick: () => window.open(token.portal_url, '_blank'),
                    });
                }

                if (token) {
                    items.push({
                        label: 'Perpanjang Akses (+30 Hari)',
                        icon: RotateCw,
                        onClick: () => handleExtendToken(row),
                    });

                    if (!token.is_revoked) {
                        items.push({
                            label: 'Cabut Akses (Revoke)',
                            icon: Ban,
                            variant: 'danger',
                            onClick: () => handleRevokeToken(row),
                        });
                    }
                } else {
                    items.push({
                        label: 'Generate Token Online',
                        icon: Share2,
                        onClick: () => handleGenerateToken(row),
                    });
                }

                // Print options
                if (row.service_type === 'mcu') {
                    items.push({
                        label: 'Cetak Buku MCU (HTML)',
                        icon: FileText,
                        onClick: () => window.open(route('prints.mcu-book', row.id), '_blank'),
                    });
                    items.push({
                        label: 'Download Buku MCU (PDF)',
                        icon: Download,
                        onClick: () => window.open(route('prints.mcu-book.pdf', row.id) + '?download=1', '_blank'),
                    });
                } else {
                    items.push({
                        label: 'Cetak Kartu Kontrol',
                        icon: Printer,
                        onClick: () => window.open(route('registrations.control-card', row.id), '_blank'),
                    });
                }

                return <ActionDropdown items={items} align="right" />;
            },
        },
    ];

    return (
        <>
            <Head title="Ambil Hasil" />

            <div className="space-y-4">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-zinc-200">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-zinc-900">
                            Ambil Hasil
                        </h1>
                    </div>
                </div>

                {/* 4 KPI Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white p-3.5 rounded-lg border border-zinc-200/80 shadow-xs">
                        <div className="text-[11px] font-medium text-zinc-500">Pemeriksaan Selesai</div>
                        <div className="text-xl font-bold font-mono text-zinc-900 mt-1 tabular-nums">
                            {kpi.total_completed.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">Workflow status: completed</div>
                    </div>

                    <div className="bg-white p-3.5 rounded-lg border border-zinc-200/80 shadow-xs">
                        <div className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Token Aktif (&lt; 30 Hari)
                        </div>
                        <div className="text-xl font-bold font-mono text-emerald-600 mt-1 tabular-nums">
                            {kpi.active_tokens.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] text-emerald-600/70 mt-0.5">Dapat diakses pasien online</div>
                    </div>

                    <div className="bg-white p-3.5 rounded-lg border border-zinc-200/80 shadow-xs">
                        <div className="text-[11px] font-medium text-amber-700 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Token Kedaluwarsa
                        </div>
                        <div className="text-xl font-bold font-mono text-amber-600 mt-1 tabular-nums">
                            {kpi.expired_tokens.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] text-amber-600/70 mt-0.5">Bisa diperpanjang +30 hari</div>
                    </div>

                    <div className="bg-white p-3.5 rounded-lg border border-zinc-200/80 shadow-xs">
                        <div className="text-[11px] font-medium text-rose-700 flex items-center gap-1">
                            <Ban className="w-3.5 h-3.5 text-rose-600" />
                            Akses Dicabut (Revoked)
                        </div>
                        <div className="text-xl font-bold font-mono text-rose-600 mt-1 tabular-nums">
                            {kpi.revoked_tokens.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] text-rose-600/70 mt-0.5">Privasi pasien terlindungi</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-3 rounded-lg border border-zinc-200/80 shadow-xs flex flex-wrap items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500 font-medium">Status Portal:</span>
                        <select
                            value={filters.token_status || 'all'}
                            onChange={(e) => {
                                router.get(
                                    route('results.index'),
                                    { ...filters, token_status: e.target.value, page: 1 },
                                    { preserveState: true, preserveScroll: true }
                                );
                            }}
                            className="px-2.5 py-1 text-xs rounded-md border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                        >
                            <option value="all">Semua Status Token</option>
                            <option value="active">Aktif (&lt; 30 Hari)</option>
                            <option value="expired">Kedaluwarsa</option>
                            <option value="revoked">Akses Dicabut</option>
                            <option value="none">Belum Dibuatkan</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500 font-medium">Layanan:</span>
                        <select
                            value={filters.service_type || 'all'}
                            onChange={(e) => {
                                router.get(
                                    route('results.index'),
                                    { ...filters, service_type: e.target.value, page: 1 },
                                    { preserveState: true, preserveScroll: true }
                                );
                            }}
                            className="px-2.5 py-1 text-xs rounded-md border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                        >
                            <option value="all">Semua Layanan</option>
                            <option value="mcu">MCU Korporat</option>
                            <option value="regular">Reguler / APS</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500 font-medium">Perusahaan:</span>
                        <select
                            value={filters.company_id || 'all'}
                            onChange={(e) => {
                                router.get(
                                    route('results.index'),
                                    { ...filters, company_id: e.target.value, page: 1 },
                                    { preserveState: true, preserveScroll: true }
                                );
                            }}
                            className="px-2.5 py-1 text-xs rounded-md border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 max-w-[180px]"
                        >
                            <option value="all">Semua Perusahaan</option>
                            {companies.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500 font-medium">Tanggal:</span>
                        <input
                            type="date"
                            value={filters.date || ''}
                            onChange={(e) => {
                                router.get(
                                    route('results.index'),
                                    { ...filters, date: e.target.value, page: 1 },
                                    { preserveState: true, preserveScroll: true }
                                );
                            }}
                            className="px-2.5 py-1 text-xs rounded-md border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                        />
                    </div>
                </div>

                {/* DataTable */}
                <DataTable
                    columns={columns}
                    data={registrations.data}
                    pagination={registrations}
                    searchValue={filters.search}
                    searchPlaceholder="Cari no. registrasi, NRM, nama pasien, NIK, no. HP..."
                    onSearch={(val) => {
                        router.get(
                            route('results.index'),
                            { ...filters, search: val, page: 1 },
                            { preserveState: true, preserveScroll: true }
                        );
                    }}
                />
            </div>

            {/* Modal: Share via WhatsApp */}
            <Modal
                isOpen={isWaModalOpen}
                onClose={() => setIsWaModalOpen(false)}
                title={`Kirim Tautan Hasil ke Pasien: ${selectedWaReg?.patient?.name || ''}`}
                subtitle={`No. Reg: ${selectedWaReg?.reg_no || ''}`}
                maxWidth="md"
                footer={
                    <div className="flex items-center justify-between w-full">
                        <button
                            type="button"
                            onClick={() => handleCopyUrl(waPayload?.portal_url || '')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors"
                        >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            {isCopied ? 'Tersalin!' : 'Salin Tautan'}
                        </button>
                        <div className="flex items-center gap-2">
                            {waPayload?.wa_link && (
                                <a
                                    href={waPayload.wa_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors shadow-xs"
                                >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    Buka WhatsApp
                                </a>
                            )}
                            <button
                                type="button"
                                onClick={() => setIsWaModalOpen(false)}
                                className="px-3.5 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                }
            >
                {waPayload && (
                    <div className="space-y-3 py-1 text-xs">
                        <div>
                            <span className="text-zinc-500 font-medium block mb-1">Nomor WhatsApp Tujuan:</span>
                            <span className="font-mono font-semibold text-zinc-900 bg-zinc-100 px-2 py-1 rounded block">
                                {waPayload.phone ? `+${waPayload.phone}` : '— (Nomor HP belum tercatat di data pasien)'}
                            </span>
                        </div>

                        <div>
                            <span className="text-zinc-500 font-medium block mb-1">Tautan Portal Online:</span>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={waPayload.portal_url}
                                    className="w-full px-2.5 py-1 text-xs font-mono bg-zinc-50 border border-zinc-200 rounded text-zinc-800"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleCopyUrl(waPayload.portal_url)}
                                    className="p-1.5 text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-300 rounded hover:bg-zinc-50 shrink-0"
                                    title="Salin"
                                >
                                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <span className="text-zinc-500 font-medium block mb-1">Preview Pesan WhatsApp:</span>
                            <textarea
                                rows={6}
                                readOnly
                                value={waPayload.message}
                                className="w-full px-3 py-2 text-[11px] font-sans bg-zinc-50 border border-zinc-200 rounded-md text-zinc-800 leading-relaxed"
                            />
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}
