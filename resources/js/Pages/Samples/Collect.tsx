import React, { useState, useRef, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import DataTable, { ColumnDef } from '@/Components/DataTable';
import Badge from '@/Components/Badge';
import Modal from '@/Components/Modal';
import {
    TestTubes,
    ScanBarcode,
    CheckCircle2,
    Clock,
    AlertTriangle,
    XCircle,
    RotateCcw,
    Calendar,
    Building2,
    Search,
    Camera,
    X,
    UserCheck,
    Check,
    Info,
} from 'lucide-react';
import type {
    PageProps,
    Pagination,
    RegistrationItem,
    Sample,
    Company,
    SampleStatus,
} from '@/types';

interface KPI {
    total: number;
    taken: number;
    pending: number;
    rejected: number;
}

interface CollectProps extends PageProps {
    stations: Sample[];
    stationCounts: Record<number, number>;
    currentStation: string | number;
    kpi: KPI;
    items: Pagination<RegistrationItem>;
    companies: Company[];
    filters: {
        date: string;
        search: string;
        status: string;
        station: string | number;
        company_id: string;
        per_page: number;
    };
    isSuperAdmin: boolean;
}

export default function Collect({
    auth,
    stations,
    stationCounts,
    currentStation,
    kpi,
    items,
    companies,
    filters,
    isSuperAdmin,
}: CollectProps) {
    const [barcodeInput, setBarcodeInput] = useState('');
    const [isSubmittingScan, setIsSubmittingScan] = useState(false);
    const barcodeInputRef = useRef<HTMLInputElement>(null);

    // Camera Barcode Scanner State
    const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);

    // Rejection Modal State
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectItem, setRejectItem] = useState<RegistrationItem | null>(null);
    const [rejectReasonType, setRejectReasonType] = useState('Sampel Lisis / Hemolisis');
    const [customReason, setCustomReason] = useState('');
    const [isSubmittingReject, setIsSubmittingReject] = useState(false);

    // Auto-focus barcode input on page mount
    useEffect(() => {
        barcodeInputRef.current?.focus();
    }, []);

    // Web Audio API beep synthesizer for scanner feedback
    const playScanSound = (isSuccess = true) => {
        try {
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            const ctx = new AudioContextClass();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            if (isSuccess) {
                // Happy high-pitched double beep
                osc.frequency.setValueAtTime(880, ctx.currentTime);
                osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.08);
                gain.gain.setValueAtTime(0.12, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.18);
            } else {
                // Low pitched warning beep
                osc.frequency.setValueAtTime(320, ctx.currentTime);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.25);
            }
        } catch {
            // Audio context not allowed or supported
        }
    };

    // Handle Barcode Submission (USB scanner or manual enter)
    const handleScanSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const code = barcodeInput.trim();
        if (!code || isSubmittingScan) return;

        setIsSubmittingScan(true);

        router.post(
            route('samples.collect.scan'),
            {
                barcode: code,
                sample_id: currentStation !== 'all' ? currentStation : null,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    playScanSound(true);
                    setBarcodeInput('');
                    setIsSubmittingScan(false);
                    barcodeInputRef.current?.focus();
                },
                onError: () => {
                    playScanSound(false);
                    setIsSubmittingScan(false);
                    barcodeInputRef.current?.focus();
                },
            }
        );
    };

    // Camera Scanner stream initialization
    const startCamera = async () => {
        setCameraError(null);
        setIsCameraModalOpen(true);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
            });
            mediaStreamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }

            // Check if native BarcodeDetector API is supported
            if ('BarcodeDetector' in window) {
                const barcodeDetector = new (window as any).BarcodeDetector({
                    formats: ['code_128', 'code_39', 'qr_code', 'ean_13'],
                });

                const detectInterval = setInterval(async () => {
                    if (!videoRef.current || videoRef.current.readyState < 2) return;
                    try {
                        const barcodes = await barcodeDetector.detect(videoRef.current);
                        if (barcodes.length > 0) {
                            clearInterval(detectInterval);
                            const detectedVal = barcodes[0].rawValue;
                            stopCamera();
                            setBarcodeInput(detectedVal);
                            // Auto submit detected barcode
                            router.post(
                                route('samples.collect.scan'),
                                {
                                    barcode: detectedVal,
                                    sample_id: currentStation !== 'all' ? currentStation : null,
                                },
                                {
                                    preserveScroll: true,
                                    preserveState: true,
                                    onSuccess: () => {
                                        playScanSound(true);
                                        setBarcodeInput('');
                                    },
                                    onError: () => playScanSound(false),
                                }
                            );
                        }
                    } catch {
                        // ignore detector frame errors
                    }
                }, 300);
            }
        } catch (err: any) {
            setCameraError(err.message || 'Gagal mengakses kamera perangkat.');
        }
    };

    const stopCamera = () => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((track) => track.stop());
            mediaStreamRef.current = null;
        }
        setIsCameraModalOpen(false);
    };

    // Filter Switcher Helpers
    const changeStation = (stationId: string | number) => {
        router.get(
            route('samples.collect.index'),
            { ...filters, station: stationId, page: 1 },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const handleDateChange = (newDate: string) => {
        router.get(
            route('samples.collect.index'),
            { ...filters, date: newDate, page: 1 },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const handleStatusFilterChange = (newStatus: string) => {
        router.get(
            route('samples.collect.index'),
            { ...filters, status: newStatus, page: 1 },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const handleCompanyFilterChange = (compId: string) => {
        router.get(
            route('samples.collect.index'),
            { ...filters, company_id: compId, page: 1 },
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    // Direct Action Helpers (Take, Reset, Reject)
    const handleTakeSingle = (item: RegistrationItem) => {
        router.post(
            route('samples.collect.update-status', { registrationItem: item.id }),
            { sample_status: 'taken' },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => playScanSound(true),
            }
        );
    };

    const handleResetSingle = (item: RegistrationItem) => {
        if (!confirm(`Reset status sampel ${item.service_name_snapshot} ke Menunggu?`)) return;

        router.post(
            route('samples.collect.update-status', { registrationItem: item.id }),
            { sample_status: 'pending' },
            { preserveScroll: true, preserveState: true }
        );
    };

    const openRejectModal = (item: RegistrationItem) => {
        setRejectItem(item);
        setRejectReasonType('Sampel Lisis / Hemolisis');
        setCustomReason('');
        setIsRejectModalOpen(true);
    };

    const handleRejectSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!rejectItem) return;

        const reason = rejectReasonType === 'Lainnya' ? customReason.trim() : rejectReasonType;
        if (!reason) return;

        setIsSubmittingReject(true);
        router.post(
            route('samples.collect.update-status', { registrationItem: rejectItem.id }),
            {
                sample_status: 'rejected',
                rejection_reason: reason,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setIsRejectModalOpen(false);
                    setRejectItem(null);
                    setIsSubmittingReject(false);
                },
                onError: () => setIsSubmittingReject(false),
            }
        );
    };

    // Status Badges Config
    const statusBadges: Record<SampleStatus, { variant: 'default' | 'success' | 'warning' | 'danger'; label: string; icon: any }> = {
        pending: { variant: 'warning', label: 'Menunggu', icon: Clock },
        taken: { variant: 'success', label: 'Sudah Diambil', icon: CheckCircle2 },
        rejected: { variant: 'danger', label: 'Ditolak', icon: AlertTriangle },
    };

    // Queue Table Columns
    const columns: ColumnDef<RegistrationItem>[] = [
        {
            header: 'No. Reg',
            accessorKey: 'registration.reg_no',
            sortable: false,
            width: '150px',
            cell: ({ row }) => {
                const reg = row.registration;
                if (!reg) return <span className="text-zinc-400">—</span>;

                return (
                    <div className="font-mono text-xs font-semibold tabular-nums text-zinc-900 flex items-center gap-1.5">
                        <ScanBarcode className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                        <span>{reg.reg_no}</span>
                    </div>
                );
            },
        },
        {
            header: 'Pasien & Identitas',
            id: 'patient',
            sortable: false,
            cell: ({ row }) => {
                const patient = row.registration?.patient;
                if (!patient) return <span className="text-zinc-400">—</span>;

                return (
                    <div className="space-y-0.5">
                        <div className="font-semibold text-xs text-zinc-900 flex items-center gap-1.5">
                            <span>{patient.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 font-mono rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                                {patient.gender === 'L' ? 'L' : 'P'}, {row.registration?.age_years_snapshot ?? patient.age} Th
                            </span>
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono flex items-center gap-2">
                            <span>NRM: {patient.medical_record_no}</span>
                            {row.registration?.company && (
                                <span className="text-zinc-400 truncate max-w-[140px]">
                                    &bull; {row.registration.company.name}
                                </span>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            header: 'Pemeriksaan & Stasiun',
            id: 'service',
            sortable: false,
            cell: ({ row }) => {
                return (
                    <div className="space-y-0.5">
                        <div className="font-medium text-xs text-zinc-800">
                            {row.service_name_snapshot}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                                {row.sample?.name || 'Tanpa Stasiun'}
                            </span>
                            {row.is_from_package && (
                                <span className="text-[10px] text-zinc-400">Paket</span>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            header: 'Status Sampel',
            accessorKey: 'sample_status',
            sortable: false,
            align: 'center',
            width: '120px',
            cell: ({ value }) => {
                const conf = statusBadges[value] || statusBadges.pending;
                return (
                    <Badge variant={conf.variant} icon={conf.icon}>
                        {conf.label}
                    </Badge>
                );
            },
        },
        {
            header: 'Waktu & Petugas',
            id: 'taken_info',
            sortable: false,
            width: '160px',
            cell: ({ row }) => {
                if (row.sample_status === 'taken') {
                    const time = row.sample_taken_at
                        ? new Date(row.sample_taken_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                        : '—';
                    const collectorName = row.collector?.name || 'Petugas';

                    return (
                        <div className="text-[11px] text-zinc-700">
                            <div className="font-mono tabular-nums font-medium text-emerald-700 flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-600" />
                                {time} WIB
                            </div>
                            <div className="text-zinc-500 text-[10px] truncate max-w-[140px]">
                                Oleh: {collectorName}
                            </div>
                        </div>
                    );
                }

                if (row.sample_status === 'rejected') {
                    return (
                        <div className="text-[10px] text-rose-600 italic truncate max-w-[150px]">
                            {row.group_conclusion || 'Ditolak petugas'}
                        </div>
                    );
                }

                return <span className="text-zinc-400 text-xs">— Belum —</span>;
            },
        },
        {
            header: 'Aksi',
            id: 'actions',
            align: 'right',
            width: '140px',
            cell: ({ row }) => {
                if (row.sample_status === 'pending') {
                    return (
                        <button
                            type="button"
                            onClick={() => handleTakeSingle(row)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors shadow-2xs"
                        >
                            <Check className="w-3.5 h-3.5" />
                            Ambil
                        </button>
                    );
                }

                return (
                    <div className="flex items-center justify-end gap-1.5">
                        <button
                            type="button"
                            onClick={() => handleResetSingle(row)}
                            title="Reset status ke Menunggu"
                            className="p-1 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        {row.sample_status === 'taken' && (
                            <button
                                type="button"
                                onClick={() => openRejectModal(row)}
                                className="px-2 py-0.8 text-[11px] font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 rounded transition-colors"
                            >
                                Tolak
                            </button>
                        )}
                    </div>
                );
            },
        },
    ];

    return (
        <>
            <Head title="Ambil Sampel" />

            <div className="space-y-4">
                {/* Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-zinc-200">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-zinc-900">
                            Ambil Sampel
                        </h1>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="inline-flex items-center gap-2 h-10 px-3.5 bg-white border border-zinc-200 rounded-md text-sm font-medium text-zinc-700 shadow-2xs">
                            <Calendar className="w-4 h-4 text-zinc-400" />
                            <input
                                type="date"
                                value={filters.date}
                                onChange={(e) => handleDateChange(e.target.value)}
                                className="border-0 p-0 text-sm focus:ring-0 text-zinc-800 font-mono"
                            />
                        </div>
                        {filters.date !== new Date().toISOString().split('T')[0] && (
                            <button
                                type="button"
                                onClick={() => handleDateChange(new Date().toISOString().split('T')[0])}
                                className="h-10 px-3.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors border border-zinc-200 bg-white"
                            >
                                Hari Ini
                            </button>
                        )}
                    </div>
                </div>

                {/* Smart Barcode Scanner Input Bar */}
                <div className="bg-white p-3.5 rounded-lg border-2 border-zinc-900/10 shadow-xs focus-within:border-zinc-900 focus-within:ring-2 focus-within:ring-zinc-900/10 transition-all">
                    <form onSubmit={handleScanSubmit} className="flex items-center gap-2.5">
                        <div className="p-2 bg-zinc-100 rounded-md text-zinc-700 flex-shrink-0">
                            <ScanBarcode className="w-5 h-5" />
                        </div>
                        <div className="flex-grow relative">
                            <input
                                ref={barcodeInputRef}
                                type="text"
                                value={barcodeInput}
                                onChange={(e) => setBarcodeInput(e.target.value)}
                                placeholder="Scan Barcode Kartu Kontrol / Masukkan No. Reg / NRM / NIK lalu tekan Enter..."
                                disabled={isSubmittingScan}
                                className="w-full text-sm font-mono tracking-wider font-semibold placeholder:font-sans placeholder:font-normal placeholder:text-zinc-400 border-0 p-0 focus:ring-0 text-zinc-900 bg-transparent"
                            />
                        </div>
                        {barcodeInput && (
                            <button
                                type="button"
                                onClick={() => {
                                    setBarcodeInput('');
                                    barcodeInputRef.current?.focus();
                                }}
                                className="p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={startCamera}
                            title="Pindai Menggunakan Kamera"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors"
                        >
                            <Camera className="w-4 h-4 text-zinc-600" />
                            <span className="hidden sm:inline">Kamera</span>
                        </button>
                        <button
                            type="submit"
                            disabled={!barcodeInput.trim() || isSubmittingScan}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 rounded-md transition-colors shadow-2xs"
                        >
                            <UserCheck className="w-4 h-4" />
                            <span>{isSubmittingScan ? 'Memproses...' : 'Check-In'}</span>
                        </button>
                    </form>
                </div>

                {/* 3 KPI Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white p-3 rounded-lg border border-zinc-200/80 shadow-2xs">
                        <div className="flex items-center justify-between text-zinc-500 text-xs">
                            <span>Total Spesimen</span>
                            <TestTubes className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div className="text-xl font-bold font-mono tabular-nums text-zinc-900 mt-1">
                            {kpi.total}
                        </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-zinc-200/80 shadow-2xs">
                        <div className="flex items-center justify-between text-emerald-700 text-xs font-medium">
                            <span>Sudah Diambil</span>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="text-xl font-bold font-mono tabular-nums text-emerald-600 mt-1">
                            {kpi.taken}
                        </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-zinc-200/80 shadow-2xs">
                        <div className="flex items-center justify-between text-amber-700 text-xs font-medium">
                            <span>Belum Diambil (Antrean)</span>
                            <Clock className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="text-xl font-bold font-mono tabular-nums text-amber-600 mt-1">
                            {kpi.pending}
                        </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-zinc-200/80 shadow-2xs">
                        <div className="flex items-center justify-between text-rose-700 text-xs font-medium">
                            <span>Ditolak</span>
                            <AlertTriangle className="w-4 h-4 text-rose-500" />
                        </div>
                        <div className="text-xl font-bold font-mono tabular-nums text-rose-600 mt-1">
                            {kpi.rejected}
                        </div>
                    </div>
                </div>

                {/* Dynamic Station Tabs */}
                <div className="border-b border-zinc-200">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs">
                        <button
                            type="button"
                            onClick={() => changeStation('all')}
                            className={`px-3 py-1.5 rounded-md font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                                currentStation === 'all'
                                    ? 'bg-zinc-900 text-white shadow-2xs'
                                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                            }`}
                        >
                            <span>Semua Stasiun</span>
                            {isSuperAdmin && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-700 text-zinc-200 font-mono tabular-nums">
                                    All
                                </span>
                            )}
                        </button>

                        {stations.map((st) => {
                            const pendingCount = stationCounts[st.id] || 0;
                            const isActive = String(currentStation) === String(st.id);

                            return (
                                <button
                                    key={st.id}
                                    type="button"
                                    onClick={() => changeStation(st.id)}
                                    className={`px-3 py-1.5 rounded-md font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                                        isActive
                                            ? 'bg-zinc-900 text-white shadow-2xs'
                                            : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                                    }`}
                                >
                                    <span>{st.name}</span>
                                    {pendingCount > 0 && (
                                        <span
                                            className={`text-[10px] px-1.5 py-0.2 rounded font-mono tabular-nums font-semibold ${
                                                isActive
                                                    ? 'bg-amber-400 text-zinc-950'
                                                    : 'bg-amber-100 text-amber-800'
                                            }`}
                                        >
                                            {pendingCount}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Filters Bar */}
                <div className="bg-white p-3 rounded-lg border border-zinc-200/80 shadow-2xs flex flex-wrap items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500 font-medium">Status:</span>
                        <select
                            value={filters.status}
                            onChange={(e) => handleStatusFilterChange(e.target.value)}
                            className="px-2.5 py-1 text-xs rounded-md border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                        >
                            <option value="all">Semua Status</option>
                            <option value="pending">Menunggu Diambil</option>
                            <option value="taken">Sudah Diambil</option>
                            <option value="rejected">Ditolak</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500 font-medium">Perusahaan:</span>
                        <select
                            value={filters.company_id}
                            onChange={(e) => handleCompanyFilterChange(e.target.value)}
                            className="px-2.5 py-1 text-xs rounded-md border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 max-w-[200px]"
                        >
                            <option value="all">Semua Perusahaan / APS</option>
                            {companies.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-grow" />

                    <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Scan barcode otomatis check-in spesimen stasiun aktif</span>
                    </div>
                </div>

                {/* Queue Data Table */}
                <DataTable
                    columns={columns}
                    data={items}
                    filters={filters}
                    searchPlaceholder="Cari no. reg, nama pasien, NRM, NIK..."
                    emptyMessage="Tidak ada antrean spesimen untuk filter terpilih."
                />
            </div>

            {/* Modal: Camera Barcode Scanner */}
            <Modal
                isOpen={isCameraModalOpen}
                onClose={stopCamera}
                title="Pindai Barcode"
                maxWidth="md"
            >
                <div className="space-y-3">
                    {cameraError ? (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs">
                            {cameraError}
                        </div>
                    ) : (
                        <div className="relative aspect-4/3 bg-black rounded-lg overflow-hidden flex items-center justify-center">
                            <video
                                ref={videoRef}
                                className="w-full h-full object-cover"
                                playsInline
                                muted
                            />
                            <div className="absolute inset-0 border-2 border-emerald-500/60 rounded-lg pointer-events-none">
                                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-emerald-500 animate-pulse" />
                            </div>
                        </div>
                    )}
                    <div className="text-center text-xs text-zinc-500">
                        Pastikan pencahayaan cukup dan garis barcode terlihat tegak lurus.
                    </div>
                </div>
            </Modal>

            {/* Modal: Tolak Sampel (Sample Rejection) */}
            <Modal
                isOpen={isRejectModalOpen}
                onClose={() => setIsRejectModalOpen(false)}
                title="Penolakan Spesimen / Sampel"
                subtitle={`Pasien: ${rejectItem?.registration?.patient?.name || ''} — ${rejectItem?.service_name_snapshot || ''}`}
                maxWidth="md"
                footer={
                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsRejectModalOpen(false)}
                            className="px-3 py-1.5 text-xs font-medium text-zinc-600 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleRejectSubmit}
                            disabled={isSubmittingReject || (rejectReasonType === 'Lainnya' && !customReason.trim())}
                            className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors shadow-2xs disabled:opacity-50"
                        >
                            {isSubmittingReject ? 'Menyimpan...' : 'Konfirmasi Tolak Sampel'}
                        </button>
                    </div>
                }
            >
                <form onSubmit={handleRejectSubmit} className="space-y-3 text-xs">
                    <div>
                        <label className="block font-medium text-zinc-700 mb-1">
                            Pilih Alasan Penolakan Standar:
                        </label>
                        <select
                            value={rejectReasonType}
                            onChange={(e) => setRejectReasonType(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                        >
                            <option value="Sampel Lisis / Hemolisis">Sampel Lisis / Hemolisis</option>
                            <option value="Volume Tidak Mencukupi (QNS)">Volume Tidak Mencukupi (QNS)</option>
                            <option value="Sampel Membeku / Clotted">Sampel Membeku / Clotted</option>
                            <option value="Spesimen Rusak / Wadah Bocor">Spesimen Rusak / Wadah Bocor</option>
                            <option value="Identitas Tabung Tidak Sesuai">Identitas Tabung Tidak Sesuai</option>
                            <option value="Lainnya">Alasan Lainnya (Tulis Manual)</option>
                        </select>
                    </div>

                    {rejectReasonType === 'Lainnya' && (
                        <div>
                            <label className="block font-medium text-zinc-700 mb-1">
                                Keterangan Alasan:
                            </label>
                            <textarea
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                placeholder="Tuliskan alasan penolakan spesimen secara detail..."
                                rows={3}
                                className="w-full px-3 py-2 text-xs rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            />
                        </div>
                    )}

                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-amber-800 text-[11px] flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <span>
                            Spesimen yang ditolak akan membutuhkan pengambilan sampel ulang (flebotomi / pengambilan ulang) sebelum hasil dapat diperiksa.
                        </span>
                    </div>
                </form>
            </Modal>
        </>
    );
}
