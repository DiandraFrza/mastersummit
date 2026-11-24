@extends('prints.layouts.print_document')

@section('title', 'Ekspertise Radiologi - ' . $registration->reg_no . ' - ' . $patient->name)
@section('toolbar_title', 'Ekspertise Radiologi: ' . $item->service_name_snapshot)

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
            <div class="doc-title">LEMBAR EKSPERTISE PEMERIKSAAN RADIOLOGI</div>
            <div class="doc-subtitle">Instalasi Radiologi &amp; Diagnostic Imaging Master Summit</div>
            <div style="font-size: 9px; color: #71717a; margin-top: 2px;">
                No. Foto Rontgen: <span class="tabular-nums font-bold text-zinc-900">RAD-{{ date('Y') }}-{{ str_pad($registration->id, 5, '0', STR_PAD_LEFT) }}</span>
            </div>
        </div>

        {{-- Patient Demographics --}}
        @include('prints.partials.patient_info_box')

        {{-- Examination Metadata --}}
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; font-size: 9px;">
            <div style="border: 1px solid #e4e4e7; border-radius: 4px; padding: 6px 10px; background-color: #fafafa;">
                <span style="color: #71717a;">Pemeriksaan:</span>
                <strong style="color: #18181b;">{{ $item->service_name_snapshot }}</strong><br>
                <span style="color: #71717a;">Proyeksi / Posisi:</span>
                <strong style="color: #18181b;">Thorax Postero-Anterior (PA) Erect</strong>
            </div>
            <div style="border: 1px solid #e4e4e7; border-radius: 4px; padding: 6px 10px; background-color: #fafafa;">
                <span style="color: #71717a;">Indikasi Klinis:</span>
                <strong style="color: #18181b;">Medical Check Up / Skrining Berkala</strong><br>
                <span style="color: #71717a;">Kualitas Foto:</span>
                <strong style="color: #18181b;">Cukup / Inspirasi Maksimal</strong>
            </div>
        </div>

        {{-- Structured Findings / Expertise Box --}}
        <div style="border: 1px solid #d4d4d8; border-radius: 4px; padding: 14px; margin-bottom: 14px; background-color: #ffffff;">
            <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #18181b; border-bottom: 1px solid #e4e4e7; padding-bottom: 6px; margin-bottom: 10px;">
                DESKRIPSI EKSPERTISE RADIOLOGI:
            </div>

            @php
                $resultsMap = $examinationResults->keyBy(fn ($r) => strtolower($r->parameter?->code ?? ''));
                $descText = $resultsMap->get('rontgen_expertise')?->value_text
                    ?? $resultsMap->get('expertise_radiologi')?->value_text
                    ?? $resultsMap->get('deskripsi_rontgen')?->value_text
                    ?? $examinationResults->first()?->value_text;
            @endphp

            @if (! empty($descText))
                <div style="font-size: 9.5px; line-height: 1.6; color: #27272a; white-space: pre-line;">
                    {{ $descText }}
                </div>
            @else
                {{-- Fallback default normal thorax structure --}}
                <div style="font-size: 9.5px; line-height: 1.6; color: #27272a;">
                    <p style="margin-bottom: 6px;">
                        <strong>Cor (Jantung):</strong> Bentuk dan ukuran dalam batas normal. CTR &lt; 50%. Aorta tidak tampak elongasi/kalsifikasi.
                    </p>
                    <p style="margin-bottom: 6px;">
                        <strong>Pulmo (Paru):</strong> Corakan bronkovaskuler dalam batas normal. Tidak tampak infiltrat, kalsifikasi, maupun kavitas spesifik pada kedua lapang paru.
                    </p>
                    <p style="margin-bottom: 6px;">
                        <strong>Sinus &amp; Diafragma:</strong> Kedua sinus kostofrenikus lancip dan diafragma licin normal.
                    </p>
                    <p style="margin-bottom: 0;">
                        <strong>Skelet &amp; Soft Tissue:</strong> Tulang-tulang dinding toraks (klavikula, kosta) dan jaringan lunak dinding toraks intak, simetris, tidak tampak deformitas/fraktur.
                    </p>
                </div>
            @endif
        </div>

        {{-- Impression / Conclusion Box --}}
        @php
            $conclusionText = $item->group_conclusion
                ?? $resultsMap->get('kesimpulan_radiologi')?->value_text
                ?? $resultsMap->get('kesan_rontgen')?->value_text
                ?? 'Cor dan Pulmo dalam batas normal. Tidak tampak tanda proses spesifik aktif maupun kardiomegali.';
        @endphp

        <div style="border-left: 3px solid #2563eb; background-color: #f8fafc; border: 1px solid #cbd5e1; border-left-width: 4px; border-radius: 4px; padding: 10px 14px; margin-bottom: 14px;">
            <div style="font-size: 9.5px; font-weight: 700; color: #1e3a8a; text-transform: uppercase; margin-bottom: 3px;">
                KESAN / KESIMPULAN:
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

        {{-- Signatures: Dokter Spesialis Radiologi --}}
        @php
            $doctorTitle = 'Dokter Spesialis Radiologi (Sp.Rad):';
        @endphp
        @include('prints.partials.footer_signatures')
    </div>
</div>
@endsection
