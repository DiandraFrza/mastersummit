import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import DataTable, { ColumnDef } from '@/Components/DataTable';
import Badge from '@/Components/Badge';
import {
    BarChart3,
    DollarSign,
    Download,
    CreditCard,
    Building2,
    Clock,
    User,
    CheckCircle2,
    Calendar,
    Receipt,
    Wallet,
    Layers,
    FileSpreadsheet,
    Building,
    Check,
} from 'lucide-react';
import type { PageProps, Pagination, Company } from '@/types';

interface PaymentItem {
    id: number;
    payment_no: string;
    paid_at: string;
    amount: string | number;
    payment_method: string;
    reference_no?: string | null;
    notes?: string | null;
    bank?: { id: number; name: string } | null;
    receivedBy?: { id: number; name: string } | null;
    registration?: {
        id: number;
        reg_no: string;
        registered_at: string;
        service_type: string;
        payer_type: string;
        payment_status: string;
        final_amount: number;
        paid_amount: number;
        remaining_amount: number;
        patient?: { id: number; name: string; medical_record_no: string } | null;
        company?: { id: number; name: string } | null;
        referrer?: { id: number; name: string } | null;
    } | null;
}

interface RevenueProps extends PageProps {
    kpi: {
        total_revenue: number;
        aps_revenue: number;
        corporate_revenue: number;
        referrer_revenue: number;
        total_billed: number;
        remaining_receivables: number;
    };
    recap_by_payer: Array<{
        type: string;
        label: string;
        reg_count: number;
        total_final: number;
        total_paid: number;
        total_remaining: number;
    }>;
    recap_by_method: Array<{
        method: string;
        label: string;
        count: number;
        total_amount: number;
    }>;
    payments: Pagination<PaymentItem>;
    companies: Company[];
    filters: {
        start_date: string;
        end_date: string;
        payer_type: string;
        payment_method: string;
        payment_status: string;
        company_id: string | number;
        search: string;
        per_page: number;
    };
}

