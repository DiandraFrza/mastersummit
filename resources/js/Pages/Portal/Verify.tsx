import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { ShieldCheck, Lock, ArrowRight, Building2, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import type { ClinicSetting } from '@/types';

interface VerifyProps {
    token: string;
    patientMasked: string;
    regNoMasked: string;
    clinic: ClinicSetting;
    expiresAt: string;
}

export default function Verify({
    token,
    patientMasked,
    regNoMasked,
    clinic,
    expiresAt,
}: VerifyProps) {
    const { data, setData, post, processing, errors } = useForm({
        credential: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('portal.verify', token));
    };

    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col justify-between text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white">
            <Head title={`Verifikasi Hasil Pemeriksaan - ${clinic.clinic_name || 'Master Summit'}`} />

            {/* Topbar */}
            <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur sticky top-0 z-10 px-4 py-3">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
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

                    <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded-full">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Enkripsi Medis 256-bit</span>
                    </div>
                </div>
            </header>

            {/* Main Center Content */}
            <main className="flex-grow flex items-center justify-center px-4 py-10">
                <div className="w-full max-w-md bg-white border border-zinc-200/80 rounded-xl shadow-xs overflow-hidden">
                    {/* Header banner */}
                    <div className="p-6 border-b border-zinc-100 bg-gradient-to-b from-zinc-50/50 to-white text-center">
                        <div className="w-12 h-12 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto mb-3 text-zinc-700">
                            <Lock className="w-5 h-5 text-zinc-800" />
                        </div>
                        <h1 className="text-base font-bold text-zinc-900 tracking-tight">
                            Verifikasi Akses Dokumen Medis
                        </h1>
                        <p className="text-xs text-zinc-500 mt-1">
                            Demi menjaga kerahasiaan data rekam medis pasien, silakan verifikasi identitas Anda untuk membuka hasil pemeriksaan.
                        </p>
                    </div>

                    {/* Patient Context Card */}
                    <div className="px-6 py-4 bg-zinc-50/80 border-b border-zinc-100 text-xs space-y-1.5">
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-500 text-[11px]">Nama Pasien:</span>
                            <span className="font-semibold text-zinc-900 font-mono">{patientMasked}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-500 text-[11px]">No. Registrasi:</span>
                            <span className="font-mono text-zinc-700">{regNoMasked}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-500 text-[11px]">Masa Aktif Tautan:</span>
                            <span className="text-emerald-700 font-medium text-[11px]">Aktif s/d {expiresAt}</span>
                        </div>
                    </div>

                    {/* Verification Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-800 mb-1">
                                Tanggal Lahir atau 4 Digit Nomor HP
                            </label>
                            <input
                                type="text"
                                autoFocus
                                value={data.credential}
                                onChange={(e) => setData('credential', e.target.value)}
                                placeholder="Contoh: 17081995 atau 7890"
                                className="w-full px-3.5 py-2 text-sm font-mono tracking-wide rounded-md border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-all bg-white"
                            />
                            {errors.credential && (
                                <p className="text-xs text-rose-600 mt-1.5 flex items-start gap-1 font-medium">
                                    <span>•</span>
                                    <span>{errors.credential}</span>
                                </p>
                            )}
                            <div className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed">
                                Masukkan <strong>Tanggal Lahir</strong> (format 8 digit: <code>HHBBMMPP</code>, misal: 25 Desember 1990 &rarr; <code>25121990</code>) atau <strong>4 digit terakhir</strong> nomor telepon yang terdaftar saat registrasi.
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 rounded-md transition-colors shadow-xs"
                        >
                            <span>Buka Hasil Pemeriksaan</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </form>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-zinc-200/80 bg-white py-4 px-4 text-center text-xs text-zinc-500">
                <div className="max-w-4xl mx-auto space-y-1">
                    <div>
                        {clinic.clinic_name || 'Klinik Utama & Laboratorium Master Summit'} &bull; {clinic.address || 'Jakarta Selatan'}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                        Butuh bantuan teknis? Hubungi kami di: {clinic.phone || '021-12345678'} atau email {clinic.email || 'info@mastersummit.co.id'}
                    </div>
                </div>
            </footer>
        </div>
    );
}
