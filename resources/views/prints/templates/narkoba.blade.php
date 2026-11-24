@extends('prints.layouts.print_document')

@section('title', 'Surat Keterangan Bebas Narkoba - ' . $registration->reg_no . ' - ' . $patient->name)
@section('toolbar_title', 'Surat Keterangan Bebas Narkoba (SKBN)')

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
            <div class="doc-title">SURAT KETERANGAN BEBAS NARKOBA (SKBN)</div>
            <div class="doc-subtitle"><em>Certificate of Drug-Free Examination</em></div>
            <div style="font-size: 9px; color: #71717a; margin-top: 2px;">
                Nomor: <span class="tabular-nums font-bold text-zinc-900">SKBN/{{ date('Y') }}/{{ str_pad($registration->id, 5, '0', STR_PAD_LEFT) }}</span>
            </div>
        </div>

        {{-- Patient Statement Section with Photo Box --}}
        <div style="display: flex; gap: 16px; margin-bottom: 12px; align-items: flex-start;">
            @php
                $patientPhotoBase64 = null;
                if (! empty($patient->photo_path)) {
                    $patientPhotoBase64 = app(\App\Services\Prints\SinglePrintTemplateService::class)->resolveFileBase64($patient->photo_path);
                }
            @endphp

            {{-- 3x4 / 4x6 Photo Box --}}
            <div style="width: 28mm; height: 38mm; border: 1px solid #d4d4d8; border-radius: 4px; display: flex; align-items: center; justify-content: center; background-color: #fafafa; flex-shrink: 0; overflow: hidden;">
                @if (! empty($patientPhotoBase64))
                    <img src="{{ $patientPhotoBase64 }}" style="width: 100%; height: 100%; object-fit: cover;" alt="Foto Pasien">
                @else
                    <div style="text-align: center; color: #a1a1aa; font-size: 8px; line-height: 1.2;">
                        PAS FOTO<br>3 x 4 cm
                    </div>
                @endif
            </div>

            {{-- Patient Meta --}}
            <div style="flex-grow: 1;">
                <p style="font-size: 9.5px; margin-bottom: 6px; line-height: 1.4;">
                    Yang bertanda tangan di bawah ini, Dokter Pemeriksa Klinik & Laboratorium Master Summit menerangkan bahwa telah dilakukan pemeriksaan skrining toksikologi zat narkotika, psikotropika, dan zat adiktif lainnya terhadap:
                </p>

                <div class="patient-box" style="margin-bottom: 0;">
                    <div class="patient-grid">
                        <div class="patient-row">
                            <span class="patient-label" style="width: 110px;">Nama Lengkap</span>
                            <span class="patient-sep">:</span>
                            <span class="patient-val">{{ $patient->name }}</span>
                        </div>
                        <div class="patient-row">
                            <span class="patient-label" style="width: 110px;">NIK / No. KTP</span>
                            <span class="patient-sep">:</span>
                            <span class="patient-val tabular-nums">{{ $patient->nik ?? '-' }}</span>
                        </div>
                        <div class="patient-row">
                            <span class="patient-label" style="width: 110px;">Tempat, Tgl Lahir</span>
                            <span class="patient-sep">:</span>
                            <span class="patient-val tabular-nums">
                                {{ $patient->birth_date ? \Carbon\Carbon::parse($patient->birth_date)->translatedFormat('d F Y') : '-' }}
                            </span>
                        </div>
                        <div class="patient-row">
                            <span class="patient-label" style="width: 110px;">Jenis Kelamin</span>
                            <span class="patient-sep">:</span>
                            <span class="patient-val">{{ $patient->gender === 'L' ? 'Laki-laki' : 'Perempuan' }}</span>
                        </div>
                        <div class="patient-row">
                            <span class="patient-label" style="width: 110px;">Pekerjaan / Jabatan</span>
                            <span class="patient-sep">:</span>
                            <span class="patient-val">{{ $patient->job_title ?? ($registration->department_snapshot ?: 'Karyawan / Pelamar') }}</span>
                        </div>
                        <div class="patient-row">
                            <span class="patient-label" style="width: 110px;">Alamat Pasien</span>
                            <span class="patient-sep">:</span>
                            <span class="patient-val" style="font-size: 9px;">{{ $patient->address ?? '-' }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {{-- Specimen Info --}}
        <div style="border-left: 3px solid #09090b; background-color: #f4f4f5; padding: 6px 12px; margin-bottom: 12px; font-size: 9px;">
            Metode: <strong>Rapid Diagnostic Multi-Panel Urine Screening Test (Lateral Flow Immunochromatographic Assay)</strong> &bull;
            Sampel: <strong>Urin Segar</strong> &bull; Waktu Sampling: <span class="tabular-nums font-semibold">{{ $item->sample_taken_at ? \Carbon\Carbon::parse($item->sample_taken_at)->translatedFormat('d F Y, H:i') : now()->translatedFormat('d F Y, H:i') }} WIB</span>
        </div>

        {{-- 6-Parameter Drug Screen Table --}}
        <table class="table-exam">
            <thead>
                <tr>
                    <th style="width: 8%; text-align: center;">NO</th>
                    <th style="width: 38%;">PARAMETER / GOLONGAN ZAT</th>
                    <th style="width: 18%;">CUT-OFF LIMIT</th>
                    <th style="width: 18%;">HASIL PEMERIKSAAN</th>
                    <th style="width: 18%; text-align: center;">INTERPRETASI</th>
                </tr>
            </thead>
            <tbody>
                @php
                    $isAnyPositive = false;
                @endphp
                @forelse ($examinationResults as $idx => $res)
                    @php
                        $valText = strtoupper(trim((string) ($res->value_text ?? 'NEGATIF')));
                        $isPos = str_contains($valText, 'POSITIF') || str_contains($valText, 'REAKTIF');
                        if ($isPos) $isAnyPositive = true;
                    @endphp
                    <tr>
                        <td style="text-align: center;" class="tabular-nums">{{ $idx + 1 }}</td>
                        <td style="font-weight: 600;">{{ $res->parameter?->label ?? 'Zat Narkotika' }}</td>
                        <td class="tabular-nums" style="color: #71717a;">{{ $res->reference_snapshot ?? '50 - 1000 ng/mL' }}</td>
                        <td class="tabular-nums" style="font-weight: 700;">{{ $valText }}</td>
                        <td style="text-align: center;">
                            @if ($isPos)
                                <span class="badge-flag flag-critical">POSITIF</span>
                            @else
                                <span class="badge-flag flag-normal">NEGATIF</span>
                            @endif
                        </td>
                    </tr>
                @empty
                    @php
                        $defaultPanels = [
                            ['Amphetamine (AMP)', '1000 ng/mL'],
                            ['Methamphetamine / Sabu (MET)', '500 ng/mL'],
                            ['THC / Marijuana / Ganja', '50 ng/mL'],
                            ['Morphine / Opiates (MOP)', '300 ng/mL'],
                            ['Benzodiazepines (BZO)', '300 ng/mL'],
                            ['Cocaine (COC)', '300 ng/mL'],
                        ];
                    @endphp
                    @foreach ($defaultPanels as $i => $panel)
                        <tr>
                            <td style="text-align: center;" class="tabular-nums">{{ $i + 1 }}</td>
                            <td style="font-weight: 600;">{{ $panel[0] }}</td>
                            <td class="tabular-nums" style="color: #71717a;">{{ $panel[1] }}</td>
                            <td class="tabular-nums" style="font-weight: 700;">NEGATIF</td>
                            <td style="text-align: center;">
                                <span class="badge-flag flag-normal">NEGATIF</span>
                            </td>
                        </tr>
                    @endforeach
                @endforelse
            </tbody>
        </table>

        {{-- Official Conclusion Banner --}}
        <div style="border: 2px solid {{ $isAnyPositive ? '#ef4444' : '#09090b' }}; background-color: {{ $isAnyPositive ? '#fef2f2' : '#ffffff' }}; border-radius: 6px; padding: 12px; margin-bottom: 12px; text-align: center;">
            <div style="font-size: 9.5px; font-weight: 700; color: #52525b; text-transform: uppercase;">
                KESIMPULAN DOKTER PEMERIKSA:
            </div>
            <div style="font-size: 13px; font-weight: 800; color: {{ $isAnyPositive ? '#b91c1c' : '#09090b' }}; margin: 3px 0; line-height: 1.4;">
                @if ($isAnyPositive)
                    TERINDIKASI POSITIF MENGANDUNG ZAT NARKOTIKA / PSIKOTROPIKA
                @else
                    BEBAS / TIDAK MENGANDUNG ZAT NARKOTIKA, PSIKOTROPIKA &amp; ZAT ADIKTIF LAINNYA
                @endif
            </div>
            <div style="font-size: 9px; color: #71717a;">
                Surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.
            </div>
        </div>

        {{-- Signatures --}}
        @include('prints.partials.footer_signatures')
    </div>
</div>
@endsection
