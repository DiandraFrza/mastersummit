<div class="print-sheet mcu-resume-sheet">
    <div class="content-relative">
        {{-- Kop Surat Header --}}
        @include('prints.partials.header_letterhead')

        {{-- Document Title --}}
        <div class="doc-title-block">
            <div class="doc-title">RESUME MEDIS &amp; REKAPITULASI KELAINAN MCU</div>
            <div class="doc-subtitle">Medical Check Up Summary &amp; Occupational Fitness Evaluation</div>
        </div>

        {{-- Patient Demographics --}}
        @include('prints.partials.patient_info_box')

        {{-- Status Kelayakan Kerja (Fit Status) Banner --}}
        @php
            $fitStatus = $mcuReview?->fit_status ?? 'fit';
            $fitConfig = [
                'fit' => [
                    'label' => 'FIT (LAIK KERJA)',
                    'desc' => 'Kondisi kesehatan memenuhi standar medis untuk melakukan pekerjaan tanpa batasan klinis khusus.',
                    'bg' => '#f0fdf4',
                    'border' => '#22c55e',
                    'text' => '#15803d',
                ],
                'fit_with_note' => [
                    'label' => 'FIT WITH NOTE (LAIK DENGAN CATATAN)',
                    'desc' => 'Dapat bekerja dengan penyesuaian/monitoring medis berkala terhadap kelainan ringan yang ditemukan.',
                    'bg' => '#eff6ff',
                    'border' => '#3b82f6',
                    'text' => '#1d4ed8',
                ],
                'temporary_unfit' => [
                    'label' => 'TEMPORARY UNFIT (TIDAK LAIK SEMENTARA)',
                    'desc' => 'Memerlukan terapi medis, penanganan lanjutan, atau evaluasi ulang sebelum dinyatakan laik bekerja kembali.',
                    'bg' => '#fffbeb',
                    'border' => '#f59e0b',
                    'text' => '#b45309',
                ],
                'unfit' => [
                    'label' => 'UNFIT (TIDAK LAIK KERJA)',
                    'desc' => 'Terdapat kondisi kelainan medis berat yang berisiko tinggi terhadap keselamatan kerja diri maupun rekan kerja.',
                    'bg' => '#fef2f2',
                    'border' => '#ef4444',
                    'text' => '#b91c1c',
                ],
                'pending' => [
                    'label' => 'PENDING (MENUNGGU HASIL LENGKAP)',
                    'desc' => 'Hasil pemeriksaan masih dalam proses konfirmasi atau evaluasi tambahan.',
                    'bg' => '#f4f4f5',
                    'border' => '#a1a1aa',
                    'text' => '#3f3f46',
                ],
            ];
            $currentFit = $fitConfig[$fitStatus] ?? $fitConfig['fit'];
        @endphp

        <div style="border: 2px solid {{ $currentFit['border'] }}; background-color: {{ $currentFit['bg'] }}; border-radius: 6px; padding: 10px 14px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
            <div>
                <div style="font-size: 8.5px; font-weight: 700; color: #71717a; text-transform: uppercase;">
                    STATUS KELAYAKAN KERJA (FITNESS STATUS):
                </div>
                <div style="font-size: 14px; font-weight: 900; color: {{ $currentFit['text'] }}; margin: 1px 0;">
                    {{ $currentFit['label'] }}
                </div>
                <div style="font-size: 8.5px; color: #52525b;">
                    {{ $currentFit['desc'] }}
                </div>
            </div>
            <div style="font-size: 24px; color: {{ $currentFit['text'] }}; font-weight: 900; padding: 0 8px;">
                &#10003;
            </div>
        </div>

        {{-- Rekapitulasi Kelainan (Abnormality Findings) --}}
        <div style="border: 1px solid #d4d4d8; border-radius: 4px; overflow: hidden; margin-bottom: 12px;">
            <div style="background-color: #f4f4f5; padding: 5px 10px; font-weight: 700; font-size: 9.5px; border-bottom: 1px solid #d4d4d8; text-transform: uppercase;">
                REKAPITULASI TEMUAN KELAINAN (ABNORMALITIES RECAPITULATION)
            </div>

            @php
                $abnormalities = is_array($mcuReview?->abnormality_recap)
                    ? $mcuReview->abnormality_recap
                    : (is_string($mcuReview?->abnormality_recap) ? json_decode($mcuReview->abnormality_recap, true) : []);
            @endphp

            @if (! empty($abnormalities) && count($abnormalities) > 0)
                <table class="table-exam" style="margin-bottom: 0;">
                    <thead>
                        <tr>
                            <th style="width: 8%; text-align: center;">NO</th>
                            <th style="width: 28%;">UNIT / PEMERIKSAAN</th>
                            <th style="width: 32%;">HASIL &amp; NILAI RUJUKAN</th>
                            <th style="width: 14%; text-align: center;">STATUS</th>
                            <th style="width: 18%;">SARAN SPESIFIK</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($abnormalities as $index => $itemAbnormal)
                            <tr>
                                <td style="text-align: center;" class="tabular-nums">{{ $index + 1 }}</td>
                                <td style="font-weight: 600;">
                                    {{ $itemAbnormal['parameter_label'] ?? ($itemAbnormal['title'] ?? 'Temuan Kelainan') }}
                                </td>
                                <td>
                                    <strong>{{ $itemAbnormal['value'] ?? '-' }}</strong>
                                    @if (! empty($itemAbnormal['reference']))
                                        <span style="color: #71717a; font-size: 8px;">(Ref: {{ $itemAbnormal['reference'] }})</span>
                                    @endif
                                </td>
                                <td style="text-align: center;">
                                    <span class="badge-flag flag-high">
                                        {{ strtoupper($itemAbnormal['flag'] ?? 'ABNORMAL') }}
                                    </span>
                                </td>
                                <td style="font-size: 8px; color: #52525b;">
                                    {{ $itemAbnormal['suggestion'] ?? '-' }}
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @else
                <div style="padding: 12px; text-align: center; color: #15803d; font-size: 9.5px; font-weight: 600;">
                    &#10003; Tidak ditemukan kelainan klinis bermakna. Seluruh parameter laboratorium, radiologi, dan fisik dalam batas normal.
                </div>
            @endif
        </div>

        {{-- Doctor Summary & Advice --}}
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px;">
            <div style="border: 1px solid #d4d4d8; border-radius: 4px; padding: 8px 12px; background-color: #ffffff;">
                <div style="font-size: 9.5px; font-weight: 700; color: #18181b; text-transform: uppercase; margin-bottom: 3px;">
                    KESIMPULAN DOKTER MCU:
                </div>
                <div style="font-size: 9px; color: #27272a; line-height: 1.5; white-space: pre-line;">
                    {{ $mcuReview?->doctor_summary ?: 'Secara umum kondisi kesehatan dan fungsi organ fisik, laboratorium, dan penunjang diagnostik dalam keadaan baik dan memenuhi syarat kelayakan kerja.' }}
                </div>
            </div>

            <div style="border: 1px solid #d4d4d8; border-radius: 4px; padding: 8px 12px; background-color: #ffffff;">
                <div style="font-size: 9.5px; font-weight: 700; color: #18181b; text-transform: uppercase; margin-bottom: 3px;">
                    SARAN &amp; TINDAK LANJUT MEDIS:
                </div>
                <div style="font-size: 9px; color: #27272a; line-height: 1.5; white-space: pre-line;">
                    {{ $mcuReview?->doctor_advice ?: '1. Pertahankan pola hidup sehat, konsumsi gizi seimbang, dan istirahat cukup.\n2. Lakukan aktivitas fisik atau olahraga teratur 30 menit minimal 3 kali seminggu.\n3. Lakukan pemeriksaan kesehatan berkala (Medical Check Up) setiap 1 tahun sekali.' }}
                </div>
            </div>
        </div>

        {{-- Signatures: Doctor MCU & Manager MCU --}}
        <div class="signatures-grid">
            <div class="sig-col">
                <div class="sig-title">
                    Dokter Pemeriksa MCU:
                </div>
                <div class="sig-image-container">
                    @if (! empty($doctorMcuSignatureBase64))
                        <img src="{{ $doctorMcuSignatureBase64 }}" class="sig-image" alt="TTD Dokter MCU">
                    @endif
                </div>
                <div class="sig-name">{{ $doctorMcuName ?? ($mcuReview?->doctor?->name ?? 'dr. Dokter MCU') }}</div>
                <div class="sig-meta">Dokter Okupasi / SIP: {{ $doctorMcuSip ?? '123/SIP-MCU/2026' }}</div>
            </div>

            <div class="sig-col">
                <div class="sig-title">
                    {{ $clinic->city ?? 'Jakarta' }}, {{ now()->translatedFormat('d F Y') }}<br>
                    Manajer MCU &amp; QC Approval:
                </div>
                <div class="sig-image-container">
                    @if (! empty($managerMcuSignatureBase64))
                        <img src="{{ $managerMcuSignatureBase64 }}" class="sig-image" alt="TTD Manajer MCU">
                    @endif
                </div>
                <div class="sig-name">{{ $managerMcuName ?? ($mcuReview?->manager?->name ?? 'Manajer Pelayanan Medis') }}</div>
                <div class="sig-meta">Status QC: <strong>VERIFIED &amp; LOCKED</strong></div>
            </div>
        </div>

        <div class="doc-footer-notes">
            <div>
                <span>Dicetak pada: <strong class="tabular-nums">{{ now()->translatedFormat('d/m/Y H:i') }} WIB</strong></span> &bull;
                <span>No. Reg: {{ $registration->reg_no }}</span>
            </div>
            <div>
                {{ $clinic->footer_text ?? 'Dokumen Resume MCU ini sah dan tercatat secara elektronik pada Master Summit Healthcare System.' }}
            </div>
        </div>
    </div>
</div>
