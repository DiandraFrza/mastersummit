import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    Download,
    FileText,
    ShieldCheck,
    Clock,
    User,
    Calendar,
    Building2,
    Activity,
    Heart,
    Stethoscope,
    CheckCircle2,
    AlertTriangle,
    AlertCircle,
    Info,
    ExternalLink,
    Paperclip,
    Printer,
    Check,
} from 'lucide-react';
import Badge from '@/Components/Badge';
import { AudiogramGrid } from '@/Components/AudiogramGrid';
import type {
    ClinicSetting,
    Registration,
    RegistrationItem,
    ExaminationResult,
    FitStatus,
    AudiogramData,
} from '@/types';

interface ShowProps {
    token: string;
    registration: Registration;
    clinic: ClinicSetting;
    expiresAt: string;
    daysRemaining: number;
}

export default function Show({
    token,
    registration,
    clinic,
    expiresAt,
    daysRemaining,
}: ShowProps) {
    const [activeTab, setActiveTab] = useState<'summary' | 'results' | 'attachments'>('summary');

    const patient = registration.patient;
    const review = registration.mcu_review || registration.mcuReview;
    const isMcu = registration.service_type === 'mcu';
    const items = registration.items || [];
    const attachments = registration.result_attachments || registration.resultAttachments || [];

    // Group items by category
    const labItems = items.filter(
        (i) => i.category === 'lab' || i.service?.category === 'laboratory'
    );
    const radItems = items.filter(
        (i) => i.category === 'radiology' || i.service?.category === 'radiology'
    );
    const electroItems = items.filter(
        (i) => i.category === 'electromedical' || i.service?.category === 'electromedical'
    );
    const physicalItems = items.filter(
        (i) => i.category === 'physical' || i.service?.category === 'physical_exam'
    );

    const getFitStatusDetails = (status?: FitStatus | string | null) => {
        switch (status) {
            case 'fit':
                return {
                    label: 'FIT (LAIK KERJA)',
                    badgeVariant: 'success' as const,
                    desc: 'Kondisi kesehatan memenuhi syarat untuk jenis pekerjaan yang dituju.',
                    bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
                    icon: CheckCircle2,
                };
            case 'fit_with_note':
                return {
                    label: 'FIT WITH NOTE (LAIK DENGAN CATATAN)',
                    badgeVariant: 'warning' as const,
                    desc: 'Laik kerja dengan catatan kelainan minor atau kondisi terkontrol yang memerlukan observasi berkala.',
                    bg: 'bg-amber-50 border-amber-200 text-amber-800',
                    icon: AlertTriangle,
                };
            case 'temporary_unfit':
                return {
                    label: 'TEMPORARY UNFIT (TIDAK LAIK SEMENTARA)',
                    badgeVariant: 'danger' as const,
                    desc: 'Kondisi medis memerlukan pengobatan atau evaluasi ulang sebelum dinyatakan laik bekerja.',
                    bg: 'bg-rose-50 border-rose-200 text-rose-800',
                    icon: AlertCircle,
                };
            case 'unfit':
                return {
                    label: 'UNFIT (TIDAK LAIK KERJA)',
                    badgeVariant: 'danger' as const,
                    desc: 'Kondisi kesehatan tidak memenuhi kualifikasi medis untuk jenis pekerjaan.',
                    bg: 'bg-red-50 border-red-200 text-red-900',
                    icon: AlertCircle,
                };
            case 'pending':
                return {
                    label: 'PENDING (MENUNGGU PEMERIKSAAN LANJUTAN)',
                    badgeVariant: 'info' as const,
                    desc: 'Memerlukan pemeriksaan penunjang lanjutan atau klarifikasi dokter spesialis.',
                    bg: 'bg-sky-50 border-sky-200 text-sky-800',
                    icon: Info,
                };
            default:
                return null;
        }
    };

    const fitDetails = getFitStatusDetails(review?.fit_status);

    const getFlagBadge = (flag?: string | null) => {
        switch (flag) {
            case 'low':
                return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">LOW</span>;
            case 'high':
                return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">HIGH</span>;
            case 'critical':
                return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">CRITICAL</span>;
            case 'abnormal':
                return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">ABNORMAL</span>;
            default:
                return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600">NORMAL</span>;
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col justify-between text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white pb-12">
            <Head title={`Hasil Pemeriksaan - ${patient?.name || 'Pasien'} (${registration.reg_no})`} />

            {/* Topbar */}
            <header className="border-b border-zinc-200/80 bg-white/90 backdrop-blur sticky top-0 z-20 px-4 py-3 shadow-xs">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                            MS
                        </div>
                        <div>
                            <div className="text-xs font-bold text-zinc-900 uppercase tracking-tight">
                                {clinic.clinic_name || 'KLINIK UTAMA & LABORATORIUM MASTER SUMMIT'}
                            </div>
                            <div className="text-[10px] text-zinc-500">
                                Portal Akses Rekam Medis &amp; Hasil Pemeriksaan Online
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <a
                            href={route('portal.download-pdf', token)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-colors shadow-xs"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Unduh PDF Resmi</span>
                        </a>
                    </div>
                </div>
            </header>

            {/* Main Content Container */}
            <main className="max-w-5xl mx-auto w-full px-4 pt-6 flex-grow">
                {/* Expiry & Security Banner */}
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white border border-zinc-200/80 rounded-lg text-xs shadow-xs">
                    <div className="flex items-center gap-2 text-zinc-700">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Dokumen Medis Terverifikasi &amp; Sah Terbitan Resmi Klinik</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-medium">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Masa Aktif Tautan:</span>
                        <span className="font-semibold text-zinc-800 font-mono">
                            {daysRemaining} hari lagi
                        </span>
                        <span>(s/d {expiresAt})</span>
                    </div>
                </div>

                {/* Patient Profile Card */}
                <div className="bg-white border border-zinc-200/80 rounded-xl p-5 mb-5 shadow-xs">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
                        <div>
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-zinc-100 text-zinc-700 mb-1">
                                {isMcu ? 'Medical Check-Up (MCU)' : 'Pemeriksaan Klinis / Lab'}
                            </span>
                            <h1 className="text-lg font-bold text-zinc-900 tracking-tight">
                                {patient?.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 mt-1">
                                <span>No. RM: <strong className="font-mono text-zinc-800 tabular-nums">{patient?.medical_record_no}</strong></span>
                                <span>&bull;</span>
                                <span>No. Reg: <strong className="font-mono text-zinc-800 tabular-nums">{registration.reg_no}</strong></span>
                                {registration.company && (
                                    <>
                                        <span>&bull;</span>
                                        <span className="flex items-center gap-1 text-zinc-700">
                                            <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                                            {registration.company.name}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex md:flex-col items-end justify-between md:justify-center border-t md:border-t-0 pt-3 md:pt-0 border-zinc-100 text-xs">
                            <span className="text-zinc-500 text-[11px]">Tanggal Pemeriksaan</span>
                            <span className="font-semibold text-zinc-900 font-mono tabular-nums">
                                {new Date(registration.created_at).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
                        <div>
                            <span className="text-[11px] text-zinc-500 block">NIK</span>
                            <span className="font-mono font-medium text-zinc-800 tabular-nums">
                                {patient?.nik || '-'}
                            </span>
                        </div>
                        <div>
                            <span className="text-[11px] text-zinc-500 block">Jenis Kelamin / Usia</span>
                            <span className="font-medium text-zinc-800">
                                {patient?.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                                {patient?.birth_date && (
                                    <span className="text-zinc-500 font-normal">
                                        {' '}
                                        ({Math.floor((new Date().getTime() - new Date(patient.birth_date).getTime()) / 31557600000)} th)
                                    </span>
                                )}
                            </span>
                        </div>
                        <div>
                            <span className="text-[11px] text-zinc-500 block">Tanggal Lahir</span>
                            <span className="font-mono font-medium text-zinc-800 tabular-nums">
                                {patient?.birth_date ? new Date(patient.birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                            </span>
                        </div>
                        <div>
                            <span className="text-[11px] text-zinc-500 block">Paket / Layanan</span>
                            <span className="font-medium text-zinc-800 truncate block">
                                {registration.package?.name || registration.items?.[0]?.service_name_snapshot || 'MCU Paket'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* MCU Fit Status Banner (if MCU) */}
                {fitDetails && (
                    <div className={`p-4 rounded-xl border mb-5 shadow-xs ${fitDetails.bg}`}>
                        <div className="flex items-start gap-3">
                            <fitDetails.icon className="w-5 h-5 mt-0.5 shrink-0" />
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold tracking-tight uppercase">
                                        Status Kelaikan Kerja:
                                    </span>
                                    <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded bg-white/80 border border-current">
                                        {fitDetails.label}
                                    </span>
                                </div>
                                <p className="text-xs leading-relaxed opacity-90">
                                    {fitDetails.desc}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="flex items-center gap-1 border-b border-zinc-200 mb-6 text-xs">
                    <button
                        onClick={() => setActiveTab('summary')}
                        className={`px-4 py-2.5 font-semibold transition-all border-b-2 flex items-center gap-2 ${
                            activeTab === 'summary'
                                ? 'border-zinc-900 text-zinc-900 bg-white rounded-t-md border-t border-l border-r border-b-white -mb-px'
                                : 'border-transparent text-zinc-500 hover:text-zinc-800'
                        }`}
                    >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Resume &amp; Rekomendasi</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('results')}
                        className={`px-4 py-2.5 font-semibold transition-all border-b-2 flex items-center gap-2 ${
                            activeTab === 'results'
                                ? 'border-zinc-900 text-zinc-900 bg-white rounded-t-md border-t border-l border-r border-b-white -mb-px'
                                : 'border-transparent text-zinc-500 hover:text-zinc-800'
                        }`}
                    >
                        <Activity className="w-3.5 h-3.5" />
                        <span>Rincian Hasil Pemeriksaan</span>
                        <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-100 text-zinc-700 font-mono">
                            {items.length}
                        </span>
                    </button>
                    {attachments.length > 0 && (
                        <button
                            onClick={() => setActiveTab('attachments')}
                            className={`px-4 py-2.5 font-semibold transition-all border-b-2 flex items-center gap-2 ${
                                activeTab === 'attachments'
                                    ? 'border-zinc-900 text-zinc-900 bg-white rounded-t-md border-t border-l border-r border-b-white -mb-px'
                                    : 'border-transparent text-zinc-500 hover:text-zinc-800'
                            }`}
                        >
                            <Paperclip className="w-3.5 h-3.5" />
                            <span>Lampiran Penunjang</span>
                            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-100 text-zinc-700 font-mono">
                                {attachments.length}
                            </span>
                        </button>
                    )}
                </div>

                {/* TAB 1: RESUME & REKOMENDASI */}
                {activeTab === 'summary' && (
                    <div className="space-y-5">
                        {/* Doctor's Summary & Advice */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs">
                                <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Stethoscope className="w-4 h-4 text-zinc-700" />
                                    <span>Kesimpulan Medis</span>
                                </h2>
                                <div className="text-xs text-zinc-700 leading-relaxed whitespace-pre-line bg-zinc-50/70 p-3.5 rounded-lg border border-zinc-100 min-h-[100px]">
                                    {review?.doctor_summary || 'Tidak ada catatan kesimpulan khusus. Hasil pemeriksaan berada dalam batas toleransi normal.'}
                                </div>
                            </div>

                            <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs">
                                <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Heart className="w-4 h-4 text-emerald-600" />
                                    <span>Saran &amp; Rekomendasi Dokter</span>
                                </h2>
                                <div className="text-xs text-zinc-700 leading-relaxed whitespace-pre-line bg-zinc-50/70 p-3.5 rounded-lg border border-zinc-100 min-h-[100px]">
                                    {review?.doctor_advice || 'Pertahankan pola hidup sehat, konsumsi gizi seimbang, cukupi istirahat serta lakukan pemeriksaan kesehatan berkala.'}
                                </div>
                            </div>
                        </div>

                        {/* Signatures & Validation Info */}
                        <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                            <div className="space-y-1 text-center sm:text-left">
                                <span className="text-[11px] text-zinc-500 block">Dokter Pemeriksa / Reviewer</span>
                                <span className="font-semibold text-zinc-900">
                                    {review?.doctor?.name || 'Tim Medis Master Summit'}
                                </span>
                                {review?.reviewed_at && (
                                    <span className="text-[10px] text-zinc-400 block font-mono">
                                        Ditinjau pada: {new Date(review.reviewed_at).toLocaleDateString('id-ID')}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-1 text-center sm:text-right">
                                <span className="text-[11px] text-zinc-500 block">Penanggung Jawab / Kepala Klinik</span>
                                <span className="font-semibold text-zinc-900">
                                    {review?.manager?.name || clinic.clinic_name || 'Kepala Pelayanan Medis'}
                                </span>
                                {review?.approved_at && (
                                    <span className="text-[10px] text-zinc-400 block font-mono">
                                        Disetujui pada: {new Date(review.approved_at).toLocaleDateString('id-ID')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: DETAILED RESULTS */}
                {activeTab === 'results' && (
                    <div className="space-y-6">
                        {/* 1. Laboratorium */}
                        {labItems.length > 0 && (
                            <div className="bg-white border border-zinc-200/80 rounded-xl shadow-xs overflow-hidden">
                                <div className="px-5 py-3.5 bg-zinc-50 border-b border-zinc-200/80 flex items-center justify-between">
                                    <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-sky-600" />
                                        <span>Pemeriksaan Laboratorium</span>
                                    </h2>
                                    <span className="text-[11px] text-zinc-500">
                                        {labItems.length} Pemeriksaan
                                    </span>
                                </div>

                                <div className="divide-y divide-zinc-100">
                                    {labItems.map((item) => {
                                        const results = item.examination_results || item.examinationResults || [];
                                        return (
                                            <div key={item.id} className="p-4">
                                                <h3 className="text-xs font-bold text-zinc-800 mb-2">
                                                    {item.service_name_snapshot}
                                                </h3>

                                                {results.length > 0 ? (
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left text-xs border border-zinc-100 rounded">
                                                            <thead className="bg-zinc-50/80 text-[11px] text-zinc-500 font-medium">
                                                                <tr>
                                                                    <th className="py-2 px-3">Parameter</th>
                                                                    <th className="py-2 px-3">Hasil</th>
                                                                    <th className="py-2 px-3">Nilai Rujukan</th>
                                                                    <th className="py-2 px-3">Satuan</th>
                                                                    <th className="py-2 px-3 text-center">Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-zinc-100">
                                                                {results.map((res: ExaminationResult) => (
                                                                    <tr key={res.id} className="hover:bg-zinc-50/50">
                                                                        <td className="py-2 px-3 font-medium text-zinc-900">
                                                                            {res.parameter?.label || 'Parameter'}
                                                                        </td>
                                                                        <td className="py-2 px-3 font-bold font-mono tabular-nums text-zinc-900">
                                                                            {res.value_numeric ?? res.value_text ?? '-'}
                                                                        </td>
                                                                        <td className="py-2 px-3 font-mono text-zinc-600 text-[11px]">
                                                                            {res.reference_snapshot || '-'}
                                                                        </td>
                                                                        <td className="py-2 px-3 text-zinc-500 text-[11px]">
                                                                            {res.unit_snapshot || '-'}
                                                                        </td>
                                                                        <td className="py-2 px-3 text-center">
                                                                            {getFlagBadge(res.flag_status)}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-zinc-400 italic py-1">
                                                        Hasil belum terinput atau menunggu verifikasi analis.
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 2. Radiologi */}
                        {radItems.length > 0 && (
                            <div className="bg-white border border-zinc-200/80 rounded-xl shadow-xs overflow-hidden">
                                <div className="px-5 py-3.5 bg-zinc-50 border-b border-zinc-200/80 flex items-center justify-between">
                                    <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-indigo-600" />
                                        <span>Pemeriksaan Radiologi</span>
                                    </h2>
                                    <span className="text-[11px] text-zinc-500">
                                        {radItems.length} Pemeriksaan
                                    </span>
                                </div>

                                <div className="divide-y divide-zinc-100 p-4 space-y-4">
                                    {radItems.map((item) => {
                                        const results = item.examination_results || item.examinationResults || [];
                                        return (
                                            <div key={item.id} className="space-y-2">
                                                <h3 className="text-xs font-bold text-zinc-800">
                                                    {item.service_name_snapshot}
                                                </h3>
                                                {results.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {results.map((res: ExaminationResult) => (
                                                            <div key={res.id} className="bg-zinc-50 p-3 rounded-lg border border-zinc-100 text-xs">
                                                                <span className="font-semibold text-zinc-800 block mb-1">
                                                                    {res.parameter?.label || 'Hasil Expertise'}:
                                                                </span>
                                                                <p className="text-zinc-700 whitespace-pre-line leading-relaxed">
                                                                    {res.value_text || res.value_numeric || '-'}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-zinc-400 italic">
                                                        Hasil expertise radiologi dalam proses.
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 3. Elektromedis (EKG, Spirometri, Audiometri) */}
                        {electroItems.length > 0 && (
                            <div className="bg-white border border-zinc-200/80 rounded-xl shadow-xs overflow-hidden">
                                <div className="px-5 py-3.5 bg-zinc-50 border-b border-zinc-200/80 flex items-center justify-between">
                                    <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                                        <Heart className="w-4 h-4 text-rose-600" />
                                        <span>Pemeriksaan Elektromedis (EKG, Spiro, Audiometri)</span>
                                    </h2>
                                    <span className="text-[11px] text-zinc-500">
                                        {electroItems.length} Pemeriksaan
                                    </span>
                                </div>

                                <div className="p-4 space-y-6">
                                    {electroItems.map((item) => {
                                        const results = item.examination_results || item.examinationResults || [];
                                        const audiogramResult = results.find(
                                            (r: ExaminationResult) => r.value_json && (r.value_json as AudiogramData).right_ear
                                        );

                                        return (
                                            <div key={item.id} className="space-y-3">
                                                <h3 className="text-xs font-bold text-zinc-800">
                                                    {item.service_name_snapshot}
                                                </h3>

                                                {/* If Audiometri JSON exists, render live SVG AudiogramGrid */}
                                                {audiogramResult && (
                                                    <div className="border border-zinc-200 rounded-lg p-3 bg-zinc-50/50">
                                                        <AudiogramGrid
                                                            value={audiogramResult.value_json as AudiogramData}
                                                            readOnly={true}
                                                        />
                                                    </div>
                                                )}

                                                {/* Text results */}
                                                {results.length > 0 && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                                        {results.map((res: ExaminationResult) => (
                                                            <div key={res.id} className="bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                                                                <span className="font-semibold text-zinc-800 block mb-1">
                                                                    {res.parameter?.label || 'Interpretasi'}:
                                                                </span>
                                                                <span className="text-zinc-700 font-mono">
                                                                    {res.value_text || res.value_numeric || (res.value_json ? 'Lihat grafik / data terlampir' : '-')}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* 4. Pemeriksaan Fisik & Dokter */}
                        {physicalItems.length > 0 && (
                            <div className="bg-white border border-zinc-200/80 rounded-xl shadow-xs overflow-hidden">
                                <div className="px-5 py-3.5 bg-zinc-50 border-b border-zinc-200/80 flex items-center justify-between">
                                    <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                                        <Stethoscope className="w-4 h-4 text-emerald-600" />
                                        <span>Pemeriksaan Fisik &amp; Tanda Vital</span>
                                    </h2>
                                    <span className="text-[11px] text-zinc-500">
                                        {physicalItems.length} Pemeriksaan
                                    </span>
                                </div>

                                <div className="p-4">
                                    {physicalItems.map((item) => {
                                        const results = item.examination_results || item.examinationResults || [];
                                        return (
                                            <div key={item.id} className="space-y-3">
                                                <h3 className="text-xs font-bold text-zinc-800">
                                                    {item.service_name_snapshot}
                                                </h3>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
                                                    {results.map((res: ExaminationResult) => (
                                                        <div key={res.id} className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-100">
                                                            <span className="text-[11px] text-zinc-500 block truncate">
                                                                {res.parameter?.label || 'Parameter'}
                                                            </span>
                                                            <span className="font-bold text-zinc-900 font-mono tabular-nums">
                                                                {res.value_numeric ?? res.value_text ?? '-'}
                                                                {res.unit_snapshot ? ` ${res.unit_snapshot}` : ''}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 3: ATTACHMENTS */}
                {activeTab === 'attachments' && (
                    <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs space-y-4">
                        <h2 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                            <Paperclip className="w-4 h-4 text-zinc-700" />
                            <span>Berkas &amp; Grafik Penunjang Otentik</span>
                        </h2>
                        <p className="text-xs text-zinc-500">
                            Berkas hasil rekaman alat (EKG, Spirometri, Foto Rontgen) yang digabungkan ke dalam dokumen hasil pemeriksaan resmi.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                            {attachments.map((att) => (
                                <div
                                    key={att.id}
                                    className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50 transition-colors flex items-center justify-between text-xs"
                                >
                                    <div className="truncate pr-2">
                                        <span className="font-medium text-zinc-800 block truncate">
                                            {att.original_filename}
                                        </span>
                                        <span className="text-[10px] text-zinc-400 uppercase">
                                            {att.attachment_type} &bull; {(att.file_size / 1024).toFixed(0)} KB
                                        </span>
                                    </div>
                                    <FileText className="w-5 h-5 text-zinc-400 shrink-0" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Bottom Action Card */}
                <div className="mt-8 bg-zinc-900 text-white rounded-xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center sm:text-left">
                        <h3 className="text-sm font-bold tracking-tight">
                            Perlu Cetakan Fisik atau Salinan Dokumen PDF?
                        </h3>
                        <p className="text-xs text-zinc-400">
                            Unduh buku hasil MCU lengkap dengan kop surat resmi, barcode, dan tanda tangan digital dokter.
                        </p>
                    </div>

                    <a
                        href={route('portal.download-pdf', token)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-zinc-900 bg-white hover:bg-zinc-100 rounded-md transition-colors shadow-xs shrink-0"
                    >
                        <Download className="w-4 h-4" />
                        <span>Unduh PDF Resmi</span>
                    </a>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-zinc-200/80 bg-white py-6 px-4 text-center text-xs text-zinc-500 mt-12">
                <div className="max-w-5xl mx-auto space-y-2">
                    <div className="font-medium text-zinc-700">
                        {clinic.clinic_name || 'Klinik Utama & Laboratorium Master Summit'} &bull; Rekam Medis Elektronik Terintegrasi
                    </div>
                    <div className="text-[11px] text-zinc-400 max-w-xl mx-auto">
                        Hasil pemeriksaan ini adalah dokumen elektronik sah sesuai peraturan rekam medis yang berlaku. Segala bentuk pemalsuan atau modifikasi dokumen tanpa izin merupakan pelanggaran hukum.
                    </div>
                </div>
            </footer>
        </div>
    );
}
