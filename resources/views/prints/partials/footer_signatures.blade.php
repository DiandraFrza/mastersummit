<div class="signatures-grid">
    {{-- Left: Analis / Petugas Pemeriksa --}}
    <div class="sig-col">
        <div class="sig-title">Pemeriksa / Analis:</div>
        <div class="sig-image-container">
            @if (! empty($examinerSignatureBase64))
                <img src="{{ $examinerSignatureBase64 }}" class="sig-image" alt="TTD Pemeriksa">
            @endif
        </div>
        <div class="sig-name">{{ $examinerName ?? 'Analis Laboratorium' }}</div>
        <div class="sig-meta">Petugas Pemeriksa</div>
    </div>

    {{-- Right: Dokter Penanggung Jawab / Dokter Spesialis --}}
    <div class="sig-col">
        <div class="sig-title">
            {{ $clinic->city ?? 'Jakarta' }}, {{ $printedDate ?? now()->translatedFormat('d F Y') }}<br>
            {{ $doctorTitle ?? 'Dokter Penanggung Jawab:' }}
        </div>
        <div class="sig-image-container">
            @if (! empty($doctorSignatureBase64))
                <img src="{{ $doctorSignatureBase64 }}" class="sig-image" alt="TTD Dokter">
            @endif
        </div>
        <div class="sig-name">{{ $doctorName ?? ($clinic->pic_doctor_name ?? 'dr. Penanggung Jawab Teknis') }}</div>
        <div class="sig-meta">SIP: {{ $doctorSip ?? ($clinic->pic_doctor_sip ?? '123/SIP-D/DPMPTSP/2026') }}</div>
    </div>
</div>

<div class="doc-footer-notes">
    <div>
        <span>Dicetak pada: <strong class="tabular-nums">{{ now()->translatedFormat('d/m/Y H:i') }} WIB</strong></span> &bull;
        <span>Operator: {{ auth()->user()->name ?? 'System' }}</span>
    </div>
    <div>
        {{ $clinic->footer_text ?? 'Dokumen ini dicetak secara sah dari Sistem Informasi Laboratorium & Klinik Master Summit.' }}
    </div>
</div>
