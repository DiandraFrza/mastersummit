import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import NewPatientModal from './NewPatientModal';
import {
    User,
    UserCheck,
    Search,
    UserPlus,
    Building2,
    Layers,
    CreditCard,
    DollarSign,
    Check,
    Plus,
    Trash2,
    X,
    ChevronRight,
    ArrowLeft,
} from 'lucide-react';
import type {
    Patient,
    Company,
    Referrer,
    Package,
    Service,
    Bank,
    ServiceType,
    PayerType,
    BilledTo,
    PaymentMethod,
} from '@/types';

interface ReferrerTypeItem {
    id: number;
    name: string;
    code: string;
}

interface RegistrationWizardModalProps {
    show: boolean;
    onClose: () => void;
    services: Service[];
    packages: Package[];
    companies: Company[];
    referrers: (Referrer & { referrer_type_id?: number })[];
    referrerTypes?: ReferrerTypeItem[];
    banks: Bank[];
    onSuccess?: (created: any) => void;
}

export default function RegistrationWizardModal({
    show,
    onClose,
    services,
    packages,
    companies,
    referrers,
    referrerTypes = [],
    banks,
    onSuccess,
}: RegistrationWizardModalProps) {
    // Current Wizard Step: 1 | 2 | 3 | 4
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

    // New Patient Modal state
    const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);

    // Step 1: Patient Search State
    const [patientQuery, setPatientQuery] = useState('');
    const [patientResults, setPatientResults] = useState<Patient[]>([]);
    const [isSearchingPatient, setIsSearchingPatient] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

    // Step 2: Referrer State
    const [selectedReferrerType, setSelectedReferrerType] = useState<string>('aps');
    const [selectedReferrerId, setSelectedReferrerId] = useState<string>('');
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

    // Step 3: Exam Cart State
    const [examTab, setExamTab] = useState<'satuan' | 'paket'>('paket');
    const [serviceSearch, setServiceSearch] = useState('');
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [selectedEventLabel, setSelectedEventLabel] = useState<string>('');
    const [selectedPackageId, setSelectedPackageId] = useState<string>('');

    // Active Cart
    const [cartPackage, setCartPackage] = useState<Package | null>(null);
    const [cartServices, setCartServices] = useState<
        { service: Service; price: number; billed_to: BilledTo }[]
    >([]);
    const [globalDiscount, setGlobalDiscount] = useState<number>(0);

    // Step 4: Payment State
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
    const [selectedBankId, setSelectedBankId] = useState<string>('');
    const [tenderedAmount, setTenderedAmount] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Reset when modal opens/closes
    useEffect(() => {
        if (!show) {
            setCurrentStep(1);
            setSelectedPatient(null);
            setPatientQuery('');
            setPatientResults([]);
            setSelectedReferrerType('aps');
            setSelectedReferrerId('');
            setSelectedCompanyId('');
            setCartPackage(null);
            setCartServices([]);
            setGlobalDiscount(0);
            setPaymentMethod('cash');
            setSelectedBankId('');
            setTenderedAmount(0);
            setSubmitError(null);
        }
    }, [show]);

    // Live Debounced Patient Search
    useEffect(() => {
        if (patientQuery.trim().length < 2) {
            setPatientResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearchingPatient(true);
            try {
                const res = await fetch(
                    route('patients.search') + `?q=${encodeURIComponent(patientQuery.trim())}`,
                    { headers: { Accept: 'application/json' } }
                );
                if (res.ok) {
                    const data = await res.json();
                    setPatientResults(data);
                }
            } catch (err) {
                setPatientResults([]);
            } finally {
                setIsSearchingPatient(false);
            }
        }, 250);

        return () => clearTimeout(timer);
    }, [patientQuery]);

    // Available Years from Packages
    const packageYears = useMemo(() => {
        const years = packages
            .map((p) => p.year)
            .filter((y): y is number => typeof y === 'number' && y > 0);
        return Array.from(new Set(years)).sort((a, b) => b - a);
    }, [packages]);

    // Auto-select first year
    useEffect(() => {
        if (!selectedYear && packageYears.length > 0) {
            setSelectedYear(String(packageYears[0]));
        }
    }, [packageYears, selectedYear]);

    // Available Events for selected Year
    const availableEvents = useMemo(() => {
        if (!selectedYear) return [];
        const evs = packages
            .filter((p) => String(p.year) === selectedYear && p.event_label)
            .map((p) => p.event_label as string);
        return Array.from(new Set(evs));
    }, [packages, selectedYear]);

    // Auto-select first event
    useEffect(() => {
        if (availableEvents.length > 0) {
            if (!selectedEventLabel || !availableEvents.includes(selectedEventLabel)) {
                setSelectedEventLabel(availableEvents[0]);
            }
        } else {
            setSelectedEventLabel('');
        }
    }, [availableEvents, selectedEventLabel]);

    // Available Packages for selected Year + Event
    const filteredPackages = useMemo(() => {
        if (!selectedYear) return packages;
        return packages.filter((p) => {
            const matchYear = String(p.year) === selectedYear;
            const matchEvent = selectedEventLabel ? p.event_label === selectedEventLabel : true;
            return matchYear && matchEvent;
        });
    }, [packages, selectedYear, selectedEventLabel]);

    // Auto-select first package
    useEffect(() => {
        if (filteredPackages.length > 0) {
            if (!selectedPackageId || !filteredPackages.some((p) => String(p.id) === selectedPackageId)) {
                setSelectedPackageId(String(filteredPackages[0].id));
            }
        } else {
            setSelectedPackageId('');
        }
    }, [filteredPackages, selectedPackageId]);

    // Calculations
    const packageTotal = cartPackage
        ? Number(cartPackage.final_price ?? cartPackage.total_price)
        : 0;

    const servicesTotal = cartServices.reduce((sum, item) => sum + Number(item.price), 0);
    const subtotal = packageTotal + servicesTotal;
    const grandTotal = Math.max(0, subtotal - globalDiscount);
    const change = Math.max(0, tenderedAmount - grandTotal);
    const remaining = Math.max(0, grandTotal - tenderedAmount);

    // Keep tenderedAmount synced to grandTotal on step change if it was 0
    useEffect(() => {
        if (currentStep === 4 && tenderedAmount === 0) {
            setTenderedAmount(grandTotal);
        }
    }, [currentStep, grandTotal, tenderedAmount]);

    // Filter services list
    const filteredServices = useMemo(() => {
        if (!serviceSearch.trim()) return services;
        const q = serviceSearch.toLowerCase();
        return services.filter(
            (s) =>
                s.name.toLowerCase().includes(q) ||
                s.code.toLowerCase().includes(q) ||
                s.category.toLowerCase().includes(q)
        );
    }, [services, serviceSearch]);

    // Add Single Service to Cart
    const handleAddServiceToCart = (svc: Service) => {
        if (cartServices.some((item) => item.service.id === svc.id)) return;
        setCartServices((prev) => [
            ...prev,
            { service: svc, price: Number(svc.base_price), billed_to: 'personal' },
        ]);
    };

    // Remove Service from Cart
    const handleRemoveService = (serviceId: number) => {
        setCartServices((prev) => prev.filter((item) => item.service.id !== serviceId));
    };

    // Add Selected Package to Cart
    const handleAddPackageToCart = () => {
        if (!selectedPackageId) return;
        const pkg = packages.find((p) => String(p.id) === selectedPackageId);
        if (pkg) {
            setCartPackage(pkg);
        }
    };

    // Form Submission
    const handleFinalSubmit = async () => {
        if (!selectedPatient) {
            setSubmitError('Pasien belum dipilih.');
            setCurrentStep(1);
            return;
        }

        if (!cartPackage && cartServices.length === 0) {
            setSubmitError('Keranjang pemeriksaan masih kosong. Tambahkan paket atau layanan.');
            setCurrentStep(3);
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);

        // Determine Payer & Service Type
        let payerType: PayerType = 'aps';
        let finalReferrerId: number | null = null;
        let finalCompanyId: number | null = null;

        if (selectedReferrerType === 'corporate') {
            payerType = 'corporate';
            finalCompanyId = selectedCompanyId ? Number(selectedCompanyId) : null;
        } else if (selectedReferrerType !== 'aps') {
            payerType = 'referrer';
            finalReferrerId = selectedReferrerId ? Number(selectedReferrerId) : null;
        }

        const serviceType: ServiceType = cartPackage ? 'mcu' : 'regular';

        const payload = {
            patient_id: selectedPatient.id,
            service_type: serviceType,
            payer_type: payerType,
            referrer_id: finalReferrerId,
            company_id: finalCompanyId,
            package_id: cartPackage ? cartPackage.id : null,
            package_billed_to: payerType === 'corporate' ? 'corporate' : 'personal',
            discount_amount: globalDiscount,
            additional_services: cartServices.map((cs) => ({
                service_id: cs.service.id,
                price: cs.price,
                discount: 0,
                billed_to: cs.billed_to,
            })),
            payment: {
                amount: tenderedAmount,
                payment_method: paymentMethod,
                bank_id: selectedBankId ? Number(selectedBankId) : null,
                reference_no: '',
                notes: '',
            },
        };

        const tokenMeta = document.querySelector('meta[name="csrf-token"]');
        const csrfToken = tokenMeta ? tokenMeta.getAttribute('content') : '';

        try {
            const res = await fetch(route('registrations.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                onClose();
                // If backend redirects or flashes created_registration, handle callback
                if (onSuccess) {
                    onSuccess({
                        patient_name: selectedPatient.name,
                        grand_total: grandTotal,
                    });
                }
                // Refresh Inertia page to update table list
                window.location.reload();
            } else {
                const errData = await res.json();
                setSubmitError(errData.message || 'Gagal menyimpan pendaftaran.');
            }
        } catch (err: any) {
            setSubmitError('Terjadi kesalahan jaringan.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Modal show={show} onClose={onClose} maxWidth="3xl">
                <div className="p-6">
                    {/* Modal Title & Step Bar */}
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-200 mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                                {currentStep}
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-zinc-900">
                                    Pendaftaran Pasien 1 Pintu
                                </h2>
                                <p className="text-xs text-zinc-500">
                                    {currentStep === 1 && 'Langkah 1: Identitas & Data Pasien'}
                                    {currentStep === 2 && 'Langkah 2: Informasi Asal Perujuk'}
                                    {currentStep === 3 && 'Langkah 3: Pemilihan Paket & Pemeriksaan'}
                                    {currentStep === 4 && 'Langkah 4: Pembayaran & Konfirmasi'}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-zinc-400 hover:text-zinc-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Step Breadcrumbs */}
                    <div className="grid grid-cols-4 gap-2 mb-5">
                        {[
                            { num: 1, label: 'Pasien' },
                            { num: 2, label: 'Perujuk' },
                            { num: 3, label: 'Pemeriksaan' },
                            { num: 4, label: 'Bayar & Cek' },
                        ].map((s) => (
                            <button
                                key={s.num}
                                type="button"
                                onClick={() => {
                                    if (s.num < currentStep) setCurrentStep(s.num as any);
                                }}
                                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded text-xs font-semibold border transition-all ${
                                    currentStep === s.num
                                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                                        : currentStep > s.num
                                        ? 'bg-zinc-100 border-zinc-300 text-zinc-800 cursor-pointer'
                                        : 'bg-white border-zinc-200 text-zinc-400 cursor-not-allowed'
                                }`}
                            >
                                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold bg-current text-white">
                                    {currentStep > s.num ? '✓' : s.num}
                                </span>
                                <span>{s.label}</span>
                            </button>
                        ))}
                    </div>

                    {submitError && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">
                            {submitError}
                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* LANGKAH 1: DATA PASIEN */}
                    {/* ======================================================== */}
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            {!selectedPatient ? (
                                <>
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                                            <input
                                                type="text"
                                                value={patientQuery}
                                                onChange={(e) => setPatientQuery(e.target.value)}
                                                placeholder="Cari pasien via NIK, Nama, NRM, atau No HP..."
                                                className="w-full h-10 pl-9 pr-4 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                                                autoFocus
                                            />
                                            {isSearchingPatient && (
                                                <span className="absolute right-3 top-2.5 text-xs text-zinc-400">
                                                    Mencari...
                                                </span>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setIsNewPatientModalOpen(true)}
                                            className="inline-flex items-center gap-1.5 h-10 px-4 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors shrink-0 shadow-xs"
                                        >
                                            <UserPlus className="w-4 h-4" />
                                            <span>Pasien Baru</span>
                                        </button>
                                    </div>

                                    {/* Patient Autocomplete Results List */}
                                    {patientResults.length > 0 && (
                                        <div className="border border-zinc-200 rounded-md overflow-hidden divide-y divide-zinc-200 bg-white max-h-60 overflow-y-auto">
                                            {patientResults.map((p) => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedPatient(p);
                                                        setPatientResults([]);
                                                    }}
                                                    className="w-full text-left p-3 hover:bg-zinc-50 flex items-center justify-between transition-colors"
                                                >
                                                    <div>
                                                        <div className="font-semibold text-sm text-zinc-900">
                                                            {p.name}
                                                        </div>
                                                        <div className="text-xs text-zinc-500 font-mono flex items-center gap-3 mt-0.5">
                                                            <span>NRM: {p.medical_record_no}</span>
                                                            {p.nik && <span>NIK: {p.nik}</span>}
                                                            <span>JK: {p.gender === 'L' ? 'L' : 'P'}</span>
                                                        </div>
                                                    </div>
                                                    <span className="h-7 px-2.5 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded border border-emerald-200 flex items-center">
                                                        Pilih
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {patientQuery.trim().length >= 2 &&
                                        !isSearchingPatient &&
                                        patientResults.length === 0 && (
                                            <div className="p-6 text-center border border-dashed border-zinc-300 rounded-md bg-zinc-50">
                                                <p className="text-sm text-zinc-600">
                                                    Pasien dengan kata kunci "{patientQuery}" tidak ditemukan.
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsNewPatientModalOpen(true)}
                                                    className="mt-3 inline-flex items-center gap-1.5 h-9 px-3 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-300 transition-colors"
                                                >
                                                    <UserPlus className="w-3.5 h-3.5" />
                                                    Daftarkan Sebagai Pasien Baru
                                                </button>
                                            </div>
                                        )}
                                </>
                            ) : (
                                /* Selected Patient Card */
                                <div className="p-4 bg-emerald-50/60 border border-emerald-300 rounded-md">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
                                                {selectedPatient.gender === 'L' ? 'L' : 'P'}
                                            </div>
                                            <div>
                                                <div className="text-base font-bold text-zinc-900">
                                                    {selectedPatient.name}
                                                </div>
                                                <div className="text-xs text-zinc-600 font-mono mt-0.5 flex flex-wrap gap-x-4">
                                                    <span>NRM: {selectedPatient.medical_record_no}</span>
                                                    <span>NIK: {selectedPatient.nik || '-'}</span>
                                                    <span>
                                                        Tgl Lahir:{' '}
                                                        {selectedPatient.birth_date
                                                            ? selectedPatient.birth_date.substring(0, 10)
                                                            : '-'}
                                                    </span>
                                                </div>
                                                {selectedPatient.phone && (
                                                    <div className="text-xs text-zinc-500 mt-1">
                                                        No. HP: {selectedPatient.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedPatient(null)}
                                            className="h-8 px-3 text-xs font-medium text-zinc-600 bg-white border border-zinc-300 hover:bg-zinc-50 rounded transition-colors"
                                        >
                                            Ganti Pasien
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end pt-4 border-t border-zinc-200">
                                <button
                                    type="button"
                                    disabled={!selectedPatient}
                                    onClick={() => setCurrentStep(2)}
                                    className="inline-flex items-center gap-1.5 h-10 px-5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-md transition-colors shadow-xs"
                                >
                                    <span>Lanjut ke Perujuk</span>
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* LANGKAH 2: PERUJUK */}
                    {/* ======================================================== */}
                    {currentStep === 2 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                                    Jenis Perujuk
                                </label>
                                <select
                                    value={selectedReferrerType}
                                    onChange={(e) => {
                                        setSelectedReferrerType(e.target.value);
                                        setSelectedReferrerId('');
                                        setSelectedCompanyId('');
                                    }}
                                    className="w-full h-10 px-3 text-sm bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                                >
                                    <option value="aps">APS (Atas Permintaan Sendiri)</option>
                                    {referrerTypes.map((rt) => (
                                        <option key={rt.id} value={rt.code}>
                                            {rt.name}
                                        </option>
                                    ))}
                                    <option value="corporate">Perusahaan / Korporasi</option>
                                </select>
                            </div>

                            {selectedReferrerType === 'corporate' && (
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                                        Pilih Perusahaan
                                    </label>
                                    <select
                                        value={selectedCompanyId}
                                        onChange={(e) => setSelectedCompanyId(e.target.value)}
                                        className="w-full h-10 px-3 text-sm bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                                    >
                                        <option value="">— Pilih Perusahaan —</option>
                                        {companies.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {selectedReferrerType !== 'aps' && selectedReferrerType !== 'corporate' && (
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                                        Nama Perujuk
                                    </label>
                                    <select
                                        value={selectedReferrerId}
                                        onChange={(e) => setSelectedReferrerId(e.target.value)}
                                        className="w-full h-10 px-3 text-sm bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                                    >
                                        <option value="">— Pilih Perujuk —</option>
                                        {referrers.map((r) => (
                                            <option key={r.id} value={r.id}>
                                                {r.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(1)}
                                    className="inline-flex items-center gap-1.5 h-10 px-4 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-md transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span>Kembali</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(3)}
                                    className="inline-flex items-center gap-1.5 h-10 px-5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors shadow-xs"
                                >
                                    <span>Lanjut ke Pemeriksaan</span>
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* LANGKAH 3: PEMERIKSAAN (SATUAN & PAKET) */}
                    {/* ======================================================== */}
                    {currentStep === 3 && (
                        <div className="space-y-4">
                            {/* Toggle Tab */}
                            <div className="flex border-b border-zinc-200">
                                <button
                                    type="button"
                                    onClick={() => setExamTab('paket')}
                                    className={`py-2 px-4 text-sm font-semibold border-b-2 transition-colors ${
                                        examTab === 'paket'
                                            ? 'border-emerald-600 text-emerald-700'
                                            : 'border-transparent text-zinc-500 hover:text-zinc-800'
                                    }`}
                                >
                                    Paket Pemeriksaan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setExamTab('satuan')}
                                    className={`py-2 px-4 text-sm font-semibold border-b-2 transition-colors ${
                                        examTab === 'satuan'
                                            ? 'border-emerald-600 text-emerald-700'
                                            : 'border-transparent text-zinc-500 hover:text-zinc-800'
                                    }`}
                                >
                                    Layanan Satuan
                                </button>
                            </div>

                            {/* TAB PAKET: 3 Cascading Dropdowns */}
                            {examTab === 'paket' && (
                                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-md space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-700 mb-1">
                                                Tahun
                                            </label>
                                            <select
                                                value={selectedYear}
                                                onChange={(e) => setSelectedYear(e.target.value)}
                                                className="w-full h-10 px-2.5 text-xs bg-white border border-zinc-300 rounded focus:outline-none focus:ring-1 focus:ring-zinc-900"
                                            >
                                                {packageYears.map((y) => (
                                                    <option key={y} value={y}>
                                                        {y}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-700 mb-1">
                                                Event
                                            </label>
                                            <select
                                                value={selectedEventLabel}
                                                onChange={(e) => setSelectedEventLabel(e.target.value)}
                                                className="w-full h-10 px-2.5 text-xs bg-white border border-zinc-300 rounded focus:outline-none focus:ring-1 focus:ring-zinc-900"
                                            >
                                                {availableEvents.map((ev) => (
                                                    <option key={ev} value={ev}>
                                                        {ev}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-700 mb-1">
                                                Paket
                                            </label>
                                            <select
                                                value={selectedPackageId}
                                                onChange={(e) => setSelectedPackageId(e.target.value)}
                                                className="w-full h-10 px-2.5 text-xs bg-white border border-zinc-300 rounded focus:outline-none focus:ring-1 focus:ring-zinc-900"
                                            >
                                                {filteredPackages.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.name} (Rp{' '}
                                                        {Number(
                                                            p.final_price ?? p.total_price
                                                        ).toLocaleString('id-ID')}
                                                        )
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={handleAddPackageToCart}
                                            className="inline-flex items-center gap-1.5 h-9 px-4 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors shadow-xs"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>Tambah ke Keranjang</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* TAB SATUAN: Search & Quick Add */}
                            {examTab === 'satuan' && (
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={serviceSearch}
                                        onChange={(e) => setServiceSearch(e.target.value)}
                                        placeholder="Cari layanan (Laboratorium, Rontgen, EKG, Fisik)..."
                                        className="w-full h-10 px-3 text-xs border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                                    />
                                    <div className="border border-zinc-200 rounded-md max-h-48 overflow-y-auto divide-y divide-zinc-200 bg-white">
                                        {filteredServices.slice(0, 15).map((s) => {
                                            const isAdded = cartServices.some(
                                                (item) => item.service.id === s.id
                                            );
                                            return (
                                                <div
                                                    key={s.id}
                                                    className="p-2.5 flex items-center justify-between text-xs hover:bg-zinc-50"
                                                >
                                                    <div>
                                                        <span className="font-semibold text-zinc-900">
                                                            {s.name}
                                                        </span>
                                                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold bg-zinc-100 text-zinc-600">
                                                            {s.category}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-mono font-semibold text-zinc-800 tabular-nums">
                                                            Rp {Number(s.base_price).toLocaleString('id-ID')}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            disabled={isAdded}
                                                            onClick={() => handleAddServiceToCart(s)}
                                                            className={`h-7 px-2.5 rounded text-[11px] font-semibold transition-colors ${
                                                                isAdded
                                                                    ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                                                                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                                            }`}
                                                        >
                                                            {isAdded ? 'Ditambahkan' : '+ Tambah'}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* KERANJANG PEMERIKSAAN */}
                            <div className="border border-zinc-200 rounded-md p-3 bg-zinc-50/50">
                                <div className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-2">
                                    Keranjang Pemeriksaan
                                </div>

                                {!cartPackage && cartServices.length === 0 ? (
                                    <div className="py-4 text-center text-xs text-zinc-400">
                                        Belum ada paket atau layanan satuan di dalam keranjang.
                                    </div>
                                ) : (
                                    <div className="space-y-1.5 divide-y divide-zinc-200">
                                        {/* Package in Cart */}
                                        {cartPackage && (
                                            <div className="pt-1.5 flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                                        PAKET
                                                    </span>
                                                    <span className="font-semibold text-zinc-900">
                                                        {cartPackage.name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-mono font-bold text-zinc-900 tabular-nums">
                                                        Rp {packageTotal.toLocaleString('id-ID')}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setCartPackage(null)}
                                                        className="text-red-500 hover:text-red-700"
                                                        title="Hapus Paket"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Single Services in Cart */}
                                        {cartServices.map((cs) => (
                                            <div
                                                key={cs.service.id}
                                                className="pt-1.5 flex items-center justify-between text-xs"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-200 text-zinc-700 uppercase">
                                                        {cs.service.category}
                                                    </span>
                                                    <span className="text-zinc-800 font-medium">
                                                        {cs.service.name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-mono text-zinc-800 tabular-nums">
                                                        Rp {cs.price.toLocaleString('id-ID')}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveService(cs.service.id)}
                                                        className="text-red-500 hover:text-red-700"
                                                        title="Hapus Layanan"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Subtotal & Diskon */}
                                <div className="mt-3 pt-2 border-t border-zinc-200 space-y-1 text-xs">
                                    <div className="flex justify-between items-center text-zinc-600">
                                        <span>Subtotal:</span>
                                        <span className="font-mono font-semibold tabular-nums text-zinc-900">
                                            Rp {subtotal.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-zinc-600">Diskon (Rp):</span>
                                        <input
                                            type="number"
                                            min={0}
                                            value={globalDiscount}
                                            onChange={(e) => setGlobalDiscount(Math.max(0, Number(e.target.value)))}
                                            className="w-28 h-7 text-right px-2 text-xs font-mono border border-zinc-300 rounded"
                                        />
                                    </div>
                                    <div className="flex justify-between items-center font-bold text-sm text-emerald-800 pt-1 border-t border-zinc-200">
                                        <span>TOTAL AKHIR:</span>
                                        <span className="font-mono tabular-nums">
                                            Rp {grandTotal.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(2)}
                                    className="inline-flex items-center gap-1.5 h-10 px-4 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-md transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span>Kembali</span>
                                </button>
                                <button
                                    type="button"
                                    disabled={!cartPackage && cartServices.length === 0}
                                    onClick={() => setCurrentStep(4)}
                                    className="inline-flex items-center gap-1.5 h-10 px-5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-md transition-colors shadow-xs"
                                >
                                    <span>Lanjut ke Pembayaran</span>
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* LANGKAH 4: PEMBAYARAN & CEK ULANG */}
                    {/* ======================================================== */}
                    {currentStep === 4 && (
                        <div className="space-y-4">
                            {/* Summary Card Before Saving */}
                            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-md text-xs space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Pasien:</span>
                                    <span className="font-semibold text-zinc-900">
                                        {selectedPatient?.name} (NRM: {selectedPatient?.medical_record_no})
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Perujuk:</span>
                                    <span className="font-medium text-zinc-800 uppercase">
                                        {selectedReferrerType}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Total Pemeriksaan:</span>
                                    <span className="font-medium text-zinc-800">
                                        {cartPackage ? `1 Paket (${cartPackage.name})` : ''}
                                        {cartServices.length > 0 ? ` + ${cartServices.length} Tes Satuan` : ''}
                                    </span>
                                </div>
                                <div className="flex justify-between pt-1 border-t border-zinc-200 font-bold text-sm text-emerald-800">
                                    <span>Total Tagihan:</span>
                                    <span className="font-mono tabular-nums">
                                        Rp {grandTotal.toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>

                            {/* Payment Method & Bank */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                                        Metode Pembayaran
                                    </label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                                        className="w-full h-10 px-3 text-sm bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                                    >
                                        <option value="cash">Tunai (Cash)</option>
                                        <option value="transfer">Transfer Bank</option>
                                        <option value="qris">QRIS</option>
                                        <option value="edc">Kartu Debit / EDC</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                                        Pilihan Bank {paymentMethod === 'cash' ? '(Opsional)' : ''}
                                    </label>
                                    <select
                                        value={selectedBankId}
                                        disabled={paymentMethod === 'cash'}
                                        onChange={(e) => setSelectedBankId(e.target.value)}
                                        className="w-full h-10 px-3 text-sm bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:bg-zinc-100 disabled:text-zinc-400"
                                    >
                                        <option value="">— Pilih Bank Penerima —</option>
                                        {banks.map((b) => (
                                            <option key={b.id} value={b.id}>
                                                {b.name} ({b.account_number})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-zinc-700 mb-1">
                                        Nominal Pembayaran (Rp)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={tenderedAmount}
                                        onChange={(e) => setTenderedAmount(Number(e.target.value))}
                                        className="w-full h-10 px-3 text-sm font-mono border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                                    />
                                </div>

                                <div className="flex flex-col justify-end">
                                    {tenderedAmount >= grandTotal ? (
                                        <div className="p-2.5 bg-emerald-50 rounded border border-emerald-200 text-xs">
                                            <span className="text-zinc-600">Kembalian: </span>
                                            <span className="font-mono font-bold text-emerald-700 tabular-nums">
                                                Rp {change.toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="p-2.5 bg-red-50 rounded border border-red-200 text-xs">
                                            <span className="text-zinc-600">Sisa Tagihan: </span>
                                            <span className="font-mono font-bold text-red-600 tabular-nums">
                                                Rp {remaining.toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(3)}
                                    className="inline-flex items-center gap-1.5 h-10 px-4 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-md transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span>Kembali</span>
                                </button>
                                <button
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={handleFinalSubmit}
                                    className="inline-flex items-center gap-1.5 h-10 px-6 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-md transition-colors shadow-xs"
                                >
                                    {isSubmitting ? 'Memproses...' : 'Simpan Pendaftaran'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Sub-modal: New Patient Quick Registration */}
            <NewPatientModal
                show={isNewPatientModalOpen}
                onClose={() => setIsNewPatientModalOpen(false)}
                onPatientCreated={(newPatient) => {
                    setSelectedPatient(newPatient);
                    setPatientResults([]);
                }}
            />
        </>
    );
}
