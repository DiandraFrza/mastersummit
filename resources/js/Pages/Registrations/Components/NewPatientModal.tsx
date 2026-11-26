import React, { useState } from 'react';
import Modal from '@/Components/Modal';
import { UserPlus, X } from 'lucide-react';
import type { Patient } from '@/types';

interface NewPatientModalProps {
    show: boolean;
    onClose: () => void;
    onPatientCreated: (patient: Patient) => void;
}

export default function NewPatientModal({
    show,
    onClose,
    onPatientCreated,
}: NewPatientModalProps) {
    const [name, setName] = useState('');
    const [nik, setNik] = useState('');
    const [gender, setGender] = useState<'L' | 'P'>('L');
    const [birthDate, setBirthDate] = useState('1990-01-01');
    const [phone, setPhone] = useState('');
    const [department, setDepartment] = useState('');
    const [address, setAddress] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!name.trim()) {
            setErrorMessage('Nama lengkap wajib diisi.');
            return;
        }

        setIsSubmitting(true);
        try {
            const tokenMeta = document.querySelector('meta[name="csrf-token"]');
            const csrfToken = tokenMeta ? tokenMeta.getAttribute('content') : '';

            const res = await fetch(route('patients.quick-store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    name: name.trim(),
                    nik: nik.trim() || null,
                    gender,
                    birth_date: birthDate,
                    phone: phone.trim() || null,
                    default_department: department.trim() || null,
                    address: address.trim() || null,
                }),
            });

            const data = await res.json();
            if (res.ok && data.success && data.patient) {
                // Reset form
                setName('');
                setNik('');
                setGender('L');
                setBirthDate('1990-01-01');
                setPhone('');
                setDepartment('');
                setAddress('');
                onPatientCreated(data.patient);
                onClose();
            } else {
                setErrorMessage(data.message || 'Gagal menyimpan pasien baru.');
            }
        } catch (err: any) {
            setErrorMessage('Terjadi kesalahan jaringan.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="lg">
            <div className="p-6">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-200 mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <UserPlus className="w-4 h-4" />
                        </div>
                        <h2 className="text-base font-bold text-zinc-900">Tambah Pasien Baru</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {errorMessage && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-zinc-700 mb-1">
                                Nama Lengkap <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Nama sesuai KTP"
                                required
                                className="w-full h-10 px-3 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-zinc-700 mb-1">
                                NIK (KTP)
                            </label>
                            <input
                                type="text"
                                value={nik}
                                onChange={(e) => setNik(e.target.value)}
                                placeholder="16 digit NIK"
                                maxLength={16}
                                className="w-full h-10 px-3 text-sm font-mono border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-zinc-700 mb-1">
                                Jenis Kelamin <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={gender}
                                onChange={(e) => setGender(e.target.value as 'L' | 'P')}
                                className="w-full h-10 px-3 text-sm bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            >
                                <option value="L">Laki-laki (L)</option>
                                <option value="P">Perempuan (P)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-zinc-700 mb-1">
                                Tanggal Lahir <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                                required
                                className="w-full h-10 px-3 text-sm font-mono border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-zinc-700 mb-1">
                                No. Telepon / HP
                            </label>
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Contoh: 08123456789"
                                className="w-full h-10 px-3 text-sm font-mono border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-zinc-700 mb-1">
                                Bagian / Departemen (Opsional)
                            </label>
                            <input
                                type="text"
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                placeholder="Contoh: Produksi, HRD, Umum"
                                className="w-full h-10 px-3 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-zinc-700 mb-1">
                                Alamat Domisili
                            </label>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Alamat lengkap"
                                className="w-full h-10 px-3 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-10 px-4 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-md transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="h-10 px-5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-md transition-colors shadow-xs"
                        >
                            {isSubmitting ? 'Menyimpan...' : 'Simpan Pasien'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
