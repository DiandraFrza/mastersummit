import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Badge from '@/Components/Badge';
import ActionDropdown, { ActionDropdownItem } from '@/Components/ActionDropdown';
import Modal from '@/Components/Modal';
import {
    ArrowLeft,
    Plus,
    Pencil,
    Trash2,
    SlidersHorizontal,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Layers,
    FileText,
    Calculator,
    Activity,
    Info,
    ListFilter,
    ShieldAlert,
    Clock,
    Hash,
} from 'lucide-react';
import type {
    PageProps,
    Service,
    ServiceParameter,
    ParameterReferenceRange,
    ParameterAutoRule,
    ParameterInputType,
    GenderType,
    ConditionOperator,
    FlagStatus,
} from '@/types';

interface ServiceParametersProps extends PageProps {
    service: Service;
    parameters: ServiceParameter[];
}

export default function ServiceParameters({
    service,
    parameters,
}: ServiceParametersProps) {
    // Parameter Modal state
    const [isParamModalOpen, setIsParamModalOpen] = useState(false);
    const [editingParameter, setEditingParameter] = useState<ServiceParameter | null>(null);

    // Rule & Range Management Modal state
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [selectedParameter, setSelectedParameter] = useState<ServiceParameter | null>(null);
    const [activeTab, setActiveTab] = useState<'ranges' | 'rules'>('ranges');

    // Sub-modal for Reference Range (Create/Edit)
    const [isRangeModalOpen, setIsRangeModalOpen] = useState(false);
    const [editingRange, setEditingRange] = useState<ParameterReferenceRange | null>(null);

    // Sub-modal for Auto Rule (Create/Edit)
    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<ParameterAutoRule | null>(null);

    // Parameter Form
    const paramForm = useForm({
        code: '',
        label: '',
        group_name: '',
        input_type: 'number' as ParameterInputType,
        unit: '',
        options_text: '',
        formula_expression: '',
        default_normal_text: '',
        sort_order: 0,
        is_required: false,
        is_active: true,
    });

    // Reference Range Form
    const rangeForm = useForm({
        gender: 'ALL' as GenderType,
        min_age_years: '' as number | string,
        max_age_years: '' as number | string,
        min_value: '' as number | string,
        max_value: '' as number | string,
        normal_text_value: '',
        display_reference: '',
        is_active: true,
    });

    // Auto Rule Form
    const ruleForm = useForm({
        condition_operator: '<' as ConditionOperator,
        compare_value_1: '',
        compare_value_2: '',
        gender: 'ALL' as GenderType,
        flag_status: 'abnormal' as FlagStatus,
        auto_conclusion: '',
        auto_suggestion: '',
        include_in_abnormality_recap: true,
        priority: 0,
        is_active: true,
    });

    // ==========================================
    // Parameter Handlers
    // ==========================================
    const openCreateParamModal = () => {
        setEditingParameter(null);
        paramForm.reset();
        paramForm.setData({
            code: '',
            label: '',
            group_name: '',
            input_type: 'number',
            unit: '',
            options_text: '',
            formula_expression: '',
            default_normal_text: '',
            sort_order: parameters.length + 1,
            is_required: false,
            is_active: true,
        });
        paramForm.clearErrors();
        setIsParamModalOpen(true);
    };

    const openEditParamModal = (param: ServiceParameter) => {
        setEditingParameter(param);
        paramForm.setData({
            code: param.code,
            label: param.label,
            group_name: param.group_name || '',
            input_type: param.input_type,
            unit: param.unit || '',
            options_text: Array.isArray(param.options_json) ? param.options_json.join(', ') : '',
            formula_expression: param.formula_expression || '',
            default_normal_text: param.default_normal_text || '',
            sort_order: param.sort_order,
            is_required: param.is_required,
            is_active: param.is_active,
        });
        paramForm.clearErrors();
        setIsParamModalOpen(true);
    };

    const handleSaveParameter = (e: React.FormEvent) => {
        e.preventDefault();

        // Convert options_text to array if select or checkbox_group
        let options_json = null;
        if (
            (paramForm.data.input_type === 'select' || paramForm.data.input_type === 'checkbox_group') &&
            paramForm.data.options_text.trim() !== ''
        ) {
            options_json = paramForm.data.options_text
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
        }

        const payload = {
            ...paramForm.data,
            options_json,
        };

        if (editingParameter) {
            paramForm.transform(() => payload);
            paramForm.put(route('services.parameters.update', [service.id, editingParameter.id]), {
                onSuccess: () => {
                    setIsParamModalOpen(false);
                    paramForm.reset();
                },
            });
        } else {
            paramForm.transform(() => payload);
            paramForm.post(route('services.parameters.store', service.id), {
                onSuccess: () => {
                    setIsParamModalOpen(false);
                    paramForm.reset();
                },
            });
        }
    };

    const handleToggleParamStatus = (param: ServiceParameter) => {
        router.patch(
            route('services.parameters.toggle-status', [service.id, param.id]),
            {},
            { preserveScroll: true }
        );
    };

    const handleDeleteParam = (param: ServiceParameter) => {
        if (confirm(`Apakah Anda yakin ingin menghapus parameter "${param.label}"?`)) {
            router.delete(route('services.parameters.destroy', [service.id, param.id]), {
                preserveScroll: true,
            });
        }
    };

    // Open Drawer / Modal for managing Ranges & Rules
    const openManageModal = (param: ServiceParameter, tab: 'ranges' | 'rules' = 'ranges') => {
        // Find latest data from parameters prop
        const currentParam = parameters.find((p) => p.id === param.id) || param;
        setSelectedParameter(currentParam);
        setActiveTab(tab);
        setIsManageModalOpen(true);
    };

    // Keep selectedParameter updated when parameters change
    React.useEffect(() => {
        if (selectedParameter) {
            const updated = parameters.find((p) => p.id === selectedParameter.id);
            if (updated) {
                setSelectedParameter(updated);
            }
        }
    }, [parameters]);

    // ==========================================
    // Reference Range Handlers
    // ==========================================
    const openCreateRangeModal = () => {
        setEditingRange(null);
        rangeForm.reset();
        rangeForm.setData({
            gender: 'ALL',
            min_age_years: '',
            max_age_years: '',
            min_value: '',
            max_value: '',
            normal_text_value: '',
            display_reference: '',
            is_active: true,
        });
        rangeForm.clearErrors();
        setIsRangeModalOpen(true);
    };

    const openEditRangeModal = (range: ParameterReferenceRange) => {
        setEditingRange(range);
        rangeForm.setData({
            gender: range.gender,
            min_age_years: range.min_age_years ?? '',
            max_age_years: range.max_age_years ?? '',
            min_value: range.min_value ?? '',
            max_value: range.max_value ?? '',
            normal_text_value: range.normal_text_value || '',
            display_reference: range.display_reference || '',
            is_active: range.is_active,
        });
        rangeForm.clearErrors();
        setIsRangeModalOpen(true);
    };

    const handleSaveRange = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedParameter) return;

        const payload = {
            gender: rangeForm.data.gender,
            min_age_years: rangeForm.data.min_age_years === '' ? null : Number(rangeForm.data.min_age_years),
            max_age_years: rangeForm.data.max_age_years === '' ? null : Number(rangeForm.data.max_age_years),
            min_value: rangeForm.data.min_value === '' ? null : Number(rangeForm.data.min_value),
            max_value: rangeForm.data.max_value === '' ? null : Number(rangeForm.data.max_value),
            normal_text_value: rangeForm.data.normal_text_value.trim() === '' ? null : rangeForm.data.normal_text_value.trim(),
            display_reference: rangeForm.data.display_reference.trim() === '' ? null : rangeForm.data.display_reference.trim(),
            is_active: rangeForm.data.is_active,
        };

        rangeForm.transform(() => payload);

        if (editingRange) {
            rangeForm.put(
                route('services.parameters.ranges.update', [service.id, selectedParameter.id, editingRange.id]),
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setIsRangeModalOpen(false);
                        rangeForm.reset();
                    },
                }
            );
        } else {
            rangeForm.post(
                route('services.parameters.ranges.store', [service.id, selectedParameter.id]),
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setIsRangeModalOpen(false);
                        rangeForm.reset();
                    },
                }
            );
        }
    };

    const handleDeleteRange = (range: ParameterReferenceRange) => {
        if (!selectedParameter) return;
        if (confirm('Hapus nilai rujukan ini?')) {
            router.delete(
                route('services.parameters.ranges.destroy', [service.id, selectedParameter.id, range.id]),
                { preserveScroll: true }
            );
        }
    };

    // ==========================================
    // Auto-Rule Handlers
    // ==========================================
    const openCreateRuleModal = () => {
        setEditingRule(null);
        ruleForm.reset();
        ruleForm.setData({
            condition_operator: '<',
            compare_value_1: '',
            compare_value_2: '',
            gender: 'ALL',
            flag_status: 'abnormal',
            auto_conclusion: '',
            auto_suggestion: '',
            include_in_abnormality_recap: true,
            priority: (selectedParameter?.auto_rules?.length || 0) + 1,
            is_active: true,
        });
        ruleForm.clearErrors();
        setIsRuleModalOpen(true);
    };

    const openEditRuleModal = (rule: ParameterAutoRule) => {
        setEditingRule(rule);
        ruleForm.setData({
            condition_operator: rule.condition_operator,
            compare_value_1: rule.compare_value_1 || '',
            compare_value_2: rule.compare_value_2 || '',
            gender: rule.gender,
            flag_status: rule.flag_status,
            auto_conclusion: rule.auto_conclusion || '',
            auto_suggestion: rule.auto_suggestion || '',
            include_in_abnormality_recap: rule.include_in_abnormality_recap,
            priority: rule.priority,
            is_active: rule.is_active,
        });
        ruleForm.clearErrors();
        setIsRuleModalOpen(true);
    };

    const handleSaveRule = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedParameter) return;

        const payload = {
            condition_operator: ruleForm.data.condition_operator,
            compare_value_1: ruleForm.data.compare_value_1,
            compare_value_2: ruleForm.data.compare_value_2,
            gender: ruleForm.data.gender,
            flag_status: ruleForm.data.flag_status,
            auto_conclusion: ruleForm.data.auto_conclusion,
            auto_suggestion: ruleForm.data.auto_suggestion,
            include_in_abnormality_recap: ruleForm.data.include_in_abnormality_recap,
            priority: Number(ruleForm.data.priority) || 0,
            is_active: ruleForm.data.is_active,
        };

        ruleForm.transform(() => payload);

        if (editingRule) {
            ruleForm.put(
                route('services.parameters.rules.update', [service.id, selectedParameter.id, editingRule.id]),
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setIsRuleModalOpen(false);
                        ruleForm.reset();
                    },
                }
            );
        } else {
            ruleForm.post(
                route('services.parameters.rules.store', [service.id, selectedParameter.id]),
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setIsRuleModalOpen(false);
                        ruleForm.reset();
                    },
                }
            );
        }
    };

    const handleDeleteRule = (rule: ParameterAutoRule) => {
        if (!selectedParameter) return;
        if (confirm('Hapus aturan evaluasi ini?')) {
            router.delete(
                route('services.parameters.rules.destroy', [service.id, selectedParameter.id, rule.id]),
                { preserveScroll: true }
            );
        }
    };

    // Helper for input type badges
    const getInputTypeBadge = (type: ParameterInputType) => {
        switch (type) {
            case 'number':
                return <Badge variant="info" icon={Hash}>Angka (Number)</Badge>;
            case 'formula':
                return <Badge variant="warning" icon={Calculator}>Formula</Badge>;
            case 'select':
                return <Badge variant="neutral" icon={ListFilter}>Pilihan (Select)</Badge>;
            case 'audiogram_grid':
                return <Badge variant="success" icon={Activity}>Audiogram Grid</Badge>;
            case 'textarea':
                return <Badge variant="neutral" icon={FileText}>Teks Panjang</Badge>;
            case 'checkbox_group':
                return <Badge variant="neutral" icon={ListFilter}>Checkbox Group</Badge>;
            default:
                return <Badge variant="neutral" icon={FileText}>Teks Singkat</Badge>;
        }
    };

    // Helper for flag status badge
    const getFlagBadge = (status: FlagStatus) => {
        switch (status) {
            case 'normal':
                return <Badge variant="success" icon={CheckCircle2}>Normal</Badge>;
            case 'low':
                return <Badge variant="warning" icon={AlertTriangle}>Low (Rendah)</Badge>;
            case 'high':
                return <Badge variant="warning" icon={AlertTriangle}>High (Tinggi)</Badge>;
            case 'critical':
                return <Badge variant="danger" icon={ShieldAlert}>Critical (Kritis)</Badge>;
            case 'abnormal':
            default:
                return <Badge variant="danger" icon={AlertTriangle}>Abnormal</Badge>;
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Parameter: ${service.name} (${service.code})`} />

            <div className="space-y-6">
                {/* Header with Breadcrumb and Service Info */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-zinc-200/80">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <Link
                                href={route('services.index')}
                                className="hover:text-zinc-900 transition-colors flex items-center gap-1 font-medium"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Master Pemeriksaan
                            </Link>
                            <span>/</span>
                            <span className="font-mono text-zinc-700">{service.code}</span>
                            <span>/</span>
                            <span className="text-zinc-800 font-semibold">Parameter & Aturan Evaluasi</span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                            {service.name}
                            <span className="text-xs font-mono font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200/80">
                                {service.code}
                            </span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href={route('services.index')}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors shadow-xs"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Kembali
                        </Link>
                        <button
                            type="button"
                            onClick={openCreateParamModal}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-colors shadow-xs"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Tambah Parameter
                        </button>
                    </div>
                </div>

                {/* Service Metadata Card */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-lg border border-zinc-200/80 shadow-xs">
                    <div>
                        <span className="text-[11px] font-medium text-zinc-400 block uppercase tracking-wider">
                            Kategori
                        </span>
                        <span className="text-xs font-medium text-zinc-800 capitalize mt-0.5 block">
                            {service.category} {service.sub_group ? `• ${service.sub_group}` : ''}
                        </span>
                    </div>
                    <div>
                        <span className="text-[11px] font-medium text-zinc-400 block uppercase tracking-wider">
                            Stasiun / Sampel
                        </span>
                        <span className="text-xs font-medium text-zinc-800 mt-0.5 block">
                            {service.sample?.name || '—'}
                        </span>
                    </div>
                    <div>
                        <span className="text-[11px] font-medium text-zinc-400 block uppercase tracking-wider">
                            Format Cetak
                        </span>
                        <span className="text-xs font-mono font-medium text-zinc-800 mt-0.5 block">
                            {service.print_template}
                        </span>
                    </div>
                    <div>
                        <span className="text-[11px] font-medium text-zinc-400 block uppercase tracking-wider">
                            Total Parameter
                        </span>
                        <span className="text-xs font-semibold text-zinc-900 mt-0.5 block tabular-nums">
                            {parameters.length} Parameter Dikonfigurasi
                        </span>
                    </div>
                </div>

                {/* Parameters List */}
                <div className="bg-white rounded-lg border border-zinc-200/80 shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-zinc-200/80 flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-semibold text-zinc-900">
                                Daftar Parameter Pemeriksaan
                            </h2>
                            <p className="text-xs text-zinc-500 mt-0.5">
                                Atur field masukan, nilai rujukan gender/usia, dan aturan evaluasi otomatis untuk pemeriksaan ini.
                            </p>
                        </div>
                    </div>

                    {parameters.length === 0 ? (
                        <div className="py-16 text-center space-y-3">
                            <SlidersHorizontal className="w-10 h-10 text-zinc-300 mx-auto" />
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-zinc-800">
                                    Belum ada parameter untuk pemeriksaan ini
                                </p>
                                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                                    Klik tombol Tambah Parameter di atas untuk mengonfigurasi field pemeriksaan seperti Hemoglobin, Visus, Kesimpulan RO, dll.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={openCreateParamModal}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Tambah Parameter Pertama
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-zinc-50/70 border-b border-zinc-200/80 text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">
                                    <tr>
                                        <th className="py-3 px-4 w-12 text-center">No</th>
                                        <th className="py-3 px-4 w-32 font-mono">Kode / Slug</th>
                                        <th className="py-3 px-4">Label & Kelompok</th>
                                        <th className="py-3 px-4 w-44">Tipe Input & Satuan</th>
                                        <th className="py-3 px-4 w-36 text-center">Nilai Rujukan</th>
                                        <th className="py-3 px-4 w-36 text-center">Auto-Rules</th>
                                        <th className="py-3 px-4 w-24 text-center">Status</th>
                                        <th className="py-3 px-4 w-20 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200/70">
                                    {parameters.map((param, index) => {
                                        const rangeCount = param.reference_ranges?.length || 0;
                                        const ruleCount = param.auto_rules?.length || 0;

                                        const actionItems: ActionDropdownItem[] = [
                                            {
                                                label: 'Kelola Nilai Rujukan & Rules',
                                                icon: SlidersHorizontal,
                                                onClick: () => openManageModal(param, 'ranges'),
                                            },
                                            {
                                                label: 'Edit Parameter',
                                                icon: Pencil,
                                                onClick: () => openEditParamModal(param),
                                            },
                                            {
                                                label: param.is_active ? 'Nonaktifkan' : 'Aktifkan',
                                                icon: param.is_active ? XCircle : CheckCircle2,
                                                variant: param.is_active ? 'danger' : 'default',
                                                onClick: () => handleToggleParamStatus(param),
                                            },
                                            {
                                                label: 'Hapus Parameter',
                                                icon: Trash2,
                                                variant: 'danger',
                                                onClick: () => handleDeleteParam(param),
                                            },
                                        ];

                                        return (
                                            <tr
                                                key={param.id}
                                                className={`hover:bg-zinc-50/80 transition-colors ${
                                                    !param.is_active ? 'opacity-60 bg-zinc-50/40' : ''
                                                }`}
                                            >
                                                <td className="py-3 px-4 text-center font-mono text-zinc-400 tabular-nums">
                                                    {param.sort_order || index + 1}
                                                </td>
                                                <td className="py-3 px-4 font-mono font-semibold text-zinc-800">
                                                    {param.code}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-zinc-900">
                                                            {param.label}
                                                            {param.is_required && (
                                                                <span className="ml-1 text-rose-500 font-bold" title="Wajib Diisi">*</span>
                                                            )}
                                                        </span>
                                                        {param.group_name && (
                                                            <span className="text-[11px] text-zinc-400">
                                                                {param.group_name}
                                                            </span>
                                                        )}
                                                        {param.default_normal_text && (
                                                            <span className="text-[11px] text-emerald-600 mt-0.5 truncate max-w-xs font-mono">
                                                                Preset: "{param.default_normal_text}"
                                                            </span>
                                                        )}
                                                        {param.formula_expression && (
                                                            <span className="text-[11px] text-amber-600 mt-0.5 font-mono">
                                                                Formula: {param.formula_expression}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        {getInputTypeBadge(param.input_type)}
                                                        {param.unit && (
                                                            <span className="text-[11px] font-mono text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200/80">
                                                                {param.unit}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => openManageModal(param, 'ranges')}
                                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                                                            rangeCount > 0
                                                                ? 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200'
                                                                : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100 border border-dashed border-zinc-300'
                                                        }`}
                                                    >
                                                        <span className="font-semibold tabular-nums">{rangeCount}</span> Rujukan
                                                    </button>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => openManageModal(param, 'rules')}
                                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                                                            ruleCount > 0
                                                                ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/80'
                                                                : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100 border border-dashed border-zinc-300'
                                                        }`}
                                                    >
                                                        <span className="font-semibold tabular-nums">{ruleCount}</span> Rules
                                                    </button>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <Badge
                                                        variant={param.is_active ? 'success' : 'neutral'}
                                                        icon={param.is_active ? CheckCircle2 : XCircle}
                                                    >
                                                        {param.is_active ? 'Aktif' : 'Non-Aktif'}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <ActionDropdown items={actionItems} align="right" />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* ========================================================================= */}
            {/* Modal: Create / Edit Parameter */}
            {/* ========================================================================= */}
            <Modal
                isOpen={isParamModalOpen}
                onClose={() => setIsParamModalOpen(false)}
                title={editingParameter ? 'Edit Parameter Pemeriksaan' : 'Tambah Parameter Pemeriksaan'}
                subtitle={`Konfigurasi field input untuk ${service.name}`}
                maxWidth="2xl"
                footer={
                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsParamModalOpen(false)}
                            className="px-3 py-1.5 text-xs font-medium text-zinc-600 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            form="param-form"
                            disabled={paramForm.processing}
                            className="px-4 py-1.5 text-xs font-semibold text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-colors shadow-xs disabled:opacity-50"
                        >
                            {paramForm.processing ? 'Menyimpan...' : 'Simpan Parameter'}
                        </button>
                    </div>
                }
            >
                <form id="param-form" onSubmit={handleSaveParameter} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Kode / Slug Parameter <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={paramForm.data.code}
                                onChange={(e) => paramForm.setData('code', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                                placeholder="misal: hgb, gdp, visus_od"
                                className="w-full px-3 py-1.5 text-xs font-mono rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                                required
                            />
                            {paramForm.errors.code && (
                                <p className="mt-1 text-[11px] text-rose-500">{paramForm.errors.code}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Label Parameter <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={paramForm.data.label}
                                onChange={(e) => paramForm.setData('label', e.target.value)}
                                placeholder="misal: Hemoglobin, Glukosa Darah Puasa"
                                className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                                required
                            />
                            {paramForm.errors.label && (
                                <p className="mt-1 text-[11px] text-rose-500">{paramForm.errors.label}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Tipe Input <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={paramForm.data.input_type}
                                onChange={(e) => paramForm.setData('input_type', e.target.value as ParameterInputType)}
                                className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                            >
                                <option value="number">Angka (Number)</option>
                                <option value="text">Teks Singkat (Text)</option>
                                <option value="textarea">Teks Panjang (Textarea)</option>
                                <option value="select">Pilihan Tunggal (Select)</option>
                                <option value="checkbox_group">Pilihan Banyak (Checkbox)</option>
                                <option value="formula">Formula Terhitung (Formula)</option>
                                <option value="audiogram_grid">Audiogram Grid (250-8000 Hz)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Satuan (Unit)
                            </label>
                            <input
                                type="text"
                                value={paramForm.data.unit}
                                onChange={(e) => paramForm.setData('unit', e.target.value)}
                                placeholder="misal: g/dL, mg/dL, /uL, %"
                                className="w-full px-3 py-1.5 text-xs font-mono rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Kelompok (Sub-Group)
                            </label>
                            <input
                                type="text"
                                value={paramForm.data.group_name}
                                onChange={(e) => paramForm.setData('group_name', e.target.value)}
                                placeholder="misal: Darah Lengkap, Hitung Jenis"
                                className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                            />
                        </div>
                    </div>

                    {/* Conditional fields based on input_type */}
                    {(paramForm.data.input_type === 'select' || paramForm.data.input_type === 'checkbox_group') && (
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Daftar Pilihan (Pisahkan dengan koma)
                            </label>
                            <input
                                type="text"
                                value={paramForm.data.options_text}
                                onChange={(e) => paramForm.setData('options_text', e.target.value)}
                                placeholder="misal: Negatif, Positif, Samar"
                                className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                            />
                            <p className="mt-1 text-[11px] text-zinc-400">
                                Contoh: "Negatif, Positif (+), Positif (++)"
                            </p>
                        </div>
                    )}

                    {paramForm.data.input_type === 'formula' && (
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Ekspresi Formula Matematika
                            </label>
                            <input
                                type="text"
                                value={paramForm.data.formula_expression}
                                onChange={(e) => paramForm.setData('formula_expression', e.target.value)}
                                placeholder="misal: [BB] / (([TB]/100) * ([TB]/100))"
                                className="w-full px-3 py-1.5 text-xs font-mono rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                            />
                            <p className="mt-1 text-[11px] text-zinc-400">
                                Gunakan tanda [KODE_PARAM] untuk merujuk ke parameter lain dalam formulir.
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">
                            Preset Nilai Normal Default (1-Click "Isi Normal")
                        </label>
                        <input
                            type="text"
                            value={paramForm.data.default_normal_text}
                            onChange={(e) => paramForm.setData('default_normal_text', e.target.value)}
                            placeholder="misal: Negatif, Cor dan Pulmo dalam batas normal, Tidak ditemukan kelainan"
                            className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
                        />
                        <p className="mt-1 text-[11px] text-zinc-400">
                            Digunakan untuk auto-fill cepat tombol "Isi Normal" pada layar entri hasil dokter/analis.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-zinc-100">
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Urutan Tampilan
                            </label>
                            <input
                                type="number"
                                min={0}
                                value={paramForm.data.sort_order}
                                onChange={(e) => paramForm.setData('sort_order', Number(e.target.value))}
                                className="w-full px-3 py-1.5 text-xs font-mono rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 tabular-nums"
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-6">
                            <input
                                type="checkbox"
                                id="is_required_chk"
                                checked={paramForm.data.is_required}
                                onChange={(e) => paramForm.setData('is_required', e.target.checked)}
                                className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                            />
                            <label htmlFor="is_required_chk" className="text-xs font-medium text-zinc-800">
                                Wajib Diisi (Required)
                            </label>
                        </div>

                        <div className="flex items-center gap-2 pt-6">
                            <input
                                type="checkbox"
                                id="is_active_chk"
                                checked={paramForm.data.is_active}
                                onChange={(e) => paramForm.setData('is_active', e.target.checked)}
                                className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                            />
                            <label htmlFor="is_active_chk" className="text-xs font-medium text-zinc-800">
                                Parameter Aktif
                            </label>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* ========================================================================= */}
            {/* Modal: Manage Reference Ranges & Auto-Rules */}
            {/* ========================================================================= */}
            <Modal
                isOpen={isManageModalOpen}
                onClose={() => setIsManageModalOpen(false)}
                title={`Aturan Parameter: ${selectedParameter?.label || ''}`}
                subtitle={`Kode: ${selectedParameter?.code || ''} • Satuan: ${selectedParameter?.unit || '—'}`}
                maxWidth="4xl"
                footer={
                    <div className="flex items-center justify-end">
                        <button
                            type="button"
                            onClick={() => setIsManageModalOpen(false)}
                            className="px-4 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors"
                        >
                            Tutup
                        </button>
                    </div>
                }
            >
                <div className="space-y-4">
                    {/* Tabs Header */}
                    <div className="flex border-b border-zinc-200">
                        <button
                            type="button"
                            onClick={() => setActiveTab('ranges')}
                            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                                activeTab === 'ranges'
                                    ? 'border-zinc-900 text-zinc-900'
                                    : 'border-transparent text-zinc-500 hover:text-zinc-700'
                            }`}
                        >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            Nilai Rujukan (Reference Ranges)
                            <span className="ml-1 text-[10px] bg-zinc-100 px-1.5 py-0.2 rounded-full font-mono">
                                {selectedParameter?.reference_ranges?.length || 0}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('rules')}
                            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                                activeTab === 'rules'
                                    ? 'border-zinc-900 text-zinc-900'
                                    : 'border-transparent text-zinc-500 hover:text-zinc-700'
                            }`}
                        >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Auto-Rules & Flagging Evaluasi
                            <span className="ml-1 text-[10px] bg-zinc-100 px-1.5 py-0.2 rounded-full font-mono">
                                {selectedParameter?.auto_rules?.length || 0}
                            </span>
                        </button>
                    </div>

                    {/* TAB 1: REFERENCE RANGES */}
                    {activeTab === 'ranges' && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-zinc-500">
                                    Nilai rujukan normal berdasarkan Jenis Kelamin dan Batas Usia pasien.
                                </p>
                                <button
                                    type="button"
                                    onClick={openCreateRangeModal}
                                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-colors shadow-xs"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Tambah Nilai Rujukan
                                </button>
                            </div>

                            {(!selectedParameter?.reference_ranges || selectedParameter.reference_ranges.length === 0) ? (
                                <div className="py-8 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 rounded-lg">
                                    Belum ada nilai rujukan untuk parameter ini.
                                </div>
                            ) : (
                                <div className="overflow-x-auto border border-zinc-200/80 rounded-md">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-zinc-50 text-[11px] font-semibold text-zinc-600 uppercase">
                                            <tr>
                                                <th className="py-2.5 px-3">Gender</th>
                                                <th className="py-2.5 px-3">Usia Pasien</th>
                                                <th className="py-2.5 px-3">Nilai Normal</th>
                                                <th className="py-2.5 px-3">Teks Normal</th>
                                                <th className="py-2.5 px-3">Teks Rujukan Cetak</th>
                                                <th className="py-2.5 px-3 w-16 text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-200/70">
                                            {selectedParameter.reference_ranges.map((range) => (
                                                <tr key={range.id} className="hover:bg-zinc-50/70">
                                                    <td className="py-2 px-3 font-semibold text-zinc-800">
                                                        {range.gender === 'ALL'
                                                            ? 'Semua (L/P)'
                                                            : range.gender === 'L'
                                                            ? 'Laki-laki'
                                                            : 'Perempuan'}
                                                    </td>
                                                    <td className="py-2 px-3 text-zinc-700 font-mono tabular-nums">
                                                        {range.min_age_years !== null || range.max_age_years !== null
                                                            ? `${range.min_age_years ?? 0} - ${range.max_age_years ?? '∞'} thn`
                                                            : 'Semua Usia'}
                                                    </td>
                                                    <td className="py-2 px-3 font-mono font-medium text-zinc-900 tabular-nums">
                                                        {range.min_value !== null || range.max_value !== null
                                                            ? `${range.min_value ?? '—'} s/d ${range.max_value ?? '—'}`
                                                            : '—'}
                                                    </td>
                                                    <td className="py-2 px-3 text-zinc-600 font-mono">
                                                        {range.normal_text_value || '—'}
                                                    </td>
                                                    <td className="py-2 px-3 font-mono text-zinc-900 font-medium">
                                                        {range.display_reference || '—'}
                                                    </td>
                                                    <td className="py-2 px-3 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditRangeModal(range)}
                                                                className="p-1 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded"
                                                                title="Edit"
                                                            >
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteRange(range)}
                                                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                                                                title="Hapus"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: AUTO-RULES */}
                    {activeTab === 'rules' && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-zinc-500">
                                    Aturan evaluasi otomatis: menentukan flag (low/high/abnormal/critical), kesimpulan, dan saran medis MCU.
                                </p>
                                <button
                                    type="button"
                                    onClick={openCreateRuleModal}
                                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-colors shadow-xs"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Tambah Auto-Rule
                                </button>
                            </div>

                            {(!selectedParameter?.auto_rules || selectedParameter.auto_rules.length === 0) ? (
                                <div className="py-8 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 rounded-lg">
                                    Belum ada auto-rule untuk parameter ini.
                                </div>
                            ) : (
                                <div className="overflow-x-auto border border-zinc-200/80 rounded-md">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-zinc-50 text-[11px] font-semibold text-zinc-600 uppercase">
                                            <tr>
                                                <th className="py-2.5 px-3 w-12 text-center">Prio</th>
                                                <th className="py-2.5 px-3">Kondisi & Nilai</th>
                                                <th className="py-2.5 px-3">Gender</th>
                                                <th className="py-2.5 px-3">Flag Status</th>
                                                <th className="py-2.5 px-3">Kesimpulan & Saran Otomatis</th>
                                                <th className="py-2.5 px-3 w-28 text-center">Rekap Kelainan</th>
                                                <th className="py-2.5 px-3 w-16 text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-200/70">
                                            {selectedParameter.auto_rules.map((rule) => (
                                                <tr key={rule.id} className="hover:bg-zinc-50/70">
                                                    <td className="py-2 px-3 text-center font-mono text-zinc-400 tabular-nums">
                                                        {rule.priority}
                                                    </td>
                                                    <td className="py-2 px-3 font-mono font-semibold text-zinc-900">
                                                        {rule.condition_operator} {rule.compare_value_1}
                                                        {rule.condition_operator === 'between' && ` s/d ${rule.compare_value_2}`}
                                                    </td>
                                                    <td className="py-2 px-3 text-zinc-700">
                                                        {rule.gender === 'ALL' ? 'Semua' : rule.gender}
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        {getFlagBadge(rule.flag_status)}
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-zinc-900">
                                                                {rule.auto_conclusion || '—'}
                                                            </span>
                                                            {rule.auto_suggestion && (
                                                                <span className="text-[11px] text-zinc-500 italic">
                                                                    Saran: {rule.auto_suggestion}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-3 text-center">
                                                        {rule.include_in_abnormality_recap ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                                                Masuk Rekap
                                                            </span>
                                                        ) : (
                                                            <span className="text-zinc-400 text-[11px]">—</span>
                                                        )}
                                                    </td>
                                                    <td className="py-2 px-3 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditRuleModal(rule)}
                                                                className="p-1 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded"
                                                                title="Edit"
                                                            >
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteRule(rule)}
                                                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                                                                title="Hapus"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Modal>

            {/* ========================================================================= */}
            {/* Sub-Modal: Add / Edit Reference Range */}
            {/* ========================================================================= */}
            <Modal
                isOpen={isRangeModalOpen}
                onClose={() => setIsRangeModalOpen(false)}
                title={editingRange ? 'Edit Nilai Rujukan' : 'Tambah Nilai Rujukan'}
                subtitle={`Parameter: ${selectedParameter?.label || ''}`}
                maxWidth="lg"
                footer={
                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsRangeModalOpen(false)}
                            className="px-3 py-1.5 text-xs font-medium text-zinc-600 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            form="range-form"
                            disabled={rangeForm.processing}
                            className="px-4 py-1.5 text-xs font-semibold text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-colors shadow-xs disabled:opacity-50"
                        >
                            {rangeForm.processing ? 'Menyimpan...' : 'Simpan Rujukan'}
                        </button>
                    </div>
                }
            >
                <form id="range-form" onSubmit={handleSaveRange} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Jenis Kelamin
                            </label>
                            <select
                                value={rangeForm.data.gender}
                                onChange={(e) => rangeForm.setData('gender', e.target.value as GenderType)}
                                className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            >
                                <option value="ALL">Semua (ALL)</option>
                                <option value="L">Laki-laki (L)</option>
                                <option value="P">Perempuan (P)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Min Usia (Thn)
                            </label>
                            <input
                                type="number"
                                min={0}
                                max={150}
                                value={rangeForm.data.min_age_years}
                                onChange={(e) => rangeForm.setData('min_age_years', e.target.value)}
                                placeholder="0"
                                className="w-full px-3 py-1.5 text-xs font-mono rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Max Usia (Thn)
                            </label>
                            <input
                                type="number"
                                min={0}
                                max={150}
                                value={rangeForm.data.max_age_years}
                                onChange={(e) => rangeForm.setData('max_age_years', e.target.value)}
                                placeholder="120"
                                className="w-full px-3 py-1.5 text-xs font-mono rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Nilai Batas Bawah (Min)
                            </label>
                            <input
                                type="number"
                                step="any"
                                value={rangeForm.data.min_value}
                                onChange={(e) => rangeForm.setData('min_value', e.target.value)}
                                placeholder="misal: 12.0"
                                className="w-full px-3 py-1.5 text-xs font-mono rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Nilai Batas Atas (Max)
                            </label>
                            <input
                                type="number"
                                step="any"
                                value={rangeForm.data.max_value}
                                onChange={(e) => rangeForm.setData('max_value', e.target.value)}
                                placeholder="misal: 16.0"
                                className="w-full px-3 py-1.5 text-xs font-mono rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">
                            Teks Normal (Untuk Tipe Select / Text)
                        </label>
                        <input
                            type="text"
                            value={rangeForm.data.normal_text_value}
                            onChange={(e) => rangeForm.setData('normal_text_value', e.target.value)}
                            placeholder="misal: Negatif, Normal, Jernih"
                            className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">
                            Format Teks Rujukan Pada Cetak Hasil
                        </label>
                        <input
                            type="text"
                            value={rangeForm.data.display_reference}
                            onChange={(e) => rangeForm.setData('display_reference', e.target.value)}
                            placeholder="misal: 12.0 - 16.0 g/dL, < 200 mg/dL, Negatif"
                            className="w-full px-3 py-1.5 text-xs font-mono rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                        />
                        <p className="mt-1 text-[11px] text-zinc-400">
                            Teks ini yang akan langsung dicetak pada kolom "Nilai Rujukan" di hasil laboratorium / resume MCU.
                        </p>
                    </div>
                </form>
            </Modal>

            {/* ========================================================================= */}
            {/* Sub-Modal: Add / Edit Auto-Rule */}
            {/* ========================================================================= */}
            <Modal
                isOpen={isRuleModalOpen}
                onClose={() => setIsRuleModalOpen(false)}
                title={editingRule ? 'Edit Auto-Rule Evaluasi' : 'Tambah Auto-Rule Evaluasi'}
                subtitle={`Parameter: ${selectedParameter?.label || ''}`}
                maxWidth="lg"
                footer={
                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsRuleModalOpen(false)}
                            className="px-3 py-1.5 text-xs font-medium text-zinc-600 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            form="rule-form"
                            disabled={ruleForm.processing}
                            className="px-4 py-1.5 text-xs font-semibold text-white bg-zinc-900 rounded-md hover:bg-zinc-800 transition-colors shadow-xs disabled:opacity-50"
                        >
                            {ruleForm.processing ? 'Menyimpan...' : 'Simpan Auto-Rule'}
                        </button>
                    </div>
                }
            >
                <form id="rule-form" onSubmit={handleSaveRule} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Operator Kondisi
                            </label>
                            <select
                                value={ruleForm.data.condition_operator}
                                onChange={(e) => ruleForm.setData('condition_operator', e.target.value as ConditionOperator)}
                                className="w-full px-3 py-1.5 text-xs font-mono rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            >
                                <option value="<">&lt; (Lebih Kecil)</option>
                                <option value="<=">&lt;= (Lebih Kecil Sama Dengan)</option>
                                <option value=">">&gt; (Lebih Besar)</option>
                                <option value=">=">&gt;= (Lebih Besar Sama Dengan)</option>
                                <option value="==">== (Sama Dengan)</option>
                                <option value="!=">!= (Tidak Sama Dengan)</option>
                                <option value="between">between (Di Antara Nilai 1 &amp; 2)</option>
                                <option value="contains">contains (Mengandung Teks)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Nilai Pembanding 1
                            </label>
                            <input
                                type="text"
                                value={ruleForm.data.compare_value_1}
                                onChange={(e) => ruleForm.setData('compare_value_1', e.target.value)}
                                placeholder="misal: 10 atau Positif"
                                className="w-full px-3 py-1.5 text-xs font-mono rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Nilai Pembanding 2
                            </label>
                            <input
                                type="text"
                                disabled={ruleForm.data.condition_operator !== 'between'}
                                value={ruleForm.data.compare_value_2}
                                onChange={(e) => ruleForm.setData('compare_value_2', e.target.value)}
                                placeholder="khusus between"
                                className="w-full px-3 py-1.5 text-xs font-mono rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 disabled:bg-zinc-100 disabled:opacity-50"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Gender
                            </label>
                            <select
                                value={ruleForm.data.gender}
                                onChange={(e) => ruleForm.setData('gender', e.target.value as GenderType)}
                                className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            >
                                <option value="ALL">Semua Gender</option>
                                <option value="L">Laki-laki (L)</option>
                                <option value="P">Perempuan (P)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Flag Status Evaluasi
                            </label>
                            <select
                                value={ruleForm.data.flag_status}
                                onChange={(e) => ruleForm.setData('flag_status', e.target.value as FlagStatus)}
                                className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                            >
                                <option value="normal">Normal</option>
                                <option value="low">Low (Rendah)</option>
                                <option value="high">High (Tinggi)</option>
                                <option value="abnormal">Abnormal</option>
                                <option value="critical">Critical (Kritis)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1">
                                Prioritas Eksekusi
                            </label>
                            <input
                                type="number"
                                min={0}
                                value={ruleForm.data.priority}
                                onChange={(e) => ruleForm.setData('priority', Number(e.target.value))}
                                className="w-full px-3 py-1.5 text-xs font-mono rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 tabular-nums"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">
                            Kesimpulan Otomatis (Auto-Conclusion)
                        </label>
                        <textarea
                            rows={2}
                            value={ruleForm.data.auto_conclusion}
                            onChange={(e) => ruleForm.setData('auto_conclusion', e.target.value)}
                            placeholder="misal: Anemia ringan, Hiperglikemia, Kardiomegali ringan"
                            className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">
                            Saran Medis Otomatis (Auto-Suggestion)
                        </label>
                        <textarea
                            rows={2}
                            value={ruleForm.data.auto_suggestion}
                            onChange={(e) => ruleForm.setData('auto_suggestion', e.target.value)}
                            placeholder="misal: Konsumsi makanan kaya zat besi dan kontrol darah 1 bulan lagi"
                            className="w-full px-3 py-1.5 text-xs rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                        />
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
                        <input
                            type="checkbox"
                            id="recap_chk"
                            checked={ruleForm.data.include_in_abnormality_recap}
                            onChange={(e) => ruleForm.setData('include_in_abnormality_recap', e.target.checked)}
                            className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                        />
                        <label htmlFor="recap_chk" className="text-xs font-medium text-zinc-800">
                            Sertakan dalam Rekapitulasi Kelainan MCU (REKAPITULASI KELAINAN)
                        </label>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
