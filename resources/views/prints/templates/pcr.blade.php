@extends('prints.layouts.print_document')

@section('title', 'Hasil Pemeriksaan RT-PCR - ' . $registration->reg_no . ' - ' . $patient->name)
@section('toolbar_title', 'Hasil Pemeriksaan RT-PCR')

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
            <div class="doc-title">SURAT KETERANGAN HASIL PEMERIKSAAN MOLEKULER RT-PCR SARS-CoV-2</div>
            <div class="doc-subtitle"><em>Laboratory Report of Real-Time Reverse Transcription Polymerase Chain Reaction</em></div>
            <div style="font-size: 9px; color: #71717a; margin-top: 2px;">
                No. Registrasi Lab: <span class="tabular-nums font-bold text-zinc-900">PCR/{{ date('Y') }}/{{ str_pad($registration->id, 5, '0', STR_PAD_LEFT) }}</span>
            </div>
        </div>

        {{-- Patient Demographics --}}
        @include('prints.partials.patient_info_box')

        {{-- Specimen Metadata --}}
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; font-size: 9px;">
            <div style="border: 1px solid #e4e4e7; border-radius: 4px; padding: 6px 10px; background-color: #fafafa;">
                <span style="color: #71717a;">Jenis Spesimen:</span>
                <strong style="color: #18181b;">Swab Nasofaring & Orofaring</strong><br>
                <span style="color: #71717a;">Metode Analisis:</span>
                <strong style="color: #18181b;">Real-Time RT PCR (Fluorescent Probe)</strong>
            </div>
            <div style="border: 1px solid #e4e4e7; border-radius: 4px; padding: 6px 10px; background-color: #fafafa;">
                <span style="color: #71717a;">Waktu Sampling:</span>
                <strong class="tabular-nums" style="color: #18181b;">
                    {{ $item->sample_taken_at ? \Carbon\Carbon::parse($item->sample_taken_at)->translatedFormat('d F Y, H:i') : now()->translatedFormat('d F Y, H:i') }} WIB
                </strong><br>
                <span style="color: #71717a;">Waktu Selesai Analisis:</span>
                <strong class="tabular-nums" style="color: #18181b;">{{ now()->translatedFormat('d F Y, H:i') }} WIB</strong>
            </div>
        </div>

        {{-- Results Table --}}
        <table class="table-exam">
            <thead>
                <tr>
                    <th style="width: 35%;">TARGET GEN / PARAMETER</th>
                    <th style="width: 25%;">HASIL (CT VALUE)</th>
                    <th style="width: 20%;">CUT-OFF VALUE</th>
                    <th style="width: 20%; text-align: center;">STATUS</th>
                </tr>
            </thead>
            <tbody>
                @php
                    $isOverallPositive = false;
                @endphp
                @forelse ($examinationResults as $res)
                    @php
                        $valText = trim((string) ($res->value_text ?? ''));
                        $valNum = $res->value_numeric;
                        $flag = strtolower($res->flag_status ?? 'normal');
                        if (str_contains(strtoupper($valText), 'POSITIF') || $flag === 'abnormal' || $flag === 'critical') {
                            $isOverallPositive = true;
                        }
                    @endphp
                    <tr>
                        <td style="font-weight: 600;">{{ $res->parameter?->label ?? 'SARS-CoV-2 Target' }}</td>
                        <td class="tabular-nums" style="font-weight: 700;">
                            @if ($valNum !== null)
                                CT {{ $valNum }}
                            @else
                                {{ $valText ?: 'Undetected' }}
                            @endif
                        </td>
                        <td class="tabular-nums" style="color: #71717a;">CT &lt; 40.00</td>
                        <td style="text-align: center;">
                            @if ($flag === 'abnormal' || $flag === 'critical' || str_contains(strtoupper($valText), 'POSITIF'))
                                <span class="badge-flag flag-critical">POSITIF</span>
                            @else
                                <span class="badge-flag flag-normal">NEGATIF</span>
                            @endif
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td style="font-weight: 600;">SARS-CoV-2 (RdRp / N Gene)</td>
                        <td class="tabular-nums" style="font-weight: 700;">Undetected</td>
                        <td class="tabular-nums" style="color: #71717a;">CT &lt; 40.00</td>
                        <td style="text-align: center;">
                            <span class="badge-flag flag-normal">NEGATIF</span>
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>

        {{-- Final Conclusion Banner --}}
        <div style="border: 2px solid {{ $isOverallPositive ? '#ef4444' : '#22c55e' }}; background-color: {{ $isOverallPositive ? '#fef2f2' : '#f0fdf4' }}; border-radius: 6px; padding: 12px; text-align: center; margin-bottom: 12px;">
            <div style="font-size: 9.5px; font-weight: 600; color: #52525b; text-transform: uppercase;">
                Kesimpulan Akhir Pemeriksaan RT-PCR:
            </div>
            <div style="font-size: 18px; font-weight: 800; color: {{ $isOverallPositive ? '#b91c1c' : '#15803d' }}; margin: 3px 0; letter-spacing: 0.8px;">
                {{ $isOverallPositive ? 'POSITIF (SARS-CoV-2 RNA DETECTED)' : 'NEGATIF (SARS-CoV-2 RNA NOT DETECTED)' }}
            </div>
            <div style="font-size: 9px; color: #52525b;">
                Batas Deteksi Alat (Limit of Detection): 200 copies/mL
            </div>
        </div>

        {{-- Technical & Clinical Notes --}}
        <div style="border: 1px solid #e4e4e7; border-radius: 4px; padding: 8px 12px; font-size: 8px; color: #52525b; line-height: 1.4; margin-bottom: 14px; background-color: #fafafa;">
            <strong>Catatan Interpretasi Laboratorium:</strong>
            <ol style="padding-left: 14px; margin: 2px 0 0;">
                <li>Hasil <strong>NEGATIF</strong> menunjukkan materi genetik (RNA) SARS-CoV-2 tidak terdeteksi pada spesimen yang diperiksa.</li>
                <li>Hasil pemeriksaan molekuler ini hanya menggambarkan kondisi saat pengambilan spesimen (sampling).</li>
                <li>Pemeriksaan dilakukan dengan protokol standar Biosafety Level 2 (BSL-2) dan reagen terdaftar Kemenkes RI.</li>
            </ol>
        </div>

        {{-- Signatures --}}
        @include('prints.partials.footer_signatures')
    </div>
</div>
@endsection
