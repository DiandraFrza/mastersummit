import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import Badge from '@/Components/Badge';
import Modal from '@/Components/Modal';
import {
    FileSpreadsheet,
    Download,
    Upload,
    ArrowLeft,
    FlaskConical,
    Volume2,
    HeartPulse,
    CheckCircle2,
    Clock,
    AlertTriangle,
    XCircle,
    Info,
    CalendarDays,
    Building2,
    Users,
    FileCheck2,
    ChevronRight,
    Eye,
} from 'lucide-react';
import type {
    PageProps,
    Pagination,
    McuEvent,
    ExcelImportLog,
    ExcelImportLogError,
} from '@/types';

interface BulkProps extends PageProps {
    mcuEvent: McuEvent;
    kpi: {
        total: number;
        registered: number;
        in_progress: number;
        result_entered: number;
        completed: number;
    };
    importLogs: Pagination<ExcelImportLog>;
}

export default function Bulk({ auth, mcuEvent, kpi, importLogs }: BulkProps) {
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<'lab_results' | 'audiometry' | 'physical'>('lab_results');
    const [selectedCategoryTitle, setSelectedCategoryTitle] = useState('Laboratorium');

    const [errorModalOpen, setErrorModalOpen] = useState(false);
    const [activeErrorLog, setActiveErrorLog] = useState<ExcelImportLog | null>(null);

    const {
        data: uploadData,
        setData: setUploadData,
        post: postImport,
        processing: importProcessing,
        reset: resetUploadForm,
        errors: uploadErrors,
    } = useForm({
        file: null as File | null,
        import_type: 'lab_results',
    });

    const openUploadModal = (type: 'lab_results' | 'audiometry' | 'physical', title: string) => {
        setSelectedCategory(type);
        setSelectedCategoryTitle(title);
        setUploadData('import_type', type);
        setUploadData('file', null);
        setUploadModalOpen(true);
    };

    const handleUploadSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadData.file) return;

        postImport(route('events.bulk-results.import', mcuEvent.id), {
            preserveScroll: true,
            onSuccess: () => {
                setUploadModalOpen(false);
                resetUploadForm();
            },
        });
    };

    const openErrorModal = (log: ExcelImportLog) => {
        setActiveErrorLog(log);
        setErrorModalOpen(true);
    };

    const getImportTypeBadge = (type: string) => {
        switch (type) {
            case 'lab_results':
                return (
                    <Badge variant="blue">
                        <FlaskConical className="h-3 w-3 mr-1" />
                        Laboratorium
                    </Badge>
                );
            case 'audiometry':
                return (
                    <Badge variant="purple">
                        <Volume2 className="h-3 w-3 mr-1" />
                        Audiometri
                    </Badge>
                );
            case 'physical':
                return (
                    <Badge variant="emerald">
                        <HeartPulse className="h-3 w-3 mr-1" />
                        Fisik & Vital
                    </Badge>
                );
            default:
                return <Badge variant="zinc">{type}</Badge>;
        }
    };

    return (
        <>
            <Head title={`Input Hasil Excel - ${mcuEvent.event_name}`} />

            <div className="space-y-5">
                {/* Header Banner */}
                <div className="rounded-sm border border-zinc-200 bg-white p-4 shadow-2xs">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
                        <div className="flex items-center gap-3">
                            <Link
                                href={route('events.index')}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 transition-colors shadow-2xs"
                                title="Kembali"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
                                        {mcuEvent.event_name}
                                    </h1>
                                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-sm bg-zinc-100 text-zinc-700 border border-zinc-200">
                                        {mcuEvent.event_code}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 mt-1">
                                    <span className="flex items-center gap-1">
                                        <Building2 className="h-3.5 w-3.5 text-zinc-400" />
                                        <span>{mcuEvent.company?.name || 'Umum'}</span>
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                        <CalendarDays className="h-3.5 w-3.5 text-zinc-400" />
                                        <span>Tahun {mcuEvent.year}</span>
                                    </span>
                                    {mcuEvent.city && (
                                        <>
                                            <span>•</span>
                                            <span>{mcuEvent.city}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Event Link shortcut */}
                        <div className="flex items-center gap-2">
                            <Link
                                href={route('examinations.index')}
                                className="inline-flex items-center gap-1.5 rounded-sm border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                            >
                                <span>Antrean Hasil</span>
                                <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
                            </Link>
                        </div>
                    </div>

                    {/* KPI Stat Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
                        <div className="rounded border border-zinc-100 bg-zinc-50/60 p-2.5">
                            <span className="text-[11px] text-zinc-500 font-medium">Total Peserta Terdaftar</span>
                            <div className="mt-0.5 text-lg font-bold font-mono text-zinc-900 tabular-nums">
                                {kpi.total}
                            </div>
                        </div>
                        <div className="rounded border border-amber-100 bg-amber-50/40 p-2.5">
                            <span className="text-[11px] text-amber-700 font-medium">Sedang Berjalan (Sampel)</span>
                            <div className="mt-0.5 text-lg font-bold font-mono text-amber-800 tabular-nums">
                                {kpi.in_progress}
                            </div>
                        </div>
                        <div className="rounded border border-blue-100 bg-blue-50/40 p-2.5">
                            <span className="text-[11px] text-blue-700 font-medium">Hasil Selesai Diinput</span>
                            <div className="mt-0.5 text-lg font-bold font-mono text-blue-800 tabular-nums">
                                {kpi.result_entered}
                            </div>
                        </div>
                        <div className="rounded border border-emerald-100 bg-emerald-50/40 p-2.5">
                            <span className="text-[11px] text-emerald-700 font-medium">Selesai / Terverifikasi</span>
                            <div className="mt-0.5 text-lg font-bold font-mono text-emerald-800 tabular-nums">
                                {kpi.completed}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3 Category Action Cards for Pre-filled Export & Bulk Import */}
                <div>
                    <h2 className="text-xs font-semibold text-zinc-800 uppercase tracking-wider mb-2.5">
                        Pusat Download Template & Upload Massal Hasil Pemeriksaan
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* 1. Laboratorium */}
                        <div className="rounded border border-zinc-200 bg-white p-4 shadow-2xs flex flex-col justify-between space-y-3">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-50 text-blue-600">
                                        <FlaskConical className="h-4 w-4" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-zinc-900">Laboratorium</h3>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-zinc-100">
                                <a
                                    href={route('events.bulk-results.template', { mcuEvent: mcuEvent.id, category: 'lab' })}
                                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-sm border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
                                >
                                    <Download className="h-3.5 w-3.5 text-zinc-500" />
                                    <span>Unduh Template</span>
                                </a>

                                <button
                                    type="button"
                                    onClick={() => openUploadModal('lab_results', 'Laboratorium')}
                                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-sm bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors shadow-2xs"
                                >
                                    <Upload className="h-3.5 w-3.5" />
                                    <span>Unggah Hasil</span>
                                </button>
                            </div>
                        </div>

                        {/* 2. Audiometri */}
                        <div className="rounded border border-zinc-200 bg-white p-4 shadow-2xs flex flex-col justify-between space-y-3">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded bg-purple-50 text-purple-600">
                                        <Volume2 className="h-4 w-4" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-zinc-900">Audiometri</h3>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-zinc-100">
                                <a
                                    href={route('events.bulk-results.template', { mcuEvent: mcuEvent.id, category: 'audiometry' })}
                                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-sm border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
                                >
                                    <Download className="h-3.5 w-3.5 text-zinc-500" />
                                    <span>Unduh Template</span>
                                </a>

                                <button
                                    type="button"
                                    onClick={() => openUploadModal('audiometry', 'Audiometri')}
                                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-sm bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 transition-colors shadow-2xs"
                                >
                                    <Upload className="h-3.5 w-3.5" />
                                    <span>Unggah Hasil</span>
                                </button>
                            </div>
                        </div>

                        {/* 3. Pemeriksaan Fisik & Tanda Vital */}
                        <div className="rounded border border-zinc-200 bg-white p-4 shadow-2xs flex flex-col justify-between space-y-3">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded bg-emerald-50 text-emerald-600">
                                        <HeartPulse className="h-4 w-4" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-zinc-900">Pemeriksaan Fisik</h3>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-zinc-100">
                                <a
                                    href={route('events.bulk-results.template', { mcuEvent: mcuEvent.id, category: 'physical' })}
                                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-sm border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-colors"
                                >
                                    <Download className="h-3.5 w-3.5 text-zinc-500" />
                                    <span>Unduh Template</span>
                                </a>

                                <button
                                    type="button"
                                    onClick={() => openUploadModal('physical', 'Pemeriksaan Fisik')}
                                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-sm bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors shadow-2xs"
                                >
                                    <Upload className="h-3.5 w-3.5" />
                                    <span>Unggah Hasil</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Import History Table (`excel_import_logs`) */}
                <div className="rounded border border-zinc-200 bg-white shadow-2xs overflow-hidden">
                    <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/80 px-4 py-2.5">
                        <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4 text-zinc-600" />
                            <h3 className="text-xs font-semibold text-zinc-900">
                                Riwayat Log Unggah Massal Excel ({importLogs.total})
                            </h3>
                        </div>
                        <span className="text-[11px] text-zinc-500">
                            Pencatatan riwayat audit dan deteksi baris error
                        </span>
                    </div>

                    {importLogs.data.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-zinc-200 text-zinc-500 text-[11px]">
                                        <th className="py-2 px-3 font-medium">Waktu Unggah</th>
                                        <th className="py-2 px-3 font-medium">Jenis Hasil</th>
                                        <th className="py-2 px-3 font-medium">Nama File</th>
                                        <th className="py-2 px-3 font-medium text-center">Total Baris</th>
                                        <th className="py-2 px-3 font-medium text-center">Berhasil</th>
                                        <th className="py-2 px-3 font-medium text-center">Gagal</th>
                                        <th className="py-2 px-3 font-medium">Pengunggah</th>
                                        <th className="py-2 px-3 font-medium text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {importLogs.data.map((log) => (
                                        <tr key={log.id} className="hover:bg-zinc-50/60">
                                            <td className="py-2 px-3 font-mono text-zinc-700 tabular-nums">
                                                {log.created_at ? new Date(log.created_at).toLocaleString('id-ID', {
                                                    dateStyle: 'medium',
                                                    timeStyle: 'short',
                                                }) : '-'}
                                            </td>
                                            <td className="py-2 px-3">
                                                {getImportTypeBadge(log.import_type)}
                                            </td>
                                            <td className="py-2 px-3 text-zinc-800 font-medium">
                                                {log.original_filename || '-'}
                                            </td>
                                            <td className="py-2 px-3 text-center font-mono font-medium text-zinc-700 tabular-nums">
                                                {log.total_rows}
                                            </td>
                                            <td className="py-2 px-3 text-center font-mono font-semibold text-emerald-700 tabular-nums">
                                                {log.success_rows}
                                            </td>
                                            <td className="py-2 px-3 text-center font-mono tabular-nums">
                                                {log.failed_rows > 0 ? (
                                                    <span className="font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                                                        {log.failed_rows}
                                                    </span>
                                                ) : (
                                                    <span className="text-zinc-400">0</span>
                                                )}
                                            </td>
                                            <td className="py-2 px-3 text-zinc-600">
                                                {log.uploader?.name || '-'}
                                            </td>
                                            <td className="py-2 px-3 text-right">
                                                {log.failed_rows > 0 && log.error_details_json && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openErrorModal(log)}
                                                        className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 hover:text-red-800 transition-colors"
                                                    >
                                                        <Eye className="h-3 w-3" />
                                                        <span>Detail Error ({log.failed_rows})</span>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-8 text-center text-xs text-zinc-400 italic">
                            Belum ada riwayat impor Excel hasil untuk event MCU ini.
                        </div>
                    )}
                </div>
            </div>

            {/* Upload Modal */}
            <Modal
                isOpen={uploadModalOpen}
                onClose={() => setUploadModalOpen(false)}
                title={`Unggah File Excel Hasil — ${selectedCategoryTitle}`}
                maxWidth="md"
            >
                <form onSubmit={handleUploadSubmit} className="space-y-4">
                    <div className="rounded border border-blue-200 bg-blue-50/50 p-3 text-xs text-blue-800 space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-blue-900">
                            <Info className="h-4 w-4" />
                            <span>Petunjuk Pengunggahan Berkas Excel:</span>
                        </div>
                        <ul className="list-disc list-inside space-y-0.5 text-[11px] text-blue-700 pl-1">
                            <li>Gunakan template resmi yang telah diunduh dari tombol di atas.</li>
                            <li>Kolom identitas seperti <strong>No. Reg</strong> tidak boleh diubah.</li>
                            <li>
                                Header parameter dengan kode kurung seperti <strong>[code]</strong> harus dipertahankan agar dapat dibaca otomatis.
                            </li>
                        </ul>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                            Pilih Berkas Excel (.xlsx, .xls, .csv):
                        </label>
                        <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={(e) => setUploadData('file', e.target.files ? e.target.files[0] : null)}
                            className="block w-full text-xs text-zinc-500 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-white hover:file:bg-zinc-800 cursor-pointer border border-zinc-200 rounded"
                        />
                        {uploadErrors.file && (
                            <p className="text-[11px] text-red-600 mt-1">{uploadErrors.file}</p>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                        <button
                            type="button"
                            onClick={() => setUploadModalOpen(false)}
                            className="rounded-sm border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={importProcessing || !uploadData.file}
                            className="inline-flex items-center gap-1.5 rounded-sm bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors shadow-2xs disabled:opacity-50"
                        >
                            <Upload className="h-3.5 w-3.5" />
                            <span>{importProcessing ? 'Memproses Impor...' : 'Mulai Impor & Validasi'}</span>
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Error Detail Modal */}
            <Modal
                isOpen={errorModalOpen}
                onClose={() => setErrorModalOpen(false)}
                title="Rincian Baris Gagal pada Berkas Excel"
                maxWidth="lg"
            >
                <div className="space-y-3">
                    <p className="text-xs text-zinc-600">
                        Berikut adalah daftar baris pada berkas Excel yang tidak dapat diimpor beserta penyebabnya:
                    </p>

                    <div className="max-h-72 overflow-y-auto rounded border border-zinc-200">
                        <table className="w-full text-xs text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-[11px]">
                                    <th className="py-1.5 px-2.5 font-medium w-16 text-center">Baris</th>
                                    <th className="py-1.5 px-2.5 font-medium w-28">No. Reg</th>
                                    <th className="py-1.5 px-2.5 font-medium">Keterangan Error</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 font-mono text-[11px]">
                                {Array.isArray(activeErrorLog?.error_details_json) ? (
                                    activeErrorLog?.error_details_json.map((errItem: any, idx: number) => {
                                        if (typeof errItem === 'string') {
                                            return (
                                                <tr key={idx}>
                                                    <td className="py-1.5 px-2.5 text-center text-zinc-400">-</td>
                                                    <td className="py-1.5 px-2.5 text-zinc-400">-</td>
                                                    <td className="py-1.5 px-2.5 text-red-600">{errItem}</td>
                                                </tr>
                                            );
                                        }
                                        return (
                                            <tr key={idx} className="hover:bg-zinc-50/70">
                                                <td className="py-1.5 px-2.5 text-center text-zinc-700">
                                                    {errItem.row || idx + 2}
                                                </td>
                                                <td className="py-1.5 px-2.5 text-zinc-900 font-semibold">
                                                    {errItem.reg_no || '-'}
                                                </td>
                                                <td className="py-1.5 px-2.5 text-red-600 font-sans">
                                                    {errItem.error || JSON.stringify(errItem)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="py-3 text-center text-zinc-400 italic">
                                            Tidak ada rincian error yang tercatat.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-zinc-100">
                        <button
                            type="button"
                            onClick={() => setErrorModalOpen(false)}
                            className="rounded-sm bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 transition-colors"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
