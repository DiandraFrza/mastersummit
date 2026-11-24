import React, { useState, useEffect } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DataTable, { ColumnDef } from '@/Components/DataTable';
import Badge from '@/Components/Badge';
import ActionDropdown, { ActionDropdownItem } from '@/Components/ActionDropdown';
import Modal from '@/Components/Modal';
import {
    Plus,
    XCircle,
    CheckCircle2,
    Clock,
    AlertCircle,
    FileCheck2,
    Building2,
    Calendar,
    CreditCard,
    DollarSign,
    UserCheck,
    Search,
    Layers,
    Trash2,
    Printer,
    Eye,
    Receipt,
    ShieldAlert,
    Ban,
    FileText,
    Download,
} from 'lucide-react';
import type {
    PageProps,
    Pagination,
    Registration,
    Patient,
    Company,
    Referrer,
    Package,
    Service,
    McuEvent,
    Bank,
    ServiceType,
    PayerType,
    PaymentStatus,
    WorkflowStatus,
    BilledTo,
    PaymentMethod,
} from '@/types';

interface RegistrationsIndexProps extends PageProps {
    registrations: Pagination<Registration>;
    companies: Company[];
    referrers: Referrer[];
    packages: Package[];
    services: Service[];
    mcuEvents: McuEvent[];
    banks: Bank[];
    filters: Record<string, any>;
    nextRegNo: string;
}

const workflowBadges: Record<
    WorkflowStatus,
    { label: string; variant: 'neutral' | 'info' | 'warning' | 'success' | 'danger'; icon: any }
> = {
    registered: { label: 'Terdaftar', variant: 'neutral', icon: Clock },
    in_progress: { label: 'Sampel Diambil', variant: 'info', icon: Clock },
    result_entered: { label: 'Hasil Diinput', variant: 'warning', icon: AlertCircle },
    doctor_reviewed: { label: 'Review Dokter', variant: 'warning', icon: AlertCircle },
    manager_approved: { label: 'Disetujui Manajer', variant: 'success', icon: CheckCircle2 },
    completed: { label: 'Selesai', variant: 'success', icon: FileCheck2 },
    void: { label: 'Dibatalkan (Void)', variant: 'danger', icon: Ban },
};

const paymentBadges: Record<
    PaymentStatus,
    { label: string; variant: 'neutral' | 'info' | 'warning' | 'success' | 'danger' }
> = {
    unpaid: { label: 'Belum Bayar', variant: 'danger' },
    partial: { label: 'Bayar Sebagian (DP)', variant: 'warning' },
    paid: { label: 'Lunas', variant: 'success' },
    corporate_billed: { label: 'Invoice Perusahaan', variant: 'info' },
};