export default function Revenue({
    kpi,
    recap_by_payer,
    recap_by_method,
    payments,
    companies,
    filters,
}: RevenueProps) {
    const [activeTab, setActiveTab] = useState<'transactions' | 'recap_payer' | 'recap_method'>('transactions');

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
        router.get(route('reports.revenue.index'), currentParams, {
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
        window.open(`${route('reports.revenue.export')}?${queryParams.toString()}`, '_blank');
    };

    const getPayerBadge = (payerType?: string) => {
        switch (payerType) {
            case 'corporate':
                return <Badge variant="info" label="Corporate MCU" />;
            case 'referrer':
                return <Badge variant="neutral" label="Rujukan" />;
            default:
                return <Badge variant="success" label="APS (Pribadi)" />;
        }
    };

    const getMethodBadge = (method?: string) => {
        switch (method) {
            case 'cash':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Tunai</span>;
            case 'transfer':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">Transfer</span>;
            case 'qris':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">QRIS</span>;
            case 'edc':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">EDC/Debit</span>;
            case 'invoice_corporate':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Invoice</span>;
            default:
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600">{method}</span>;
        }
    };

    const getPaymentStatusBadge = (status?: string) => {
        switch (status) {
            case 'paid':
                return <Badge variant="success" label="LUNAS" />;
            case 'partial':
                return <Badge variant="warning" label="SEBAGIAN" />;
            case 'corporate_billed':
                return <Badge variant="info" label="TAGIHAN CORP" />;
            case 'unpaid':
                return <Badge variant="danger" label="BELUM BAYAR" />;
            default:
                return <Badge variant="neutral" label={status || '-'} />;
        }
    };

    const columns: ColumnDef<PaymentItem>[] = [
        {
            header: 'No. Kwitansi',
            accessorKey: 'payment_no',
            width: '130px',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-mono font-bold text-xs text-zinc-900 tabular-nums">
                        {row.payment_no}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono tabular-nums">
                        {new Date(row.paid_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </span>
                </div>
            ),
        },
        {
            header: 'Registrasi & Pasien',
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
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-500">
                            <span className="font-mono text-zinc-700 tabular-nums">{reg?.reg_no}</span>
                            {reg?.company && (
                                <>
                                    <span>&bull;</span>
                                    <span className="text-zinc-600 truncate max-w-[140px]">
                                        {reg.company.name}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            header: 'Penjamin',
            id: 'payer_type',
            width: '120px',
            cell: ({ row }) => getPayerBadge(row.registration?.payer_type),
        },
        {
            header: 'Metode & Bank',
            id: 'method',
            width: '130px',
            cell: ({ row }) => (
                <div className="flex flex-col gap-1">
                    <div>{getMethodBadge(row.payment_method)}</div>
                    {row.bank && (
                        <span className="text-[10px] text-zinc-500 font-medium">
                            {row.bank.name}
                        </span>
                    )}
                </div>
            ),
        },
        {
            header: 'Jumlah Bayar',
            accessorKey: 'amount',
            align: 'right',
            width: '130px',
            cell: ({ row }) => (
                <div className="text-right">
                    <span className="font-bold text-xs text-zinc-900 font-mono tabular-nums">
                        {formatIdr(row.amount)}
                    </span>
                    {row.reference_no && (
                        <span className="text-[10px] text-zinc-400 block font-mono">
                            Ref: {row.reference_no}
                        </span>
                    )}
                </div>
            ),
        },
        {
            header: 'Status Tagihan',
            id: 'status',
            width: '120px',
            cell: ({ row }) => getPaymentStatusBadge(row.registration?.payment_status),
        },
        {
            header: 'Penerima',
            id: 'receiver',
            width: '100px',
            cell: ({ row }) => (
                <span className="text-xs text-zinc-600 truncate block">
                    {row.receivedBy?.name || 'Kasir'}
                </span>
            ),
        },
    ];

    return (
        <>
            <Head title="Laporan Pendapatan" />

            <div className="space-y-4">
                {/* Header Title & Actions */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-zinc-200">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-zinc-900">
                            Laporan Pendapatan
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
                            <span className="text-[11px] font-medium text-zinc-500">Total Pendapatan Masuk</span>
                            <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <DollarSign className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-xl font-bold font-mono text-zinc-900 mt-1 tabular-nums">
                            {formatIdr(kpi.total_revenue)}
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">Arus kas tunai &amp; bank terealisasi</div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-zinc-200/80 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-zinc-500">Pendapatan APS (Pribadi)</span>
                            <div className="w-7 h-7 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                                <User className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-xl font-bold font-mono text-zinc-900 mt-1 tabular-nums">
                            {formatIdr(kpi.aps_revenue)}
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">Pasien umum &amp; mandiri</div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-zinc-200/80 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-zinc-500">Pendapatan Corporate MCU</span>
                            <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <Building2 className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-xl font-bold font-mono text-zinc-900 mt-1 tabular-nums">
                            {formatIdr(kpi.corporate_revenue)}
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">Pembayaran klien korporasi</div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-zinc-200/80 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-zinc-500">Sisa Piutang Tagihan</span>
                            <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                                <Clock className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="text-xl font-bold font-mono text-zinc-900 mt-1 tabular-nums">
                            {formatIdr(kpi.remaining_receivables)}
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">Belum lunas / invoice berjalan</div>
                    </div>
                </div>

                {/* Date & Filter Toolbar */}
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
                            <span className="text-zinc-500 text-[11px]">Penjamin:</span>
                            <select
                                value={filters.payer_type}
                                onChange={(e) => handleFilterUpdate('payer_type', e.target.value)}
                                className="px-2 py-1 text-xs border border-zinc-300 rounded bg-white"
                            >
                                <option value="all">Semua Penjamin</option>
                                <option value="aps">APS (Pribadi)</option>
                                <option value="corporate">Corporate MCU</option>
                                <option value="referrer">Rujukan Luar</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <span className="text-zinc-500 text-[11px]">Metode:</span>
                            <select
                                value={filters.payment_method}
                                onChange={(e) => handleFilterUpdate('payment_method', e.target.value)}
                                className="px-2 py-1 text-xs border border-zinc-300 rounded bg-white"
                            >
                                <option value="all">Semua Metode</option>
                                <option value="cash">Tunai</option>
                                <option value="transfer">Transfer Bank</option>
                                <option value="qris">QRIS</option>
                                <option value="edc">Debit / EDC</option>
                                <option value="invoice_corporate">Invoice Perusahaan</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <span className="text-zinc-500 text-[11px]">Status:</span>
                            <select
                                value={filters.payment_status}
                                onChange={(e) => handleFilterUpdate('payment_status', e.target.value)}
                                className="px-2 py-1 text-xs border border-zinc-300 rounded bg-white"
                            >
                                <option value="all">Semua Status</option>
                                <option value="paid">Lunas</option>
                                <option value="partial">Sebagian</option>
                                <option value="corporate_billed">Tagihan Corporate</option>
                                <option value="unpaid">Belum Bayar</option>
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
                        onClick={() => setActiveTab('transactions')}
                        className={`px-3.5 py-2 font-semibold transition-all border-b-2 flex items-center gap-2 ${
                            activeTab === 'transactions'
                                ? 'border-zinc-900 text-zinc-900 bg-white rounded-t border-t border-l border-r border-b-white -mb-px'
                                : 'border-transparent text-zinc-500 hover:text-zinc-800'
                        }`}
                    >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Rincian Pembayaran (Daily Revenue)</span>
                        <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-100 text-zinc-700 font-mono">
                            {payments.total}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('recap_payer')}
                        className={`px-3.5 py-2 font-semibold transition-all border-b-2 flex items-center gap-2 ${
                            activeTab === 'recap_payer'
                                ? 'border-zinc-900 text-zinc-900 bg-white rounded-t border-t border-l border-r border-b-white -mb-px'
                                : 'border-transparent text-zinc-500 hover:text-zinc-800'
                        }`}
                    >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Rekapitulasi Penjamin &amp; Split Billing</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('recap_method')}
                        className={`px-3.5 py-2 font-semibold transition-all border-b-2 flex items-center gap-2 ${
                            activeTab === 'recap_method'
                                ? 'border-zinc-900 text-zinc-900 bg-white rounded-t border-t border-l border-r border-b-white -mb-px'
                                : 'border-transparent text-zinc-500 hover:text-zinc-800'
                        }`}
                    >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Rekapitulasi Metode Bayar</span>
                    </button>
                </div>

                {/* TAB 1: TRANSACTIONS TABLE */}
                {activeTab === 'transactions' && (
                    <div className="bg-white rounded-lg border border-zinc-200/80 shadow-xs overflow-hidden">
                        <DataTable
                            columns={columns}
                            data={payments}
                            filters={filters}
                            searchPlaceholder="Cari no. kwitansi, no. reg, nama pasien, atau ref..."
                            routeName="reports.revenue.index"
                            emptyMessage="Belum ada transaksi pembayaran pada rentang tanggal dan filter ini."
                        />
                    </div>
                )}

                {/* TAB 2: RECAP BY PAYER */}
                {activeTab === 'recap_payer' && (
                    <div className="bg-white rounded-lg border border-zinc-200/80 shadow-xs overflow-hidden">
                        <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200/80">
                            <h2 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                                Rekapitulasi Pendapatan Berdasarkan Penjamin &amp; Tambahan Pribadi (Split Billing)
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-zinc-50/80 text-[11px] text-zinc-500 font-medium border-b border-zinc-200/80">
                                    <tr>
                                        <th className="py-2.5 px-4">Kategori / Penjamin</th>
                                        <th className="py-2.5 px-4 text-center">Jumlah Pasien</th>
                                        <th className="py-2.5 px-4 text-right">Total Nilai Tagihan (Rp)</th>
                                        <th className="py-2.5 px-4 text-right">Sudah Diterima (Rp)</th>
                                        <th className="py-2.5 px-4 text-right">Sisa Piutang (Rp)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {recap_by_payer.map((r) => (
                                        <tr key={r.type} className="hover:bg-zinc-50/50">
                                            <td className="py-3 px-4 font-semibold text-zinc-900">
                                                {r.label}
                                            </td>
                                            <td className="py-3 px-4 text-center font-mono tabular-nums text-zinc-700">
                                                {r.reg_count}
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono tabular-nums text-zinc-800">
                                                {formatIdr(r.total_final)}
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-emerald-700">
                                                {formatIdr(r.total_paid)}
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-rose-700">
                                                {formatIdr(r.total_remaining)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-zinc-50 border-t-2 border-zinc-200 font-bold">
                                    <tr>
                                        <td className="py-3 px-4 text-zinc-900">TOTAL KESELURUHAN</td>
                                        <td className="py-3 px-4 text-center font-mono tabular-nums text-zinc-900">
                                            {recap_by_payer.reduce((acc, c) => acc + c.reg_count, 0)}
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono tabular-nums text-zinc-900">
                                            {formatIdr(kpi.total_billed)}
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700">
                                            {formatIdr(kpi.total_revenue)}
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono tabular-nums text-rose-700">
                                            {formatIdr(kpi.remaining_receivables)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB 3: RECAP BY PAYMENT METHOD */}
                {activeTab === 'recap_method' && (
                    <div className="bg-white rounded-lg border border-zinc-200/80 shadow-xs overflow-hidden">
                        <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200/80">
                            <h2 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                                Rekapitulasi Realisasi Berdasarkan Metode Pembayaran
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-zinc-50/80 text-[11px] text-zinc-500 font-medium border-b border-zinc-200/80">
                                    <tr>
                                        <th className="py-2.5 px-4">Metode Pembayaran</th>
                                        <th className="py-2.5 px-4 text-center">Frekuensi Transaksi</th>
                                        <th className="py-2.5 px-4 text-right">Total Nominal Diterima (Rp)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {recap_by_method.map((m) => (
                                        <tr key={m.method} className="hover:bg-zinc-50/50">
                                            <td className="py-3 px-4 font-semibold text-zinc-900">
                                                {m.label}
                                            </td>
                                            <td className="py-3 px-4 text-center font-mono tabular-nums text-zinc-700">
                                                {m.count}
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-zinc-900">
                                                {formatIdr(m.total_amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-zinc-50 border-t-2 border-zinc-200 font-bold">
                                    <tr>
                                        <td className="py-3 px-4 text-zinc-900">TOTAL SELURUH METODE</td>
                                        <td className="py-3 px-4 text-center font-mono tabular-nums text-zinc-900">
                                            {recap_by_method.reduce((acc, c) => acc + c.count, 0)}
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700">
                                            {formatIdr(kpi.total_revenue)}
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
