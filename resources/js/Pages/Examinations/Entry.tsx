import React, { useState, useMemo, useEffect } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Badge from '@/Components/Badge';
import { AudiogramGrid } from '@/Components/AudiogramGrid';
import {
    ArrowLeft,
    Save,
    CheckCheck,
    FlaskConical,
    ScanLine,
    Activity,
    HeartPulse,
    FileText,
    Upload,
    Trash2,
    Eye,
    FileCheck2,
    AlertTriangle,
    CheckCircle2,
    Clock,
    User,
    Building2,
    Calendar,
    Sparkles,
    ShieldCheck,
    Paperclip,
    ExternalLink,
} from 'lucide-react';
import type {
    PageProps,
    Registration,
    RegistrationItem,
    ServiceParameter,
    ParameterReferenceRange,
    ParameterAutoRule,
    FlagStatus,
    AudiogramData,
    ResultAttachment,
} from '@/types';

interface ExaminationsEntryProps extends PageProps {
    registration: Registration;
    currentCategory: string;
    categoriesAvailable: string[];
}

interface FormParamValue {
    registration_item_id: number;
    parameter_id: number;
    value_numeric: number | string | null;
    value_text: string | null;
    value_json: any | null;
    unit_snapshot: string | null;
    reference_snapshot: string | null;
    flag_status: FlagStatus;
    auto_conclusion: string | null;
    auto_suggestion: string | null;
    is_manually_overridden: boolean;
}

