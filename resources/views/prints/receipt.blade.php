<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kwitansi - {{ $registration->reg_no }} - {{ $patient->name }}</title>
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
    <style>
        *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Public Sans", Inter, sans-serif;
            font-size: 11px;
            color: #09090b;
            background-color: #f4f4f5;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .tabular-nums {
            font-variant-numeric: tabular-nums;
        }

        .no-print-toolbar {
            position: sticky;
            top: 0;
            z-index: 100;
            background-color: #18181b;
            color: #ffffff;
            padding: 10px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
        }

        .btn-toolbar {
            background-color: #059669;
            color: #ffffff;
            border: 1px solid #047857;
            padding: 6px 14px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }

        .btn-toolbar:hover {
            background-color: #047857;
        }

        .receipt-container {
            width: 210mm;
            min-height: 148mm; /* Half A4 landscape or A5 friendly */
            margin: 20px auto;
            background: #ffffff;
            padding: 15mm 20mm;
            border-radius: 4px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
            border: 1px solid #e4e4e7;
        }

        .header-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0f766e;
            padding-bottom: 12px;
            margin-bottom: 14px;
        }

        .clinic-info h1 {
            font-size: 16px;
            font-weight: 700;
            color: #0f766e;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 3px;
        }

        .clinic-info p {
            font-size: 10px;
            color: #52525b;
            line-height: 1.35;
        }

        .receipt-title-box {
            text-align: right;
        }

        .receipt-title {
            font-size: 15px;
            font-weight: 800;
            color: #18181b;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .receipt-no {
            font-size: 11px;
            font-weight: 600;
            color: #0f766e;
            margin-top: 2px;
        }

        .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 14px;
            background: #fafafa;
            border: 1px solid #e4e4e7;
            border-radius: 4px;
            padding: 10px 14px;
        }

        .meta-row {
            display: flex;
            margin-bottom: 3px;
            font-size: 10.5px;
        }

        .meta-label {
            width: 110px;
            color: #71717a;
            font-weight: 500;
        }

        .meta-value {
            flex: 1;
            color: #18181b;
            font-weight: 600;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
        }

        .items-table th {
            background-color: #f4f4f5;
            color: #27272a;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border: 1px solid #d4d4d8;
            padding: 6px 8px;
            text-align: left;
        }

        .items-table td {
            border: 1px solid #e4e4e7;
            padding: 6px 8px;
            font-size: 10.5px;
            vertical-align: middle;
        }

        .items-table tr:nth-child(even) {
            background-color: #fafafa;
        }

        .summary-wrap {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 20px;
            margin-bottom: 20px;
        }

        .terbilang-box {
            flex: 1;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 8px 12px;
            font-size: 10px;
        }

        .terbilang-title {
            font-weight: 600;
            color: #64748b;
            margin-bottom: 2px;
            text-transform: uppercase;
        }

        .terbilang-text {
            font-weight: 700;
            font-style: italic;
            color: #0f766e;
        }

        .totals-table {
            width: 280px;
            border-collapse: collapse;
        }

        .totals-table td {
            padding: 3px 6px;
            font-size: 11px;
        }

        .totals-table .label {
            color: #71717a;
            font-weight: 500;
        }

        .totals-table .val {
            text-align: right;
            font-weight: 600;
        }

        .grand-total-row td {
            font-size: 13px !important;
            font-weight: 800 !important;
            color: #0f766e !important;
            border-top: 1.5px solid #0f766e;
            border-bottom: 1.5px solid #0f766e;
            padding: 5px 6px !important;
        }

        .badge-status {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
        }

        .badge-paid {
            background-color: #dcfce7;
            color: #15803d;
            border: 1px solid #86efac;
        }

        .badge-unpaid {
            background-color: #fee2e2;
            color: #b91c1c;
            border: 1px solid #fca5a5;
        }

        .badge-corporate {
            background-color: #e0f2fe;
            color: #0369a1;
            border: 1px solid #7dd3fc;
        }

        .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            text-align: center;
            margin-top: 25px;
            page-break-inside: avoid;
        }

        .sig-box {
            font-size: 10.5px;
        }

        .sig-space {
            height: 50px;
        }

        .sig-name {
            font-weight: 700;
            border-bottom: 1px solid #71717a;
            display: inline-block;
            min-width: 160px;
            padding-bottom: 2px;
        }

        @media print {
            body {
                background: none !important;
            }
            .no-print-toolbar {
                display: none !important;
            }
            .receipt-container {
                margin: 0 !important;
                padding: 10mm 15mm !important;
                width: 100% !important;
                box-shadow: none !important;
                border: none !important;
            }
        }
    </style>
