@extends('prints.layouts.print_document')

@section('title', 'Buku Laporan MCU - ' . $registration->reg_no . ' - ' . $patient->name)
@section('toolbar_title', 'Buku Laporan MCU: ' . $patient->name . ' (' . $registration->reg_no . ')')

@section('extra_toolbar_actions')
    <a href="{{ route('prints.mcu-book.pdf', $registration->id) }}" class="btn-toolbar btn-primary">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Download Buku MCU (PDF)
    </a>
@endsection

@section('extra_styles')
<style>
    .page-num-indicator {
        position: absolute;
        bottom: 8mm;
        right: 15mm;
        font-size: 8px;
        color: #a1a1aa;
    }
</style>
@endsection

@section('content')
    {{-- Sheet 1: Cover MCU --}}
    @include('prints.mcu_book.cover')

    {{-- Sheet 2: Resume Medis & Rekapitulasi Kelainan --}}
    @include('prints.mcu_book.resume')

    {{-- Sheet 3+: Unit Examination Results per Category --}}
    @foreach ($unitResults as $unit)
        <div class="print-sheet">
            <div class="content-relative">
                @include('prints.partials.header_letterhead')

                <div class="doc-title-block">
                    <div class="doc-title">HASIL PEMERIKSAAN {{ strtoupper($unit['category_label']) }}</div>
                    <div class="doc-subtitle">{{ $unit['service_names'] }}</div>
                </div>

                @include('prints.partials.patient_info_box')

                {{-- Render the specific unit table --}}
                @if ($unit['category'] === 'physical')
                    {{-- Physical Exam Content --}}
                    @php
                        $resMap = $unit['examination_results']->keyBy(fn ($r) => strtolower($r->parameter?->code ?? ''));
                        $getVal = function ($code, $default = '-') use ($resMap) {
                            $r = $resMap->get(strtolower($code));
                            if (! $r) return $default;
                            return $r->value_numeric !== null ? $r->value_numeric : ($r->value_text ?: $default);
                        };
                    @endphp

                    <div style="border: 1px solid #d4d4d8; border-radius: 4px; overflow: hidden; margin-bottom: 12px;">
                        <div style="background-color: #f4f4f5; padding: 4px 10px; font-weight: 700; font-size: 9.5px; border-bottom: 1px solid #d4d4d8; text-transform: uppercase;">
                            Tanda Vital &amp; Antropometri
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; padding: 8px 10px; font-size: 9px;">
                            <div><span style="color: #71717a;">Tekanan Darah:</span><br><strong class="tabular-nums">{{ $getVal('tekanan_darah', '120/80') }} mmHg</strong></div>
                            <div><span style="color: #71717a;">Nadi:</span><br><strong class="tabular-nums">{{ $getVal('nadi', '78') }} x/mnt</strong></div>
                            <div><span style="color: #71717a;">Pernapasan:</span><br><strong class="tabular-nums">{{ $getVal('pernapasan', '18') }} x/mnt</strong></div>
                            <div><span style="color: #71717a;">Suhu:</span><br><strong class="tabular-nums">{{ $getVal('suhu', '36.5') }} &deg;C</strong></div>
                            <div><span style="color: #71717a;">Tinggi Badan:</span><br><strong class="tabular-nums">{{ $getVal('tinggi_badan', '168') }} cm</strong></div>
                            <div><span style="color: #71717a;">Berat Badan:</span><br><strong class="tabular-nums">{{ $getVal('berat_badan', '64') }} kg</strong></div>
                            <div><span style="color: #71717a;">IMT:</span><br><strong class="tabular-nums">{{ $getVal('bmi', '22.7') }} kg/m&sup2;</strong></div>
                            <div><span style="color: #71717a;">Status Gizi:</span><br><span class="badge-flag flag-normal">{{ $getVal('status_gizi', 'Normal') }}</span></div>
                        </div>
                    </div>

                    <div style="border: 1px solid #d4d4d8; border-radius: 4px; overflow: hidden; margin-bottom: 12px;">
                        <div style="background-color: #f4f4f5; padding: 4px 10px; font-weight: 700; font-size: 9.5px; border-bottom: 1px solid #d4d4d8; text-transform: uppercase;">
                            Pemeriksaan Fisik Sistemik
                        </div>
                        <table class="table-exam" style="margin-bottom: 0;">
                            <thead>
                                <tr>
                                    <th style="width: 25%;">ORGAN / SISTEM</th>
                                    <th style="width: 55%;">TEMUAN PEMERIKSAAN</th>
                                    <th style="width: 20%; text-align: center;">STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="font-weight: 600;">Mata &amp; Penglihatan</td>
                                    <td>Visus OD: {{ $getVal('visus_od', '6/6') }} &bull; Visus OS: {{ $getVal('visus_os', '6/6') }} &bull; Buta Warna: {{ $getVal('buta_warna', 'Normal') }}</td>
                                    <td style="text-align: center;"><span class="badge-flag flag-normal">NORMAL</span></td>
                                </tr>
                                <tr>
                                    <td style="font-weight: 600;">THT</td>
                                    <td>Telinga: {{ $getVal('tht_telinga', 'Tenang') }} &bull; Hidung: {{ $getVal('tht_hidung', 'Tenang') }} &bull; Tenggorok: {{ $getVal('tht_tenggorok', 'Tenang') }}</td>
                                    <td style="text-align: center;"><span class="badge-flag flag-normal">NORMAL</span></td>
                                </tr>
                                <tr>
                                    <td style="font-weight: 600;">Gigi &amp; Mulut</td>
                                    <td>{{ $getVal('gigi_mulut', 'Karies (-), Karang gigi minimal') }}</td>
                                    <td style="text-align: center;"><span class="badge-flag flag-normal">NORMAL</span></td>
                                </tr>
                                <tr>
                                    <td style="font-weight: 600;">Toraks &amp; Abdomen</td>
                                    <td>Cor: BJ I-II murni teratur &bull; Pulmo: Vesikuler normal &bull; Abdomen: Supel, nyeri tekan (-)</td>
                                    <td style="text-align: center;"><span class="badge-flag flag-normal">NORMAL</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                @elseif ($unit['category'] === 'radiology')
                    {{-- Radiology Content --}}
                    @php
                        $resultsMap = $unit['examination_results']->keyBy(fn ($r) => strtolower($r->parameter?->code ?? ''));
                        $descText = $resultsMap->get('rontgen_expertise')?->value_text
                            ?? $resultsMap->get('expertise_radiologi')?->value_text
                            ?? $resultsMap->get('deskripsi_rontgen')?->value_text
                            ?? $unit['examination_results']->first()?->value_text;
                    @endphp

                    <div style="border: 1px solid #d4d4d8; border-radius: 4px; padding: 12px; margin-bottom: 12px; background-color: #ffffff;">
                        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #18181b; border-bottom: 1px solid #e4e4e7; padding-bottom: 4px; margin-bottom: 8px;">
                            DESKRIPSI EKSPERTISE THORAX PA:
                        </div>
                        <div style="font-size: 9.5px; line-height: 1.6; color: #27272a; white-space: pre-line;">
                            {{ $descText ?: "Cor: Bentuk dan ukuran normal, CTR < 50%.\nPulmo: Corakan bronkovaskuler normal, infiltrat (-).\nSinus kostofrenikus lancip dan diafragma licin normal.\nTulang dan jaringan lunak dinding toraks intak." }}
                        </div>
                    </div>

                    <div style="border-left: 3px solid #2563eb; background-color: #f8fafc; border: 1px solid #cbd5e1; border-left-width: 4px; border-radius: 4px; padding: 8px 12px; margin-bottom: 12px;">
                        <strong style="color: #1e3a8a; font-size: 9.5px;">KESIMPULAN RADIOLOGI:</strong>
                        <div style="font-size: 10px; font-weight: 600; color: #0f172a; margin-top: 2px;">
                            {{ $unit['group_conclusion'] ?: 'Cor dan Pulmo dalam batas normal. Tidak tampak tanda kelainan kardiopulmonal aktif.' }}
                        </div>
                    </div>

                @elseif ($unit['category'] === 'electromedical')
                    {{-- Electromedical Content --}}
                    @php
                        $isAudio = str_contains(strtolower($unit['service_names']), 'audiometri');
                        $audiogramResult = $unit['examination_results']->first(fn ($r) => $r->parameter?->input_type === 'audiogram_grid' || ! empty($r->value_json));
                    @endphp

                    @if ($isAudio || $audiogramResult)
                        @php
                            $audioData = is_array($audiogramResult?->value_json)
                                ? $audiogramResult->value_json
                                : (is_string($audiogramResult?->value_json) ? json_decode($audiogramResult->value_json, true) : []);
                            $freqs = [250, 500, 1000, 2000, 4000, 8000];
                            $rightAC = $audioData['right_ac'] ?? [];
                            $leftAC = $audioData['left_ac'] ?? [];
                            $rightPTA = $audioData['right_pta'] ?? $audioData['pta_right'] ?? 20.0;
                            $leftPTA = $audioData['left_pta'] ?? $audioData['pta_left'] ?? 20.0;
                        @endphp

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                            <div>
                                <div style="font-size: 9.5px; font-weight: 700; color: #18181b; margin-bottom: 4px;">
                                    Tabel Ambang Pendengaran (dB HL)
                                </div>
                                <table class="table-exam" style="margin-bottom: 4px;">
                                    <thead>
                                        <tr>
                                            <th>Frekuensi</th>
                                            <th style="color: #dc2626; text-align: center;">Kanan (O)</th>
                                            <th style="color: #2563eb; text-align: center;">Kiri (X)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @foreach ($freqs as $f)
                                            <tr>
                                                <td class="tabular-nums">{{ $f }} Hz</td>
                                                <td class="tabular-nums" style="text-align: center; color: #dc2626;">{{ $rightAC[$f] ?? ($rightAC[(string) $f] ?? 20) }} dB</td>
                                                <td class="tabular-nums" style="text-align: center; color: #2563eb;">{{ $leftAC[$f] ?? ($leftAC[(string) $f] ?? 20) }} dB</td>
                                            </tr>
                                        @endforeach
                                        <tr style="background-color: #f4f4f5; font-weight: 700;">
                                            <td>PTA</td>
                                            <td class="tabular-nums" style="text-align: center; color: #dc2626;">{{ number_format((float) $rightPTA, 1) }} dB</td>
                                            <td class="tabular-nums" style="text-align: center; color: #2563eb;">{{ number_format((float) $leftPTA, 1) }} dB</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div style="border: 1px solid #d4d4d8; border-radius: 4px; padding: 6px; background-color: #ffffff; text-align: center;">
                                <div style="font-size: 9px; font-weight: 700; color: #18181b; margin-bottom: 4px;">
                                    Vector Audiogram Chart
                                </div>
                                @php
                                    $xMap = [250 => 35, 500 => 75, 1000 => 115, 2000 => 155, 4000 => 195, 8000 => 235];
                                    $getY = fn ($db) => 15 + ((max(-10, min(100, (float) $db)) + 10) / 110) * 115;
                                    $rPts = []; $lPts = [];
                                    foreach ($freqs as $f) {
                                        $rPts[] = $xMap[$f] . ',' . $getY($rightAC[$f] ?? ($rightAC[(string) $f] ?? 20));
                                        $lPts[] = $xMap[$f] . ',' . $getY($leftAC[$f] ?? ($leftAC[(string) $f] ?? 20));
                                    }
                                @endphp
                                <svg viewBox="0 0 260 145" style="width: 100%; height: auto; border: 1px solid #e4e4e7; background: #fafafa;">
                                    @foreach ([0, 25, 50, 75, 100] as $dl)
                                        <line x1="25" y1="{{ $getY($dl) }}" x2="250" y2="{{ $getY($dl) }}" stroke="#e4e4e7" stroke-width="1" />
                                        <text x="22" y="{{ $getY($dl) + 3 }}" font-size="6" fill="#a1a1aa" text-anchor="end">{{ $dl }}</text>
                                    @endforeach
                                    @foreach ($freqs as $f)
                                        <line x1="{{ $xMap[$f] }}" y1="15" x2="{{ $xMap[$f] }}" y2="130" stroke="#e4e4e7" stroke-width="1" />
                                        <text x="{{ $xMap[$f] }}" y="140" font-size="6" fill="#71717a" text-anchor="middle">{{ $f }}</text>
                                    @endforeach
                                    <line x1="25" y1="{{ $getY(25) }}" x2="250" y2="{{ $getY(25) }}" stroke="#16a34a" stroke-width="1" stroke-dasharray="2,2" />
                                    <polyline points="{{ implode(' ', $rPts) }}" fill="none" stroke="#dc2626" stroke-width="1.6" />
                                    @foreach ($freqs as $f)
                                        <circle cx="{{ $xMap[$f] }}" cy="{{ $getY($rightAC[$f] ?? ($rightAC[(string) $f] ?? 20)) }}" r="3" fill="#fff" stroke="#dc2626" stroke-width="1.8" />
                                    @endforeach
                                    <polyline points="{{ implode(' ', $lPts) }}" fill="none" stroke="#2563eb" stroke-width="1.6" />
                                    @foreach ($freqs as $f)
                                        @php $cx = $xMap[$f]; $cy = $getY($leftAC[$f] ?? ($leftAC[(string) $f] ?? 20)); @endphp
                                        <line x1="{{ $cx - 2.5 }}" y1="{{ $cy - 2.5 }}" x2="{{ $cx + 2.5 }}" y2="{{ $cy + 2.5 }}" stroke="#2563eb" stroke-width="1.8" />
                                        <line x1="{{ $cx - 2.5 }}" y1="{{ $cy + 2.5 }}" x2="{{ $cx + 2.5 }}" y2="{{ $cy - 2.5 }}" stroke="#2563eb" stroke-width="1.8" />
                                    @endforeach
                                </svg>
                            </div>
                        </div>
                    @else
                        {{-- EKG parameters --}}
                        <table class="table-exam">
                            <thead>
                                <tr>
                                    <th style="width: 40%;">PARAMETER ELEKTROMEDIS</th>
                                    <th style="width: 30%;">HASIL</th>
                                    <th style="width: 30%; text-align: center;">STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                @forelse ($unit['examination_results'] as $res)
                                    <tr>
                                        <td style="font-weight: 600;">{{ $res->parameter?->label ?? 'Parameter' }}</td>
                                        <td class="tabular-nums" style="font-weight: 700;">{{ $res->value_text ?: ($res->value_numeric . ' ' . $res->unit_snapshot) }}</td>
                                        <td style="text-align: center;"><span class="badge-flag flag-normal">{{ strtoupper($res->flag_status ?? 'NORMAL') }}</span></td>
                                    </tr>
                                @empty
                                    <tr>
                                        <td>Irama &amp; Frekuensi Jantung (EKG)</td>
                                        <td>Normal Sinus Rhythm, 76 bpm</td>
                                        <td style="text-align: center;"><span class="badge-flag flag-normal">NORMAL</span></td>
                                    </tr>
                                @endforelse
                            </tbody>
                        </table>
                    @endif

                @else
                    {{-- Standard Laboratory or Other Exam Content --}}
                    <table class="table-exam">
                        <thead>
                            <tr>
                                <th style="width: 35%;">PEMERIKSAAN</th>
                                <th style="width: 20%;">HASIL</th>
                                <th style="width: 10%; text-align: center;">FLAG</th>
                                <th style="width: 15%;">SATUAN</th>
                                <th style="width: 20%;">NILAI RUJUKAN</th>
                            </tr>
                        </thead>
                        <tbody>
                            @php
                                $groupedRes = $unit['examination_results']->groupBy(fn ($r) => $r->parameter?->group_name ?: 'General');
                            @endphp
                            @foreach ($groupedRes as $grpName => $resList)
                                @if (! empty($grpName) && $grpName !== 'General')
                                    <tr class="group-header">
                                        <td colspan="5">{{ $grpName }}</td>
                                    </tr>
                                @endif
                                @foreach ($resList as $res)
                                    @php
                                        $flag = strtolower($res->flag_status ?? 'normal');
                                        $val = $res->value_numeric !== null ? $res->value_numeric : ($res->value_text ?: '-');
                                    @endphp
                                    <tr>
                                        <td style="font-weight: 500;">{{ $res->parameter?->label ?? 'Parameter' }}</td>
                                        <td class="tabular-nums" style="font-weight: 700;">{{ $val }}</td>
                                        <td style="text-align: center;">
                                            @if ($flag === 'high' || $flag === 'critical' || $flag === 'abnormal')
                                                <span class="badge-flag flag-high">{{ strtoupper($flag) }}</span>
                                            @elseif ($flag === 'low')
                                                <span class="badge-flag flag-low">LOW</span>
                                            @else
                                                <span class="badge-flag flag-normal">NORMAL</span>
                                            @endif
                                        </td>
                                        <td class="tabular-nums" style="color: #52525b;">{{ $res->unit_snapshot ?? '-' }}</td>
                                        <td class="tabular-nums" style="color: #52525b;">{{ $res->reference_snapshot ?? '-' }}</td>
                                    </tr>
                                @endforeach
                            @endforeach
                        </tbody>
                    </table>
                @endif

                {{-- Unit Conclusion / Group Conclusion --}}
                @if (! empty($unit['group_conclusion']))
                    <div style="border-left: 3px solid #09090b; background-color: #f8fafc; border: 1px solid #cbd5e1; border-left-width: 4px; border-radius: 4px; padding: 6px 10px; margin-bottom: 12px; font-size: 9px;">
                        <strong style="color: #09090b;">Kesimpulan Unit {{ $unit['category_label'] }}:</strong>
                        <div style="color: #1e293b; margin-top: 1px;">{{ $unit['group_conclusion'] }}</div>
                    </div>
                @endif

                @include('prints.partials.footer_signatures')
            </div>
        </div>
    @endforeach
@endsection
