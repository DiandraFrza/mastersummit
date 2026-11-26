import React, { useState, useRef, useEffect } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import DataTable, { ColumnDef } from '@/Components/DataTable';
import Badge from '@/Components/Badge';
import ActionDropdown, { ActionDropdownItem } from '@/Components/ActionDropdown';
import Modal from '@/Components/Modal';
import {
    ArrowLeft,
    Plus,
    Upload,
    Download,
    Camera,
    RefreshCw,
    CheckCircle2,
    Clock,
    Pencil,
    Trash2,
    Tag,
    Building2,
    Calendar,
    FileText,
    Printer,
    UserCheck,
    X,
} from 'lucide-react';
import type { PageProps, Pagination, Registration, McuEvent, Package } from '@/types';

interface ParticipantProps extends PageProps {
    mcuEvent: McuEvent;
    participants: Pagination<Registration>;
    packages: Package[];
    stats: {
        total: number;
        registered: number;
        pending: number;
    };
    filters: Record<string, string | number>;
}

export default function ParticipantsIndex({
    mcuEvent,
    participants,
    packages,
    stats,
    filters,
}: ParticipantProps) {
    // Modals
    const [isCheckInOpen, setIsCheckInOpen] = useState(false);
    const [selectedParticipant, setSelectedParticipant] = useState<Registration | null>(null);
    const [isQuickPrintOpen, setIsQuickPrintOpen] = useState(false);
    const [justRegistered, setJustRegistered] = useState<Registration | null>(null);

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [editingParticipant, setEditingParticipant] = useState<Registration | null>(null);

    // ==========================================
    // Check-in (Daftar) Form + Webcam state
    // ==========================================
    const todayStr = new Date().toISOString().substring(0, 10);
    const checkInForm = useForm({
        package_id: '',
        registered_at: todayStr,
        photo: null as string | null,
    });

    const [isCameraActive, setIsCameraActive] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        setIsCameraActive(false);
    };

    const startCamera = async () => {
        try {
            stopCamera();
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 640, height: 480 },
                audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setIsCameraActive(true);
        } catch (err) {
            alert('Tidak dapat mengakses webcam. Silakan gunakan opsi Upload File.');
            setIsCameraActive(false);
        }
    };

    // Attach stream to video element once it becomes active in DOM
    useEffect(() => {
        if (isCameraActive && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [isCameraActive]);

    const capturePhoto = () => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, 640, 480);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            checkInForm.setData('photo', dataUrl);
            stopCamera();
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                checkInForm.setData('photo', event.target?.result as string);
                stopCamera();
            };
            reader.readAsDataURL(file);
        }
    };

    const openCheckInModal = (participant: Registration) => {
        setSelectedParticipant(participant);
        const existingPhoto = participant.patient?.photo_path
            ? `/storage/${participant.patient.photo_path}`
            : null;

        checkInForm.setData({
            package_id: participant.package_id ? String(participant.package_id) : (packages[0]?.id ? String(packages[0].id) : ''),
            registered_at: todayStr,
            photo: existingPhoto,
        });
        checkInForm.clearErrors();
        setIsCheckInOpen(true);
    };

    const handleCheckInSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedParticipant) return;

        const targetParticipant = selectedParticipant;
        checkInForm.post(route('events.participants.check-in', [mcuEvent.id, selectedParticipant.id]), {
            preserveScroll: true,
            onSuccess: () => {
                setIsCheckInOpen(false);
                stopCamera();
                setJustRegistered(targetParticipant);
                setIsQuickPrintOpen(true);
            },
        });
    };

    // ==========================================
    // Import Excel Form
    // ==========================================
    const importForm = useForm({
        file: null as File | null,
    });

    const handleImportSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        importForm.post(route('events.participants.import', mcuEvent.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setIsImportModalOpen(false);
                importForm.reset();
            },
        });
    };

    // ==========================================
    // Manual Add / Edit Participant Form
    // ==========================================
    const manualForm = useForm({
        name: '',
        nik: '',
        gender: 'L' as 'L' | 'P',
        birth_date: '1990-01-01',
        department: '',
        package_id: packages[0]?.id ? String(packages[0].id) : '',
        phone: '',
        address: '',
    });

    const openCreateManualModal = () => {
        setEditingParticipant(null);
        manualForm.reset();
        manualForm.clearErrors();
        manualForm.setData({
            name: '',
            nik: '',
            gender: 'L',
            birth_date: '1990-01-01',
            department: '',
            package_id: packages[0]?.id ? String(packages[0].id) : '',
            phone: '',
            address: '',
        });
        setIsManualModalOpen(true);
    };

    const openEditManualModal = (p: Registration) => {
        setEditingParticipant(p);
        manualForm.clearErrors();
        manualForm.setData({
            name: p.patient?.name || '',
            nik: p.patient?.nik || '',
            gender: p.patient?.gender || 'L',
            birth_date: p.patient?.birth_date ? p.patient.birth_date.substring(0, 10) : '1990-01-01',
            department: p.department_snapshot || p.patient?.default_department || '',
            package_id: p.package_id ? String(p.package_id) : '',
            phone: p.patient?.phone || '',
            address: p.patient?.address || '',
        });
        setIsManualModalOpen(true);
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingParticipant) {
            manualForm.put(route('events.participants.update', [mcuEvent.id, editingParticipant.id]), {
                preserveScroll: true,
                onSuccess: () => {
                    setIsManualModalOpen(false);
                    setEditingParticipant(null);
                },
            });
        } else {
            manualForm.post(route('events.participants.store', mcuEvent.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setIsManualModalOpen(false);
                    manualForm.reset();
                },
            });
        }
    };

    const handleDeleteParticipant = (p: Registration) => {
        if (confirm(`Apakah Anda yakin ingin menghapus peserta "${p.patient?.name}"?`)) {
            router.delete(route('events.participants.destroy', [mcuEvent.id, p.id]), {
                preserveScroll: true,
            });
        }
    };

    // Print helper with validation for unregistered patients
    const handlePrintAction = (p: Registration, printUrl: string) => {
        if (p.workflow_status === 'pending' || !p.reg_no) {
            alert('Peserta belum didaftarkan. Silakan klik menu "Daftar" terlebih dahulu.');
            return;
        }
        window.open(printUrl, '_blank');
    };

    // ==========================================
    // DataTable Columns (9 Kolom)
    // ==========================================
    const columns: ColumnDef<Registration>[] = [
        {
            header: 'No',
            id: 'row_number',
            width: '60px',
            align: 'center',
            cell: ({ index }) => {
                const currentPage = participants.current_page || 1;
                const perPage = participants.per_page || 20;
                return (
                    <span className="font-mono text-zinc-500 tabular-nums text-xs">
                        {(currentPage - 1) * perPage + index + 1}
                    </span>
                );
            },
        },
        {
            header: 'Aksi',
            id: 'actions',
            width: '80px',
            align: 'center',
            cell: ({ row }) => {
                const isPending = row.workflow_status === 'pending' || !row.reg_no;

                const items: ActionDropdownItem[] = [
                    {
                        label: isPending ? 'Daftar' : 'Daftar Ulang',
                        icon: UserCheck,
                        onClick: () => openCheckInModal(row),
                    },
                    {
                        label: 'Label Lab',
                        icon: Printer,
                        onClick: () => handlePrintAction(row, route('registrations.label-lab', row.id)),
                    },
                    {
                        label: 'Label Non Lab',
                        icon: Printer,
                        onClick: () => handlePrintAction(row, route('registrations.label-non-lab', row.id)),
                    },
                    {
                        label: 'Cetak Kartu',
                        icon: FileText,
                        onClick: () => handlePrintAction(row, route('registrations.participant-card', row.id)),
                    },
                    {
                        label: 'Cetak Kartu Kontrol',
                        icon: Printer,
                        onClick: () => handlePrintAction(row, route('registrations.control-card', row.id) + '?print=1'),
                    },
                    {
                        label: 'Ubah',
                        icon: Pencil,
                        onClick: () => openEditManualModal(row),
                    },
                    {
                        label: 'Hapus',
                        icon: Trash2,
                        variant: 'danger',
                        onClick: () => handleDeleteParticipant(row),
                    },
                ];

                return <ActionDropdown items={items} align="right" />;
            },
        },
        {
            header: 'No. Registrasi',
            accessorKey: 'reg_no',
            width: '150px',
            sortable: true,
            cell: ({ value }) => (
                <span className="font-mono text-xs font-semibold tabular-nums text-zinc-900">
                    {value || <span className="text-zinc-400 font-normal">-</span>}
                </span>
            ),
        },
        {
            header: 'NIK',
            accessorKey: 'patient.nik',
            width: '140px',
            sortable: true,
            cell: ({ row }) => (
                <span className="font-mono text-xs tabular-nums text-zinc-700">
                    {row.patient?.nik || <span className="text-zinc-400">-</span>}
                </span>
            ),
        },
        {
            header: 'Nama',
            accessorKey: 'patient.name',
            cell: ({ row }) => (
                <div>
                    <div className="font-semibold text-zinc-900">{row.patient?.name || '-'}</div>
                    <div className="text-[11px] text-zinc-500 font-mono">
                        {row.patient?.medical_record_no || ''}
                    </div>
                </div>
            ),
        },
        {
            header: 'Tgl Lahir',
            accessorKey: 'patient.birth_date',
            width: '120px',
            cell: ({ row }) => {
                const bdate = row.patient?.birth_date;
                if (!bdate) return <span className="text-zinc-400">-</span>;
                const formatted = new Date(bdate).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                });
                return <span className="font-mono text-xs tabular-nums text-zinc-700">{formatted}</span>;
            },
        },
        {
            header: 'JK',
            accessorKey: 'patient.gender',
            width: '60px',
            align: 'center',
            cell: ({ value }) => (
                <span className="font-semibold text-xs text-zinc-800">
                    {value === 'L' ? 'L' : 'P'}
                </span>
            ),
        },
        {
            header: 'Bagian',
            accessorKey: 'department_snapshot',
            width: '140px',
            cell: ({ value, row }) => (
                <span className="text-xs text-zinc-700">
                    {value || row.patient?.default_department || '-'}
                </span>
            ),
        },
        {
            header: 'Paket',
            accessorKey: 'package.name',
            width: '160px',
            cell: ({ value }) => (
                <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {value || '-'}
                </span>
            ),
        },
        {
            header: 'Status',
            accessorKey: 'workflow_status',
            width: '130px',
            align: 'center',
            cell: ({ value }) => {
                if (value === 'pending') {
                    return (
                        <Badge variant="neutral" icon={Clock}>
                            Belum Daftar
                        </Badge>
                    );
                }
                return (
                    <Badge variant="success" icon={CheckCircle2}>
                        Terdaftar
                    </Badge>
                );
            },
        },
    ];

    return (
        <>
            <Head title={`Data Pasien MCU - ${mcuEvent.event_name}`} />

            <div className="w-full max-w-none space-y-4">
                {/* Header Context Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-md border border-zinc-200 shadow-xs">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => router.get(route('events.index'))}
                            className="inline-flex items-center justify-center h-10 w-10 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-md transition-colors"
                            title="Kembali ke Daftar Event MCU"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Data Pasien MCU</h1>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500">
                                <span className="font-semibold text-zinc-800">{mcuEvent.event_name}</span>
                                <span className="font-mono text-zinc-400">({mcuEvent.event_code})</span>
                                {mcuEvent.company && (
                                    <>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                                            {mcuEvent.company.name}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                        <a
                            href={route('events.participants.template', mcuEvent.id)}
                            className="inline-flex items-center gap-1.5 h-10 px-3.5 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-md transition-colors"
                        >
                            <Download className="w-4 h-4 text-zinc-500" />
                            <span>Unduh Template</span>
                        </a>

                        <button
                            type="button"
                            onClick={() => setIsImportModalOpen(true)}
                            className="inline-flex items-center gap-1.5 h-10 px-3.5 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-md transition-colors"
                        >
                            <Upload className="w-4 h-4 text-zinc-500" />
                            <span>Import Excel</span>
                        </button>

                        <button
                            type="button"
                            onClick={openCreateManualModal}
                            className="inline-flex items-center gap-1.5 h-10 px-4 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors shadow-xs"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Tambah Data</span>
                        </button>
                    </div>
                </div>

                {/* Filter and Stats Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-md border border-zinc-200 text-xs">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <span className="text-zinc-600 font-medium">Status:</span>
                            <select
                                value={filters.status || 'all'}
                                onChange={(e) => {
                                    router.get(
                                        route('events.participants.index', mcuEvent.id),
                                        { ...filters, status: e.target.value, page: 1 },
                                        { preserveState: true, preserveScroll: true }
                                    );
                                }}
                                className="h-9 text-xs px-2.5 rounded border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            >
                                <option value="all">Semua Status</option>
                                <option value="pending">Belum Daftar</option>
                                <option value="registered">Terdaftar</option>
                            </select>
                        </div>
                    </div>

                    {/* Quick Stats Chips */}
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-zinc-100 rounded text-zinc-700 font-medium tabular-nums">
                            Total: <strong className="font-semibold text-zinc-900">{stats.total}</strong>
                        </span>
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded font-medium tabular-nums">
                            Belum Daftar: <strong>{stats.pending}</strong>
                        </span>
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-medium tabular-nums">
                            Terdaftar: <strong>{stats.registered}</strong>
                        </span>
                    </div>
                </div>

                {/* Participants DataTable */}
                <DataTable<Registration>
                    columns={columns}
                    data={participants.data}
                    pagination={participants}
                    searchPlaceholder="Cari nama peserta, NIK, No. Registrasi, bagian..."
                    routeParams={filters}
                />
            </div>

            {/* ========================================================= */}
            {/* Modal: Form Daftar (Check-In) with Webcam & Package Change */}
            {/* ========================================================= */}
            <Modal
                isOpen={isCheckInOpen}
                onClose={() => {
                    setIsCheckInOpen(false);
                    stopCamera();
                }}
                title="Form Daftar"
                maxWidth="md"
            >
                {selectedParticipant && (
                    <form onSubmit={handleCheckInSubmit} className="space-y-4">
                        {/* Field 1: Event MCU (Readonly) */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Event MCU
                            </label>
                            <input
                                type="text"
                                readOnly
                                value={`${mcuEvent.event_name} (${mcuEvent.event_code})`}
                                className="w-full h-10 px-3 text-sm bg-zinc-100 border border-zinc-200 rounded-md text-zinc-700 cursor-not-allowed font-medium select-none"
                            />
                        </div>

                        {/* Field 2: Tanggal Pendaftaran */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Tanggal <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                required
                                value={checkInForm.data.registered_at}
                                onChange={(e) => checkInForm.setData('registered_at', e.target.value)}
                                className="w-full h-10 px-3 text-sm font-mono border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums"
                            />
                            {checkInForm.errors.registered_at && (
                                <p className="mt-1 text-[11px] text-red-600">{checkInForm.errors.registered_at}</p>
                            )}
                        </div>

                        {/* Field 3: Foto Pasien (Webcam Live View + Card Vertikal) */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Foto Pasien
                            </label>
                            
                            <div className="border border-zinc-300 rounded-md p-3 bg-zinc-50 flex flex-col items-center justify-center">
                                {isCameraActive ? (
                                    <div className="w-full flex flex-col items-center space-y-2">
                                        <div className="relative w-full h-52 bg-black rounded overflow-hidden flex items-center justify-center">
                                            <video
                                                ref={videoRef}
                                                autoPlay
                                                playsInline
                                                muted
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={capturePhoto}
                                                className="h-9 px-4 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors flex items-center gap-1.5 shadow-xs"
                                            >
                                                <Camera className="w-3.5 h-3.5" />
                                                <span>Ambil Foto</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={stopCamera}
                                                className="h-9 px-3 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded transition-colors"
                                            >
                                                Batal
                                            </button>
                                        </div>
                                    </div>
                                ) : checkInForm.data.photo ? (
                                    <div className="w-full flex flex-col items-center space-y-2">
                                        <div className="relative w-full h-52 bg-zinc-200 rounded overflow-hidden flex items-center justify-center border border-zinc-300">
                                            <img
                                                src={checkInForm.data.photo}
                                                alt="Foto Pasien"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={startCamera}
                                                className="h-8 px-3 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded transition-colors flex items-center gap-1"
                                            >
                                                <RefreshCw className="w-3 h-3 text-zinc-500" />
                                                <span>Ulangi Foto</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="h-8 px-3 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded transition-colors flex items-center gap-1"
                                            >
                                                <Upload className="w-3 h-3 text-zinc-500" />
                                                <span>Ganti File</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        onClick={startCamera}
                                        className="w-full h-44 border-2 border-dashed border-zinc-300 hover:border-emerald-500 hover:bg-emerald-50/30 rounded flex flex-col items-center justify-center cursor-pointer transition-colors group"
                                    >
                                        <Camera className="w-8 h-8 text-zinc-400 group-hover:text-emerald-600 mb-1.5 transition-colors" />
                                        <span className="text-xs font-semibold text-zinc-700 group-hover:text-emerald-700">
                                            Klik untuk ambil foto
                                        </span>
                                        <span className="text-[11px] text-zinc-400 mt-0.5">
                                            Membuka webcam browser
                                        </span>
                                    </div>
                                )}

                                {/* Fallback File Input */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />

                                {!isCameraActive && !checkInForm.data.photo && (
                                    <div className="mt-2 text-center">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-xs text-zinc-500 hover:text-zinc-800 underline"
                                        >
                                            Atau pilih berkas foto dari PC
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Field 4: Paket Pemeriksaan (Bisa diganti) */}
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Paket <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={checkInForm.data.package_id}
                                onChange={(e) => checkInForm.setData('package_id', e.target.value)}
                                className="w-full h-10 px-3 text-sm bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            >
                                <option value="">Pilih Paket Pemeriksaan</option>
                                {packages.map((pkg) => (
                                    <option key={pkg.id} value={pkg.id}>
                                        {pkg.name} — Rp {Number(pkg.final_price).toLocaleString('id-ID')}
                                    </option>
                                ))}
                            </select>
                            {checkInForm.errors.package_id && (
                                <p className="mt-1 text-[11px] text-red-600">{checkInForm.errors.package_id}</p>
                            )}
                        </div>

                        {/* Submit Action */}
                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCheckInOpen(false);
                                    stopCamera();
                                }}
                                className="h-10 px-4 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-md transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={checkInForm.processing}
                                className="h-10 px-6 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-md transition-colors shadow-xs"
                            >
                                {checkInForm.processing ? 'Menyimpan...' : 'Daftar'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* ========================================================= */}
            {/* Modal: Import Excel Peserta MCU                           */}
            {/* ========================================================= */}
            <Modal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                title="Import Peserta Excel"
                maxWidth="md"
            >
                <form onSubmit={handleImportSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">
                            Pilih Berkas Excel (.xlsx, .xls, .csv) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="file"
                            required
                            accept=".xlsx,.xls,.csv"
                            onChange={(e) => importForm.setData('file', e.target.files?.[0] || null)}
                            className="w-full text-xs text-zinc-700 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-900 border border-zinc-300 rounded-md p-1.5"
                        />
                        {importForm.errors.file && (
                            <p className="mt-1 text-[11px] text-red-600">{importForm.errors.file}</p>
                        )}
                    </div>

                    <div className="bg-zinc-50 border border-zinc-200 rounded p-3 text-xs text-zinc-600 space-y-1">
                        <p className="font-semibold text-zinc-800">Petunjuk Format Berkas:</p>
                        <p>1. Gunakan template resmi dari tombol <strong>Unduh Template</strong> di atas.</p>
                        <p>2. Kolom wajib: <code>Nama Lengkap</code>, <code>Jenis Kelamin (L/P)</code>, <code>Tanggal Lahir</code>.</p>
                        <p>3. Peserta yang diimpor akan masuk dengan status <strong>Belum Daftar</strong> hingga hadir di lokasi.</p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200">
                        <button
                            type="button"
                            onClick={() => setIsImportModalOpen(false)}
                            className="h-10 px-4 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-md transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={importForm.processing || !importForm.data.file}
                            className="h-10 px-5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-md transition-colors shadow-xs"
                        >
                            {importForm.processing ? 'Mengunggah...' : 'Import'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ========================================================= */}
            {/* Modal: Tambah & Ubah Peserta Manual                       */}
            {/* ========================================================= */}
            <Modal
                isOpen={isManualModalOpen}
                onClose={() => setIsManualModalOpen(false)}
                title={editingParticipant ? 'Ubah Peserta MCU' : 'Tambah Peserta Manual'}
                maxWidth="lg"
            >
                <form onSubmit={handleManualSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Nama Lengkap <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={manualForm.data.name}
                                onChange={(e) => manualForm.setData('name', e.target.value)}
                                placeholder="Nama lengkap peserta"
                                className="w-full h-10 px-3 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            />
                            {manualForm.errors.name && (
                                <p className="mt-1 text-[11px] text-red-600">{manualForm.errors.name}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                NIK (No. KTP)
                            </label>
                            <input
                                type="text"
                                maxLength={20}
                                value={manualForm.data.nik}
                                onChange={(e) => manualForm.setData('nik', e.target.value)}
                                placeholder="16 digit NIK KTP"
                                className="w-full h-10 px-3 text-sm font-mono border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Jenis Kelamin <span className="text-red-500">*</span>
                            </label>
                            <select
                                required
                                value={manualForm.data.gender}
                                onChange={(e) => manualForm.setData('gender', e.target.value as 'L' | 'P')}
                                className="w-full h-10 px-3 text-sm bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            >
                                <option value="L">Laki-laki (L)</option>
                                <option value="P">Perempuan (P)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Tanggal Lahir <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                required
                                value={manualForm.data.birth_date}
                                onChange={(e) => manualForm.setData('birth_date', e.target.value)}
                                className="w-full h-10 px-3 text-sm font-mono border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Bagian / Departemen
                            </label>
                            <input
                                type="text"
                                value={manualForm.data.department}
                                onChange={(e) => manualForm.setData('department', e.target.value)}
                                placeholder="Contoh: Operasional / IT"
                                className="w-full h-10 px-3 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Paket MCU
                            </label>
                            <select
                                value={manualForm.data.package_id}
                                onChange={(e) => manualForm.setData('package_id', e.target.value)}
                                className="w-full h-10 px-3 text-sm bg-white border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            >
                                <option value="">— Pilih Paket —</option>
                                {packages.map((pkg) => (
                                    <option key={pkg.id} value={pkg.id}>
                                        {pkg.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                No. Telepon
                            </label>
                            <input
                                type="text"
                                value={manualForm.data.phone}
                                onChange={(e) => manualForm.setData('phone', e.target.value)}
                                placeholder="Contoh: 081234567890"
                                className="w-full h-10 px-3 text-sm font-mono border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Alamat Domisili
                            </label>
                            <input
                                type="text"
                                value={manualForm.data.address}
                                onChange={(e) => manualForm.setData('address', e.target.value)}
                                placeholder="Alamat singkat"
                                className="w-full h-10 px-3 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200">
                        <button
                            type="button"
                            onClick={() => setIsManualModalOpen(false)}
                            className="h-10 px-4 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-md transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={manualForm.processing}
                            className="h-10 px-5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-md transition-colors shadow-xs"
                        >
                            {manualForm.processing ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Quick Print Modal Post Check-In */}
            <Modal
                show={isQuickPrintOpen}
                onClose={() => setIsQuickPrintOpen(false)}
                maxWidth="md"
            >
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-zinc-900">Check-in Berhasil</h2>
                            <p className="text-xs text-zinc-500 mt-0.5">
                                Pasien {justRegistered?.patient?.name} telah terdaftar untuk event ini.
                            </p>
                        </div>
                    </div>

                    <div className="p-3 bg-zinc-50 rounded-md border border-zinc-200 text-xs mb-5 space-y-1">
                        <div className="flex justify-between">
                            <span className="text-zinc-500">Nama Pasien:</span>
                            <span className="font-semibold text-zinc-900">{justRegistered?.patient?.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-500">Event MCU:</span>
                            <span className="font-medium text-zinc-800">{mcuEvent.event_name}</span>
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        <button
                            type="button"
                            onClick={() => {
                                if (justRegistered) {
                                    window.open(route('registrations.control-card', justRegistered.id) + '?print=1', '_blank');
                                }
                            }}
                            className="w-full flex items-center justify-center gap-2 h-11 px-4 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors shadow-xs"
                        >
                            <Printer className="w-4 h-4" />
                            <span>Cetak Kartu Kontrol</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                if (justRegistered) {
                                    window.open(route('registrations.label-non-lab', justRegistered.id), '_blank');
                                }
                            }}
                            className="w-full flex items-center justify-center gap-2 h-11 px-4 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-md transition-colors"
                        >
                            <Tag className="w-4 h-4 text-zinc-500" />
                            <span>Cetak Label Non Lab</span>
                        </button>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-200 text-right">
                        <button
                            type="button"
                            onClick={() => setIsQuickPrintOpen(false)}
                            className="h-9 px-4 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
