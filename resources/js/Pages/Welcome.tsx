import React from 'react';
import { Head } from '@inertiajs/react';
import { Activity, ShieldCheck, Database, Building2 } from 'lucide-react';
import type { PageProps } from '@/types';

export default function Welcome({ auth, clinicSetting }: PageProps) {
    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col justify-center items-center px-4 py-12">
            <Head title="Welcome — Master Summit" />
            
            <div className="w-full max-w-xl bg-white border border-zinc-200/80 rounded-md p-8 shadow-sm">
                <div className="flex items-center gap-3 border-b border-zinc-100 pb-5 mb-6">
                    <div className="w-10 h-10 rounded-sm bg-zinc-900 flex items-center justify-center text-white">
                        <Activity className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-zinc-900 tracking-tight">
                            {clinicSetting?.clinic_name || 'Master Summit Clinic & Lab'}
                        </h1>
                        <p className="text-xs text-zinc-500 font-medium">
                            {clinicSetting?.clinic_subtitle || 'Clinic, Lab & MCU Management System'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-3.5 bg-zinc-50/80 rounded-sm border border-zinc-200/60 flex items-center gap-3">
                        <ShieldCheck className="w-4 h-4 text-zinc-700" />
                        <div>
                            <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Role Access</div>
                            <div className="text-xs font-semibold text-zinc-800">Multi-Role RBAC</div>
                        </div>
                    </div>
                    <div className="p-3.5 bg-zinc-50/80 rounded-sm border border-zinc-200/60 flex items-center gap-3">
                        <Database className="w-4 h-4 text-zinc-700" />
                        <div>
                            <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Database</div>
                            <div className="text-xs font-semibold text-zinc-800 tabular-nums">28 Tables Schema</div>
                        </div>
                    </div>
                </div>

                <div className="text-xs text-zinc-600 bg-zinc-50 p-3 rounded-sm border border-zinc-200/60 space-y-1">
                    <div className="flex justify-between">
                        <span className="text-zinc-500">Paper Size:</span>
                        <span className="font-semibold text-zinc-800 tabular-nums">
                            {clinicSetting?.control_card_paper_size || 'A5'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-zinc-500">Default Online Expiry:</span>
                        <span className="font-semibold text-zinc-800 tabular-nums">
                            {clinicSetting?.default_online_expiry_days || 30} Hari
                        </span>
                    </div>
                </div>
            </div>

            <p className="mt-8 text-center text-xs text-zinc-400">
                Phase 1A — Foundation, Auth, RBAC & Core Layout
            </p>
        </div>
    );
}
