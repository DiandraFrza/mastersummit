import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Badge from '@/Components/Badge';
import {
    ArrowLeft,
    ShieldCheck,
    Lock,
    Unlock,
    CheckCircle2,
    AlertTriangle,
    Stethoscope,
    FileText,
    Paperclip,
    Eye,
    Save,
    RotateCcw,
    AlertCircle,
    UserCheck,
    Calendar,
    Building2,
    Users,
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

interface ManagerReviewShowProps extends PageProps {
    registration: Registration;
    compiledRecap: CompiledRecap;
    fitStatusOptions: Record<FitStatus, string>;
}

export default function Show({
    auth,
    registration,
    compiledRecap,
    fitStatusOptions,
}: ManagerReviewShowProps) {
    const review = registration.mcu_review || registration.mcuReview;
    const isLocked = Boolean(review?.is_locked);

    const [activeTab, setActiveTab] = useState<'doctor_review' | 'all_results' | 'attachments'>('doctor_review');
    const [showUnlockModal, setShowUnlockModal] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        manager_notes: review?.manager_notes || '',
        is_locked: true,
    });

    const handleApprove = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('mcu.manager-review.approve', registration.id), {
            preserveScroll: true,
        });
    };

    const handleUnlock = () => {
        router.post(
            route('mcu.manager-review.unlock', registration.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => setShowUnlockModal(false),
            }
        );
    };

    const getFitStatusBadge = (status?: FitStatus | null) => {
        switch (status) {
            case 'fit':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Fit (Laik Kerja Tanpa Catatan)</span>
                    </span>
                );
            case 'fit_with_note':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>Fit with Note (Laik dengan Catatan / Observasi)</span>
                    </span>
                );
            case 'temporary_unfit':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        <span>Temporary Unfit (Tidak Laik Sementara)</span>
                    </span>
                );
            case 'unfit':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span>Unfit (Tidak Laik Kerja)</span>
                    </span>
                );
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300">
                        <AlertCircle className="w-4 h-4 text-sky-600" />
                        <span>Pending (Menunggu Hasil Tambahan)</span>
                    </span>
                );
            default:
                return <Badge variant="neutral" label="Belum Ditentukan" />;
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

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title={`Review & QC Manajer MCU - ${registration.reg_no}`} />

            <div className="space-y-6 max-w-7xl mx-auto">
                {/* Top Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('mcu.manager-review.index')}
                            className="p-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold tracking-tight text-zinc-900">
                                    Quality Control & Approval Manajer MCU
                                </h1>
                                <span className="font-mono text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                    {registration.reg_no}
                                </span>
                            </div>
                            <p className="text-xs text-zinc-500 mt-0.5">
                                Verifikasi akhir hasil pemeriksaan, validasi kesimpulan medis dokter, dan penetapan status lock approval.
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons & Status Banner Pill */}
                    <div className="flex flex-wrap items-center gap-2">
                        <a
                            href={route('prints.mcu-book', registration.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors shadow-xs"
                        >
                            <Printer className="w-3.5 h-3.5 text-zinc-600" />
                            Preview Buku MCU
                        </a>
                        <a
                            href={route('prints.mcu-book.pdf', registration.id) + '?download=1'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors shadow-xs"
                        >
                            <Download className="w-3.5 h-3.5 text-zinc-600" />
                            Download PDF
                        </a>

                        {isLocked ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 text-xs font-bold">
                                <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>QC PASSED &amp; COMPLETED</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs font-bold">
                                <Unlock className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>MENUNGGU QC &amp; APPROVAL</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Patient Demographic Banner */}
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
                            <div className="font-semibold text-zinc-900 mt-0.5 flex items-center gap-1">
                                <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{review?.doctor?.name || 'Belum direview'}</span>
                            </div>
                            <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                                {review?.doctor_reviewed_at ? new Date(review.doctor_reviewed_at).toLocaleDateString('id-ID') : 'â€”'}
                            </div>
                        </div>

                        <div>
                            <div className="text-zinc-400 font-medium">Status Workflow</div>
                            <div className="font-bold text-zinc-900 mt-0.5 uppercase tracking-wide">
                                {registration.workflow_status}
                            </div>
                            <div className="text-[11px] text-zinc-500 mt-0.5">
                                {isLocked ? 'QC Selesai' : 'Siap Approval'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Workspace Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Doctor Review & Results Inspection (7 cols) */}
                    <div className="lg:col-span-7 space-y-4">
                        {/* Tab Selector */}
                        <div className="bg-white border border-zinc-200 rounded-lg p-1.5 shadow-sm flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setActiveTab('doctor_review')}
                                className={`flex-1 py-2 px-3 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                                    activeTab === 'doctor_review'
                                        ? 'bg-zinc-900 text-white shadow-sm'
                                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                                }`}
                            >
                                <Stethoscope className="w-4 h-4" />
                                <span>Review Dokter & Kelainan</span>
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
                                <span>Hasil Lengkap Pemeriksaan</span>
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
                                <span>Lampiran Output Mesin</span>
                            </button>
                        </div>

                        {/* Tab Content: DOCTOR REVIEW INSPECTION */}
                        {activeTab === 'doctor_review' && (
                            <div className="space-y-4">
                                {/* Doctor Verdict Card */}
                                <div className="bg-white border border-zinc-200 rounded-lg shadow-sm p-5 space-y-4">
                                    <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                                            Status Kelaikan Kerja (Fit to Work)
                                        </h3>
                                        <span className="text-xs text-zinc-400">
                                            Ditetapkan oleh: <span className="font-semibold text-zinc-700">{review?.doctor?.name || 'Dokter Pemeriksa'}</span>
                                        </span>
                                    </div>

                                    <div>
                                        {getFitStatusBadge(review?.fit_status)}
                                    </div>

                                    <div className="pt-2 border-t border-zinc-100 space-y-2">
                                        <div className="text-xs font-bold text-zinc-800">
                                            Kesimpulan Medis Dokter:
                                        </div>
                                        <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-sans text-zinc-800 whitespace-pre-line leading-relaxed">
                                            {review?.doctor_summary || (
                                                <span className="italic text-zinc-400">Dokter belum mengisi kesimpulan medis.</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="text-xs font-bold text-zinc-800">
                                            Saran & Anjuran Dokter (Advice):
                                        </div>
                                        <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-sans text-zinc-800 whitespace-pre-line leading-relaxed">
                                            {review?.doctor_advice || (
                                                <span className="italic text-zinc-400">Dokter belum mengisi saran/anjuran medis.</span>
                                            )}
                                        </div>
                                    </div>

                                    {review?.doctor_notes && (
                                        <div className="space-y-1 text-xs">
                                            <span className="font-semibold text-zinc-500">Catatan Internal Dokter:</span>
                                            <p className="text-zinc-600 italic bg-amber-50/50 p-2 rounded border border-amber-100">
                                                {review.doctor_notes}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Abnormality Recap List */}
                                <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
                                    <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                                            <h3 className="text-sm font-bold text-zinc-900">
                                                Rekapitulasi Temuan Kelainan ({compiledRecap.total_abnormalities})
                                            </h3>
                                        </div>
                                        <span className="text-[11px] text-zinc-500">Auto-compiled verification</span>
                                    </div>

                                    {compiledRecap.total_abnormalities === 0 ? (
                                        <div className="p-6 text-center text-zinc-400 text-xs italic">
                                            Tidak terdeteksi parameter yang melampaui nilai rujukan (Semua normal).
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-zinc-200 p-4 space-y-3">
                                            {Object.entries(compiledRecap.by_category).map(([category, items]) => (
                                                <div key={category} className="space-y-2">
                                                    <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded inline-block">
                                                        {category}
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        {items.map((item, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="p-2.5 rounded border border-zinc-200 bg-zinc-50/60 flex items-start justify-between text-xs"
                                                            >
                                                                <div className="space-y-0.5">
                                                                    <div className="font-bold text-zinc-900">
                                                                        {item.parameter_name}{' '}
                                                                        <span className="font-normal text-zinc-400 text-[11px]">
                                                                            ({item.service_name})
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-zinc-600">
                                                                        Hasil: <span className="font-semibold text-zinc-900">{item.value} {item.unit || ''}</span>{' '}
                                                                        {item.reference_range && (
                                                                            <span className="text-zinc-400 text-[11px]">
                                                                                (Ref: {item.reference_range} {item.unit || ''})
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {item.conclusion && (
                                                                        <div className="text-[11px] font-medium text-amber-800">
                                                                            {item.conclusion}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div>{getFlagBadge(item.flag_status)}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Tab Content: ALL RESULTS */}
                        {activeTab === 'all_results' && (
                            <div className="bg-white border border-zinc-200 rounded-lg shadow-sm p-4 space-y-4">
                                <h3 className="text-sm font-bold text-zinc-900">Seluruh Hasil Pemeriksaan Pasien</h3>
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
                                                                    <td className="py-1 font-medium text-zinc-800">{res.parameter?.name || 'â€”'}</td>
                                                                    <td className="py-1 font-bold text-zinc-900">{res.value_numeric !== null ? res.value_numeric : (res.value_text || 'â€”')}</td>
                                                                    <td className="py-1 text-zinc-500">{res.unit_snapshot || 'â€”'}</td>
                                                                    <td className="py-1 font-mono text-[11px] text-zinc-500">{res.reference_snapshot || 'â€”'}</td>
                                                                    <td className="py-1 text-right">{getFlagBadge(res.flag_status)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                ) : (
                                                    <div className="text-xs text-zinc-400 italic">
                                                        {item.group_conclusion || 'Belum ada rincian hasil.'}
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

                        {/* Tab Content: ATTACHMENTS */}
                        {activeTab === 'attachments' && (
                            <div className="bg-white border border-zinc-200 rounded-lg shadow-sm p-4 space-y-4">
                                <h3 className="text-sm font-bold text-zinc-900">Berkas Lampiran Penunjang</h3>
                                {((registration.result_attachments || registration.resultAttachments || []) as ResultAttachment[]).length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {((registration.result_attachments || registration.resultAttachments || []) as ResultAttachment[]).map((att) => (
                                            <div
                                                key={att.id}
                                                className="p-3 border border-zinc-200 rounded-lg bg-zinc-50/60 flex items-center justify-between gap-3 text-xs"
                                            >
                                                <div className="truncate">
                                                    <div className="font-semibold text-zinc-900 truncate">{att.original_filename}</div>
                                                    <div className="text-[11px] text-zinc-400 uppercase">{att.attachment_type} â€¢ {(att.file_size / 1024).toFixed(1)} KB</div>
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
                                        Tidak ada berkas PDF/foto mesin terlampir.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Manager QC Approval & Lock Form (5 cols) */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="bg-white border border-zinc-200 rounded-lg shadow-sm p-5 space-y-5 sticky top-4">
                            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                                <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                    <span>Keputusan QC & Lock Approval</span>
                                </h2>
                                {isLocked ? (
                                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                                        <Lock className="w-3 h-3" /> LOCKED
                                    </span>
                                ) : (
                                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                                        <Unlock className="w-3 h-3" /> UNLOCKED
                                    </span>
                                )}
                            </div>

                            {/* Approval Form */}
                            <form onSubmit={handleApprove} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-zinc-700">
                                        Catatan Quality Control (Manajer MCU)
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={data.manager_notes}
                                        onChange={(e) => setData('manager_notes', e.target.value)}
                                        placeholder="Tuliskan catatan verifikasi QC, kelengkapan berkas, validasi anamnese, atau instruksi rilis hasil..."
                                        className="w-full text-xs font-sans p-3 border border-zinc-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 leading-relaxed"
                                    />
                                    {errors.manager_notes && (
                                        <div className="text-xs text-rose-600">{errors.manager_notes}</div>
                                    )}
                                </div>

                                {/* Status Info Box */}
                                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2 text-xs">
                                    <div className="font-bold text-zinc-800 flex items-center gap-1.5">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        <span>Protokol Verifikasi Rilis MCU:</span>
                                    </div>
                                    <ul className="text-zinc-600 space-y-1 list-disc list-inside text-[11px]">
                                        <li>Seluruh parameter penunjang telah terisi & terverifikasi.</li>
                                        <li>Status Kelaikan Kerja (Fit) telah ditinjau sesuai standar medis.</li>
                                        <li>Locking hasil akan mengunci pemeriksaan dari pengeditan ulang dan menyelesaikan workflow (<code className="font-mono text-zinc-800 font-semibold">completed</code>).</li>
                                    </ul>
                                </div>

                                {/* Action Buttons */}
                                {!isLocked ? (
                                    <div className="space-y-2 pt-2">
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="w-full py-2.5 px-4 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-sm transition-colors"
                                        >
                                            <ShieldCheck className="w-4 h-4" />
                                            <span>
                                                {processing ? 'Memproses Lock...' : 'Setujui QC & Kunci Hasil (Lock Approval)'}
                                            </span>
                                        </button>
                                        <div className="text-[11px] text-zinc-400 text-center">
                                            Status pendaftaran akan langsung berubah menjadi <span className="font-semibold text-emerald-700">completed</span>.
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3 pt-2">
                                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs space-y-1">
                                            <div className="font-bold flex items-center gap-1.5">
                                                <Lock className="w-4 h-4 text-emerald-700" />
                                                <span>Pemeriksaan Telah Disetujui & Dikunci</span>
                                            </div>
                                            <div className="text-[11px] text-emerald-700">
                                                Disetujui oleh <span className="font-semibold">{review?.manager?.name || 'Manajer MCU'}</span> pada{' '}
                                                <span className="font-mono">
                                                    {review?.manager_approved_at ? new Date(review.manager_approved_at).toLocaleString('id-ID') : 'â€”'}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setShowUnlockModal(true)}
                                            className="w-full py-2 px-3 border border-zinc-300 rounded-lg font-semibold text-xs text-zinc-700 hover:bg-zinc-50 flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <Unlock className="w-3.5 h-3.5 text-amber-600" />
                                            <span>Buka Kunci untuk Revisi (Unlock)</span>
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Unlock Confirmation Modal */}
            {showUnlockModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
                        <div className="flex items-center gap-3 text-amber-600">
                            <AlertTriangle className="w-6 h-6 shrink-0" />
                            <h3 className="text-base font-bold text-zinc-900">
                                Buka Kunci Pemeriksaan MCU?
                            </h3>
                        </div>

                        <p className="text-xs text-zinc-600 leading-relaxed">
                            Membuka kunci (unlock) akan mengembalikan status pendaftaran ke{' '}
                            <span className="font-semibold text-zinc-900">doctor_reviewed</span>. Dokter dapat melakukan revisi terhadap kesimpulan, saran, maupun status kelaikan kerja. Tindakan ini dicatat dalam activity audit log.
                        </p>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                            <button
                                type="button"
                                onClick={() => setShowUnlockModal(false)}
                                className="px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 rounded border border-zinc-200 hover:bg-zinc-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleUnlock}
                                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded shadow-xs"
                            >
                                Ya, Buka Kunci
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
