{{-- Watermark Background --}}
@if (! empty($watermarkBase64))
    <img src="{{ $watermarkBase64 }}" class="watermark-bg" alt="Watermark">
@elseif (! empty($logoBase64))
    <img src="{{ $logoBase64 }}" class="watermark-bg" alt="Watermark">
@endif

{{-- Dynamic Kop Surat --}}
<div class="kop-header">
    @if (! empty($logoBase64))
        <img src="{{ $logoBase64 }}" alt="Logo Klinik" class="kop-logo">
    @endif
    <div class="kop-info">
        <div class="kop-clinic-name">{{ $clinic->clinic_name ?? 'KLINIK UTAMA & LABORATORIUM MASTER SUMMIT' }}</div>
        @if (! empty($clinic->clinic_subtitle))
            <div class="kop-clinic-sub">{{ $clinic->clinic_subtitle }}</div>
        @endif
        <div class="kop-clinic-meta">
            @if (! empty($clinic->izin_klinik_no))
                <span>Izin Operasional: <strong>{{ $clinic->izin_klinik_no }}</strong></span> &bull;
            @endif
            <span>{{ $clinic->address }}{{ $clinic->city ? ', ' . $clinic->city : '' }}</span>
            <br>
            @if (! empty($clinic->phone))
                <span>Telp: {{ $clinic->phone }}</span> &bull;
            @endif
            @if (! empty($clinic->email))
                <span>Email: {{ $clinic->email }}</span> &bull;
            @endif
            @if (! empty($clinic->website))
                <span>{{ $clinic->website }}</span>
            @endif
        </div>
    </div>
</div>
