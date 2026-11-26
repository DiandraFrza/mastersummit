import React from 'react';
import Modal from '@/Components/Modal';
import { CheckCircle2, Receipt, Tag, Printer, X } from 'lucide-react';

interface RegistrationSuccessModalProps {
    show: boolean;
    onClose: () => void;
    registration: {
        id: number;
        reg_no: string;
        patient_name: string;
        grand_total?: number;
    } | null;
}

export default function RegistrationSuccessModal({
    show,
    onClose,
    registration,
}: RegistrationSuccessModalProps) {
    if (!registration) return null;

    const handlePrintReceipt = () => {
        window.open(route('registrations.receipt', registration.id) + '?print=1', '_blank');
    };

    const handlePrintLabel = () => {
        window.open(route('registrations.label-lab', registration.id), '_blank');
    };

    const handlePrintControlCard = () => {
        window.open(route('registrations.control-card', registration.id) + '?print=1', '_blank');
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-zinc-900">Pendaftaran Berhasil</h2>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Pasien telah didaftarkan dan data pemeriksaan siap diproses.
                        </p>
                    </div>
                </div>

                <div className="p-4 bg-zinc-50 rounded-md border border-zinc-200 text-xs mb-5 space-y-1.5">
                    <div className="flex justify-between items-center">
                        <span className="text-zinc-500">No. Registrasi:</span>
                        <span className="font-mono font-bold text-sm text-emerald-700 tabular-nums">
                            {registration.reg_no}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-zinc-500">Nama Pasien:</span>
                        <span className="font-semibold text-zinc-900 text-sm">
                            {registration.patient_name}
                        </span>
                    </div>
                    {typeof registration.grand_total === 'number' && (
                        <div className="flex justify-between items-center pt-1 border-t border-zinc-200">
                            <span className="text-zinc-500">Total Tarif:</span>
                            <span className="font-mono font-bold text-zinc-900 tabular-nums">
                                Rp {registration.grand_total.toLocaleString('id-ID')}
                            </span>
                        </div>
                    )}
                </div>

                <div className="space-y-2.5">
                    <button
                        type="button"
                        onClick={handlePrintReceipt}
                        className="w-full flex items-center justify-center gap-2 h-11 px-4 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors shadow-xs"
                    >
                        <Receipt className="w-4 h-4" />
                        <span>Cetak Kwitansi</span>
                    </button>

                    <button
                        type="button"
                        onClick={handlePrintLabel}
                        className="w-full flex items-center justify-center gap-2 h-11 px-4 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-md transition-colors"
                    >
                        <Tag className="w-4 h-4 text-zinc-500" />
                        <span>Cetak Label Lab</span>
                    </button>

                    <button
                        type="button"
                        onClick={handlePrintControlCard}
                        className="w-full flex items-center justify-center gap-2 h-11 px-4 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-md transition-colors"
                    >
                        <Printer className="w-4 h-4 text-zinc-500" />
                        <span>Cetak Kartu Kontrol</span>
                    </button>
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-200 text-right">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-9 px-4 text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
                    >
                        Selesai
                    </button>
                </div>
            </div>
        </Modal>
    );
}
