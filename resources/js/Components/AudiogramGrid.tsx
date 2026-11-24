import React, { useMemo } from 'react';
import { AudiogramData } from '@/types';
import { Volume2, RotateCcw, CheckCheck, Eye, Layers } from 'lucide-react';

interface AudiogramGridProps {
    value?: AudiogramData | null;
    onChange?: (data: AudiogramData) => void;
    readOnly?: boolean;
}

const FREQUENCIES = [250, 500, 1000, 2000, 3000, 4000, 6000, 8000];
const PTA_FREQUENCIES = [500, 1000, 2000, 4000];
const DB_LEVELS = [-10, 0, 10, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];

export const getHearingClassification = (pta: number | null | undefined): string => {
    if (pta === null || pta === undefined || isNaN(pta)) return '-';
    if (pta <= 25) return 'Normal (<= 25 dB)';
    if (pta <= 40) return 'Tuli Ringan (26 - 40 dB)';
    if (pta <= 55) return 'Tuli Sedang (41 - 55 dB)';
    if (pta <= 70) return 'Tuli Sedang-Berat (56 - 70 dB)';
    if (pta <= 90) return 'Tuli Berat (71 - 90 dB)';
    return 'Tuli Sangat Berat (> 90 dB)';
};

export const calculatePta = (acValues: Record<string, number | null>): number | null => {
    const validValues: number[] = [];
    for (const freq of PTA_FREQUENCIES) {
        const val = acValues[freq.toString()];
        if (val !== null && val !== undefined && !isNaN(Number(val))) {
            validValues.push(Number(val));
        }
    }
    if (validValues.length === 0) return null;
    const sum = validValues.reduce((acc, curr) => acc + curr, 0);
    return Math.round((sum / validValues.length) * 10) / 10;
};

export const generateDiagnosis = (rightPta: number | null, leftPta: number | null): string => {
    if (rightPta === null && leftPta === null) return '';
    const rightNormal = rightPta !== null && rightPta <= 25;
    const leftNormal = leftPta !== null && leftPta <= 25;

    if (rightNormal && leftNormal) {
        return 'Pendengaran kedua telinga dalam batas normal (Normal hearing bilateral).';
    }

    const parts: string[] = [];
    if (rightPta !== null) {
        parts.push(`Telinga kanan: ${getHearingClassification(rightPta)} (PTA: ${rightPta} dB)`);
    }
    if (leftPta !== null) {
        parts.push(`Telinga kiri: ${getHearingClassification(leftPta)} (PTA: ${leftPta} dB)`);
    }

    return parts.join('; ') + '.';
};

