import React from 'react';
import { Head } from '@inertiajs/react';
import { ShieldAlert, Clock, Phone, Mail, MapPin, Building2, HelpCircle } from 'lucide-react';
import type { ClinicSetting } from '@/types';

interface StatusProps {
    status: 'revoked' | 'expired';
    title: string;
    message: string;
    clinic: ClinicSetting;
}

export default function Status({ status, title, message, clinic }: StatusProps) {
    const isRevoked = status === 'revoked';

    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col justify-between text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white">
            <Head title={`${title} - ${clinic.clinic_name || 'Master Summit'}`} />

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
                </div>
            </header>

            {/* Main Center Content */}
            <main className="flex-grow flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md bg-white border border-zinc-200/80 rounded-xl shadow-xs overflow-hidden">
                    <div className="p-8 text-center">
                        <div
                            className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 border ${
                                isRevoked
                                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                                    : 'bg-amber-50 border-amber-200 text-amber-600'
                            }`}
                        >
                            {isRevoked ? (
                                <ShieldAlert className="w-7 h-7" />
                            ) : (
                                <Clock className="w-7 h-7" />
                            )}
                        </div>

                        <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider mb-2 ${
                                isRevoked
                                    ? 'bg-rose-100/70 text-rose-700'
                                    : 'bg-amber-100/70 text-amber-800'
                            }`}
                        >
                            {isRevoked ? 'Akses Dinonaktifkan' : 'Akses Kedaluwarsa'}
                        </span>

                        <h1 className="text-lg font-bold text-zinc-900 tracking-tight">
                            {title}
                        </h1>

                        <p className="text-xs text-zinc-600 mt-2 leading-relaxed">
                            {message}
                        </p>

                        <div className="mt-6 pt-6 border-t border-zinc-100 text-left">
                            <h2 className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5 mb-3">
                                <HelpCircle className="w-3.5 h-3.5 text-zinc-500" />
                                <span>Layanan Bantuan &amp; Administrasi</span>
                            </h2>

                            <div className="bg-zinc-50 rounded-lg p-3.5 border border-zinc-200/60 space-y-2 text-xs text-zinc-600">
                                <div className="font-medium text-zinc-900">
                                    {clinic.clinic_name || 'Klinik Utama & Laboratorium Master Summit'}
                                </div>
                                {clinic.address && (
                                    <div className="flex items-start gap-2 text-[11px]">
                                        <MapPin className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" />
                                        <span>{clinic.address}</span>
                                    </div>
                                )}
                                {clinic.phone && (
                                    <div className="flex items-center gap-2 text-[11px]">
                                        <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                        <span className="font-mono">{clinic.phone}</span>
                                    </div>
                                )}
                                {clinic.email && (
                                    <div className="flex items-center gap-2 text-[11px]">
                                        <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                        <span className="font-mono">{clinic.email}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-zinc-200/80 bg-white py-4 px-4 text-center text-xs text-zinc-500">
                <div className="max-w-4xl mx-auto space-y-1">
                    <div>
                        {clinic.clinic_name || 'Klinik Utama & Laboratorium Master Summit'} &bull; Layanan Medis Terpercaya
                    </div>
                    <div className="text-[11px] text-zinc-400">
                        Dokumen dan rekam medis dilindungi oleh Peraturan Perlindungan Data Medis Pasien.
                    </div>
                </div>
            </footer>
        </div>
    );
}
