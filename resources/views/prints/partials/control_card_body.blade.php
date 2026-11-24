{{-- Watermark Image if uploaded --}}
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

{{-- Document Title & Barcode --}}
<div class="doc-title-row">
    <div class="doc-title-block">
        <h1>KARTU KONTROL ALUR PEMERIKSAAN</h1>
        <p>
            <span style="font-weight: 700; color: #18181b;">{{ $copyLabel ?? 'LEMBAR PEMERIKSAAN' }}</span>
            &bull; Tgl Daftar: <span class="tabular-nums">{{ $registration->registered_at ? $registration->registered_at->translatedFormat('d F Y, H:i') : now()->translatedFormat('d F Y, H:i') }} WIB</span>
        </p>
    </div>
    <div class="barcode-block">
        <div class="barcode-svg-container">
            {!! $barcodeSvg !!}
        </div>
        <div class="barcode-text tabular-nums">{{ $registration->reg_no }}</div>
    </div>
</div>

{{-- Patient Demographic Box --}}
<div class="patient-box">
    <div class="patient-grid">
        <div class="patient-col">
            <div class="patient-row">
                <span class="patient-label">No. Rekam Medis</span>
                <span class="patient-separator">:</span>
                <span class="patient-val tabular-nums">{{ $patient->medical_record_no }}</span>
            </div>
            <div class="patient-row">
                <span class="patient-label">Nama Pasien</span>
                <span class="patient-separator">:</span>
                <span class="patient-val">{{ $patient->name }}</span>
            </div>
            <div class="patient-row">
                <span class="patient-label">NIK / Identitas</span>
                <span class="patient-separator">:</span>
                <span class="patient-val tabular-nums">{{ $patient->nik ?? '-' }}</span>
            </div>
            <div class="patient-row">
                <span class="patient-label">JK / Usia</span>
                <span class="patient-separator">:</span>
                <span class="patient-val tabular-nums">
                    {{ $patient->gender === 'L' ? 'Laki-laki' : 'Perempuan' }} /
                    {{ $registration->age_years_snapshot ?? $patient->age ?? '-' }} Tahun
                    @if ($patient->birth_date)
                        ({{ \Carbon\Carbon::parse($patient->birth_date)->translatedFormat('d M Y') }})
                    @endif
                </span>
            </div>
        </div>

        <div class="patient-col">
            <div class="patient-row">
                <span class="patient-label">Tipe Pasien</span>
                <span class="patient-separator">:</span>
                <span class="patient-val" style="text-transform: uppercase;">
                    @if ($registration->payer_type === 'corporate')
                        Perusahaan (MCU)
                    @elseif ($registration->payer_type === 'referrer')
                        Rujukan Dokter/Instansi
                    @else
                        Umum (APS Pribadi)
                    @endif
                </span>
            </div>
            <div class="patient-row">
                <span class="patient-label">Perusahaan / Klien</span>
                <span class="patient-separator">:</span>
                <span class="patient-val">{{ $registration->company?->name ?? '-' }}</span>
            </div>
            <div class="patient-row">
                <span class="patient-label">Departemen / Divisi</span>
                <span class="patient-separator">:</span>
                <span class="patient-val">{{ $registration->department_snapshot ?? $patient->default_department ?? '-' }}</span>
            </div>
            <div class="patient-row">
                <span class="patient-label">Paket / Layanan</span>
                <span class="patient-separator">:</span>
                <span class="patient-val">{{ $registration->package?->name ?? 'Layanan Pemeriksaan Terpilih' }}</span>
            </div>
        </div>
    </div>
</div>

{{-- Station Checklist Table --}}
<table class="station-table">
    <thead>
        <tr>
            <th class="col-num">No</th>
            <th class="col-station">Pos / Stasiun Pemeriksaan</th>
            <th>Uraian Pemeriksaan & Sampel</th>
            <th class="col-time">Jam</th>
            <th class="col-signature">Paraf Petugas</th>
            <th class="col-notes">Catatan / Hasil Cepat</th>
        </tr>
    </thead>
    <tbody>
        @foreach ($stations as $st)
            <tr>
                <td class="col-num tabular-nums">{{ $st['number'] }}</td>
                <td class="col-station">
                    <div class="station-title">
                        <span class="checkbox-square"></span>
                        <span>{{ $st['station_name'] }}</span>
                    </div>
                    <div class="station-room">{{ $st['room'] }}</div>
                </td>
                <td>
                    <div class="station-desc">{{ $st['description'] }}</div>
                </td>
                <td class="col-time">
                    <span style="color: #a1a1aa; font-size: 7.5px;">__ : __</span>
                </td>
                <td class="col-signature" style="height: {{ $paperSize === 'A6' ? '24px' : '30px' }};">
                    <div style="border-bottom: 1px dotted #a1a1aa; width: 85%; margin: 0 auto; height: 18px;"></div>
                </td>
                <td class="col-notes"></td>
            </tr>
        @endforeach
    </tbody>
</table>

{{-- Footer Block & Patient Rules --}}
<div class="footer-block">
    <div class="rules-block">
        <ul class="rules-list">
            <li>Harap selalu membawa kartu kontrol ini ke setiap pos pemeriksaan yang tercantum.</li>
            <li>Pastikan petugas pemeriksa membubuhkan jam dan tanda tangan/paraf setelah pemeriksaan selesai.</li>
            <li>Setelah seluruh pos pemeriksaan terlaksana, serahkan kartu ini kembali ke Meja Kasir / Administrasi Akhir.</li>
        </ul>
        @if (! empty($clinic->footer_text))
            <div style="margin-top: 3px; font-style: italic; color: #71717a;">
                {{ $clinic->footer_text }}
            </div>
        @endif
    </div>
    <div class="print-meta tabular-nums">
        <div>Dicetak: {{ $printedAt }} WIB</div>
        <div>Sistem Manajemen MCU & Klinik</div>
    </div>
</div>
