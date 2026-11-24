<div class="patient-box">
    <div class="patient-grid">
        <div class="patient-row">
            <span class="patient-label">No. Rekam Medis</span>
            <span class="patient-sep">:</span>
            <span class="patient-val tabular-nums">{{ $patient->medical_record_no }}</span>
        </div>
        <div class="patient-row">
            <span class="patient-label">No. Registrasi</span>
            <span class="patient-sep">:</span>
            <span class="patient-val tabular-nums">{{ $registration->reg_no }}</span>
        </div>
        <div class="patient-row">
            <span class="patient-label">Nama Pasien</span>
            <span class="patient-sep">:</span>
            <span class="patient-val">{{ $patient->name }}</span>
        </div>
        <div class="patient-row">
            <span class="patient-label">Tgl. Pemeriksaan</span>
            <span class="patient-sep">:</span>
            <span class="patient-val tabular-nums">
                {{ $registration->registered_at ? $registration->registered_at->translatedFormat('d F Y, H:i') : now()->translatedFormat('d F Y, H:i') }} WIB
            </span>
        </div>
        <div class="patient-row">
            <span class="patient-label">Jenis Kelamin / Usia</span>
            <span class="patient-sep">:</span>
            <span class="patient-val tabular-nums">
                {{ $patient->gender === 'L' ? 'Laki-laki' : 'Perempuan' }} /
                {{ $registration->age_years_snapshot ?? $patient->age ?? '-' }} Tahun
                @if ($patient->birth_date)
                    ({{ \Carbon\Carbon::parse($patient->birth_date)->translatedFormat('d M Y') }})
                @endif
            </span>
        </div>
        <div class="patient-row">
            <span class="patient-label">Perusahaan / Dept</span>
            <span class="patient-sep">:</span>
            <span class="patient-val">
                {{ $registration->company?->name ?? $registration->mcuEvent?->company?->name ?? 'Pasien Umum / APS' }}
                @if (! empty($registration->department_snapshot))
                    - {{ $registration->department_snapshot }}
                @endif
            </span>
        </div>
        <div class="patient-row">
            <span class="patient-label">NIK / No. Identitas</span>
            <span class="patient-sep">:</span>
            <span class="patient-val tabular-nums">{{ $patient->nik ?? '-' }}</span>
        </div>
        <div class="patient-row">
            <span class="patient-label">Dokter Pengirim / Perujuk</span>
            <span class="patient-sep">:</span>
            <span class="patient-val">
                {{ $registration->referrer?->name ?? 'Atas Permintaan Sendiri (APS)' }}
            </span>
        </div>
    </div>
</div>