export const AudiogramGrid: React.FC<AudiogramGridProps> = ({
    value,
    onChange,
    readOnly = false,
}) => {
    const [viewMode, setViewMode] = React.useState<'both' | 'right' | 'left'>('both');

    const data: AudiogramData = useMemo(() => {
        return {
            frequencies: FREQUENCIES,
            right_ear: {
                ac: value?.right_ear?.ac || {},
                bc: value?.right_ear?.bc || {},
            },
            left_ear: {
                ac: value?.left_ear?.ac || {},
                bc: value?.left_ear?.bc || {},
            },
            right_pta: value?.right_pta ?? null,
            left_pta: value?.left_pta ?? null,
            right_classification: value?.right_classification ?? null,
            left_classification: value?.left_classification ?? null,
            diagnosis: value?.diagnosis ?? null,
            recommendation: value?.recommendation ?? null,
        };
    }, [value]);

    const handleValueChange = (
        ear: 'right_ear' | 'left_ear',
        conduction: 'ac' | 'bc',
        freq: number,
        newValStr: string
    ) => {
        if (!onChange || readOnly) return;

        const val = newValStr === '' ? null : Number(newValStr);
        const updatedEar = {
            ...data[ear],
            [conduction]: {
                ...data[ear][conduction],
                [freq.toString()]: val,
            },
        };

        const updatedRight = ear === 'right_ear' ? updatedEar : data.right_ear;
        const updatedLeft = ear === 'left_ear' ? updatedEar : data.left_ear;

        const rightPta = calculatePta(updatedRight?.ac || {});
        const leftPta = calculatePta(updatedLeft?.ac || {});
        const rightClass = getHearingClassification(rightPta);
        const leftClass = getHearingClassification(leftPta);
        const diagnosis = generateDiagnosis(rightPta, leftPta);

        onChange({
            frequencies: FREQUENCIES,
            right_ear: updatedRight,
            left_ear: updatedLeft,
            right_pta: rightPta,
            left_pta: leftPta,
            right_classification: rightClass,
            left_classification: leftClass,
            diagnosis,
            recommendation: data.recommendation,
        });
    };

    const handleFillNormal = () => {
        if (!onChange || readOnly) return;
        const rightAc: Record<string, number> = {};
        const rightBc: Record<string, number> = {};
        const leftAc: Record<string, number> = {};
        const leftBc: Record<string, number> = {};

        FREQUENCIES.forEach((freq) => {
            rightAc[freq] = 15;
            rightBc[freq] = 10;
            leftAc[freq] = 15;
            leftBc[freq] = 10;
        });

        const rightPta = 15;
        const leftPta = 15;

        onChange({
            frequencies: FREQUENCIES,
            right_ear: { ac: rightAc, bc: rightBc },
            left_ear: { ac: leftAc, bc: leftBc },
            right_pta: rightPta,
            left_pta: leftPta,
            right_classification: 'Normal (<= 25 dB)',
            left_classification: 'Normal (<= 25 dB)',
            diagnosis: 'Pendengaran kedua telinga dalam batas normal (Normal hearing bilateral).',
            recommendation: 'Jaga kebersihan telinga dan hindari paparan kebisingan berkepanjangan tanpa pelindung telinga (earmuff/earplug).',
        });
    };

    const handleReset = () => {
        if (!onChange || readOnly) return;
        onChange({
            frequencies: FREQUENCIES,
            right_ear: { ac: {}, bc: {} },
            left_ear: { ac: {}, bc: {} },
            right_pta: null,
            left_pta: null,
            right_classification: null,
            left_classification: null,
            diagnosis: null,
            recommendation: null,
        });
    };

    // SVG Layout calculation
    const svgWidth = 560;
    const svgHeight = 360;
    const margin = { top: 30, right: 30, bottom: 40, left: 50 };
    const chartWidth = svgWidth - margin.left - margin.right;
    const chartHeight = svgHeight - margin.top - margin.bottom;

    // Y scale: -10 dB to 120 dB (inverted, 130 dB range)
    const minY = -10;
    const maxY = 120;
    const getY = (db: number) => {
        const clamped = Math.max(minY, Math.min(maxY, db));
        return margin.top + ((clamped - minY) / (maxY - minY)) * chartHeight;
    };

    // X scale: 8 discrete frequencies
    const getX = (index: number) => {
        return margin.left + (index / (FREQUENCIES.length - 1)) * chartWidth;
    };

    // Prepare point paths for SVG
    const getPoints = (earData: Record<string, number | null> | undefined) => {
        if (!earData) return [];
        return FREQUENCIES.map((freq, idx) => {
            const val = earData[freq.toString()];
            if (val !== null && val !== undefined && !isNaN(Number(val))) {
                return { freq, val: Number(val), x: getX(idx), y: getY(Number(val)) };
            }
            return null;
        });
    };

    const rightAcPoints = getPoints(data.right_ear?.ac);
    const rightBcPoints = getPoints(data.right_ear?.bc);
    const leftAcPoints = getPoints(data.left_ear?.ac);
    const leftBcPoints = getPoints(data.left_ear?.bc);

    const makeLinePath = (points: Array<{ x: number; y: number } | null>) => {
        let path = '';
        let inSubpath = false;
        for (const pt of points) {
            if (pt) {
                if (!inSubpath) {
                    path += `M ${pt.x} ${pt.y} `;
                    inSubpath = true;
                } else {
                    path += `L ${pt.x} ${pt.y} `;
                }
            } else {
                inSubpath = false;
            }
        }
        return path;
    };

    return (
        <div className="space-y-4">
            {/* Header Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-3">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-zinc-100 text-zinc-700">
                        <Volume2 className="h-4 w-4" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-zinc-900">
                            Grid Pemeriksaan Audiometri (AC / BC)
                        </h4>
                        <p className="text-xs text-zinc-500">
                            Rentang frekuensi 250 Hz – 8000 Hz, standar kalkulasi PTA 4-Frekuensi (500, 1k, 2k, 4k Hz)
                        </p>
                    </div>
                </div>

                {!readOnly && (
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleFillNormal}
                            className="inline-flex items-center gap-1.5 rounded-sm border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
                        >
                            <CheckCheck className="h-3.5 w-3.5" />
                            Isi Normal (15 dB)
                        </button>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="inline-flex items-center gap-1 rounded-sm border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                        >
                            <RotateCcw className="h-3 w-3" />
                            Reset
                        </button>
                    </div>
                )}
            </div>

            {/* Grid Table & SVG Audiogram Chart Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Interactive Data Table (5 Cols) */}
                <div className="lg:col-span-6 space-y-3">
                    <div className="overflow-x-auto rounded border border-zinc-200 bg-white shadow-xs">
                        <table className="w-full text-xs text-left border-collapse">
                            <thead>
                                <tr className="border-b border-zinc-200 bg-zinc-50/80">
                                    <th className="py-2 px-2.5 font-semibold text-zinc-700 text-center" rowSpan={2}>
                                        Hz
                                    </th>
                                    <th
                                        colSpan={2}
                                        className="py-1 px-2 font-semibold text-red-700 text-center border-l border-r border-zinc-200 bg-red-50/40"
                                    >
                                        Telinga Kanan (AD)
                                    </th>
                                    <th
                                        colSpan={2}
                                        className="py-1 px-2 font-semibold text-blue-700 text-center bg-blue-50/40"
                                    >
                                        Telinga Kiri (AS)
                                    </th>
                                </tr>
                                <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px]">
                                    <th className="py-1 px-2 font-medium text-red-600 text-center border-l border-zinc-200">
                                        AC (O)
                                    </th>
                                    <th className="py-1 px-2 font-medium text-red-600 text-center border-r border-zinc-200">
                                        BC (&lt;)
                                    </th>
                                    <th className="py-1 px-2 font-medium text-blue-600 text-center">
                                        AC (X)
                                    </th>
                                    <th className="py-1 px-2 font-medium text-blue-600 text-center">
                                        BC (&gt;)
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 font-mono">
                                {FREQUENCIES.map((freq) => {
                                    const isPtaFreq = PTA_FREQUENCIES.includes(freq);
                                    return (
                                        <tr
                                            key={freq}
                                            className={`hover:bg-zinc-50/70 ${isPtaFreq ? 'bg-amber-50/20' : ''}`}
                                        >
                                            <td className="py-1.5 px-2.5 font-semibold text-zinc-800 text-center tabular-nums">
                                                {freq}
                                                {isPtaFreq && (
                                                    <span className="ml-1 text-[9px] font-sans text-amber-600 font-normal">
                                                        *
                                                    </span>
                                                )}
                                            </td>
                                            {/* Right Ear AC */}
                                            <td className="py-1 px-1.5 border-l border-zinc-200">
                                                <input
                                                    type="number"
                                                    min="-10"
                                                    max="120"
                                                    step="5"
                                                    disabled={readOnly}
                                                    value={data.right_ear?.ac[freq.toString()] ?? ''}
                                                    onChange={(e) =>
                                                        handleValueChange('right_ear', 'ac', freq, e.target.value)
                                                    }
                                                    placeholder="-"
                                                    className="w-full h-7 rounded border border-zinc-200 px-1 text-center text-xs text-red-700 font-medium tabular-nums focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:bg-zinc-100"
                                                />
                                            </td>
                                            {/* Right Ear BC */}
                                            <td className="py-1 px-1.5 border-r border-zinc-200">
                                                <input
                                                    type="number"
                                                    min="-10"
                                                    max="120"
                                                    step="5"
                                                    disabled={readOnly}
                                                    value={data.right_ear?.bc[freq.toString()] ?? ''}
                                                    onChange={(e) =>
                                                        handleValueChange('right_ear', 'bc', freq, e.target.value)
                                                    }
                                                    placeholder="-"
                                                    className="w-full h-7 rounded border border-zinc-200 px-1 text-center text-xs text-red-600 tabular-nums focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:bg-zinc-100"
                                                />
                                            </td>
                                            {/* Left Ear AC */}
                                            <td className="py-1 px-1.5">
                                                <input
                                                    type="number"
                                                    min="-10"
                                                    max="120"
                                                    step="5"
                                                    disabled={readOnly}
                                                    value={data.left_ear?.ac[freq.toString()] ?? ''}
                                                    onChange={(e) =>
                                                        handleValueChange('left_ear', 'ac', freq, e.target.value)
                                                    }
                                                    placeholder="-"
                                                    className="w-full h-7 rounded border border-zinc-200 px-1 text-center text-xs text-blue-700 font-medium tabular-nums focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-zinc-100"
                                                />
                                            </td>
                                            {/* Left Ear BC */}
                                            <td className="py-1 px-1.5">
                                                <input
                                                    type="number"
                                                    min="-10"
                                                    max="120"
                                                    step="5"
                                                    disabled={readOnly}
                                                    value={data.left_ear?.bc[freq.toString()] ?? ''}
                                                    onChange={(e) =>
                                                        handleValueChange('left_ear', 'bc', freq, e.target.value)
                                                    }
                                                    placeholder="-"
                                                    className="w-full h-7 rounded border border-zinc-200 px-1 text-center text-xs text-blue-600 tabular-nums focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-zinc-100"
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-[11px] text-zinc-500 italic">
                        * Frekuensi penentu Pure Tone Average (PTA): 500, 1000, 2000, 4000 Hz.
                    </p>

                    {/* PTA Summary Box */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                        {/* Right PTA */}
                        <div className="rounded border border-red-200 bg-red-50/50 p-2.5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-red-900">PTA Kanan (AD):</span>
                                <span className="font-mono font-bold text-sm text-red-700 tabular-nums">
                                    {data.right_pta !== null && data.right_pta !== undefined
                                        ? `${data.right_pta} dB`
                                        : '-'}
                                </span>
                            </div>
                            <div className="mt-1 text-[11px] font-medium text-red-800 truncate">
                                {data.right_classification || '-'}
                            </div>
                        </div>

                        {/* Left PTA */}
                        <div className="rounded border border-blue-200 bg-blue-50/50 p-2.5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-blue-900">PTA Kiri (AS):</span>
                                <span className="font-mono font-bold text-sm text-blue-700 tabular-nums">
                                    {data.left_pta !== null && data.left_pta !== undefined
                                        ? `${data.left_pta} dB`
                                        : '-'}
                                </span>
                            </div>
                            <div className="mt-1 text-[11px] font-medium text-blue-800 truncate">
                                {data.left_classification || '-'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* SVG Vector Audiogram Graphic (6 Cols) */}
                <div className="lg:col-span-6 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                            <Layers className="h-3.5 w-3.5 text-zinc-500" />
                            <span className="font-medium">Grafik Audiogram Vektor</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px]">
                            <button
                                type="button"
                                onClick={() => setViewMode('both')}
                                className={`px-2 py-0.5 rounded-sm transition-colors ${
                                    viewMode === 'both'
                                        ? 'bg-zinc-800 text-white font-medium'
                                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                                }`}
                            >
                                Keduanya
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('right')}
                                className={`px-2 py-0.5 rounded-sm transition-colors ${
                                    viewMode === 'right'
                                        ? 'bg-red-600 text-white font-medium'
                                        : 'bg-zinc-100 text-red-700 hover:bg-zinc-200'
                                }`}
                            >
                                Kanan (AD)
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('left')}
                                className={`px-2 py-0.5 rounded-sm transition-colors ${
                                    viewMode === 'left'
                                        ? 'bg-blue-600 text-white font-medium'
                                        : 'bg-zinc-100 text-blue-700 hover:bg-zinc-200'
                                }`}
                            >
                                Kiri (AS)
                            </button>
                        </div>
                    </div>

                    <div className="rounded border border-zinc-200 bg-white p-2 shadow-xs">
                        <svg
                            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                            className="w-full h-auto max-h-[360px] select-none"
                        >
                            {/* Normal Hearing Boundary Shading (<= 25 dB) */}
                            <rect
                                x={margin.left}
                                y={margin.top}
                                width={chartWidth}
                                height={getY(25) - margin.top}
                                fill="#ECFDF5"
                                opacity="0.65"
                            />
                            <text
                                x={margin.left + chartWidth - 6}
                                y={margin.top + 12}
                                textAnchor="end"
                                fontSize="9"
                                fill="#059669"
                                fontWeight="500"
                            >
                                Batas Normal (≤ 25 dB)
                            </text>

                            {/* Horizontal Grid lines (dB) */}
                            {DB_LEVELS.map((db) => {
                                const y = getY(db);
                                const isZero = db === 0;
                                const isThreshold = db === 25;
                                return (
                                    <g key={`h-${db}`}>
                                        <line
                                            x1={margin.left}
                                            y1={y}
                                            x2={margin.left + chartWidth}
                                            y2={y}
                                            stroke={isThreshold ? '#10B981' : isZero ? '#9CA3AF' : '#E5E7EB'}
                                            strokeWidth={isThreshold || isZero ? '1.2' : '0.75'}
                                            strokeDasharray={isThreshold ? '3 2' : undefined}
                                        />
                                        <text
                                            x={margin.left - 8}
                                            y={y + 3.5}
                                            textAnchor="end"
                                            fontSize="9"
                                            fill={isThreshold ? '#059669' : '#6B7280'}
                                            fontFamily="monospace"
                                        >
                                            {db}
                                        </text>
                                    </g>
                                );
                            })}

                            {/* Vertical Grid lines (Frequencies) */}
                            {FREQUENCIES.map((freq, idx) => {
                                const x = getX(idx);
                                return (
                                    <g key={`v-${freq}`}>
                                        <line
                                            x1={x}
                                            y1={margin.top}
                                            x2={x}
                                            y2={margin.top + chartHeight}
                                            stroke="#E5E7EB"
                                            strokeWidth="0.75"
                                        />
                                        <text
                                            x={x}
                                            y={margin.top - 8}
                                            textAnchor="middle"
                                            fontSize="9.5"
                                            fontWeight="600"
                                            fill="#374151"
                                            fontFamily="monospace"
                                        >
                                            {freq}
                                        </text>
                                    </g>
                                );
                            })}

                            {/* X-axis and Y-axis units */}
                            <text
                                x={margin.left - 8}
                                y={margin.top - 12}
                                textAnchor="end"
                                fontSize="9"
                                fill="#9CA3AF"
                                fontWeight="bold"
                            >
                                dB HL
                            </text>
                            <text
                                x={margin.left + chartWidth / 2}
                                y={svgHeight - 10}
                                textAnchor="middle"
                                fontSize="10"
                                fill="#6B7280"
                                fontWeight="500"
                            >
                                Frekuensi (Hz)
                            </text>

                            {/* Right Ear Paths & Symbols (RED) */}
                            {(viewMode === 'both' || viewMode === 'right') && (
                                <g id="right-ear-group">
                                    {/* BC Dashed Line & Brackets */}
                                    <path
                                        d={makeLinePath(rightBcPoints)}
                                        fill="none"
                                        stroke="#DC2626"
                                        strokeWidth="1.5"
                                        strokeDasharray="4 3"
                                        opacity="0.85"
                                    />
                                    {rightBcPoints.map((pt, idx) => {
                                        if (!pt) return null;
                                        return (
                                            <text
                                                key={`rbc-${idx}`}
                                                x={pt.x - 3}
                                                y={pt.y + 4}
                                                fontSize="12"
                                                fontWeight="bold"
                                                fill="#DC2626"
                                                textAnchor="middle"
                                            >
                                                [
                                            </text>
                                        );
                                    })}

                                    {/* AC Solid Line & Circles (O) */}
                                    <path
                                        d={makeLinePath(rightAcPoints)}
                                        fill="none"
                                        stroke="#DC2626"
                                        strokeWidth="2"
                                    />
                                    {rightAcPoints.map((pt, idx) => {
                                        if (!pt) return null;
                                        return (
                                            <g key={`rac-${idx}`}>
                                                <circle
                                                    cx={pt.x}
                                                    cy={pt.y}
                                                    r="4.5"
                                                    fill="#FFFFFF"
                                                    stroke="#DC2626"
                                                    strokeWidth="2"
                                                />
                                            </g>
                                        );
                                    })}
                                </g>
                            )}

                            {/* Left Ear Paths & Symbols (BLUE) */}
                            {(viewMode === 'both' || viewMode === 'left') && (
                                <g id="left-ear-group">
                                    {/* BC Dashed Line & Brackets */}
                                    <path
                                        d={makeLinePath(leftBcPoints)}
                                        fill="none"
                                        stroke="#2563EB"
                                        strokeWidth="1.5"
                                        strokeDasharray="4 3"
                                        opacity="0.85"
                                    />
                                    {leftBcPoints.map((pt, idx) => {
                                        if (!pt) return null;
                                        return (
                                            <text
                                                key={`lbc-${idx}`}
                                                x={pt.x + 3}
                                                y={pt.y + 4}
                                                fontSize="12"
                                                fontWeight="bold"
                                                fill="#2563EB"
                                                textAnchor="middle"
                                            >
                                                ]
                                            </text>
                                        );
                                    })}

                                    {/* AC Solid Line & Crosses (X) */}
                                    <path
                                        d={makeLinePath(leftAcPoints)}
                                        fill="none"
                                        stroke="#2563EB"
                                        strokeWidth="2"
                                    />
                                    {leftAcPoints.map((pt, idx) => {
                                        if (!pt) return null;
                                        return (
                                            <g key={`lac-${idx}`}>
                                                <line
                                                    x1={pt.x - 4}
                                                    y1={pt.y - 4}
                                                    x2={pt.x + 4}
                                                    y2={pt.y + 4}
                                                    stroke="#2563EB"
                                                    strokeWidth="2"
                                                />
                                                <line
                                                    x1={pt.x - 4}
                                                    y1={pt.y + 4}
                                                    x2={pt.x + 4}
                                                    y2={pt.y - 4}
                                                    stroke="#2563EB"
                                                    strokeWidth="2"
                                                />
                                            </g>
                                        );
                                    })}
                                </g>
                            )}
                        </svg>

                        {/* Chart Legend */}
                        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-zinc-100 pt-2 text-[11px] text-zinc-600">
                            <div className="flex items-center gap-1.5">
                                <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-red-600 bg-white" />
                                <span className="font-medium text-red-700">Kanan AC (O)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="font-bold text-red-600">[</span>
                                <span className="text-red-700">Kanan BC ([)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="font-bold text-blue-600">✕</span>
                                <span className="font-medium text-blue-700">Kiri AC (X)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="font-bold text-blue-600">]</span>
                                <span className="text-blue-700">Kiri BC (])</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Diagnosis & Kesimpulan Otomatis */}
            <div className="rounded border border-zinc-200 bg-zinc-50/70 p-3 space-y-2">
                <div className="text-xs font-semibold text-zinc-800">
                    Kesimpulan & Saran Otomatis Audiometri:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                        <label className="block text-[11px] font-medium text-zinc-600 mb-0.5">
                            Kesimpulan / Diagnosis:
                        </label>
                        <input
                            type="text"
                            disabled={readOnly}
                            value={data.diagnosis || ''}
                            onChange={(e) => {
                                if (!onChange || readOnly) return;
                                onChange({ ...data, diagnosis: e.target.value });
                            }}
                            placeholder="Kesimpulan hasil audiometri..."
                            className="w-full rounded border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-800 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 disabled:bg-zinc-100"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-medium text-zinc-600 mb-0.5">
                            Saran Medis:
                        </label>
                        <input
                            type="text"
                            disabled={readOnly}
                            value={data.recommendation || ''}
                            onChange={(e) => {
                                if (!onChange || readOnly) return;
                                onChange({ ...data, recommendation: e.target.value });
                            }}
                            placeholder="Saran medis..."
                            className="w-full rounded border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-800 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 disabled:bg-zinc-100"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
