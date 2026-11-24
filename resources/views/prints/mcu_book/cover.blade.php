<div class="print-sheet mcu-cover-sheet" style="display: flex; flex-direction: column; justify-content: space-between; min-height: 297mm; padding: 24mm 20mm; text-align: center; border: 1px solid #e4e4e7;">
    {{-- Header / Brand --}}
    <div>
        @if (! empty($logoBase64))
            <img src="{{ $logoBase64 }}" alt="Logo Klinik" style="height: 70px; object-fit: contain; margin-bottom: 12px;">
        @endif
        <div style="font-size: 16px; font-weight: 800; letter-spacing: 1px; color: #09090b; text-transform: uppercase;">
            {{ $clinic->clinic_name ?? 'KLINIK UTAMA & LABORATORIUM MASTER SUMMIT' }}
        </div>
        <div style="font-size: 11px; color: #71717a; margin-top: 2px;">
            {{ $clinic->clinic_subtitle ?? 'Center of Occupational Health & Diagnostic Excellence' }}
        </div>
        <div style="width: 80px; height: 3px; background-color: #09090b; margin: 16px auto 0;"></div>
    </div>

    {{-- Main Document Title --}}
    <div style="margin: 30px 0;">
        <div style="font-size: 24px; font-weight: 900; letter-spacing: 1.5px; color: #09090b; text-transform: uppercase;">
            LAPORAN HASIL<br>MEDICAL CHECK UP
        </div>
        <div style="font-size: 13px; font-weight: 600; color: #52525b; margin-top: 6px; letter-spacing: 0.5px;">
            CONFIDENTIAL MEDICAL REPORT &bull; HASIL RAHASIA KEDOKTERAN
        </div>

        @if (! empty($mcuEvent))
            <div style="display: inline-block; background-color: #f4f4f5; border: 1px solid #d4d4d8; border-radius: 6px; padding: 8px 18px; margin-top: 14px;">
                <div style="font-size: 9.5px; color: #71717a; text-transform: uppercase;">Program / Event MCU:</div>
                <div style="font-size: 13px; font-weight: 700; color: #18181b;">{{ $mcuEvent->event_name }}</div>
                <div style="font-size: 10px; color: #52525b; font-weight: 500;">
                    {{ $registration->company?->name ?? $mcuEvent->company?->name ?? 'Perusahaan Rekanan' }}
                </div>
            </div>
        @elseif (! empty($registration->company))
            <div style="display: inline-block; background-color: #f4f4f5; border: 1px solid #d4d4d8; border-radius: 6px; padding: 8px 18px; margin-top: 14px;">
                <div style="font-size: 9.5px; color: #71717a; text-transform: uppercase;">Perusahaan / Instansi:</div>
                <div style="font-size: 13px; font-weight: 700; color: #18181b;">{{ $registration->company->name }}</div>
            </div>
        @endif
    </div>

    {{-- Participant Profile Card --}}
    <div style="max-width: 140mm; margin: 0 auto; width: 100%; border: 1.5px solid #18181b; border-radius: 6px; padding: 16px; background-color: #ffffff; text-align: left;">
        <div style="display: flex; gap: 16px; align-items: center;">
            {{-- Photo / Avatar --}}
            <div style="width: 32mm; height: 42mm; border: 1px solid #d4d4d8; border-radius: 4px; display: flex; align-items: center; justify-content: center; background-color: #fafafa; flex-shrink: 0; overflow: hidden;">
                @if (! empty($patientPhotoBase64))
                    <img src="{{ $patientPhotoBase64 }}" style="width: 100%; height: 100%; object-fit: cover;" alt="Foto Pasien">
                @else
                    <div style="text-align: center; color: #a1a1aa; font-size: 9px; line-height: 1.3;">
                        PAS FOTO<br>3 x 4 cm
                    </div>
                @endif
            </div>

            {{-- Participant Meta --}}
            <div style="flex-grow: 1; font-size: 10px;">
                <div style="margin-bottom: 6px;">
                    <div style="font-size: 8.5px; color: #71717a; text-transform: uppercase;">Nama Lengkap:</div>
                    <div style="font-size: 14px; font-weight: 800; color: #09090b;">{{ $patient->name }}</div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px 10px;">
                    <div>
                        <span style="color: #71717a; font-size: 8.5px;">No. Rekam Medis (NRM):</span><br>
                        <strong class="tabular-nums" style="font-size: 10.5px;">{{ $patient->medical_record_no }}</strong>
                    </div>
                    <div>
                        <span style="color: #71717a; font-size: 8.5px;">No. Registrasi:</span><br>
                        <strong class="tabular-nums" style="font-size: 10.5px;">{{ $registration->reg_no }}</strong>
                    </div>
                    <div>
                        <span style="color: #71717a; font-size: 8.5px;">NIK / KTP:</span><br>
                        <span class="tabular-nums font-semibold">{{ $patient->nik ?? '-' }}</span>
                    </div>
                    <div>
                        <span style="color: #71717a; font-size: 8.5px;">JK / Usia:</span><br>
                        <span class="tabular-nums font-semibold">{{ $patient->gender === 'L' ? 'Laki-laki' : 'Perempuan' }}, {{ $registration->age_years_snapshot ?? $patient->age }} Thn</span>
                    </div>
                    <div>
                        <span style="color: #71717a; font-size: 8.5px;">Departemen / Jabatan:</span><br>
                        <span class="font-semibold">{{ $registration->department_snapshot ?: ($patient->default_department ?: '-') }}</span>
                    </div>
                    <div>
                        <span style="color: #71717a; font-size: 8.5px;">Tanggal Pelaksanaan:</span><br>
                        <span class="tabular-nums font-semibold">
                            {{ $registration->registered_at ? $registration->registered_at->translatedFormat('d F Y') : now()->translatedFormat('d F Y') }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    {{-- Footer Barcode & Clinic Meta --}}
    <div style="margin-top: 30px;">
        @if (! empty($barcodeSvg))
            <div style="width: 70px; height: 70px; margin: 0 auto 6px;">
                {!! $barcodeSvg !!}
            </div>
            <div class="tabular-nums" style="font-size: 10px; font-weight: 700; letter-spacing: 1px; color: #18181b; margin-bottom: 8px;">
                {{ $registration->reg_no }}
            </div>
        @endif

        <div style="font-size: 8.5px; color: #71717a; line-height: 1.4;">
            {{ $clinic->address ?? 'Jl. Boulevard Raya No. 88' }}{{ $clinic->city ? ', ' . $clinic->city : '' }}<br>
            Telp: {{ $clinic->phone ?? '021-12345678' }} &bull; Email: {{ $clinic->email ?? 'info@mastersummit.test' }} &bull; {{ $clinic->website ?? 'www.mastersummit.test' }}
        </div>
    </div>
</div>
