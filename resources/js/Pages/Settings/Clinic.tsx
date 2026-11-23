import React, { useState, useRef } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Building2,
    UploadCloud,
    X,
    FileText,
    Sliders,
    Globe,
    Phone,
    Mail,
    MapPin,
    ShieldAlert,
    Loader2,
    CheckCircle2,
    Printer,
} from 'lucide-react';
import type { PageProps, ClinicSetting } from '@/types';

interface ClinicSettingProps extends PageProps {
    setting: ClinicSetting;
}

export default function ClinicSettingPage({ setting }: ClinicSettingProps) {
    const logoInputRef = useRef<HTMLInputElement>(null);
    const watermarkInputRef = useRef<HTMLInputElement>(null);

    // Initial image previews from saved paths
    const [logoPreview, setLogoPreview] = useState<string | null>(
        setting.logo_path ? `/storage/${setting.logo_path}` : null
    );
    const [watermarkPreview, setWatermarkPreview] = useState<string | null>(
        setting.watermark_path ? `/storage/${setting.watermark_path}` : null
    );

    const { data, setData, post, processing, errors, isDirty } = useForm({
        clinic_name: setting.clinic_name || '',
        clinic_subtitle: setting.clinic_subtitle || '',
        izin_klinik_no: setting.izin_klinik_no || '',
        address: setting.address || '',
        city: setting.city || '',
        phone: setting.phone || '',
        email: setting.email || '',
        website: setting.website || '',
        watermark_opacity: setting.watermark_opacity ?? 0.08,
        footer_text: setting.footer_text || '',
        control_card_paper_size: setting.control_card_paper_size || 'A5',
        default_online_expiry_days: setting.default_online_expiry_days || 30,
        logo_file: null as File | null,
        watermark_file: null as File | null,
        remove_logo: false,
        remove_watermark: false,
    });

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData((prev) => ({ ...prev, logo_file: file, remove_logo: false }));
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveLogo = () => {
        setData((prev) => ({ ...prev, logo_file: null, remove_logo: true }));
        setLogoPreview(null);
        if (logoInputRef.current) logoInputRef.current.value = '';
    };

    const handleWatermarkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData((prev) => ({ ...prev, watermark_file: file, remove_watermark: false }));
            setWatermarkPreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveWatermark = () => {
        setData((prev) => ({ ...prev, watermark_file: null, remove_watermark: true }));
        setWatermarkPreview(null);
        if (watermarkInputRef.current) watermarkInputRef.current.value = '';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('settings.clinic.update'), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout title="Pengaturan Klinik & Kop Surat">
            <Head title="Pengaturan Klinik & Kop Surat — Master Summit" />

            <div className="space-y-6">
                {/* Header Title */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-200/70">
                    <div>
                        <h2 className="text-base font-semibold text-zinc-900 tracking-tight">
                            Pengaturan Klinik & Kop Surat HVS
                        </h2>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Konfigurasi identitas klinik, watermark transparan, ukuran kertas cetak, dan preview kop surat otomatis.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {isDirty && (
                            <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-sm">
                                Perubahan belum disimpan
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={processing}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 rounded-sm shadow-2xs transition-colors cursor-pointer"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Menyimpan...</span>
                                </>
                            ) : (
                                <span>Simpan</span>
                            )}
                        </button>
                    </div>
                </div>

                {/* 2-Column Grid: Form & Live HVS Kop Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Configuration Forms (7 cols) */}
                    <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-5">
                        {/* Section 1: Identitas & Legalitas */}
                        <div className="bg-white border border-zinc-200/80 rounded-md p-4 space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                                <Building2 className="w-4 h-4 text-zinc-500" />
                                <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                                    Identitas & Legalitas Klinik
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                                        Nama Resmi Klinik <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.clinic_name}
                                        onChange={(e) => setData('clinic_name', e.target.value)}
                                        placeholder="Master Summit Clinic & Lab"
                                        required
                                        className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200/90 rounded-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors"
                                    />
                                    {errors.clinic_name && <p className="mt-1 text-[11px] text-rose-600">{errors.clinic_name}</p>}
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                                        Slogan / Subtitle Klinik
                                    </label>
                                    <input
                                        type="text"
                                        value={data.clinic_subtitle}
                                        onChange={(e) => setData('clinic_subtitle', e.target.value)}
                                        placeholder="Pusat Layanan Kesehatan, Laboratorium & Medical Check-Up Terpadu"
                                        className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200/90 rounded-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors"
                                    />
                                    {errors.clinic_subtitle && <p className="mt-1 text-[11px] text-rose-600">{errors.clinic_subtitle}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                                        No. Izin Operasional Klinik
                                    </label>
                                    <input
                                        type="text"
                                        value={data.izin_klinik_no}
                                        onChange={(e) => setData('izin_klinik_no', e.target.value)}
                                        placeholder="440/012/KLINIK-UTAMA/2026"
                                        className="w-full px-3 py-1.5 text-xs font-mono bg-zinc-50 border border-zinc-200/90 rounded-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors"
                                    />
                                    {errors.izin_klinik_no && <p className="mt-1 text-[11px] text-rose-600">{errors.izin_klinik_no}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                                        Kota / Wilayah
                                    </label>
                                    <input
                                        type="text"
                                        value={data.city}
                                        onChange={(e) => setData('city', e.target.value)}
                                        placeholder="Jakarta Selatan"
                                        className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200/90 rounded-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors"
                                    />
                                    {errors.city && <p className="mt-1 text-[11px] text-rose-600">{errors.city}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                                        No. Telepon / Hotline
                                    </label>
                                    <input
                                        type="text"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder="(021) 7890-1234 / 0812-9999-8888"
                                        className="w-full px-3 py-1.5 text-xs tabular-nums bg-zinc-50 border border-zinc-200/90 rounded-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors"
                                    />
                                    {errors.phone && <p className="mt-1 text-[11px] text-rose-600">{errors.phone}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                                        Email Resmi
                                    </label>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="info@mastersummit.co.id"
                                        className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200/90 rounded-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors"
                                    />
                                    {errors.email && <p className="mt-1 text-[11px] text-rose-600">{errors.email}</p>}
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                                        Website
                                    </label>
                                    <input
                                        type="text"
                                        value={data.website}
                                        onChange={(e) => setData('website', e.target.value)}
                                        placeholder="https://mastersummit.co.id"
                                        className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200/90 rounded-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors"
                                    />
                                    {errors.website && <p className="mt-1 text-[11px] text-rose-600">{errors.website}</p>}
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                                        Alamat Lengkap
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        placeholder="Jl. Summit Medical No. 88, Kebayoran Baru, Jakarta Selatan"
                                        className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200/90 rounded-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors resize-none"
                                    />
                                    {errors.address && <p className="mt-1 text-[11px] text-rose-600">{errors.address}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Aset Kop Surat & Watermark */}
                        <div className="bg-white border border-zinc-200/80 rounded-md p-4 space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                                <FileText className="w-4 h-4 text-zinc-500" />
                                <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                                    Berkas Logo & Watermark Transparan
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Logo Upload Box */}
                                <div className="p-3 bg-zinc-50/70 border border-zinc-200/80 rounded-sm flex flex-col items-center justify-center text-center">
                                    <span className="text-xs font-medium text-zinc-700 mb-1">Logo Utama Kop (PNG/JPG)</span>
                                    {logoPreview ? (
                                        <div className="relative my-2 p-2 bg-white border border-zinc-200 rounded-sm">
                                            <img
                                                src={logoPreview}
                                                alt="Logo Preview"
                                                className="h-16 max-w-full object-contain"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleRemoveLogo}
                                                className="absolute -top-1.5 -right-1.5 p-0.5 bg-zinc-900 text-white rounded-full hover:bg-rose-600 transition-colors"
                                                title="Hapus Logo"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="my-2 flex flex-col items-center text-zinc-400">
                                            <UploadCloud className="w-6 h-6 mb-1 text-zinc-300" />
                                            <span className="text-[10px]">Belum ada logo terunggah</span>
                                        </div>
                                    )}
                                    <input
                                        ref={logoInputRef}
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        onChange={handleLogoChange}
                                        className="hidden"
                                        id="logo_file"
                                    />
                                    <label
                                        htmlFor="logo_file"
                                        className="cursor-pointer text-[11px] font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-100 px-2.5 py-1 rounded-sm transition-colors mt-1"
                                    >
                                        Pilih Berkas Logo
                                    </label>
                                    {errors.logo_file && (
                                        <p className="mt-1 text-[10px] text-rose-600">{errors.logo_file}</p>
                                    )}
                                </div>

                                {/* Watermark Upload Box */}
                                <div className="p-3 bg-zinc-50/70 border border-zinc-200/80 rounded-sm flex flex-col items-center justify-center text-center">
                                    <span className="text-xs font-medium text-zinc-700 mb-1">Watermark Transparan (PNG)</span>
                                    {watermarkPreview ? (
                                        <div className="relative my-2 p-2 bg-white border border-zinc-200 rounded-sm">
                                            <img
                                                src={watermarkPreview}
                                                alt="Watermark Preview"
                                                className="h-16 max-w-full object-contain"
                                                style={{ opacity: data.watermark_opacity }}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleRemoveWatermark}
                                                className="absolute -top-1.5 -right-1.5 p-0.5 bg-zinc-900 text-white rounded-full hover:bg-rose-600 transition-colors"
                                                title="Hapus Watermark"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="my-2 flex flex-col items-center text-zinc-400">
                                            <UploadCloud className="w-6 h-6 mb-1 text-zinc-300" />
                                            <span className="text-[10px]">Belum ada watermark terunggah</span>
                                        </div>
                                    )}
                                    <input
                                        ref={watermarkInputRef}
                                        type="file"
                                        accept="image/png,image/webp"
                                        onChange={handleWatermarkChange}
                                        className="hidden"
                                        id="watermark_file"
                                    />
                                    <label
                                        htmlFor="watermark_file"
                                        className="cursor-pointer text-[11px] font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-100 px-2.5 py-1 rounded-sm transition-colors mt-1"
                                    >
                                        Pilih Berkas Watermark
                                    </label>
                                    {errors.watermark_file && (
                                        <p className="mt-1 text-[10px] text-rose-600">{errors.watermark_file}</p>
                                    )}
                                </div>
                            </div>

                            {/* Watermark Opacity Slider */}
                            <div className="pt-2 border-t border-zinc-100 space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <label className="font-medium text-zinc-700 flex items-center gap-1.5">
                                        <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                                        <span>Ketebalan / Opacity Watermark HVS</span>
                                    </label>
                                    <span className="font-mono text-zinc-800 font-semibold tabular-nums text-xs">
                                        {Math.round(data.watermark_opacity * 100)}% ({Number(data.watermark_opacity).toFixed(2)})
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0.01"
                                    max="0.50"
                                    step="0.01"
                                    value={data.watermark_opacity}
                                    onChange={(e) => setData('watermark_opacity', parseFloat(e.target.value))}
                                    className="w-full accent-zinc-900 cursor-pointer"
                                />
                                <div className="flex justify-between text-[10px] text-zinc-400 tabular-nums">
                                    <span>1% (Sangat Samar)</span>
                                    <span className="text-emerald-600 font-medium">8% (Standar Ideal)</span>
                                    <span>50% (Sangat Tebal)</span>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Konfigurasi Cetak HVS & Hasil Online */}
                        <div className="bg-white border border-zinc-200/80 rounded-md p-4 space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                                <Printer className="w-4 h-4 text-zinc-500" />
                                <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                                    Konfigurasi Cetak HVS & Portal Online
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                {/* Control Card Paper Size */}
                                <div>
                                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                                        Ukuran Cetak Kartu Kontrol Pasien
                                    </label>
                                    <select
                                        value={data.control_card_paper_size}
                                        onChange={(e) => setData('control_card_paper_size', e.target.value as any)}
                                        className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200/90 rounded-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors font-medium text-zinc-800"
                                    >
                                        <option value="A5">A5 — Standar 1 Lembar</option>
                                        <option value="A6">A6 — Ukuran Saku / Mini</option>
                                        <option value="A4_2IN1">A4 2-in-1 — Cetak 2 Kartu per Lembar A4 (Hemat Kertas)</option>
                                    </select>
                                    <p className="text-[10px] text-zinc-400 mt-1">
                                        Dicetak langsung pada kertas HVS putih polos melalui modul Registrasi.
                                    </p>
                                </div>

                                {/* Default Online Expiry */}
                                <div>
                                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                                        Masa Berlaku Link Hasil Online
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="1"
                                            max="365"
                                            value={data.default_online_expiry_days}
                                            onChange={(e) => setData('default_online_expiry_days', parseInt(e.target.value) || 30)}
                                            className="w-24 px-3 py-1.5 text-xs tabular-nums bg-zinc-50 border border-zinc-200/90 rounded-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors font-medium text-zinc-800"
                                        />
                                        <span className="text-xs text-zinc-500 font-medium">Hari</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-400 mt-1">
                                        Link portal hasil `/r/{'{token}'}` aktif 30 hari sejak MCU selesai.
                                    </p>
                                </div>

                                {/* Footer Text Disclaimer */}
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                                        Catatan Kaki Hasil Pemeriksaan (Footer Disclaimer)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={data.footer_text}
                                        onChange={(e) => setData('footer_text', e.target.value)}
                                        placeholder="Dokumen hasil pemeriksaan ini diterbitkan secara elektronik dan sah tanpa tanda tangan basah."
                                        className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200/90 rounded-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors resize-none"
                                    />
                                    {errors.footer_text && <p className="mt-1 text-[11px] text-rose-600">{errors.footer_text}</p>}
                                </div>
                            </div>
                        </div>
                    </form>

                    {/* Right Column: Interactive Live HVS Paper Kop Preview (5 cols) */}
                    <div className="lg:col-span-5 space-y-2 sticky top-20">
                        <div className="flex items-center justify-between pb-1 text-xs">
                            <span className="font-semibold text-zinc-800 uppercase tracking-wider text-[11px]">
                                Live Preview Cetak Kertas HVS
                            </span>
                            <span className="text-[10px] font-mono text-zinc-400">
                                {data.control_card_paper_size} HVS Plain
                            </span>
                        </div>

                        {/* Simulated HVS Sheet Surface */}
                        <div className="bg-white border border-zinc-300 rounded-sm p-6 shadow-sm relative overflow-hidden text-zinc-900 min-h-[460px] flex flex-col justify-between select-none">
                            {/* Watermark in center with dynamic opacity */}
                            {watermarkPreview && (
                                <div
                                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
                                    style={{ opacity: data.watermark_opacity }}
                                >
                                    <img
                                        src={watermarkPreview}
                                        alt="Watermark Preview"
                                        className="w-56 h-56 object-contain"
                                    />
                                </div>
                            )}

                            {/* Letterhead (Kop Surat) Header */}
                            <div className="relative z-10">
                                <div className="flex items-center gap-3.5 pb-2.5">
                                    {logoPreview ? (
                                        <img
                                            src={logoPreview}
                                            alt="Logo"
                                            className="h-14 w-14 object-contain shrink-0"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-sm bg-zinc-900 text-white flex items-center justify-center shrink-0">
                                            <Building2 className="w-6 h-6 text-emerald-400" />
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold tracking-tight text-zinc-950 uppercase leading-snug">
                                            {data.clinic_name || 'NAMA KLINIK & LABORATORIUM'}
                                        </h4>
                                        {data.clinic_subtitle && (
                                            <p className="text-[10px] font-medium text-zinc-600 leading-tight">
                                                {data.clinic_subtitle}
                                            </p>
                                        )}
                                        {data.izin_klinik_no && (
                                            <p className="text-[9px] font-mono text-zinc-500 leading-tight">
                                                Izin Operasional: {data.izin_klinik_no}
                                            </p>
                                        )}
                                        <p className="text-[9px] text-zinc-500 leading-tight mt-0.5">
                                            {data.address || 'Alamat klinik lengkap'} {data.city ? `— ${data.city}` : ''}
                                        </p>
                                        <p className="text-[9px] text-zinc-500 tabular-nums leading-tight">
                                            {data.phone ? `Telp: ${data.phone}` : ''} {data.email ? `| Email: ${data.email}` : ''}
                                        </p>
                                    </div>
                                </div>

                                {/* Standard Medical Dual Border Line for Kop Surat */}
                                <div className="border-b-2 border-zinc-950 mb-0.5" />
                                <div className="border-b border-zinc-800 mb-4" />
                            </div>

                            {/* Simulated Medical Document Body */}
                            <div className="relative z-10 flex-1 space-y-3 opacity-60">
                                <div className="text-center font-bold text-xs uppercase tracking-wider text-zinc-800">
                                    SURAT HASIL PEMERIKSAAN LABORATORIUM / MCU
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-[10px] border-b border-zinc-200 pb-2">
                                    <div>
                                        <span className="text-zinc-400">No. Registrasi:</span>{' '}
                                        <span className="font-mono font-medium">REG-202611-0001</span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-400">No. Rekam Medis:</span>{' '}
                                        <span className="font-mono font-medium">NRM-000123</span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-400">Nama Pasien:</span>{' '}
                                        <span className="font-medium">CONTOH PASIEN MCU</span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-400">Tgl. Lahir / Umur:</span>{' '}
                                        <span className="tabular-nums">15/08/1990 (36 Th)</span>
                                    </div>
                                </div>

                                <div className="space-y-1.5 text-[9px]">
                                    <div className="flex justify-between font-bold border-b border-zinc-200 pb-0.5">
                                        <span>PEMERIKSAAN</span>
                                        <span>HASIL</span>
                                        <span>NILAI RUJUKAN</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Hemoglobin</span>
                                        <span className="font-medium">14.5 g/dL</span>
                                        <span>13.0 - 17.0</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Leukosit</span>
                                        <span className="font-medium">6,800 /uL</span>
                                        <span>4,000 - 10,000</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Glukosa Puasa</span>
                                        <span className="font-medium">88 mg/dL</span>
                                        <span>70 - 100</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Disclaimer */}
                            <div className="relative z-10 pt-3 border-t border-zinc-200 mt-4 text-[8px] text-zinc-400 text-center leading-relaxed">
                                {data.footer_text ||
                                    'Dokumen hasil pemeriksaan ini diterbitkan secara elektronik dan sah tanpa tanda tangan basah.'}
                            </div>
                        </div>

                        <p className="text-[10px] text-zinc-400 text-center">
                            Setiap perubahan data kop dan slider watermark langsung tersimulasi di atas sebelum dicetak.
                        </p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
