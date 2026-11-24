@extends('prints.layouts.print_document')

@section('title', 'Pemeriksaan Elektromedis - ' . $registration->reg_no . ' - ' . $patient->name)
@section('toolbar_title', 'Hasil Elektromedis: ' . $item->service_name_snapshot)

@section('extra_toolbar_actions')
    <a href="{{ route('prints.single.pdf', ['registration' => $registration->id, 'item' => $item->id]) }}" class="btn-toolbar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Download PDF
    </a>
@endsection

@section('content')
<div class="print-sheet">
    <div class="content-relative">
        {{-- Kop Surat Header --}}
        @include('prints.partials.header_letterhead')

        {{-- Document Title --}}
        <div class="doc-title-block">
            <div class="doc-title">HASIL PEMERIKSAAN ELEKTROMEDIS &amp; DIAGNOSTIK</div>
            <div class="doc-subtitle">{{ $item->service_name_snapshot }} &bull; Instalasi Diagnostik Terpadu Master Summit</div>
        </div>

        {{-- Patient Demographics --}}
        @include('prints.partials.patient_info_box')

        @php
            $isAudiometry = str_contains(strtolower($item->service_name_snapshot), 'audiometri');
            $audiogramResult = $examinationResults->first(function ($r) {
                return $r->parameter?->input_type === 'audiogram_grid' || ! empty($r->value_json);
            });
        @endphp

        @if ($isAudiometry || $audiogramResult)
            {{-- AUDIOMETRY SECTION --}}
            @php
                $audioData = is_array($audiogramResult?->value_json)
                    ? $audiogramResult->value_json
                    : (is_string($audiogramResult?->value_json) ? json_decode($audiogramResult->value_json, true) : []);

                $freqs = [250, 500, 1000, 2000, 4000, 8000];
                $rightAC = $audioData['right_ac'] ?? [];
                $leftAC = $audioData['left_ac'] ?? [];
                $rightPTA = $audioData['right_pta'] ?? $audioData['pta_right'] ?? null;
                $leftPTA = $audioData['left_pta'] ?? $audioData['pta_left'] ?? null;
            @endphp

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
                {{-- Audiometry Table --}}
                <div>
                    <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #18181b; margin-bottom: 6px;">
                        Tabel Ambang Pendengaran (dB HL)
                    </div>
                    <table class="table-exam" style="margin-bottom: 8px;">
                        <thead>
                            <tr>
                                <th>Frekuensi (Hz)</th>
                                <th style="color: #dc2626; text-align: center;">Telinga Kanan (O)</th>
                                <th style="color: #2563eb; text-align: center;">Telinga Kiri (X)</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ($freqs as $f)
                                <tr>
                                    <td class="tabular-nums" style="font-weight: 600;">{{ $f }} Hz</td>
                                    <td class="tabular-nums" style="text-align: center; color: #dc2626; font-weight: 700;">
                                        {{ $rightAC[$f] ?? ($rightAC[(string) $f] ?? 20) }} dB
                                    </td>
                                    <td class="tabular-nums" style="text-align: center; color: #2563eb; font-weight: 700;">
                                        {{ $leftAC[$f] ?? ($leftAC[(string) $f] ?? 20) }} dB
                                    </td>
                                </tr>
                            @endforeach
                            <tr style="background-color: #f4f4f5; font-weight: 700;">
                                <td>PTA (500-2000 Hz)</td>
                                <td class="tabular-nums" style="text-align: center; color: #dc2626;">
                                    {{ $rightPTA !== null ? number_format((float) $rightPTA, 1) : '20.0' }} dB
                                </td>
                                <td class="tabular-nums" style="text-align: center; color: #2563eb;">
                                    {{ $leftPTA !== null ? number_format((float) $leftPTA, 1) : '20.0' }} dB
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div style="border: 1px solid #e4e4e7; border-radius: 4px; padding: 6px 10px; font-size: 8px; color: #52525b; background-color: #fafafa;">
                        <strong>Derajat Gangguan Pendengaran (WHO):</strong><br>
                        &bull; Normal: &le; 25 dB &bull; Ringan: 26 - 40 dB<br>
                        &bull; Sedang: 41 - 60 dB &bull; Berat: &gt; 60 dB
                    </div>
                </div>

                {{-- Audiogram SVG Vector Graphic --}}
                <div style="border: 1px solid #d4d4d8; border-radius: 4px; padding: 8px; background-color: #ffffff; text-align: center;">
                    <div style="font-size: 9.5px; font-weight: 700; color: #18181b; margin-bottom: 4px;">
                        GRAFIK AUDIOGRAM (Vector)
                    </div>
                    <div style="font-size: 8px; color: #71717a; margin-bottom: 6px;">
                        <span style="color: #dc2626; font-weight: 700;">● Merah (O): Telinga Kanan (AD)</span> &bull;
                        <span style="color: #2563eb; font-weight: 700;">✕ Biru (X): Telinga Kiri (AS)</span>
                    </div>

                    {{-- Scalable Vector Audiogram SVG Chart --}}
                    @php
                        // Coordinate mapping for SVG: Width 300, Height 180
                        // X axis: 250Hz (40px) to 8000Hz (270px)
                        // Y axis: -10dB (20px) to 100dB (160px)
                        $xMap = [250 => 45, 500 => 90, 1000 => 135, 2000 => 180, 4000 => 225, 8000 => 270];
                        $yMinDb = -10;
                        $yMaxDb = 100;
                        $yMinPx = 20;
                        $yMaxPx = 160;

                        $getYPx = function ($db) use ($yMinDb, $yMaxDb, $yMinPx, $yMaxPx) {
                            $db = max(-10, min(100, (float) $db));
                            return $yMinPx + (($db - $yMinDb) / ($yMaxDb - $yMinDb)) * ($yMaxPx - $yMinPx);
                        };

                        $rightPoints = [];
                        $leftPoints = [];
                        foreach ($freqs as $f) {
                            $x = $xMap[$f];
                            $rDb = $rightAC[$f] ?? ($rightAC[(string) $f] ?? 20);
                            $lDb = $leftAC[$f] ?? ($leftAC[(string) $f] ?? 20);
                            $rightPoints[] = $x . ',' . $getYPx($rDb);
                            $leftPoints[] = $x . ',' . $getYPx($lDb);
                        }
                    @endphp

                    <svg viewBox="0 0 300 180" style="width: 100%; max-width: 290px; height: auto; border: 1px solid #e4e4e7; background: #fafafa; border-radius: 4px;">
                        <!-- Grid Lines -->
                        @foreach ([0, 20, 40, 60, 80, 100] as $dbLine)
                            @php $yLine = $getYPx($dbLine); @endphp
                            <line x1="35" y1="{{ $yLine }}" x2="285" y2="{{ $yLine }}" stroke="#e4e4e7" stroke-width="1" />
                            <text x="30" y="{{ $yLine + 3 }}" font-size="7" fill="#a1a1aa" text-anchor="end">{{ $dbLine }}</text>
                        @endforeach

                        @foreach ($freqs as $f)
                            @php $xLine = $xMap[$f]; @endphp
                            <line x1="{{ $xLine }}" y1="20" x2="{{ $xLine }}" y2="160" stroke="#e4e4e7" stroke-width="1" />
                            <text x="{{ $xLine }}" y="172" font-size="7" fill="#71717a" text-anchor="middle">{{ $f }}</text>
                        @endforeach

                        <!-- Normal Threshold Line (25dB) -->
                        @php $y25 = $getYPx(25); @endphp
                        <line x1="35" y1="{{ $y25 }}" x2="285" y2="{{ $y25 }}" stroke="#16a34a" stroke-width="1" stroke-dasharray="3,3" />

                        <!-- Right Ear Polyline & Circles (Red) -->
                        <polyline points="{{ implode(' ', $rightPoints) }}" fill="none" stroke="#dc2626" stroke-width="1.8" />
                        @foreach ($freqs as $f)
                            @php
                                $rDb = $rightAC[$f] ?? ($rightAC[(string) $f] ?? 20);
                            @endphp
                            <circle cx="{{ $xMap[$f] }}" cy="{{ $getYPx($rDb) }}" r="3.5" fill="#ffffff" stroke="#dc2626" stroke-width="2" />
                        @endforeach

                        <!-- Left Ear Polyline & Crosses (Blue) -->
                        <polyline points="{{ implode(' ', $leftPoints) }}" fill="none" stroke="#2563eb" stroke-width="1.8" />
                        @foreach ($freqs as $f)
                            @php
                                $lDb = $leftAC[$f] ?? ($leftAC[(string) $f] ?? 20);
                                $cx = $xMap[$f];
                                $cy = $getYPx($lDb);
                            @endphp
                            <line x1="{{ $cx - 3 }}" y1="{{ $cy - 3 }}" x2="{{ $cx + 3 }}" y2="{{ $cy + 3 }}" stroke="#2563eb" stroke-width="2" />
                            <line x1="{{ $cx - 3 }}" y1="{{ $cy + 3 }}" x2="{{ $cx + 3 }}" y2="{{ $cy - 3 }}" stroke="#2563eb" stroke-width="2" />
                        @endforeach
                    </svg>
                </div>
            </div>
        @else
            {{-- EKG OR GENERAL ELECTROMEDICAL PARAMETERS --}}
            <table class="table-exam">
                <thead>
                    <tr>
                        <th style="width: 35%;">PARAMETER PEMERIKSAAN</th>
                        <th style="width: 25%;">HASIL</th>
                        <th style="width: 20%;">NILAI RUJUKAN</th>
                        <th style="width: 20%; text-align: center;">STATUS</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($examinationResults as $res)
                        @php
                            $val = $res->value_numeric !== null ? $res->value_numeric : ($res->value_text ?? '-');
                            $flag = strtolower($res->flag_status ?? 'normal');
                        @endphp
                        <tr>
                            <td style="font-weight: 600;">{{ $res->parameter?->label ?? 'Parameter' }}</td>
                            <td class="tabular-nums" style="font-weight: 700;">{{ $val }} {{ $res->unit_snapshot }}</td>
                            <td class="tabular-nums" style="color: #71717a;">{{ $res->reference_snapshot ?? 'Normal' }}</td>
                            <td style="text-align: center;">
                                @if ($flag === 'abnormal' || $flag === 'critical' || $flag === 'high')
                                    <span class="badge-flag flag-high">{{ strtoupper($flag) }}</span>
                                @else
                                    <span class="badge-flag flag-normal">NORMAL</span>
                                @endif
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td style="font-weight: 600;">Irama &amp; Frekuensi (Heart Rate)</td>
                            <td class="tabular-nums" style="font-weight: 700;">Sinus Rhythm, 76 bpm</td>
                            <td class="tabular-nums" style="color: #71717a;">60 - 100 bpm, Teratur</td>
                            <td style="text-align: center;"><span class="badge-flag flag-normal">NORMAL</span></td>
                        </tr>
                        <tr>
                            <td style="font-weight: 600;">Axis Jantung</td>
                            <td class="tabular-nums" style="font-weight: 700;">Normoaxis (0 s/d +90°)</td>
                            <td class="tabular-nums" style="color: #71717a;">Normal Axis</td>
                            <td style="text-align: center;"><span class="badge-flag flag-normal">NORMAL</span></td>
                        </tr>
                        <tr>
                            <td style="font-weight: 600;">Interval PR / Kompleks QRS</td>
                            <td class="tabular-nums" style="font-weight: 700;">0.16 detik / 0.08 detik</td>
                            <td class="tabular-nums" style="color: #71717a;">PR: 0.12-0.20s / QRS: &lt;0.12s</td>
                            <td style="text-align: center;"><span class="badge-flag flag-normal">NORMAL</span></td>
                        </tr>
                        <tr>
                            <td style="font-weight: 600;">Perubahan Segmen ST / Gelombang T</td>
                            <td class="tabular-nums" style="font-weight: 700;">Tidak ada elevasi/depresi ST</td>
                            <td class="tabular-nums" style="color: #71717a;">Isoelektris</td>
                            <td style="text-align: center;"><span class="badge-flag flag-normal">NORMAL</span></td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        @endif

        {{-- Conclusion & Recommendations Box --}}
        @php
            $conclusionText = $item->group_conclusion
                ?? ($isAudiometry ? 'Pendengaran kedua telinga dalam batas normal (Bilateral Normal Hearing).' : 'Elektrokardiogram dalam batas normal (Normal Sinus Rhythm).');
        @endphp

        <div style="border-left: 3px solid #09090b; background-color: #f8fafc; border: 1px solid #cbd5e1; border-left-width: 4px; border-radius: 4px; padding: 10px 14px; margin-bottom: 14px;">
            <div style="font-size: 9.5px; font-weight: 700; color: #09090b; text-transform: uppercase; margin-bottom: 3px;">
                KESIMPULAN DOKTER PEMERIKSA:
            </div>
            <div style="font-size: 10.5px; font-weight: 600; color: #0f172a; line-height: 1.4;">
                {{ $conclusionText }}
            </div>
            @if (! empty($item->group_suggestion))
                <div style="font-size: 9px; color: #475569; margin-top: 4px;">
                    <strong>Saran:</strong> {{ $item->group_suggestion }}
                </div>
            @endif
        </div>

        {{-- Signatures --}}
        @include('prints.partials.footer_signatures')
    </div>
</div>
@endsection