export default function RegistrationsIndex({
    registrations,
    companies,
    referrers,
    packages,
    services,
    mcuEvents,
    banks,
    filters,
    nextRegNo,
}: RegistrationsIndexProps) {
    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
    const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);

    // Patient live search for registration modal
    const [patientSearch, setPatientSearch] = useState('');
    const [patientResults, setPatientResults] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [isSearchingPatient, setIsSearchingPatient] = useState(false);

    // Form Registration
    const regForm = useForm({
        patient_id: '' as string | number,
        service_type: 'regular' as ServiceType,
        payer_type: 'aps' as PayerType,
        referrer_id: '' as string | number,
        company_id: '' as string | number,
        mcu_event_id: '' as string | number,
        package_id: '' as string | number,
        department_snapshot: '',
        package_billed_to: 'corporate' as BilledTo,
        discount_amount: 0,
        additional_services: [] as {
            service_id: number;
            name: string;
            price: number;
            discount: number;
            billed_to: BilledTo;
        }[],
        payment: {
            amount: 0,
            payment_method: 'cash' as PaymentMethod,
            bank_id: '' as string | number,
            reference_no: '',
            notes: '',
        },
    });

    // Form Void
    const voidForm = useForm({
        void_reason: '',
    });

    // Debounced search for patient
    useEffect(() => {
        if (patientSearch.trim().length < 2) {
            setPatientResults([]);
            return;
        }

        const timer = setTimeout(() => {
            setIsSearchingPatient(true);
            fetch(`/patients?search=${encodeURIComponent(patientSearch)}`, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            })
                .then((res) => res.json())
                .then((res) => {
                    const data = res?.props?.patients?.data || [];
                    setPatientResults(data);
                })
                .catch(() => setPatientResults([]))
                .finally(() => setIsSearchingPatient(false));
        }, 300);

        return () => clearTimeout(timer);
    }, [patientSearch]);

    const openCreateModal = () => {
        regForm.reset();
        setSelectedPatient(null);
        setPatientSearch('');
        setPatientResults([]);
        regForm.clearErrors();
        setIsCreateModalOpen(true);
    };

    const handleSelectPatient = (patient: Patient) => {
        setSelectedPatient(patient);
        regForm.setData((prev) => ({
            ...prev,
            patient_id: patient.id,
            company_id: patient.default_company_id || prev.company_id,
            department_snapshot: patient.default_department || prev.department_snapshot,
            payer_type: patient.default_company_id ? 'corporate' : 'aps',
        }));
        setPatientResults([]);
    };

    const handlePackageChange = (pkgId: string) => {
        regForm.setData('package_id', pkgId);
    };

    const handleAddAddonService = (serviceId: string) => {
        if (!serviceId) return;
        const svc = services.find((s) => s.id === Number(serviceId));
        if (!svc) return;

        // check if already added
        if (regForm.data.additional_services.some((item) => item.service_id === svc.id)) {
            return;
        }

        regForm.setData('additional_services', [
            ...regForm.data.additional_services,
            {
                service_id: svc.id,
                name: svc.name,
                price: Number(svc.base_price),
                discount: 0,
                billed_to: regForm.data.payer_type === 'corporate' ? 'personal' : 'personal',
            },
        ]);
    };

    const handleRemoveAddon = (index: number) => {
        const next = [...regForm.data.additional_services];
        next.splice(index, 1);
        regForm.setData('additional_services', next);
    };

    // Calculate totals for preview
    const selectedPkg = packages.find((p) => p.id === Number(regForm.data.package_id));
    const packagePrice = selectedPkg ? Number(selectedPkg.final_price) : 0;
    const addonsTotal = regForm.data.additional_services.reduce(
        (sum, item) => sum + (item.price - item.discount),
        0
    );
    const subtotal = packagePrice + addonsTotal;
    const globalDiscount = Number(regForm.data.discount_amount) || 0;
    const grandTotal = Math.max(0, subtotal - globalDiscount);

    // Split breakdown: Corporate vs Personal
    let corporateBill = 0;
    let personalBill = 0;

    if (selectedPkg) {
        if (regForm.data.package_billed_to === 'corporate') {
            corporateBill += packagePrice;
        } else {
            personalBill += packagePrice;
        }
    }

    regForm.data.additional_services.forEach((item) => {
        const itemFinal = item.price - item.discount;
        if (item.billed_to === 'corporate') {
            corporateBill += itemFinal;
        } else {
            personalBill += itemFinal;
        }
    });

    const handleSubmitRegistration = (e: React.FormEvent) => {
        e.preventDefault();
        regForm.post(route('registrations.store'), {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                regForm.reset();
            },
        });
    };

    const openVoidModal = (registration: Registration) => {
        setSelectedRegistration(registration);
        voidForm.reset();
        voidForm.clearErrors();
        setIsVoidModalOpen(true);
    };

    const handleVoidSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRegistration) return;

        voidForm.post(route('registrations.void', selectedRegistration.id), {
            onSuccess: () => {
                setIsVoidModalOpen(false);
                voidForm.reset();
            },
        });
    };

    const openDetailModal = (reg: Registration) => {
        setSelectedRegistration(reg);
        setIsDetailModalOpen(true);
    };

    const formatCurrency = (val: number | string) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(Number(val));
    };

    const columns: ColumnDef<Registration>[] = [
        {
            header: 'No. Reg (Barcode)',
            accessorKey: 'reg_no',
            isNumeric: true,
            sortable: true,
            width: '160px',
            cell: ({ value }) => (
                <span className="font-mono text-zinc-900 font-semibold tabular-nums text-xs">
                    {value}
                </span>
            ),
        },
        {
            header: 'Pasien & NRM',
            id: 'patient',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium text-zinc-900">{row.patient?.name || '—'}</span>
                    <span className="text-[11px] font-mono text-zinc-400 tabular-nums">
                        {row.patient?.medical_record_no} • {row.age_years_snapshot ?? row.patient?.age ?? '—'} thn
                    </span>
                </div>
            ),
        },
        {
            header: 'Layanan & Pembayar',
            id: 'service_payer',
            cell: ({ row }) => (
                <div className="flex flex-col gap-1 text-xs">
                    <div className="flex items-center gap-1.5">
                        <Badge variant={row.service_type === 'mcu' ? 'info' : 'neutral'}>
                            {row.service_type === 'mcu' ? 'MCU' : 'Reguler'}
                        </Badge>
                        <Badge
                            variant={
                                row.payer_type === 'corporate'
                                    ? 'warning'
                                    : row.payer_type === 'referrer'
                                    ? 'info'
                                    : 'neutral'
                            }
                        >
                            {row.payer_type.toUpperCase()}
                        </Badge>
                    </div>
                    {row.company && (
                        <span className="text-[11px] text-zinc-500 truncate max-w-[150px]">
                            {row.company.name}
                        </span>
                    )}
                </div>
            ),
        },
        {
            header: 'Paket / Pemeriksaan',
            id: 'exam_package',
            cell: ({ row }) => (
                <div className="flex flex-col text-xs">
                    <span className="font-medium text-zinc-800 truncate max-w-[180px]">
                        {row.package?.name || `${row.items?.length || 0} Pemeriksaan Satuan`}
                    </span>
                    {row.items && row.package && (
                        <span className="text-[11px] text-zinc-400">
                            {row.items.length} item ({row.items.filter((i) => !i.is_from_package).length} add-on)
                        </span>
                    )}
                </div>
            ),
        },
        {
            header: 'Tagihan & Bayar',
            accessorKey: 'grand_total',
            sortable: true,
            align: 'right',
            width: '140px',
            cell: ({ row }) => (
                <div className="flex flex-col text-right font-mono tabular-nums text-xs">
                    <span className="font-semibold text-zinc-900">
                        {formatCurrency(row.grand_total)}
                    </span>
                    <span className="text-[11px] text-emerald-600">
                        Bayar: {formatCurrency(row.paid_amount)}
                    </span>
                </div>
            ),
        },
        {
            header: 'Status Bayar',
            accessorKey: 'payment_status',
            sortable: true,
            width: '130px',
            align: 'center',
            cell: ({ value }) => {
                const conf = paymentBadges[value] || paymentBadges.unpaid;
                return <Badge variant={conf.variant}>{conf.label}</Badge>;
            },
        },
        {
            header: 'Alur Kerja (Status)',
            accessorKey: 'workflow_status',
            sortable: true,
            width: '140px',
            align: 'center',
            cell: ({ value }) => {
                const conf = workflowBadges[value] || workflowBadges.registered;
                return (
                    <Badge variant={conf.variant} icon={conf.icon}>
                        {conf.label}
                    </Badge>
                );
            },
        },
        {
            header: 'Aksi',
            id: 'actions',
            align: 'right',
            width: '80px',
            cell: ({ row }) => {
                const isVoid = row.workflow_status === 'void';
                const isCompleted = row.workflow_status === 'completed';

                const items: ActionDropdownItem[] = [
                    {
                        label: 'Detail Pendaftaran',
                        icon: Eye,
                        onClick: () => openDetailModal(row),
                    },
                    {
                        label: 'Cetak Kartu Kontrol',
                        icon: Printer,
                        onClick: () => window.open(route('registrations.control-card', { registration: row.id }), '_blank'),
                    },
                ];

                if (row.service_type === 'mcu') {
                    items.push({
                        label: 'Buku Laporan MCU (HTML)',
                        icon: FileText,
                        onClick: () => window.open(route('prints.mcu-book', { registration: row.id }), '_blank'),
                    });
                    items.push({
                        label: 'Download Buku MCU (PDF)',
                        icon: Download,
                        onClick: () => window.open(route('prints.mcu-book.pdf', { registration: row.id }) + '?download=1', '_blank'),
                    });
                }

                if (!isVoid && !isCompleted) {
                    items.push({
                        label: 'Batalkan (Void)',
                        icon: Ban,
                        variant: 'danger',
                        onClick: () => openVoidModal(row),
                    });
                }

                return <ActionDropdown items={items} align="right" />;
            },
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Pendaftaran 1 Pintu & Split Billing" />

            <div className="space-y-4">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-zinc-200/80">
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-zinc-700" />
                            Pendaftaran 1 Pintu
                        </h1>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Registrasi pasien terpadu untuk Reguler, MCU Korporat, Pasien Mandiri (APS), dan Rujukan Dokter.
                        </p>
                    </div>

                    <div>
                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-colors shadow-xs"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Pendaftaran Baru
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-3 rounded-lg border border-zinc-200/80 shadow-xs flex flex-wrap items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500 font-medium">Layanan:</span>
                        <select
                            value={filters.service_type || 'all'}
                            onChange={(e) => {
                                router.get(
                                    route('registrations.index'),
                                    { ...filters, service_type: e.target.value, page: 1 },
                                    { preserveState: true, preserveScroll: true }
                                );
                            }}
                            className="px-2.5 py-1 text-xs rounded-md border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                        >
                            <option value="all">Semua Layanan</option>
                            <option value="regular">Reguler</option>
                            <option value="mcu">MCU</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500 font-medium">Pembayar:</span>
                        <select
                            value={filters.payer_type || 'all'}
                            onChange={(e) => {
                                router.get(
                                    route('registrations.index'),
                                    { ...filters, payer_type: e.target.value, page: 1 },
                                    { preserveState: true, preserveScroll: true }
                                );
                            }}
                            className="px-2.5 py-1 text-xs rounded-md border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                        >
                            <option value="all">Semua Tipe</option>
                            <option value="aps">APS (Pribadi)</option>
                            <option value="corporate">Corporate</option>
                            <option value="referrer">Perujuk</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500 font-medium">Status Alur:</span>
                        <select
                            value={filters.workflow_status || 'all'}
                            onChange={(e) => {
                                router.get(
                                    route('registrations.index'),
                                    { ...filters, workflow_status: e.target.value, page: 1 },
                                    { preserveState: true, preserveScroll: true }
                                );
                            }}
                            className="px-2.5 py-1 text-xs rounded-md border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                        >
                            <option value="all">Semua Status</option>
                            <option value="registered">Terdaftar</option>
                            <option value="in_progress">Sampel Diambil</option>
                            <option value="result_entered">Hasil Diinput</option>
                            <option value="doctor_reviewed">Review Dokter</option>
                            <option value="manager_approved">Disetujui Manajer</option>
                            <option value="completed">Selesai</option>
                            <option value="void">Void</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500 font-medium">Bayar:</span>
                        <select
                            value={filters.payment_status || 'all'}
                            onChange={(e) => {
                                router.get(
                                    route('registrations.index'),
                                    { ...filters, payment_status: e.target.value, page: 1 },
                                    { preserveState: true, preserveScroll: true }
                                );
                            }}
                            className="px-2.5 py-1 text-xs rounded-md border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                        >
                            <option value="all">Semua Status Bayar</option>
                            <option value="unpaid">Belum Bayar</option>
                            <option value="partial">Bayar Sebagian</option>
                            <option value="paid">Lunas</option>
                            <option value="corporate_billed">Tagihan Korporat</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <DataTable<Registration>
                    columns={columns}
                    data={registrations}
                    filters={filters}
                    searchPlaceholder="Cari no reg barcode, NRM, nama pasien..."
                />
            </div>

            {/* ========================================================================= */}
            {/* Modal: Pendaftaran Baru (Single-Door Wizard) */}
            {/* ========================================================================= */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Pendaftaran Pasien 1 Pintu"
                subtitle={`No. Registrasi Baru: ${nextRegNo}`}
                maxWidth="3xl"
                footer={
                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="px-3 py-1.5 text-xs font-medium text-zinc-600 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            form="reg-form"
                            disabled={regForm.processing || !selectedPatient}
                            className="px-4 py-1.5 text-xs font-semibold text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-colors shadow-xs disabled:opacity-50"
                        >
                            {regForm.processing ? 'Memproses...' : 'Proses Pendaftaran'}
                        </button>
                    </div>
                }
            >
                <form id="reg-form" onSubmit={handleSubmitRegistration} className="space-y-4">
                    {/* 1. Pilih Pasien */}
                    <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200/80 space-y-2">
                        <label className="block text-xs font-semibold text-zinc-900">
                            1. Identitas Pasien <span className="text-rose-500">*</span>
                        </label>

                        {!selectedPatient ? (
                            <div className="relative">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={patientSearch}
                                        onChange={(e) => setPatientSearch(e.target.value)}
                                        placeholder="Ketik NRM, NIK, atau Nama Pasien untuk mencari..."
                                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                                    />
                                    <Search className="w-4 h-4 text-zinc-400 absolute left-2.5 top-2" />
                                </div>

                                {isSearchingPatient && (
                                    <p className="text-[11px] text-zinc-400 mt-1">Mencari database pasien...</p>
                                )}

                                {patientResults.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-zinc-200 rounded-md shadow-lg max-h-48 overflow-y-auto divide-y divide-zinc-100">
                                        {patientResults.map((p) => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => handleSelectPatient(p)}
                                                className="w-full text-left p-2.5 hover:bg-zinc-50 flex items-center justify-between text-xs"
                                            >
                                                <div>
                                                    <span className="font-semibold text-zinc-900">{p.name}</span>
                                                    <span className="text-zinc-500 font-mono ml-2">({p.medical_record_no})</span>
                                                    {p.nik && <span className="text-zinc-400 font-mono ml-2">NIK: {p.nik}</span>}
                                                </div>
                                                <span className="text-[11px] text-zinc-400">
                                                    {p.gender === 'L' ? 'Laki-laki' : 'Perempuan'} • {p.age} thn
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between bg-white p-2.5 rounded border border-zinc-200">
                                <div>
                                    <span className="font-semibold text-zinc-900 text-xs">{selectedPatient.name}</span>
                                    <span className="text-zinc-500 font-mono text-xs ml-2">({selectedPatient.medical_record_no})</span>
                                    <span className="text-[11px] text-zinc-400 block mt-0.5">
                                        {selectedPatient.gender === 'L' ? 'Laki-laki' : 'Perempuan'} • {selectedPatient.age} thn • HP: {selectedPatient.phone || '—'}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedPatient(null)}
                                    className="text-xs text-rose-600 hover:text-rose-800 font-medium"
                                >
                                    Ganti Pasien
                                </button>
                            </div>
                        )}
                        {regForm.errors.patient_id && (
                            <p className="text-[11px] text-rose-500">{regForm.errors.patient_id}</p>
                        )}
                    </div>

                    {/* 2. Jenis Layanan & Pembayar */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Jenis Layanan <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={regForm.data.service_type}
                                onChange={(e) => regForm.setData('service_type', e.target.value as ServiceType)}
                                className="w-full px-2.5 py-1.5 text-xs rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            >
                                <option value="regular">Reguler / Non-MCU</option>
                                <option value="mcu">Medical Check Up (MCU)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Tipe Pembayar <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={regForm.data.payer_type}
                                onChange={(e) => regForm.setData('payer_type', e.target.value as PayerType)}
                                className="w-full px-2.5 py-1.5 text-xs rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            >
                                <option value="aps">Pribadi / APS (Bayar Sendiri)</option>
                                <option value="corporate">Corporate (Ditagihkan ke Klien)</option>
                                <option value="referrer">Perujuk (Klaim Partner)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Perusahaan / Klien Korporat
                            </label>
                            <select
                                value={regForm.data.company_id}
                                onChange={(e) => regForm.setData('company_id', e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            >
                                <option value="">— Non-Perusahaan —</option>
                                {companies.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Jika MCU, pilih Event MCU & Paket */}
                    {regForm.data.service_type === 'mcu' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                            <div>
                                <label className="block text-xs font-medium text-zinc-700 mb-1">
                                    Event MCU Korporat (Jika Ada)
                                </label>
                                <select
                                    value={regForm.data.mcu_event_id}
                                    onChange={(e) => regForm.setData('mcu_event_id', e.target.value)}
                                    className="w-full px-2.5 py-1.5 text-xs rounded-md border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                                >
                                    <option value="">— Walk-in / Non Event —</option>
                                    {mcuEvents.map((ev) => (
                                        <option key={ev.id} value={ev.id}>
                                            {ev.event_code} - {ev.event_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-zinc-700 mb-1">
                                    Paket Pemeriksaan MCU
                                </label>
                                <select
                                    value={regForm.data.package_id}
                                    onChange={(e) => handlePackageChange(e.target.value)}
                                    className="w-full px-2.5 py-1.5 text-xs rounded-md border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                                >
                                    <option value="">— Tanpa Paket (Item Satuan) —</option>
                                    {packages.map((pkg) => (
                                        <option key={pkg.id} value={pkg.id}>
                                            {pkg.name} ({formatCurrency(pkg.final_price)})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* 3. Pemeriksaan Tambahan (Add-On) & Split Billing */}
                    <div className="space-y-2 border-t border-zinc-200 pt-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-zinc-900">
                                2. Pemeriksaan Tambahan / Add-On (Split Billing)
                            </span>
                            <div className="w-64">
                                <select
                                    onChange={(e) => {
                                        handleAddAddonService(e.target.value);
                                        e.target.value = '';
                                    }}
                                    className="w-full px-2 py-1 text-xs rounded border border-zinc-300 bg-white"
                                >
                                    <option value="">+ Tambah Layanan Satuan</option>
                                    {services.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({formatCurrency(s.base_price)})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {regForm.data.additional_services.length === 0 ? (
                            <p className="text-xs text-zinc-400 italic">
                                Belum ada pemeriksaan tambahan. Pasien hanya akan menjalani item pemeriksaan dari paket di atas.
                            </p>
                        ) : (
                            <div className="border border-zinc-200 rounded-md overflow-hidden">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-zinc-50 text-[11px] font-semibold text-zinc-600 uppercase">
                                        <tr>
                                            <th className="py-2 px-3">Layanan Pemeriksaan</th>
                                            <th className="py-2 px-3 w-28 text-right">Tarif</th>
                                            <th className="py-2 px-3 w-40 text-center">Ditagihkan Ke (Billed To)</th>
                                            <th className="py-2 px-3 w-12 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-200">
                                        {regForm.data.additional_services.map((item, idx) => (
                                            <tr key={item.service_id}>
                                                <td className="py-2 px-3 font-medium text-zinc-800">
                                                    {item.name}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono tabular-nums">
                                                    {formatCurrency(item.price)}
                                                </td>
                                                <td className="py-2 px-3 text-center">
                                                    <select
                                                        value={item.billed_to}
                                                        onChange={(e) => {
                                                            const next = [...regForm.data.additional_services];
                                                            next[idx].billed_to = e.target.value as BilledTo;
                                                            regForm.setData('additional_services', next);
                                                        }}
                                                        className="px-2 py-0.5 text-xs rounded border border-zinc-300 bg-white"
                                                    >
                                                        <option value="personal">Pribadi (Pasien Bayar)</option>
                                                        <option value="corporate">Perusahaan (Invoice Korporat)</option>
                                                        <option value="referrer">Perujuk</option>
                                                    </select>
                                                </td>
                                                <td className="py-2 px-3 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveAddon(idx)}
                                                        className="p-1 text-rose-500 hover:text-rose-700"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Ringkasan Split Billing & Pembayaran */}
                    <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 space-y-3">
                        <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-200">
                            <div>
                                <span className="font-semibold text-zinc-800 block">Total Biaya Pemeriksaan:</span>
                                <span className="text-[11px] text-zinc-500">
                                    Paket: {formatCurrency(packagePrice)} • Add-on: {formatCurrency(addonsTotal)}
                                </span>
                            </div>
                            <span className="text-base font-bold text-zinc-900 font-mono tabular-nums">
                                {formatCurrency(grandTotal)}
                            </span>
                        </div>

                        {/* Split Billing Badge Indicator */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="bg-white p-2.5 rounded border border-zinc-200">
                                <span className="text-[11px] text-zinc-500 block">Ditagihkan ke Perusahaan (Klien):</span>
                                <span className="text-sm font-semibold text-zinc-900 font-mono tabular-nums">
                                    {formatCurrency(corporateBill)}
                                </span>
                            </div>
                            <div className="bg-white p-2.5 rounded border border-zinc-200">
                                <span className="text-[11px] text-zinc-500 block">Ditagihkan ke Pasien (Pribadi/APS):</span>
                                <span className="text-sm font-semibold text-zinc-900 font-mono tabular-nums">
                                    {formatCurrency(personalBill)}
                                </span>
                            </div>
                        </div>

                        {/* Input Pembayaran Kasir Pendaftaran */}
                        {personalBill > 0 && (
                            <div className="pt-2 border-t border-zinc-200 space-y-2">
                                <span className="text-xs font-semibold text-zinc-800 block">
                                    Pembayaran Kasir Saat Pendaftaran (Opsional)
                                </span>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                                            Jumlah Bayar (Rp)
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={regForm.data.payment.amount}
                                            onChange={(e) =>
                                                regForm.setData('payment', {
                                                    ...regForm.data.payment,
                                                    amount: Number(e.target.value),
                                                })
                                            }
                                            placeholder="0"
                                            className="w-full px-2.5 py-1 text-xs font-mono rounded border border-zinc-300 tabular-nums bg-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                                            Metode Bayar
                                        </label>
                                        <select
                                            value={regForm.data.payment.payment_method}
                                            onChange={(e) =>
                                                regForm.setData('payment', {
                                                    ...regForm.data.payment,
                                                    payment_method: e.target.value as PaymentMethod,
                                                })
                                            }
                                            className="w-full px-2.5 py-1 text-xs rounded border border-zinc-300 bg-white"
                                        >
                                            <option value="cash">Tunai (Cash)</option>
                                            <option value="qris">QRIS</option>
                                            <option value="transfer">Transfer Bank</option>
                                            <option value="edc">Kartu Debit / EDC</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                                            Rekening Bank Klinik
                                        </label>
                                        <select
                                            value={regForm.data.payment.bank_id}
                                            onChange={(e) =>
                                                regForm.setData('payment', {
                                                    ...regForm.data.payment,
                                                    bank_id: e.target.value,
                                                })
                                            }
                                            className="w-full px-2.5 py-1 text-xs rounded border border-zinc-300 bg-white"
                                        >
                                            <option value="">— Kasir Utama —</option>
                                            {banks.map((b) => (
                                                <option key={b.id} value={b.id}>
                                                    {b.name} ({b.account_number})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </form>
            </Modal>

            {/* ========================================================================= */}
            {/* Modal: Detail Pendaftaran & Split Billing Breakdown */}
            {/* ========================================================================= */}
            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title={`Detail Pendaftaran: ${selectedRegistration?.reg_no || ''}`}
                subtitle={`Pasien: ${selectedRegistration?.patient?.name || ''} (${selectedRegistration?.patient?.medical_record_no || ''})`}
                maxWidth="3xl"
                footer={
                    <div className="flex items-center justify-between w-full">
                        {selectedRegistration ? (
                            <div className="flex items-center gap-2">
                                <a
                                    href={route('registrations.control-card', { registration: selectedRegistration.id })}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-800 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors shadow-xs"
                                >
                                    <Printer className="w-3.5 h-3.5 text-zinc-600" />
                                    Cetak Kartu Kontrol
                                </a>
                                {selectedRegistration.service_type === 'mcu' && (
                                    <a
                                        href={route('prints.mcu-book', { registration: selectedRegistration.id })}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-800 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors shadow-xs"
                                    >
                                        <FileText className="w-3.5 h-3.5 text-zinc-600" />
                                        Buku Laporan MCU
                                    </a>
                                )}
                            </div>
                        ) : <div />}
                        <button
                            type="button"
                            onClick={() => setIsDetailModalOpen(false)}
                            className="px-4 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors"
                        >
                            Tutup
                        </button>
                    </div>
                }
            >
                {selectedRegistration && (
                    <div className="space-y-4">
                        {/* Status Card */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-zinc-50 p-3 rounded-lg border border-zinc-200 text-xs">
                            <div>
                                <span className="text-[11px] text-zinc-500 block">Waktu Registrasi:</span>
                                <span className="font-mono text-zinc-800">
                                    {selectedRegistration.registered_at?.substring(0, 16)}
                                </span>
                            </div>
                            <div>
                                <span className="text-[11px] text-zinc-500 block">Jenis Layanan:</span>
                                <span className="font-semibold text-zinc-800 capitalize">
                                    {selectedRegistration.service_type} ({selectedRegistration.payer_type.toUpperCase()})
                                </span>
                            </div>
                            <div>
                                <span className="text-[11px] text-zinc-500 block">Status Alur Kerja:</span>
                                <span className="font-semibold text-zinc-800">
                                    {workflowBadges[selectedRegistration.workflow_status]?.label}
                                </span>
                            </div>
                            <div>
                                <span className="text-[11px] text-zinc-500 block">Status Pembayaran:</span>
                                <span className="font-semibold text-zinc-800">
                                    {paymentBadges[selectedRegistration.payment_status]?.label}
                                </span>
                            </div>
                        </div>

                        {/* List Items */}
                        <div className="space-y-2">
                            <span className="text-xs font-semibold text-zinc-900 block">
                                Rincian Item Pemeriksaan ({selectedRegistration.items?.length || 0} item)
                            </span>
                            <div className="border border-zinc-200 rounded-md overflow-hidden">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-zinc-50 text-[11px] font-semibold text-zinc-600 uppercase">
                                        <tr>
                                            <th className="py-2 px-3">Layanan Pemeriksaan</th>
                                            <th className="py-2 px-3">Stasiun Sampel</th>
                                            <th className="py-2 px-3 text-center">Status Sampel</th>
                                            <th className="py-2 px-3 text-center">Status Hasil</th>
                                            <th className="py-2 px-3 text-center">Ditagihkan Ke</th>
                                            <th className="py-2 px-3 text-right">Tarif</th>
                                            <th className="py-2 px-3 text-center">Cetak</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-200">
                                        {selectedRegistration.items?.map((item) => (
                                            <tr key={item.id}>
                                                <td className="py-2 px-3 font-medium text-zinc-800">
                                                    {item.service_name_snapshot}
                                                    {item.is_from_package && (
                                                        <span className="ml-1 text-[10px] text-zinc-400 bg-zinc-100 px-1 py-0.5 rounded">Paket</span>
                                                    )}
                                                </td>
                                                <td className="py-2 px-3 text-zinc-600">
                                                    {item.sample?.name || '—'}
                                                </td>
                                                <td className="py-2 px-3 text-center">
                                                    <span className="capitalize text-zinc-700">{item.sample_status}</span>
                                                </td>
                                                <td className="py-2 px-3 text-center">
                                                    <span className="capitalize text-zinc-700">{item.result_status}</span>
                                                </td>
                                                <td className="py-2 px-3 text-center">
                                                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 capitalize">
                                                        {item.billed_to}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono tabular-nums">
                                                    {formatCurrency(item.final_price)}
                                                </td>
                                                <td className="py-2 px-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <a
                                                            href={route('prints.single', { registration: selectedRegistration.id, item: item.id })}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            title="Cetak Hasil"
                                                            className="p-1 rounded text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 transition-colors"
                                                        >
                                                            <Printer className="w-3.5 h-3.5" />
                                                        </a>
                                                        <a
                                                            href={route('prints.single.pdf', { registration: selectedRegistration.id, item: item.id }) + '?download=1'}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            title="Download PDF"
                                                            className="p-1 rounded text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 transition-colors"
                                                        >
                                                            <Download className="w-3.5 h-3.5" />
                                                        </a>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Financial recap */}
                        <div className="flex justify-end">
                            <div className="w-72 bg-zinc-50 p-3 rounded-lg border border-zinc-200 text-xs space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Total Tagihan:</span>
                                    <span className="font-mono font-semibold text-zinc-800">
                                        {formatCurrency(selectedRegistration.grand_total)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Sudah Dibayar:</span>
                                    <span className="font-mono font-semibold text-emerald-600">
                                        {formatCurrency(selectedRegistration.paid_amount)}
                                    </span>
                                </div>
                                <div className="flex justify-between pt-1 border-t border-zinc-200 font-bold">
                                    <span className="text-zinc-900">Sisa Pembayaran:</span>
                                    <span className="font-mono text-zinc-900">
                                        {formatCurrency(selectedRegistration.remaining_amount)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ========================================================================= */}
            {/* Modal: Void / Pembatalan Pendaftaran */}
            {/* ========================================================================= */}
            <Modal
                isOpen={isVoidModalOpen}
                onClose={() => setIsVoidModalOpen(false)}
                title="Pembatalan Pendaftaran Pasien (Void)"
                subtitle={`No. Reg: ${selectedRegistration?.reg_no || ''}`}
                maxWidth="md"
                footer={
                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsVoidModalOpen(false)}
                            className="px-3 py-1.5 text-xs font-medium text-zinc-600 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
                        >
                            Kembali
                        </button>
                        <button
                            type="submit"
                            form="void-form"
                            disabled={voidForm.processing || voidForm.data.void_reason.trim().length < 5}
                            className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 rounded-md hover:bg-rose-700 transition-colors shadow-xs disabled:opacity-50"
                        >
                            {voidForm.processing ? 'Membatalkan...' : 'Konfirmasi Batalkan (Void)'}
                        </button>
                    </div>
                }
            >
                <form id="void-form" onSubmit={handleVoidSubmit} className="space-y-3">
                    <div className="bg-rose-50 p-3 rounded border border-rose-200 text-xs text-rose-800">
                        <p className="font-medium">Perhatian:</p>
                        <p className="mt-0.5 text-rose-700">
                            Pembatalan transaksi tidak menghapus data historis (audit trail tetap tersimpan). Anda wajib mengisi alasan pembatalan di bawah ini.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">
                            Alasan Pembatalan (Wajib diisi) <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            rows={3}
                            value={voidForm.data.void_reason}
                            onChange={(e) => voidForm.setData('void_reason', e.target.value)}
                            placeholder="Tuliskan alasan pembatalan pendaftaran, misal: Pasien membatalkan sepihak, salah input data identitas, dll."
                            className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-rose-500"
                            required
                        />
                        {voidForm.errors.void_reason && (
                            <p className="mt-1 text-[11px] text-rose-500">{voidForm.errors.void_reason}</p>
                        )}
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
