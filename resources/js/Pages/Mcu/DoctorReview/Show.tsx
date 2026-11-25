import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import Badge from '@/Components/Badge';
import {
    ArrowLeft,
    Stethoscope,
    ShieldCheck,
    CheckCircle2,
    AlertTriangle,
    AlertCircle,
    Clock,
    Lock,
    Unlock,
    FileText,
    FileCheck2,
    Save,
    RotateCcw,
    ExternalLink,
    Paperclip,
    Copy,
    User,
    Building2,
    Calendar,
    Eye,
    Printer,
    Download,
} from 'lucide-react';
import type {
    PageProps,
    Registration,
    FitStatus,
    CompiledRecap,
    AbnormalityRecapItem,
    ResultAttachment,
} from '@/types';

interface DoctorReviewShowProps extends PageProps {
    registration: Registration;
    compiledRecap: CompiledRecap;
    fitStatusOptions: Record<FitStatus, string>;
}

export default function Show({
    auth,
    registration,
    compiledRecap,
    fitStatusOptions,
}: DoctorReviewShowProps) {
    const existingReview = registration.mcu_review || registration.mcuReview;
    const isLocked = Boolean(existingReview?.is_locked);

    const [activeTab, setActiveTab] = useState<'recap' | 'all_results' | 'attachments'>('recap');

    const { data, setData, post, processing, errors } = useForm({
        fit_status: existingReview?.fit_status || compiledRecap.suggested_fit_status || 'fit',
        doctor_summary: existingReview?.doctor_summary ?? compiledRecap.summary_draft ?? '',
        doctor_advice: existingReview?.doctor_advice ?? compiledRecap.advice_draft ?? '',
        doctor_notes: existingReview?.doctor_notes ?? '',
        abnormality_recap: (existingReview?.abnormality_recap as AbnormalityRecapItem[]) || compiledRecap.items,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isLocked) return;

        post(route('mcu.doctor-review.store', registration.id), {
            preserveScroll: true,
        });
    };

    const handleResetToAutoDraft = () => {
        if (confirm('Muat ulang kesimpulan dan anjuran dari draft otomatis rekapitulasi kelainan? Teks yang telah diketik akan ditimpa.')) {
            setData((prev) => ({
                ...prev,
                doctor_summary: compiledRecap.summary_draft,
                doctor_advice: compiledRecap.advice_draft,
                fit_status: compiledRecap.suggested_fit_status,
                abnormality_recap: compiledRecap.items,
            }));
        }
    };

    const getFlagBadge = (flag: string) => {
        switch (flag) {
            case 'low':
                return <Badge variant="warning" label="LOW" />;
            case 'high':
                return <Badge variant="warning" label="HIGH" />;
            case 'critical':
                return <Badge variant="danger" label="CRITICAL" />;
            case 'abnormal':
                return <Badge variant="danger" label="ABNORMAL" />;
            default:
                return <Badge variant="neutral" label="NORMAL" />;
        }
    };

    const fitStatusDescriptions: Record<FitStatus, { label: string; desc: string; color: string; border: string }> = {
        fit: {
            label: 'Fit (Laik Kerja)',
            desc: 'Kondisi kesehatan memenuhi syarat untuk semua jenis pekerjaan tanpa batasan.',
            color: 'text-emerald-700 bg-emerald-50/50',
            border: 'border-emerald-300 focus:border-emerald-600',
        },
        fit_with_note: {
            label: 'Fit with Note (Laik dengan Catatan)',
            desc: 'Laik kerja dengan kelainan minor atau kondisi terkontrol yang memerlukan observasi berkala.',
            color: 'text-amber-700 bg-amber-50/50',
            border: 'border-amber-300 focus:border-amber-600',
        },
        temporary_unfit: {
            label: 'Temporary Unfit (Tidak Laik Sementara)',
            desc: 'Kondisi medis memerlukan pengobatan atau pemulihan sebelum dapat dievaluasi kembali.',
            color: 'text-rose-700 bg-rose-50/50',
            border: 'border-rose-300 focus:border-rose-600',
        },
        unfit: {
            label: 'Unfit (Tidak Laik Kerja)',
            desc: 'Kondisi kesehatan tidak memenuhi kualifikasi medis untuk jenis pekerjaan yang dituju.',
            color: 'text-red-800 bg-red-50/50',
            border: 'border-red-400 focus:border-red-600',
        },
        pending: {
            label: 'Pending (Menunggu Tambahan)',
            desc: 'Masih memerlukan pemeriksaan penunjang lanjutan atau rujukan dokter spesialis.',
            color: 'text-sky-700 bg-sky-50/50',
            border: 'border-sky-300 focus:border-sky-600',
        },
    };

    return (
        <>
            <Head title={`Review Dokter MCU - ${registration.reg_no}`} />

            <div className="space-y-6 max-w-7xl mx-auto">
                {/* Top Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-zinc-200">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('mcu.doctor-review.index')}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 transition-colors shadow-2xs"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold tracking-tight text-zinc-900">
                                    Review Dokter MCU
                                </h1>
                                <span className="font-mono text-sm font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-200">
                                    {registration.reg_no}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons & Lock Status Pill */}
                    <div className="flex flex-wrap items-center gap-2">
                        <a
                            href={route('prints.mcu-book', registration.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 h-10 px-3.5 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-sm hover:bg-zinc-50 transition-colors shadow-2xs"
                        >
                            <Printer className="w-4 h-4 text-zinc-600" />
                            Preview Buku MCU
                        </a>
                        <a
                            href={route('prints.mcu-book.pdf', registration.id) + '?download=1'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 h-10 px-3.5 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-sm hover:bg-zinc-50 transition-colors shadow-2xs"
                        >
                            <Download className="w-4 h-4 text-zinc-600" />
                            Download PDF
                        </a>

                        {isLocked ? (
                            <div className="flex items-center gap-2 h-10 px-3.5 bg-rose-50 border border-rose-200 rounded-sm text-rose-800 text-sm font-medium">
                                <Lock className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>Terkunci</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 h-10 px-3.5 bg-emerald-50 border border-emerald-200 rounded-sm text-emerald-800 text-sm font-medium">
                                <Unlock className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>Status Terbuka</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Patient Profile Card */}
                <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
                        <div>
                            <div className="text-zinc-400 font-medium">Nama Pasien</div>
                            <div className="font-bold text-zinc-900 text-sm mt-0.5">
                                {registration.patient?.name}
                            </div>
                            <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                                NIK: {registration.patient?.nik || 'â€”'}
                            </div>
                        </div>

                        <div>
                            <div className="text-zinc-400 font-medium">No. Rekam Medis (NRM)</div>
                            <div className="font-mono font-semibold text-zinc-800 mt-0.5 text-sm">
                                {registration.patient?.medical_record_no}
                            </div>
                            <div className="text-[11px] text-zinc-500 mt-0.5">
                                {registration.patient?.gender === 'L' ? 'Laki-laki' : 'Perempuan'}, {registration.age_years_snapshot || registration.patient?.age} thn
                            </div>
                        </div>

                        <div>
                            <div className="text-zinc-400 font-medium">Perusahaan / Event MCU</div>
                            <div className="font-semibold text-zinc-800 mt-0.5">
                                {registration.mcu_event?.event_name || registration.company?.name || 'Walk-in / APS'}
                            </div>
                            <div className="text-[11px] text-zinc-500 mt-0.5">
                                Kode: {registration.mcu_event?.event_code || 'APS'}
                            </div>
                        </div>

                        <div>
                            <div className="text-zinc-400 font-medium">Departemen / Jabatan</div>
                            <div className="font-semibold text-zinc-800 mt-0.5">
                                {registration.department_snapshot || 'â€”'}
                            </div>
                            <div className="text-[11px] text-zinc-500 mt-0.5">
                                Paket: {registration.package?.name || 'Custom'}
                            </div>
                        </div>

                        <div>
                            <div className="text-zinc-400 font-medium">Dokter Reviewer</div>
                            <div className="font-medium text-zinc-800 mt-0.5">
                                {existingReview?.doctor?.name || 'Belum ditugaskan'}
                            </div>
                            <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                                {existingReview?.doctor_reviewed_at ? new Date(existingReview.doctor_reviewed_at).toLocaleDateString('id-ID') : 'Draft'}
                            </div>
                        </div>

                        <div>
                            <div className="text-zinc-400 font-medium">Manajer MCU (QC)</div>
                            <div className="font-medium text-zinc-800 mt-0.5">
                                {existingReview?.manager?.name || 'Belum QC'}
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">
                                {isLocked ? 'Status: LOCKED' : 'Status: OPEN'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form & Workspace Grid */}
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Clinical Results & Recap Tabs (7 cols) */}
                    <div className="lg:col-span-7 space-y-4">
                        {/* Tab Switcher */}
                        <div className="bg-white border border-zinc-200 rounded-lg p-1.5 shadow-sm flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setActiveTab('recap')}
                                className={`flex-1 py-2 px-3 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                                    activeTab === 'recap'
                                        ? 'bg-zinc-900 text-white shadow-sm'
                                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                                }`}
                            >
                                <AlertTriangle className="w-4 h-4" />
                                <span>Rekapitulasi Kelainan ({compiledRecap.total_abnormalities})</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('all_results')}
                                className={`flex-1 py-2 px-3 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                                    activeTab === 'all_results'
                                        ? 'bg-zinc-900 text-white shadow-sm'
                                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                                }`}
                            >
                                <FileText className="w-4 h-4" />
                                <span>Semua Hasil Penunjang</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('attachments')}
                                className={`flex-1 py-2 px-3 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                                    activeTab === 'attachments'
                                        ? 'bg-zinc-900 text-white shadow-sm'
                                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                                }`}
                            >
                                <Paperclip className="w-4 h-4" />
                                <span>Lampiran File ({registration.result_attachments?.length || registration.resultAttachments?.length || 0})</span>
                            </button>
                        </div>

                        {/* Tab Content: REKAPITULASI KELAINAN */}
                        {activeTab === 'recap' && (
                            <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                                            <span>Temuan Kelainan Klinis (REKAPITULASI KELAINAN)</span>
                                        </h2>
                                        <p className="text-xs text-zinc-500 mt-0.5">
                                            Dihimpun otomatis dari parameter dengan flag Low, High, Abnormal, Critical, atau kelainan audiogram/rontgen.
                                        </p>
                                    </div>
                                    <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full">
                                        {compiledRecap.total_abnormalities} Kelainan
                                    </span>
                                </div>

                                {compiledRecap.total_abnormalities === 0 ? (
                                    <div className="p-8 text-center text-zinc-500 space-y-2">
                                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                                        <div className="font-semibold text-zinc-800">Semua Hasil dalam Batas Normal</div>
                                        <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                                            Tidak terdeteksi parameter yang melampaui rentang nilai rujukan atau menghasilkan temuan kelainan bermakna.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-zinc-200">
                                        {Object.entries(compiledRecap.by_category).map(([category, items]) => (
                                            <div key={category} className="p-4 space-y-3">
                                                <div className="text-xs font-bold uppercase tracking-wider text-zinc-700 bg-zinc-100 px-2 py-1 rounded inline-block">
                                                    {category} ({items.length})
                                                </div>

                                                <div className="space-y-2.5">
                                                    {items.map((item, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="p-3 rounded-lg border border-zinc-200 bg-zinc-50/70 hover:bg-zinc-50 transition-colors space-y-1.5"
                                                        >
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div>
                                                                    <span className="text-xs font-bold text-zinc-900">
                                                                        {item.parameter_name}
                                                                    </span>
                                                                    <span className="text-[11px] text-zinc-500 ml-2">
                                                                        ({item.service_name})
                                                                    </span>
                                                                </div>
                                                                {getFlagBadge(item.flag_status)}
                                                            </div>

                                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1 border-t border-zinc-200/60">
                                                                <div>
                                                                    <span className="text-[11px] text-zinc-400">Hasil:</span>{' '}
                                                                    <span className="font-bold text-zinc-900">
                                                                        {item.value} {item.unit || ''}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-[11px] text-zinc-400">Nilai Rujukan:</span>{' '}
                                                                    <span className="text-zinc-600 font-mono text-[11px]">
                                                                        {item.reference_range || 'â€”'} {item.unit || ''}
                                                                    </span>
                                                                </div>
                                                                {item.conclusion && (
                                                                    <div className="col-span-2 sm:col-span-1">
                                                                        <span className="text-[11px] text-zinc-400">Klinis:</span>{' '}
                                                                        <span className="font-medium text-amber-800">
                                                                            {item.conclusion}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {item.suggestion && (
                                                                <div className="text-[11px] text-zinc-600 bg-amber-50/70 border border-amber-200/60 rounded p-1.5 mt-1">
                                                                    <span className="font-semibold text-amber-900">Saran Sistem:</span> {item.suggestion}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab Content: SEMUA HASIL PEMERIKSAAN */}
                        {activeTab === 'all_results' && (
                            <div className="bg-white border border-zinc-200 rounded-lg shadow-sm p-4 space-y-4">
                                <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-zinc-600" />
                                    <span>Rincian Seluruh Hasil Pemeriksaan Pasien</span>
                                </h2>

                                {registration.items && registration.items.length > 0 ? (
                                    <div className="space-y-4">
                                        {registration.items.map((item) => (
                                            <div key={item.id} className="border border-zinc-200 rounded-lg p-3 space-y-2">
                                                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                                                    <div className="font-bold text-xs text-zinc-800">
                                                        {item.service_name_snapshot || item.service?.name}
                                                    </div>
                                                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 bg-zinc-100 rounded text-zinc-600">
                                                        {item.category}
                                                    </span>
                                                </div>

                                                {item.examination_results && item.examination_results.length > 0 ? (
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left text-xs">
                                                            <thead>
                                                                <tr className="border-b border-zinc-200 text-zinc-500 text-[11px]">
                                                                    <th className="py-1">Parameter</th>
                                                                    <th className="py-1">Hasil</th>
                                                                    <th className="py-1">Satuan</th>
                                                                    <th className="py-1">Rujukan</th>
                                                                    <th className="py-1 text-right">Flag</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-zinc-100">
                                                                {item.examination_results.map((res) => (
                                                                    <tr key={res.id} className="hover:bg-zinc-50">
                                                                        <td className="py-1.5 font-medium text-zinc-800">
                                                                            {res.parameter?.name || 'â€”'}
                                                                        </td>
                                                                        <td className="py-1.5 font-semibold text-zinc-900">
                                                                            {res.value_numeric !== null ? res.value_numeric : (res.value_text || 'â€”')}
                                                                        </td>
                                                                        <td className="py-1.5 text-zinc-500">{res.unit_snapshot || 'â€”'}</td>
                                                                        <td className="py-1.5 font-mono text-[11px] text-zinc-500">
                                                                            {res.reference_snapshot || 'â€”'}
                                                                        </td>
                                                                        <td className="py-1.5 text-right">
                                                                            {getFlagBadge(res.flag_status)}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-zinc-400 italic py-1">
                                                        {item.group_conclusion ? `Kesimpulan: ${item.group_conclusion}` : 'Belum ada hasil pemeriksaan tersimpan.'}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-xs text-zinc-400 italic">Tidak ada item pemeriksaan.</div>
                                )}
                            </div>
                        )}

                        {/* Tab Content: LAMPIRAN FILE */}
                        {activeTab === 'attachments' && (
                            <div className="bg-white border border-zinc-200 rounded-lg shadow-sm p-4 space-y-4">
                                <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                                    <Paperclip className="w-4 h-4 text-zinc-600" />
                                    <span>Lampiran Output Mesin / Hasil Penunjang</span>
                                </h2>

                                {((registration.result_attachments || registration.resultAttachments || []) as ResultAttachment[]).length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {((registration.result_attachments || registration.resultAttachments || []) as ResultAttachment[]).map((att) => (
                                            <div
                                                key={att.id}
                                                className="p-3 border border-zinc-200 rounded-lg bg-zinc-50/60 hover:bg-zinc-50 flex items-center justify-between gap-3 text-xs"
                                            >
                                                <div className="space-y-0.5 truncate">
                                                    <div className="font-medium text-zinc-900 truncate">
                                                        {att.original_filename}
                                                    </div>
                                                    <div className="text-[11px] text-zinc-400 uppercase">
                                                        {att.attachment_type} â€¢ {(att.file_size / 1024).toFixed(1)} KB
                                                    </div>
                                                </div>

                                                <a
                                                    href={att.file_url || `/storage/${att.file_path}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-2.5 py-1.5 bg-white border border-zinc-200 rounded text-zinc-700 hover:bg-zinc-100 flex items-center gap-1 shrink-0"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    <span>Lihat</span>
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-zinc-400 text-xs italic">
                                        Tidak ada berkas PDF/foto mesin yang dilampirkan pada pendaftaran ini.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Doctor Review Decision & Advice Panel (5 cols) */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="bg-white border border-zinc-200 rounded-lg shadow-sm p-5 space-y-5 sticky top-4">
                            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                                <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                                    <Stethoscope className="w-4 h-4 text-emerald-600" />
                                    <span>Keputusan & Rekomendasi Dokter</span>
                                </h2>

                                {!isLocked && (
                                    <button
                                        type="button"
                                        onClick={handleResetToAutoDraft}
                                        title="Muat ulang draft saran & kesimpulan dari analisis kelainan"
                                        className="text-[11px] text-zinc-500 hover:text-zinc-900 flex items-center gap-1 font-medium transition-colors"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                                        <span>Reset Draft</span>
                                    </button>
                                )}
                            </div>

                            {/* Fit to Work Status Selector */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
                                    Status Kelaikan Kerja (Fit to Work) <span className="text-rose-500">*</span>
                                </label>

                                <div className="space-y-2">
                                    {(Object.keys(fitStatusDescriptions) as FitStatus[]).map((statusKey) => {
                                        const config = fitStatusDescriptions[statusKey];
                                        const isSelected = data.fit_status === statusKey;
                                        return (
                                            <label
                                                key={statusKey}
                                                className={`block p-3 rounded-lg border cursor-pointer transition-all ${
                                                    isSelected
                                                        ? `${config.border} ${config.color} ring-1 ring-emerald-500/30 font-semibold shadow-xs`
                                                        : 'border-zinc-200 hover:border-zinc-300 bg-white text-zinc-700'
                                                } ${isLocked ? 'cursor-not-allowed opacity-80' : ''}`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <input
                                                        type="radio"
                                                        name="fit_status"
                                                        value={statusKey}
                                                        checked={isSelected}
                                                        disabled={isLocked}
                                                        onChange={(e) => setData('fit_status', e.target.value as FitStatus)}
                                                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-zinc-300"
                                                    />
                                                    <span className="text-xs font-bold">{config.label}</span>
                                                </div>
                                                <p className="mt-1 text-[11px] text-zinc-500 pl-6 leading-relaxed">
                                                    {config.desc}
                                                </p>
                                            </label>
                                        );
                                    })}
                                </div>
                                {errors.fit_status && (
                                    <div className="text-xs text-rose-600">{errors.fit_status}</div>
                                )}
                            </div>

                            {/* Doctor Medical Summary */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-bold text-zinc-700">
                                        Kesimpulan Medis Dokter
                                    </label>
                                    <span className="text-[10px] text-zinc-400">Dicetak di Buku & Resume MCU</span>
                                </div>
                                <textarea
                                    rows={5}
                                    value={data.doctor_summary}
                                    disabled={isLocked}
                                    onChange={(e) => setData('doctor_summary', e.target.value)}
                                    placeholder="Tuliskan rangkuman diagnosis klinis atau kelainan yang terdeteksi..."
                                    className="w-full text-xs font-sans p-3 border border-zinc-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:bg-zinc-100 disabled:text-zinc-500 leading-relaxed"
                                />
                                {errors.doctor_summary && (
                                    <div className="text-xs text-rose-600">{errors.doctor_summary}</div>
                                )}
                            </div>

                            {/* Doctor Medical Advice */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-bold text-zinc-700">
                                        Saran & Anjuran Dokter (Advice)
                                    </label>
                                    <span className="text-[10px] text-zinc-400">Pola hidup, rujukan, terapi</span>
                                </div>
                                <textarea
                                    rows={5}
                                    value={data.doctor_advice}
                                    disabled={isLocked}
                                    onChange={(e) => setData('doctor_advice', e.target.value)}
                                    placeholder="Tuliskan anjuran gaya hidup, diet, konsul spesialis, atau jadwal kontrol ulang..."
                                    className="w-full text-xs font-sans p-3 border border-zinc-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:bg-zinc-100 disabled:text-zinc-500 leading-relaxed"
                                />
                                {errors.doctor_advice && (
                                    <div className="text-xs text-rose-600">{errors.doctor_advice}</div>
                                )}
                            </div>

                            {/* Internal Doctor Notes */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-zinc-700">
                                    Catatan Internal Dokter (Klinik)
                                </label>
                                <textarea
                                    rows={2}
                                    value={data.doctor_notes}
                                    disabled={isLocked}
                                    onChange={(e) => setData('doctor_notes', e.target.value)}
                                    placeholder="Catatan rahasia khusus internal (tidak dicetak di buku MCU)..."
                                    className="w-full text-xs font-sans p-2.5 border border-zinc-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:bg-zinc-100 disabled:text-zinc-500"
                                />
                                {errors.doctor_notes && (
                                    <div className="text-xs text-rose-600">{errors.doctor_notes}</div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-2 border-t border-zinc-100 space-y-2">
                                <button
                                    type="submit"
                                    disabled={processing || isLocked}
                                    className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 text-white shadow-sm transition-colors ${
                                        isLocked
                                            ? 'bg-zinc-400 cursor-not-allowed'
                                            : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                                    }`}
                                >
                                    <Save className="w-4 h-4" />
                                    <span>
                                        {isLocked
                                            ? 'Hasil Terkunci (QC Lock Aktif)'
                                            : processing
                                            ? 'Menyimpan...'
                                            : 'Simpan & Konfirmasi Review Dokter'}
                                    </span>
                                </button>

                                <div className="text-[11px] text-zinc-400 text-center">
                                    Setelah disimpan, status pendaftaran akan maju ke <span className="font-semibold text-zinc-600">doctor_reviewed</span> untuk verifikasi Manajer MCU.
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}
