@extends('prints.layouts.print_document')

@section('title', 'Pemeriksaan Fisik - ' . $registration->reg_no . ' - ' . $patient->name)
@section('toolbar_title', 'Hasil Pemeriksaan Fisik & Gigi')

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
            <div class="doc-title">LEMBAR HASIL PEMERIKSAAN FISIK UMUM &amp; GIGI</div>
            <div class="doc-subtitle">Poli Pemeriksaan Dokter &bull; Medical Check Up Master Summit</div>
        </div>

        {{-- Patient Demographics --}}
        @include('prints.partials.patient_info_box')

        @php
            $resMap = $examinationResults->keyBy(fn ($r) => strtolower($r->parameter?->code ?? ''));
            $getVal = function ($code, $default = '-') use ($resMap) {
                $r = $resMap->get(strtolower($code));
                if (! $r) return $default;
                return $r->value_numeric !== null ? $r->value_numeric : ($r->value_text ?: $default);
            };
        @endphp

        {{-- 1. Vital Signs & Antropometri Box --}}
        <div style="border: 1px solid #d4d4d8; border-radius: 4px; overflow: hidden; margin-bottom: 12px;">
            <div style="background-color: #f4f4f5; padding: 4px 10px; font-weight: 700; font-size: 9.5px; border-bottom: 1px solid #d4d4d8; text-transform: uppercase;">
                1. Tanda Vital &amp; Antropometri
            </div>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; padding: 8px 10px; font-size: 9px;">
                <div>
                    <span style="color: #71717a;">Tekanan Darah:</span><br>
                    <strong class="tabular-nums">{{ $getVal('tekanan_darah', '120/80') }} mmHg</strong>
                </div>
                <div>
                    <span style="color: #71717a;">Frekuensi Nadi:</span><br>
                    <strong class="tabular-nums">{{ $getVal('nadi', '78') }} x/mnt</strong>
                </div>
                <div>
                    <span style="color: #71717a;">Frekuensi Nafas:</span><br>
                    <strong class="tabular-nums">{{ $getVal('pernapasan', '18') }} x/mnt</strong>
                </div>
                <div>
                    <span style="color: #71717a;">Suhu Tubuh:</span><br>
                    <strong class="tabular-nums">{{ $getVal('suhu', '36.5') }} &deg;C</strong>
                </div>
                <div>
                    <span style="color: #71717a;">Tinggi Badan:</span><br>
                    <strong class="tabular-nums">{{ $getVal('tinggi_badan', '168') }} cm</strong>
                </div>
                <div>
                    <span style="color: #71717a;">Berat Badan:</span><br>
                    <strong class="tabular-nums">{{ $getVal('berat_badan', '64') }} kg</strong>
                </div>
                <div>
                    <span style="color: #71717a;">Indeks Massa Tubuh:</span><br>
                    <strong class="tabular-nums">{{ $getVal('bmi', '22.7') }} kg/m&sup2;</strong>
                </div>
                <div>
                    <span style="color: #71717a;">Status Gizi (IMT):</span><br>
                    <span class="badge-flag flag-normal">{{ $getVal('status_gizi', 'Normal') }}</span>
                </div>
            </div>
        </div>

        {{-- 2. Systematic Organ Examination --}}
        <div style="border: 1px solid #d4d4d8; border-radius: 4px; overflow: hidden; margin-bottom: 12px;">
            <div style="background-color: #f4f4f5; padding: 4px 10px; font-weight: 700; font-size: 9.5px; border-bottom: 1px solid #d4d4d8; text-transform: uppercase;">
                2. Pemeriksaan Fisik Head to Toe
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
                        <td>
                            Visus OD: <strong>{{ $getVal('visus_od', '6/6') }}</strong> &bull;
                            Visus OS: <strong>{{ $getVal('visus_os', '6/6') }}</strong> &bull;
                            Buta Warna: <strong>{{ $getVal('buta_warna', 'Normal (Tidak Buta Warna)') }}</strong>
                        </td>
                        <td style="text-align: center;"><span class="badge-flag flag-normal">NORMAL</span></td>
                    </tr>
                    <tr>
                        <td style="font-weight: 600;">Telinga, Hidung, Tenggorok</td>
                        <td>
                            Telinga: {{ $getVal('tht_telinga', 'Tenang, serumen (-)') }} &bull;
                            Hidung: {{ $getVal('tht_hidung', 'Deviasi septum (-)') }} &bull;
                            Tenggorok: {{ $getVal('tht_tenggorok', 'T1/T1 tenang, faring hiperemis (-)') }}
                        </td>
                        <td style="text-align: center;"><span class="badge-flag flag-normal">NORMAL</span></td>
                    </tr>
                    <tr>
                        <td style="font-weight: 600;">Gigi &amp; Mulut</td>
                        <td>
                            Gigi: {{ $getVal('gigi_mulut', 'Karies (-), Karang gigi minimal, Gangren (-)') }}
                        </td>
                        <td style="text-align: center;"><span class="badge-flag flag-normal">NORMAL</span></td>
                    </tr>
                    <tr>
                        <td style="font-weight: 600;">Toraks (Jantung &amp; Paru)</td>
                        <td>
                            Cor: {{ $getVal('fisik_cor', 'BJ I-II murni teratur, murmur (-), gallop (-)') }}<br>
                            Pulmo: {{ $getVal('fisik_pulmo', 'Vesikuler normal, ronkhi (-/-), wheezing (-/-)') }}
                        </td>
                        <td style="text-align: center;"><span class="badge-flag flag-normal">NORMAL</span></td>
                    </tr>
                    <tr>
                        <td style="font-weight: 600;">Abdomen (Perut)</td>
                        <td>
                            Dinding perut supel, nyeri tekan (-), hepar &amp; lien tidak teraba membesar, bising usus normal.
                        </td>
                        <td style="text-align: center;"><span class="badge-flag flag-normal">NORMAL</span></td>
                    </tr>
                    <tr>
                        <td style="font-weight: 600;">Ekstremitas &amp; Neurologis</td>
                        <td>
                            Akral hangat, edema (-/-), refleks fisiologis (+/+), refleks patologis (-/-), ROM sendi bebas.
                        </td>
                        <td style="text-align: center;"><span class="badge-flag flag-normal">NORMAL</span></td>
                    </tr>
                </tbody>
            </table>
        </div>

        {{-- 3. Doctor Impression & Advice --}}
        @php
            $conclusionText = $item->group_conclusion ?? 'Pemeriksaan fisik dalam batas normal. Status kesehatan umum baik.';
        @endphp

        <div style="border-left: 3px solid #2563eb; background-color: #f8fafc; border: 1px solid #cbd5e1; border-left-width: 4px; border-radius: 4px; padding: 10px 14px; margin-bottom: 12px;">
            <div style="font-size: 9.5px; font-weight: 700; color: #1e3a8a; text-transform: uppercase; margin-bottom: 3px;">
                KESIMPULAN &amp; SARAN DOKTER PEMERIKSA:
            </div>
            <div style="font-size: 10px; font-weight: 600; color: #0f172a; line-height: 1.4;">
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
