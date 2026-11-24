@extends('prints.layouts.print_document')

@section('title', 'Surat Keterangan Rapid Antigen - ' . $registration->reg_no . ' - ' . $patient->name)
@section('toolbar_title', 'Surat Keterangan Rapid Antigen')

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
            <div class="doc-title">SURAT KETERANGAN HASIL PEMERIKSAAN RAPID DIAGNOSTIC TEST (RDT) ANTIGEN</div>
            <div class="doc-subtitle"><em>Certificate of Rapid SARS-CoV-2 Antigen Detection Test</em></div>
            <div style="font-size: 9px; color: #71717a; margin-top: 2px;">
                No. Surat: <span class="tabular-nums font-bold text-zinc-900">SKBN-AG/{{ date('Y') }}/{{ str_pad($registration->id, 5, '0', STR_PAD_LEFT) }}</span>
            </div>
        </div>

        {{-- Patient Demographics --}}
        @include('prints.partials.patient_info_box')

        {{-- Test Details Box --}}
        <div style="border: 1px solid #d4d4d8; border-radius: 4px; overflow: hidden; margin-bottom: 14px;">
            <div style="background-color: #f4f4f5; padding: 6px 12px; font-weight: 700; font-size: 10px; border-bottom: 1px solid #d4d4d8; text-transform: uppercase;">
                Informasi & Spesifikasi Pemeriksaan
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 9.5px;">
                <tr>
                    <td style="padding: 6px 12px; width: 35%; color: #52525b; border-bottom: 1px solid #f4f4f5;">Jenis Pemeriksaan / <em>Test Name</em></td>
                    <td style="padding: 6px 12px; font-weight: 600; border-bottom: 1px solid #f4f4f5;">SARS-CoV-2 Antigen Rapid Test (RDT-Ag)</td>
                </tr>
                <tr>
                    <td style="padding: 6px 12px; color: #52525b; border-bottom: 1px solid #f4f4f5;">Metode Pemeriksaan / <em>Method</em></td>
                    <td style="padding: 6px 12px; font-weight: 600; border-bottom: 1px solid #f4f4f5;">Immunochromatography Rapid Assay</td>
                </tr>
                <tr>
                    <td style="padding: 6px 12px; color: #52525b; border-bottom: 1px solid #f4f4f5;">Jenis Spesimen / <em>Sample Type</em></td>
                    <td style="padding: 6px 12px; font-weight: 600; border-bottom: 1px solid #f4f4f5;">Swab Nasofaring / Orofaring</td>
                </tr>
                <tr>
                    <td style="padding: 6px 12px; color: #52525b;">Waktu Pengambilan / <em>Sampling Time</em></td>
                    <td style="padding: 6px 12px; font-weight: 600;" class="tabular-nums">
                        {{ $item->sample_taken_at ? \Carbon\Carbon::parse($item->sample_taken_at)->translatedFormat('d F Y, H:i') : now()->translatedFormat('d F Y, H:i') }} WIB
                    </td>
                </tr>
            </table>
        </div>

        {{-- Result Highlight Box --}}
        @php
            $firstRes = $examinationResults->first();
            $resultVal = strtoupper(trim((string) ($firstRes?->value_text ?? 'NEGATIF')));
            $isPositive = str_contains($resultVal, 'POSITIF') || str_contains($resultVal, 'REAKTIF');
        @endphp

        <div style="border: 2px solid {{ $isPositive ? '#ef4444' : '#22c55e' }}; background-color: {{ $isPositive ? '#fef2f2' : '#f0fdf4' }}; border-radius: 6px; padding: 14px; text-align: center; margin-bottom: 14px;">
            <div style="font-size: 10px; font-weight: 600; color: #52525b; text-transform: uppercase; letter-spacing: 0.5px;">
                Hasil Pemeriksaan / <em>Test Result</em>:
            </div>
            <div style="font-size: 20px; font-weight: 800; color: {{ $isPositive ? '#b91c1c' : '#15803d' }}; margin: 4px 0; letter-spacing: 1px;">
                {{ $resultVal }}
            </div>
            <div style="font-size: 9.5px; color: #52525b;">
                Nilai Rujukan: <strong>NEGATIF (NON-REAKTIF)</strong>
            </div>
        </div>

        {{-- Clinical Interpretation Notes --}}
        <div style="border: 1px solid #e4e4e7; border-radius: 4px; padding: 8px 12px; font-size: 8.5px; color: #52525b; line-height: 1.4; margin-bottom: 14px; background-color: #fafafa;">
            <strong style="color: #18181b; display: block; margin-bottom: 2px;">Catatan Klinis & Rekomendasi:</strong>
            <ul style="padding-left: 14px; margin: 0;">
                <li>Hasil <strong>NEGATIF</strong> tidak menyingkirkan kemungkinan infeksi SARS-CoV-2 secara mutlak terutama bila paparan baru saja terjadi atau viral load di bawah batas deteksi alat.</li>
                <li>Tetap patuhi protokol kesehatan (mencuci tangan, memakai masker, menjaga jarak).</li>
                <li>Bila timbul gejala klinis seperti demam, batuk, anosmia, atau sesak napas, disarankan untuk melakukan konfirmasi RT-PCR dan konsultasi dokter.</li>
            </ul>
        </div>

        {{-- Verification QR & Signatures --}}
        <div style="display: flex; align-items: flex-end; justify-content: space-between; gap: 20px;">
            @if (! empty($barcodeSvg))
                <div style="text-align: center; border: 1px solid #e4e4e7; border-radius: 4px; padding: 8px; background-color: #fafafa; width: 110px;">
                    <div style="width: 70px; height: 70px; margin: 0 auto;">
                        {!! $barcodeSvg !!}
                    </div>
                    <div style="font-size: 7.5px; color: #71717a; margin-top: 4px;">Pindai untuk validasi dokumen resmi</div>
                </div>
            @endif

            <div style="flex-grow: 1;">
                @include('prints.partials.footer_signatures')
            </div>
        </div>
    </div>
</div>
@endsection