</head>
<body>

    <div class="no-print-toolbar">
        <div style="font-size: 12px; font-weight: 600;">
            Kwitansi Pembayaran: <span style="color: #34d399;">{{ $registration->reg_no }}</span> ({{ $patient->name }})
        </div>
        <div style="display: flex; gap: 8px;">
            <button onclick="window.print()" class="btn-toolbar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 6 2 18 2 18 9"></polyline>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                    <rect x="6" y="14" width="12" height="8"></rect>
                </svg>
                Cetak Kwitansi
            </button>
            <button onclick="window.close()" class="btn-toolbar" style="background-color: #3f3f46; border-color: #52525b;">
                Tutup
            </button>
        </div>
    </div>

    <div class="receipt-container">
        <!-- Header -->
        <div class="header-section">
            <div class="clinic-info">
                <h1>{{ $clinic->name ?? 'Klinik & Laboratorium Medis' }}</h1>
                <p>{{ $clinic->address ?? 'Jl. Raya Kesehatan No. 10' }}</p>
                <p>Telp: {{ $clinic->phone ?? '(021) 555-0199' }} | Email: {{ $clinic->email ?? 'info@klinik.co.id' }}</p>
            </div>
            <div class="receipt-title-box">
                <div class="receipt-title">KWITANSI PEMBAYARAN</div>
                <div class="receipt-no">{{ $registration->reg_no }}</div>
                <div style="margin-top: 4px;">
                    <svg id="barcode-receipt"></svg>
                </div>
            </div>
        </div>

        <!-- Metadata Pasien -->
        <div class="meta-grid">
            <div>
                <div class="meta-row">
                    <div class="meta-label">No. Registrasi</div>
                    <div class="meta-value">{{ $registration->reg_no }}</div>
                </div>
                <div class="meta-row">
                    <div class="meta-label">No. RM (NRM)</div>
                    <div class="meta-value">{{ $patient->medical_record_no }}</div>
                </div>
                <div class="meta-row">
                    <div class="meta-label">Nama Pasien</div>
                    <div class="meta-value">{{ $patient->name }}</div>
                </div>
                <div class="meta-row">
                    <div class="meta-label">NIK / KTP</div>
                    <div class="meta-value">{{ $patient->nik ?: '-' }}</div>
                </div>
            </div>
            <div>
                <div class="meta-row">
                    <div class="meta-label">Tanggal / Waktu</div>
                    <div class="meta-value">{{ $registration->registered_at ? \Carbon\Carbon::parse($registration->registered_at)->translatedFormat('d F Y H:i') : '-' }}</div>
                </div>
                <div class="meta-row">
                    <div class="meta-label">Jenis Kelamin / Usia</div>
                    <div class="meta-value">{{ $genderText }} / {{ $age }} Tahun</div>
                </div>
                <div class="meta-row">
                    <div class="meta-label">Jenis Pasien</div>
                    <div class="meta-value">{{ strtoupper($registration->payer_type) }} ({{ $registration->company?->name ?? $registration->referrer?->name ?? 'APS' }})</div>
                </div>
                <div class="meta-row">
                    <div class="meta-label">Kasir / Petugas</div>
                    <div class="meta-value">{{ $registration->payments->first()?->receivedBy?->name ?? auth()->user()?->name ?? 'Petugas Kasir' }}</div>
                </div>
            </div>
        </div>

        <!-- Tabel Layanan / Pemeriksaan -->
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 30px; text-align: center;">No</th>
                    <th>Nama Pemeriksaan / Layanan</th>
                    <th style="width: 120px;">Unit</th>
                    <th style="width: 50px; text-align: center;">Qty</th>
                    <th style="width: 100px; text-align: right;">Tarif Satuan</th>
                    <th style="width: 110px; text-align: right;">Subtotal</th>
                </tr>
            </thead>
            <tbody>
                @php $no = 1; @endphp
                @if($registration->package)
                    <tr>
                        <td style="text-align: center;">{{ $no++ }}</td>
                        <td>
                            <strong>{{ $registration->package->name }}</strong>
                            <div style="font-size: 9px; color: #52525b;">Paket Pemeriksaan Kesehatan</div>
                        </td>
                        <td>Paket MCU</td>
                        <td style="text-align: center;">1</td>
                        <td style="text-align: right;" class="tabular-nums">Rp {{ number_format($registration->package->final_price ?? $registration->package->total_price, 0, ',', '.') }}</td>
                        <td style="text-align: right;" class="tabular-nums font-semibold">Rp {{ number_format($registration->package->final_price ?? $registration->package->total_price, 0, ',', '.') }}</td>
                    </tr>
                    @foreach($registration->items->where('is_package_item', false) as $item)
                        <tr>
                            <td style="text-align: center;">{{ $no++ }}</td>
                            <td>{{ $item->service_name_snapshot ?? $item->service?->name }} (Tambahan)</td>
                            <td>{{ strtoupper($item->category) }}</td>
                            <td style="text-align: center;">1</td>
                            <td style="text-align: right;" class="tabular-nums">Rp {{ number_format($item->price_snapshot, 0, ',', '.') }}</td>
                            <td style="text-align: right;" class="tabular-nums font-semibold">Rp {{ number_format($item->price_snapshot, 0, ',', '.') }}</td>
                        </tr>
                    @endforeach
                @else
                    @foreach($registration->items as $item)
                        <tr>
                            <td style="text-align: center;">{{ $no++ }}</td>
                            <td>{{ $item->service_name_snapshot ?? $item->service?->name }}</td>
                            <td>{{ strtoupper($item->category) }}</td>
                            <td style="text-align: center;">1</td>
                            <td style="text-align: right;" class="tabular-nums">Rp {{ number_format($item->price_snapshot, 0, ',', '.') }}</td>
                            <td style="text-align: right;" class="tabular-nums font-semibold">Rp {{ number_format($item->price_snapshot, 0, ',', '.') }}</td>
                        </tr>
                    @endforeach
                @endif
            </tbody>
        </table>

        <!-- Ringkasan Finansial -->
        @php
            $firstPayment = $registration->payments->first();
            $paymentMethod = $firstPayment?->method ? strtoupper($firstPayment->method) : 'TUNAI';
            $bankName = $firstPayment?->bank?->name ? ' (' . $firstPayment->bank->name . ')' : '';
            $paidTotal = (float) $registration->paid_amount;
            $grandTotal = (float) $registration->grand_total;
            $change = max(0, $paidTotal - $grandTotal);
            $remaining = max(0, $grandTotal - $paidTotal);

            // Fungsi Terbilang Rupiah Sederhana
            function terbilang($angka) {
                $bil = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
                if ($angka < 12) return " " . $bil[$angka];
                elseif ($angka < 20) return terbilang($angka - 10) . " Belas";
                elseif ($angka < 100) return terbilang(floor($angka / 10)) . " Puluh" . terbilang($angka % 10);
                elseif ($angka < 200) return " Seratus" . terbilang($angka - 100);
                elseif ($angka < 1000) return terbilang(floor($angka / 100)) . " Ratus" . terbilang($angka % 100);
                elseif ($angka < 2000) return " Seribu" . terbilang($angka - 1000);
                elseif ($angka < 1000000) return terbilang(floor($angka / 1000)) . " Ribu" . terbilang($angka % 1000);
                elseif ($angka < 1000000000) return terbilang(floor($angka / 1000000)) . " Juta" . terbilang($angka % 1000000);
                return "";
            }
            $terbilangText = trim(terbilang($grandTotal)) . " Rupiah";
        @endphp

        <div class="summary-wrap">
            <div class="terbilang-box">
                <div class="terbilang-title">Terbilang:</div>
                <div class="terbilang-text"># {{ $terbilangText }} #</div>
                <div style="margin-top: 10px; font-size: 10px; color: #52525b;">
                    <div>Metode Pembayaran: <strong>{{ $paymentMethod }}{{ $bankName }}</strong></div>
                    <div style="margin-top: 4px;">Status: 
                        @if($registration->payment_status === 'paid')
                            <span class="badge-status badge-paid">LUNAS</span>
                        @elseif($registration->payment_status === 'corporate_billed')
                            <span class="badge-status badge-corporate">TAGIHAN PERUSAHAAN</span>
                        @else
                            <span class="badge-status badge-unpaid">BELUM LUNAS</span>
                        @endif
                    </div>
                </div>
            </div>

            <table class="totals-table">
                <tr>
                    <td class="label">Total Tarif:</td>
                    <td class="val tabular-nums">Rp {{ number_format($registration->subtotal, 0, ',', '.') }}</td>
                </tr>
                @if($registration->discount_amount > 0)
                <tr>
                    <td class="label">Diskon:</td>
                    <td class="val tabular-nums" style="color: #dc2626;">- Rp {{ number_format($registration->discount_amount, 0, ',', '.') }}</td>
                </tr>
                @endif
                <tr class="grand-total-row">
                    <td>TOTAL AKHIR:</td>
                    <td class="val tabular-nums">Rp {{ number_format($grandTotal, 0, ',', '.') }}</td>
                </tr>
                <tr>
                    <td class="label">Jumlah Dibayar:</td>
                    <td class="val tabular-nums">Rp {{ number_format($paidTotal, 0, ',', '.') }}</td>
                </tr>
                @if($registration->payment_status === 'paid' && $change > 0)
                <tr>
                    <td class="label">Kembalian:</td>
                    <td class="val tabular-nums" style="color: #16a34a;">Rp {{ number_format($change, 0, ',', '.') }}</td>
                </tr>
                @elseif($remaining > 0 && $registration->payment_status !== 'corporate_billed')
                <tr>
                    <td class="label" style="color: #dc2626; font-weight: 700;">Sisa Tagihan:</td>
                    <td class="val tabular-nums" style="color: #dc2626; font-weight: 700;">Rp {{ number_format($remaining, 0, ',', '.') }}</td>
                </tr>
                @endif
            </table>
        </div>

        <!-- Signatures -->
        <div class="signatures">
            <div class="sig-box">
                <div>Pasien / Pembayar,</div>
                <div class="sig-space"></div>
                <div class="sig-name">{{ $patient->name }}</div>
            </div>
            <div class="sig-box">
                <div>Petugas Kasir,</div>
                <div class="sig-space"></div>
                <div class="sig-name">{{ $registration->payments->first()?->receivedBy?->name ?? auth()->user()?->name ?? 'Kasir Klinik' }}</div>
            </div>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            if (typeof JsBarcode === 'function') {
                JsBarcode('#barcode-receipt', '{{ $registration->reg_no }}', {
                    format: 'CODE128',
                    width: 1.2,
                    height: 28,
                    displayValue: false,
                    margin: 0
                });
            }

            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('print') === '1') {
                window.print();
            }
        });
    </script>
</body>
</html>