export default function Entry({
    auth,
    registration,
    currentCategory,
    categoriesAvailable,
}: ExaminationsEntryProps) {
    const [activeTab, setActiveTab] = useState<string>(currentCategory || categoriesAvailable[0] || 'lab');
    const [isSaving, setIsSaving] = useState(false);

    // Group conclusions / suggestions per registration item
    const [conclusions, setConclusions] = useState<Record<number, { conclusion: string; suggestion: string }>>(() => {
        const initial: Record<number, { conclusion: string; suggestion: string }> = {};
        registration.items?.forEach((item) => {
            initial[item.id] = {
                conclusion: item.group_conclusion || '',
                suggestion: item.group_suggestion || '',
            };
        });
        return initial;
    });

    const patientGender = registration.patient?.gender === 'P' ? 'P' : 'L';
    const patientAge = registration.age_years_snapshot ?? registration.patient?.age ?? 25;

    // Helper to find matching reference range for a parameter
    const getMatchingRange = (param: ServiceParameter): ParameterReferenceRange | undefined => {
        if (!param.reference_ranges || param.reference_ranges.length === 0) return undefined;
        return param.reference_ranges
            .filter((r) => {
                if (!r.is_active) return false;
                if (r.gender !== 'ALL' && r.gender !== patientGender) return false;
                if (r.min_age_years !== null && r.min_age_years !== undefined && patientAge < r.min_age_years) return false;
                if (r.max_age_years !== null && r.max_age_years !== undefined && patientAge > r.max_age_years) return false;
                return true;
            })
            .sort((a, b) => (a.gender === patientGender ? -1 : 1))[0];
    };

    // Helper to construct reference string
    const getReferenceText = (param: ServiceParameter, range?: ParameterReferenceRange): string => {
        if (range) {
            if (range.display_reference) return range.display_reference;
            if (range.min_value !== null && range.max_value !== null) {
                return `${range.min_value} - ${range.max_value} ${param.unit || ''}`.trim();
            }
            if (range.normal_text_value) return range.normal_text_value;
        }
        return param.default_normal_text || '-';
    };

    // Initial results map from existing DB records
    const [paramValues, setParamValues] = useState<Record<number, FormParamValue>>(() => {
        const initial: Record<number, FormParamValue> = {};

        registration.items?.forEach((item) => {
            const existingResultsMap = new Map<number, any>();
            item.examination_results?.forEach((er) => {
                existingResultsMap.set(er.parameter_id, er);
            });

            item.service?.parameters?.forEach((param) => {
                const existing = existingResultsMap.get(param.id);
                const range = getMatchingRange(param);
                const refText = getReferenceText(param, range);

                if (existing) {
                    initial[param.id] = {
                        registration_item_id: item.id,
                        parameter_id: param.id,
                        value_numeric: existing.value_numeric ?? '',
                        value_text: existing.value_text ?? '',
                        value_json: existing.value_json ?? null,
                        unit_snapshot: existing.unit_snapshot || param.unit || null,
                        reference_snapshot: existing.reference_snapshot || refText || null,
                        flag_status: existing.flag_status || 'normal',
                        auto_conclusion: existing.auto_conclusion || null,
                        auto_suggestion: existing.auto_suggestion || null,
                        is_manually_overridden: Boolean(existing.is_manually_overridden),
                    };
                } else {
                    initial[param.id] = {
                        registration_item_id: item.id,
                        parameter_id: param.id,
                        value_numeric: '',
                        value_text: '',
                        value_json: null,
                        unit_snapshot: param.unit || null,
                        reference_snapshot: refText,
                        flag_status: 'normal',
                        auto_conclusion: null,
                        auto_suggestion: null,
                        is_manually_overridden: false,
                    };
                }
            });
        });

        return initial;
    });

    // Client-side rule evaluation logic
    const evaluateRule = (
        param: ServiceParameter,
        valNumeric: number | null,
        valText: string | null
    ): { flag: FlagStatus; conclusion: string | null; suggestion: string | null } => {
        const range = getMatchingRange(param);
        let flag: FlagStatus = 'normal';
        let conclusion: string | null = null;
        let suggestion: string | null = null;

        // 1. Evaluate reference range
        if (range && valNumeric !== null && !isNaN(valNumeric)) {
            const min = range.min_value !== null ? Number(range.min_value) : null;
            const max = range.max_value !== null ? Number(range.max_value) : null;
            if (min !== null && valNumeric < min) {
                flag = 'low';
            } else if (max !== null && valNumeric > max) {
                flag = 'high';
            } else {
                flag = 'normal';
            }
        } else if (valText && valText.trim() !== '') {
            const lower = valText.toLowerCase().trim();
            if (lower === 'normal' || lower === 'negatif' || lower === 'tidak ada' || lower === 'dbn') {
                flag = 'normal';
            } else if (lower.includes('positif') || lower.includes('abnormal') || lower.includes('ditemukan')) {
                flag = 'abnormal';
            }
        }

        // 2. Evaluate auto rules
        if (param.auto_rules && param.auto_rules.length > 0) {
            const sortedRules = [...param.auto_rules]
                .filter((r) => r.is_active && (r.gender === 'ALL' || r.gender === patientGender))
                .sort((a, b) => (b.priority || 0) - (a.priority || 0));

            for (const rule of sortedRules) {
                let matches = false;
                const op = rule.condition_operator;
                const c1 = rule.compare_value_1 !== null ? Number(rule.compare_value_1) : null;
                const c2 = rule.compare_value_2 !== null ? Number(rule.compare_value_2) : null;

                if (valNumeric !== null && !isNaN(valNumeric) && c1 !== null && !isNaN(c1)) {
                    if (op === '<' && valNumeric < c1) matches = true;
                    else if (op === '<=' && valNumeric <= c1) matches = true;
                    else if (op === '>' && valNumeric > c1) matches = true;
                    else if (op === '>=' && valNumeric >= c1) matches = true;
                    else if (op === '==' && valNumeric === c1) matches = true;
                    else if (op === '!=' && valNumeric !== c1) matches = true;
                    else if (op === 'between' && c2 !== null && !isNaN(c2)) {
                        if (valNumeric >= c1 && valNumeric <= c2) matches = true;
                    }
                } else if (valText && rule.compare_value_1) {
                    const txt = valText.toLowerCase();
                    const cmp = rule.compare_value_1.toLowerCase();
                    if (op === 'contains' && txt.includes(cmp)) matches = true;
                    else if (op === '==' && txt === cmp) matches = true;
                    else if (op === '!=' && txt !== cmp) matches = true;
                }

                if (matches) {
                    flag = rule.flag_status || flag;
                    conclusion = rule.auto_conclusion || null;
                    suggestion = rule.auto_suggestion || null;
                    break;
                }
            }
        }

        return { flag, conclusion, suggestion };
    };

    // Handle field change
    const handleFieldChange = (
        param: ServiceParameter,
        itemId: number,
        field: 'value_numeric' | 'value_text' | 'value_json' | 'flag_status' | 'is_manually_overridden',
        val: any
    ) => {
        setParamValues((prev) => {
            const current = prev[param.id] || {
                registration_item_id: itemId,
                parameter_id: param.id,
                value_numeric: '',
                value_text: '',
                value_json: null,
                unit_snapshot: param.unit || null,
                reference_snapshot: getReferenceText(param, getMatchingRange(param)),
                flag_status: 'normal',
                auto_conclusion: null,
                auto_suggestion: null,
                is_manually_overridden: false,
            };

            const updated = { ...current, [field]: val };

            // If user manually changes flag, mark as overridden
            if (field === 'flag_status') {
                updated.is_manually_overridden = true;
            }

            // Auto re-evaluate if not manually overridden
            if (!updated.is_manually_overridden && (field === 'value_numeric' || field === 'value_text')) {
                const num = field === 'value_numeric' && val !== '' ? Number(val) : null;
                const txt = field === 'value_text' ? String(val) : current.value_text;
                const evalResult = evaluateRule(param, num, txt);
                updated.flag_status = evalResult.flag;
                updated.auto_conclusion = evalResult.conclusion;
                updated.auto_suggestion = evalResult.suggestion;
            }

            return { ...prev, [param.id]: updated };
        });
    };

    // 1-Click "Isi Normal" for a single parameter
    const handleFillSingleNormal = (param: ServiceParameter, itemId: number) => {
        const range = getMatchingRange(param);
        let normalNumeric: number | string = '';
        let normalText = param.default_normal_text || '';

        if (param.input_type === 'number' && range) {
            if (range.min_value !== null && range.max_value !== null) {
                // Median of reference range
                normalNumeric = Math.round(((Number(range.min_value) + Number(range.max_value)) / 2) * 10) / 10;
            } else if (range.min_value !== null) {
                normalNumeric = Number(range.min_value);
            }
        } else if (!normalText && range?.normal_text_value) {
            normalText = range.normal_text_value;
        }

        setParamValues((prev) => {
            const current = prev[param.id];
            return {
                ...prev,
                [param.id]: {
                    ...current,
                    value_numeric: normalNumeric,
                    value_text: normalText,
                    flag_status: 'normal',
                    is_manually_overridden: false,
                },
            };
        });
    };

    // 1-Click "Isi Normal (Semua)" for active category
    const handleFillCategoryNormal = () => {
        const activeItems = registration.items?.filter((it) => it.category === activeTab) || [];
        setParamValues((prev) => {
            const updated = { ...prev };
            activeItems.forEach((item) => {
                item.service?.parameters?.forEach((param) => {
                    const range = getMatchingRange(param);
                    const current = updated[param.id] || {
                        registration_item_id: item.id,
                        parameter_id: param.id,
                        value_numeric: '',
                        value_text: '',
                        value_json: null,
                        unit_snapshot: param.unit || null,
                        reference_snapshot: getReferenceText(param, range),
                        flag_status: 'normal',
                        auto_conclusion: null,
                        auto_suggestion: null,
                        is_manually_overridden: false,
                    };

                    if (param.input_type === 'number' && range) {
                        let normalNum: number = 0;
                        if (range.min_value !== null && range.max_value !== null) {
                            normalNum = Math.round(((Number(range.min_value) + Number(range.max_value)) / 2) * 10) / 10;
                        } else if (range.min_value !== null) {
                            normalNum = Number(range.min_value);
                        }
                        updated[param.id] = {
                            ...current,
                            value_numeric: normalNum,
                            flag_status: 'normal',
                            is_manually_overridden: false,
                        };
                    } else if (param.input_type === 'text' || param.input_type === 'textarea') {
                        const normalTxt = param.default_normal_text || range?.normal_text_value || 'Normal';
                        updated[param.id] = {
                            ...current,
                            value_text: normalTxt,
                            flag_status: 'normal',
                            is_manually_overridden: false,
                        };
                    } else if (param.input_type === 'audiogram_grid') {
                        // Prefill audiogram
                        const rightAc: Record<string, number> = {};
                        const rightBc: Record<string, number> = {};
                        const leftAc: Record<string, number> = {};
                        const leftBc: Record<string, number> = {};
                        [250, 500, 1000, 2000, 3000, 4000, 6000, 8000].forEach((f) => {
                            rightAc[f] = 15;
                            rightBc[f] = 10;
                            leftAc[f] = 15;
                            leftBc[f] = 10;
                        });
                        updated[param.id] = {
                            ...current,
                            value_json: {
                                frequencies: [250, 500, 1000, 2000, 3000, 4000, 6000, 8000],
                                right_ear: { ac: rightAc, bc: rightBc },
                                left_ear: { ac: leftAc, bc: leftBc },
                                right_pta: 15,
                                left_pta: 15,
                                right_classification: 'Normal (<= 25 dB)',
                                left_classification: 'Normal (<= 25 dB)',
                                diagnosis: 'Pendengaran kedua telinga dalam batas normal (Normal hearing bilateral).',
                                recommendation: 'Jaga kebersihan telinga.',
                            },
                            flag_status: 'normal',
                            is_manually_overridden: false,
                        };
                    }
                });
            });
            return updated;
        });
    };

    // Calculate Formula parameters live (e.g. BMI / IMT)
    useEffect(() => {
        const activeItems = registration.items?.filter((it) => it.category === activeTab) || [];
        activeItems.forEach((item) => {
            const params = item.service?.parameters || [];
            // Check for weight and height
            const weightParam = params.find(
                (p) => p.code.toLowerCase().includes('berat') || p.code.toLowerCase().includes('weight')
            );
            const heightParam = params.find(
                (p) => p.code.toLowerCase().includes('tinggi') || p.code.toLowerCase().includes('height')
            );
            const bmiParam = params.find(
                (p) =>
                    p.input_type === 'formula' &&
                    (p.code.toLowerCase().includes('bmi') || p.code.toLowerCase().includes('imt'))
            );

            if (weightParam && heightParam && bmiParam) {
                const weightVal = Number(paramValues[weightParam.id]?.value_numeric);
                const heightVal = Number(paramValues[heightParam.id]?.value_numeric);

                if (weightVal > 0 && heightVal > 50) {
                    const heightM = heightVal / 100;
                    const bmi = Math.round((weightVal / (heightM * heightM)) * 10) / 10;

                    let flag: FlagStatus = 'normal';
                    let conclusion = 'Status gizi normal';
                    if (bmi < 18.5) {
                        flag = 'low';
                        conclusion = 'Berat badan kurang (Underweight)';
                    } else if (bmi >= 23 && bmi < 25) {
                        flag = 'high';
                        conclusion = 'Kelebihan berat badan (Overweight)';
                    } else if (bmi >= 25 && bmi < 30) {
                        flag = 'high';
                        conclusion = 'Obesitas Tingkat I';
                    } else if (bmi >= 30) {
                        flag = 'critical';
                        conclusion = 'Obesitas Tingkat II';
                    }

                    if (paramValues[bmiParam.id]?.value_numeric !== bmi) {
                        setParamValues((prev) => ({
                            ...prev,
                            [bmiParam.id]: {
                                ...prev[bmiParam.id],
                                value_numeric: bmi,
                                flag_status: flag,
                                auto_conclusion: conclusion,
                            },
                        }));
                    }
                }
            }
        });
    }, [paramValues, activeTab]);

    // Handle form submission
    const handleSaveResults = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const activeItems = registration.items?.filter((it) => it.category === activeTab) || [];
        const payloadResults: any[] = [];

        activeItems.forEach((item) => {
            item.service?.parameters?.forEach((param) => {
                const val = paramValues[param.id];
                if (val) {
                    payloadResults.push({
                        registration_item_id: item.id,
                        parameter_id: param.id,
                        value_numeric:
                            val.value_numeric !== '' && val.value_numeric !== null
                                ? Number(val.value_numeric)
                                : null,
                        value_text: val.value_text || null,
                        value_json: val.value_json || null,
                        unit_snapshot: val.unit_snapshot || null,
                        reference_snapshot: val.reference_snapshot || null,
                        flag_status: val.flag_status || 'normal',
                        auto_conclusion: val.auto_conclusion || null,
                        auto_suggestion: val.auto_suggestion || null,
                        is_manually_overridden: val.is_manually_overridden,
                    });
                }
            });
        });

        const firstItem = activeItems[0];
        const groupConclusion = firstItem ? conclusions[firstItem.id]?.conclusion : null;
        const groupSuggestion = firstItem ? conclusions[firstItem.id]?.suggestion : null;

        router.post(
            route('examinations.save', registration.id),
            {
                results: payloadResults,
                group_conclusion: groupConclusion,
                group_suggestion: groupSuggestion,
            },
            {
                preserveScroll: true,
                onFinish: () => setIsSaving(false),
            }
        );
    };

    // Diagnostic File Attachment Form
    const {
        data: attachData,
        setData: setAttachData,
        post: postAttachment,
        processing: attachProcessing,
        reset: resetAttachForm,
        errors: attachErrors,
    } = useForm({
        file: null as File | null,
        attachment_type: 'ekg_pdf',
        registration_item_id: '',
        merge_into_mcu_pdf: true,
    });

    const handleUploadAttachment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!attachData.file) return;

        postAttachment(route('examinations.attachments.upload', registration.id), {
            preserveScroll: true,
            onSuccess: () => {
                resetAttachForm('file');
            },
        });
    };

    const handleDeleteAttachment = (attachmentId: number) => {
        if (!confirm('Hapus berkas lampiran ini?')) return;
        router.delete(route('examinations.attachments.destroy', attachmentId), {
            preserveScroll: true,
        });
    };

    const activeItems = registration.items?.filter((it) => it.category === activeTab) || [];

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case 'lab':
                return <FlaskConical className="h-4 w-4" />;
            case 'radiology':
                return <ScanLine className="h-4 w-4" />;
            case 'electromedical':
                return <Activity className="h-4 w-4" />;
            case 'physical':
                return <HeartPulse className="h-4 w-4" />;
            default:
                return <FileText className="h-4 w-4" />;
        }
    };

    const getCategoryLabel = (cat: string) => {
        switch (cat) {
            case 'lab':
                return 'Laboratorium';
            case 'radiology':
                return 'Radiologi';
            case 'electromedical':
                return 'Elektromedis';
            case 'physical':
                return 'Pemeriksaan Fisik';
            default:
                return cat.toUpperCase();
        }
    };

    const getFlagBadge = (flag: FlagStatus) => {
        switch (flag) {
            case 'normal':
                return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">NORMAL</span>;
            case 'low':
                return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">RENDAH (L)</span>;
            case 'high':
                return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">TINGGI (H)</span>;
            case 'abnormal':
                return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">ABNORMAL (*)</span>;
            case 'critical':
                return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-300 animate-pulse">KRITIKAL (!!)</span>;
            default:
                return null;
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Input Hasil - ${registration.patient?.name || ''} (${registration.reg_no})`} />

            <div className="space-y-4">
                {/* Top Demographics Banner */}
                <div className="rounded border border-zinc-200 bg-white p-3.5 shadow-2xs">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
                        <div className="flex items-center gap-3">
                            <Link
                                href={route('examinations.index')}
                                className="inline-flex h-8 w-8 items-center justify-center rounded border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 transition-colors"
                                title="Kembali ke Antrean"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-base font-semibold text-zinc-900">
                                        {registration.patient?.name}
                                    </h1>
                                    <span
                                        className={`font-semibold px-1.5 py-0.5 rounded text-[11px] ${
                                            registration.patient?.gender === 'L'
                                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                                        }`}
                                    >
                                        {registration.patient?.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                                    </span>
                                    <span className="text-xs text-zinc-500 font-mono">
                                        ({patientAge} Tahun)
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 mt-0.5">
                                    <span>
                                        NRM: <strong className="font-mono text-zinc-700">{registration.patient?.medical_record_no}</strong>
                                    </span>
                                    <span>•</span>
                                    <span>
                                        No. Reg: <strong className="font-mono text-zinc-700">{registration.reg_no}</strong>
                                    </span>
                                    <span>•</span>
                                    <span>
                                        {registration.company?.name ? (
                                            <span className="text-zinc-700 font-medium">{registration.company.name}</span>
                                        ) : (
                                            <span className="text-zinc-500">Pasien Umum / APS</span>
                                        )}
                                    </span>
                                    {registration.department_snapshot && (
                                        <>
                                            <span>•</span>
                                            <span>Dept: {registration.department_snapshot}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Status Alur Badge & Quick Actions */}
                        <div className="flex items-center gap-2 self-start md:self-center">
                            <span className="text-xs text-zinc-500">Status Alur:</span>
                            <Badge variant={registration.workflow_status === 'result_entered' ? 'blue' : 'amber'}>
                                {registration.workflow_status === 'result_entered' ? (
                                    <>
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Hasil Diinput
                                    </>
                                ) : (
                                    <>
                                        <Clock className="h-3 w-3 mr-1" />
                                        {registration.workflow_status}
                                    </>
                                )}
                            </Badge>
                        </div>
                    </div>

                    {/* Category Tabs */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3">
                        <div className="flex items-center gap-1">
                            {categoriesAvailable.map((cat) => {
                                const isActive = activeTab === cat;
                                const itemCount = registration.items?.filter((it) => it.category === cat).length || 0;
                                return (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setActiveTab(cat)}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                                            isActive
                                                ? 'bg-zinc-900 text-white shadow-2xs'
                                                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                                        }`}
                                    >
                                        {getCategoryIcon(cat)}
                                        <span>{getCategoryLabel(cat)}</span>
                                        <span
                                            className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                                                isActive ? 'bg-zinc-700 text-white' : 'bg-zinc-200 text-zinc-700'
                                            }`}
                                        >
                                            {itemCount}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Category Fast Actions */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleFillCategoryNormal}
                                className="inline-flex items-center gap-1 rounded-sm border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs"
                                title="Isi semua parameter di kategori ini dengan nilai normal referensi"
                            >
                                <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Isi Normal (Semua)</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleSaveResults}
                                disabled={isSaving}
                                className="inline-flex items-center gap-1.5 rounded-sm bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 transition-colors shadow-2xs disabled:opacity-50"
                            >
                                <Save className="h-3.5 w-3.5" />
                                <span>{isSaving ? 'Menyimpan...' : 'Simpan Hasil'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Dynamic Parameters Section */}
                <form onSubmit={handleSaveResults} className="space-y-4">
                    {activeItems.length === 0 ? (
                        <div className="rounded border border-zinc-200 bg-white p-8 text-center">
                            <FileText className="mx-auto h-8 w-8 text-zinc-300" />
                            <p className="mt-2 text-xs text-zinc-500">
                                Tidak ada item pemeriksaan untuk kategori ini pada pendaftaran pasien ini.
                            </p>
                        </div>
                    ) : (
                        activeItems.map((item) => {
                            const params = item.service?.parameters || [];
                            const isAudiogramService = params.some((p) => p.input_type === 'audiogram_grid');

                            // Group parameters by group_name
                            const groupsMap: Record<string, ServiceParameter[]> = {};
                            params.forEach((p) => {
                                const gName = p.group_name || 'Parameter Utama';
                                if (!groupsMap[gName]) groupsMap[gName] = [];
                                groupsMap[gName].push(p);
                            });

                            return (
                                <div
                                    key={item.id}
                                    className="rounded border border-zinc-200/80 bg-white shadow-2xs overflow-hidden"
                                >
                                    {/* Service Title Bar */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 bg-zinc-50/80 px-4 py-2.5">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-xs text-zinc-900">
                                                {item.service_name_snapshot}
                                            </span>
                                            {item.service?.code && (
                                                <span className="font-mono text-[11px] text-zinc-400">
                                                    [{item.service.code}]
                                                </span>
                                            )}
                                            {item.service?.sample?.name && (
                                                <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700">
                                                    Sampel: {item.service.sample.name}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] text-zinc-500">Status Hasil:</span>
                                            <span
                                                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                                    item.result_status === 'entered' || item.result_status === 'verified'
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-zinc-100 text-zinc-600'
                                                }`}
                                            >
                                                {item.result_status === 'entered'
                                                    ? 'SUDAH DIINPUT'
                                                    : item.result_status === 'verified'
                                                    ? 'TERVERIFIKASI'
                                                    : 'BELUM INPUT'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Service Content */}
                                    <div className="p-4 space-y-4">
                                        {/* If service contains audiogram grid, render directly */}
                                        {isAudiogramService ? (
                                            params.map((param) => {
                                                const currentVal = paramValues[param.id];
                                                return (
                                                    <div key={param.id}>
                                                        <AudiogramGrid
                                                            value={currentVal?.value_json}
                                                            onChange={(data) => {
                                                                handleFieldChange(param, item.id, 'value_json', data);
                                                                // Also update group conclusion/suggestion if available
                                                                if (data.diagnosis) {
                                                                    setConclusions((prev) => ({
                                                                        ...prev,
                                                                        [item.id]: {
                                                                            conclusion: data.diagnosis || '',
                                                                            suggestion: data.recommendation || '',
                                                                        },
                                                                    }));
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            /* Standard / Lab / Physical Parameter Grid */
                                            Object.entries(groupsMap).map(([groupTitle, groupParams]) => (
                                                <div key={groupTitle} className="space-y-2">
                                                    {groupTitle !== 'Parameter Utama' && (
                                                        <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-100 pb-1">
                                                            {groupTitle}
                                                        </div>
                                                    )}

                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-xs text-left border-collapse">
                                                            <thead>
                                                                <tr className="border-b border-zinc-200 text-zinc-500 text-[11px]">
                                                                    <th className="py-1.5 px-3 font-medium w-1/4">
                                                                        Parameter
                                                                    </th>
                                                                    <th className="py-1.5 px-3 font-medium w-1/3">
                                                                        Hasil Pemeriksaan
                                                                    </th>
                                                                    <th className="py-1.5 px-3 font-medium w-1/5">
                                                                        Nilai Rujukan / Standar
                                                                    </th>
                                                                    <th className="py-1.5 px-3 font-medium w-1/6 text-center">
                                                                        Flag Status
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-zinc-100">
                                                                {groupParams.map((param) => {
                                                                    const val = paramValues[param.id] || {
                                                                        registration_item_id: item.id,
                                                                        parameter_id: param.id,
                                                                        value_numeric: '',
                                                                        value_text: '',
                                                                        value_json: null,
                                                                        unit_snapshot: param.unit || null,
                                                                        reference_snapshot: getReferenceText(
                                                                            param,
                                                                            getMatchingRange(param)
                                                                        ),
                                                                        flag_status: 'normal',
                                                                        auto_conclusion: null,
                                                                        auto_suggestion: null,
                                                                        is_manually_overridden: false,
                                                                    };

                                                                    const range = getMatchingRange(param);
                                                                    const refString = getReferenceText(param, range);

                                                                    return (
                                                                        <tr key={param.id} className="hover:bg-zinc-50/60">
                                                                            {/* Parameter Name & Fast Normal */}
                                                                            <td className="py-2 px-3 align-middle">
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <span className="font-medium text-zinc-900">
                                                                                        {param.label}
                                                                                    </span>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() =>
                                                                                            handleFillSingleNormal(param, item.id)
                                                                                        }
                                                                                        className="text-zinc-400 hover:text-emerald-600 transition-colors"
                                                                                        title="Isi nilai normal untuk parameter ini"
                                                                                    >
                                                                                        <CheckCheck className="h-3 w-3" />
                                                                                    </button>
                                                                                </div>
                                                                                {param.formula_expression && (
                                                                                    <span className="text-[10px] text-zinc-400 font-mono">
                                                                                        Rumus: {param.formula_expression}
                                                                                    </span>
                                                                                )}
                                                                            </td>

                                                                            {/* Input Control */}
                                                                            <td className="py-2 px-3 align-middle">
                                                                                {param.input_type === 'number' && (
                                                                                    <div className="flex items-center gap-1.5">
                                                                                        <input
                                                                                            type="number"
                                                                                            step="any"
                                                                                            value={val.value_numeric ?? ''}
                                                                                            onChange={(e) =>
                                                                                                handleFieldChange(
                                                                                                    param,
                                                                                                    item.id,
                                                                                                    'value_numeric',
                                                                                                    e.target.value
                                                                                                )
                                                                                            }
                                                                                            placeholder="0.0"
                                                                                            className="w-32 rounded border border-zinc-200 px-2.5 py-1 text-xs text-zinc-900 font-medium tabular-nums focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                                                                                        />
                                                                                        {param.unit && (
                                                                                            <span className="text-[11px] font-mono text-zinc-500">
                                                                                                {param.unit}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                )}

                                                                                {param.input_type === 'formula' && (
                                                                                    <div className="flex items-center gap-1.5">
                                                                                        <input
                                                                                            type="text"
                                                                                            readOnly
                                                                                            value={val.value_numeric ?? ''}
                                                                                            placeholder="Kalkulasi otomatis..."
                                                                                            className="w-32 rounded border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-xs text-zinc-900 font-bold tabular-nums"
                                                                                        />
                                                                                        {param.unit && (
                                                                                            <span className="text-[11px] font-mono text-zinc-500">
                                                                                                {param.unit}
                                                                                            </span>
                                                                                        )}
                                                                                        {val.auto_conclusion && (
                                                                                            <span className="text-[11px] text-zinc-600 italic">
                                                                                                ({val.auto_conclusion})
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                )}

                                                                                {param.input_type === 'text' && (
                                                                                    <input
                                                                                        type="text"
                                                                                        value={val.value_text ?? ''}
                                                                                        onChange={(e) =>
                                                                                            handleFieldChange(
                                                                                                param,
                                                                                                item.id,
                                                                                                'value_text',
                                                                                                e.target.value
                                                                                            )
                                                                                        }
                                                                                        placeholder={param.default_normal_text || 'Hasil pemeriksaan...'}
                                                                                        className="w-full max-w-sm rounded border border-zinc-200 px-2.5 py-1 text-xs text-zinc-900 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                                                                                    />
                                                                                )}

                                                                                {param.input_type === 'textarea' && (
                                                                                    <textarea
                                                                                        rows={2}
                                                                                        value={val.value_text ?? ''}
                                                                                        onChange={(e) =>
                                                                                            handleFieldChange(
                                                                                                param,
                                                                                                item.id,
                                                                                                'value_text',
                                                                                                e.target.value
                                                                                            )
                                                                                        }
                                                                                        placeholder={param.default_normal_text || 'Deskripsi / Kesan pemeriksaan...'}
                                                                                        className="w-full rounded border border-zinc-200 px-2.5 py-1 text-xs text-zinc-900 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                                                                                    />
                                                                                )}

                                                                                {param.input_type === 'select' && (
                                                                                    <select
                                                                                        value={val.value_text ?? ''}
                                                                                        onChange={(e) =>
                                                                                            handleFieldChange(
                                                                                                param,
                                                                                                item.id,
                                                                                                'value_text',
                                                                                                e.target.value
                                                                                            )
                                                                                        }
                                                                                        className="w-48 rounded border border-zinc-200 px-2.5 py-1 text-xs text-zinc-900 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                                                                                    >
                                                                                        <option value="">-- Pilih --</option>
                                                                                        {Array.isArray(param.options_json) ? (
                                                                                            param.options_json.map((opt: any, idx: number) => (
                                                                                                <option key={idx} value={typeof opt === 'string' ? opt : opt.value}>
                                                                                                    {typeof opt === 'string' ? opt : opt.label || opt.value}
                                                                                                </option>
                                                                                            ))
                                                                                        ) : (
                                                                                            <>
                                                                                                <option value="Negatif">Negatif</option>
                                                                                                <option value="Positif (+)">Positif (+)</option>
                                                                                                <option value="Positif (++)">Positif (++)</option>
                                                                                            </>
                                                                                        )}
                                                                                    </select>
                                                                                )}
                                                                            </td>

                                                                            {/* Reference Range */}
                                                                            <td className="py-2 px-3 align-middle text-zinc-600 font-mono text-[11px] tabular-nums">
                                                                                {refString}
                                                                            </td>

                                                                            {/* Flag Badge & Manual Override */}
                                                                            <td className="py-2 px-3 align-middle text-center">
                                                                                <div className="flex items-center justify-center gap-1.5">
                                                                                    {getFlagBadge(val.flag_status)}
                                                                                    <select
                                                                                        value={val.flag_status}
                                                                                        onChange={(e) =>
                                                                                            handleFieldChange(
                                                                                                param,
                                                                                                item.id,
                                                                                                'flag_status',
                                                                                                e.target.value as FlagStatus
                                                                                            )
                                                                                        }
                                                                                        className="text-[10px] rounded border border-zinc-200 bg-white px-1 py-0.5 text-zinc-600 focus:border-zinc-400"
                                                                                        title="Override manual status flag"
                                                                                    >
                                                                                        <option value="normal">Normal</option>
                                                                                        <option value="low">Low (L)</option>
                                                                                        <option value="high">High (H)</option>
                                                                                        <option value="abnormal">Abnormal (*)</option>
                                                                                        <option value="critical">Critical (!!)</option>
                                                                                    </select>
                                                                                </div>
                                                                                {val.auto_conclusion && (
                                                                                    <div className="mt-0.5 text-[10px] text-zinc-500 italic max-w-xs truncate mx-auto">
                                                                                        {val.auto_conclusion}
                                                                                    </div>
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            ))
                                        )}

                                        {/* Service Level Conclusion & Suggestion */}
                                        <div className="mt-4 pt-3 border-t border-zinc-100 grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[11px] font-medium text-zinc-700 mb-1">
                                                    Kesimpulan / Kesan ({item.service_name_snapshot}):
                                                </label>
                                                <textarea
                                                    rows={2}
                                                    value={conclusions[item.id]?.conclusion || ''}
                                                    onChange={(e) =>
                                                        setConclusions((prev) => ({
                                                            ...prev,
                                                            [item.id]: {
                                                                ...prev[item.id],
                                                                conclusion: e.target.value,
                                                            },
                                                        }))
                                                    }
                                                    placeholder="Kesan hasil pemeriksaan..."
                                                    className="w-full rounded border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-800 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-medium text-zinc-700 mb-1">
                                                    Saran Tindak Lanjut:
                                                </label>
                                                <textarea
                                                    rows={2}
                                                    value={conclusions[item.id]?.suggestion || ''}
                                                    onChange={(e) =>
                                                        setConclusions((prev) => ({
                                                            ...prev,
                                                            [item.id]: {
                                                                ...prev[item.id],
                                                                suggestion: e.target.value,
                                                            },
                                                        }))
                                                    }
                                                    placeholder="Saran medis tindak lanjut..."
                                                    className="w-full rounded border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-800 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {/* Bottom Save Button */}
                    {activeItems.length > 0 && (
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="inline-flex items-center gap-2 rounded-sm bg-zinc-900 px-5 py-2 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors shadow-xs disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
                                <span>{isSaving ? 'Menyimpan Hasil...' : 'Simpan Hasil Pemeriksaan'}</span>
                            </button>
                        </div>
                    )}
                </form>

                {/* Diagnostic Machine Attachments Section */}
                <div className="rounded border border-zinc-200/80 bg-white shadow-2xs p-4 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
                        <div className="flex items-center gap-2">
                            <Paperclip className="h-4 w-4 text-zinc-600" />
                            <h3 className="text-xs font-semibold text-zinc-900">
                                Berkas & Lampiran Hasil Alat Diagnostik (EKG, Spirometri, Rontgen, Audiometri)
                            </h3>
                        </div>
                        <span className="text-[11px] text-zinc-500">
                            Auto-merge ke Buku MCU PDF saat finalisasi
                        </span>
                    </div>

                    {/* Upload Form */}
                    <form onSubmit={handleUploadAttachment} className="flex flex-wrap items-center gap-3">
                        <div>
                            <select
                                value={attachData.attachment_type}
                                onChange={(e) => setAttachData('attachment_type', e.target.value as any)}
                                className="h-8 rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-800 focus:border-zinc-500"
                            >
                                <option value="ekg_pdf">EKG (PDF)</option>
                                <option value="spiro_pdf">Spirometri (PDF)</option>
                                <option value="radiology_img">Foto Radiologi (JPG/PNG/PDF)</option>
                                <option value="audiometry_pdf">Audiometri (PDF)</option>
                                <option value="other">Lampiran Lainnya</option>
                            </select>
                        </div>

                        <div className="flex-1 min-w-[200px]">
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => setAttachData('file', e.target.files ? e.target.files[0] : null)}
                                className="block w-full text-xs text-zinc-500 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-medium file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 cursor-pointer"
                            />
                            {attachErrors.file && (
                                <p className="text-[10px] text-red-600 mt-0.5">{attachErrors.file}</p>
                            )}
                        </div>

                        <div className="flex items-center gap-1.5">
                            <input
                                type="checkbox"
                                id="merge_check"
                                checked={attachData.merge_into_mcu_pdf}
                                onChange={(e) => setAttachData('merge_into_mcu_pdf', e.target.checked)}
                                className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 h-3.5 w-3.5"
                            />
                            <label htmlFor="merge_check" className="text-xs text-zinc-700 select-none">
                                Merge ke MCU Book
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={attachProcessing || !attachData.file}
                            className="inline-flex items-center gap-1.5 rounded-sm bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 transition-colors shadow-2xs disabled:opacity-50"
                        >
                            <Upload className="h-3.5 w-3.5" />
                            <span>{attachProcessing ? 'Mengunggah...' : 'Unggah Berkas'}</span>
                        </button>
                    </form>

                    {/* Attachment List */}
                    {registration.result_attachments && registration.result_attachments.length > 0 ? (
                        <div className="overflow-x-auto rounded border border-zinc-200">
                            <table className="w-full text-xs text-left border-collapse">
                                <thead>
                                    <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-[11px]">
                                        <th className="py-1.5 px-3 font-medium">Jenis Lampiran</th>
                                        <th className="py-1.5 px-3 font-medium">Nama File</th>
                                        <th className="py-1.5 px-3 font-medium">Ukuran</th>
                                        <th className="py-1.5 px-3 font-medium">Merge MCU</th>
                                        <th className="py-1.5 px-3 font-medium">Pengunggah</th>
                                        <th className="py-1.5 px-3 font-medium text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {registration.result_attachments.map((att) => (
                                        <tr key={att.id} className="hover:bg-zinc-50/70">
                                            <td className="py-1.5 px-3 font-medium text-zinc-800 uppercase text-[10px]">
                                                {att.attachment_type.replace('_', ' ')}
                                            </td>
                                            <td className="py-1.5 px-3 text-zinc-900">
                                                {att.original_filename}
                                            </td>
                                            <td className="py-1.5 px-3 text-zinc-500 font-mono tabular-nums">
                                                {Math.round(att.file_size / 1024)} KB
                                            </td>
                                            <td className="py-1.5 px-3">
                                                {att.merge_into_mcu_pdf ? (
                                                    <span className="text-[10px] text-emerald-700 font-semibold">Ya</span>
                                                ) : (
                                                    <span className="text-[10px] text-zinc-400">Tidak</span>
                                                )}
                                            </td>
                                            <td className="py-1.5 px-3 text-zinc-500">
                                                {att.uploader?.name || '-'}
                                            </td>
                                            <td className="py-1.5 px-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <a
                                                        href={`/storage/${att.file_path}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-zinc-600 hover:text-zinc-900 inline-flex items-center gap-0.5 text-[11px]"
                                                    >
                                                        <ExternalLink className="h-3 w-3" />
                                                        <span>Lihat</span>
                                                    </a>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteAttachment(att.id)}
                                                        className="text-red-500 hover:text-red-700"
                                                        title="Hapus Lampiran"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-4 text-xs text-zinc-400 italic">
                            Belum ada berkas lampiran yang diunggah untuk pendaftaran ini.
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
