<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Kartu Peserta MCU - {{ $registration->reg_no }}</title>
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
    <style>
        @page {
            size: 85mm 54mm;
            margin: 0;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        body {
            font-family: Arial, sans-serif;
            font-size: 8pt;
            line-height: 1.25;
            color: #1e293b;
            background: #fff;
            width: 85mm;
            height: 54mm;
            padding: 3mm 4mm;
            overflow: hidden;
            border: 1px solid #cbd5e1;
            position: relative;
        }
        .header-card {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1.5px solid #0f766e;
            padding-bottom: 2px;
            margin-bottom: 3px;
        }
        .clinic-brand {
            font-size: 8.5pt;
            font-weight: bold;
            color: #0f766e;
            text-transform: uppercase;
        }
        .badge-card {
            font-size: 6.5pt;
            background: #f1f5f9;
            border: 0.5px solid #cbd5e1;
            padding: 1px 4px;
            border-radius: 2px;
            font-weight: 600;
        }
        .title-mcu {
            font-size: 7pt;
            font-weight: 600;
            color: #475569;
            margin-bottom: 3px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .content-grid {
            display: grid;
            grid-template-columns: 50mm 1fr;
            gap: 2mm;
            align-items: center;
        }
        .info-table {
            width: 100%;
            font-size: 7pt;
            border-collapse: collapse;
        }
        .info-table td {
            padding: 1px 0;
            vertical-align: top;
        }
        .info-table td.label {
            color: #64748b;
            width: 16mm;
        }
        .info-table td.val {
            font-weight: bold;
            color: #0f172a;
        }
        .barcode-side {
            text-align: center;
        }
        .barcode-svg {
            max-width: 25mm;
            height: 18mm;
            display: block;
            margin: 0 auto;
        }
        .footer-note {
            position: absolute;
            bottom: 2mm;
            left: 4mm;
            right: 4mm;
            font-size: 5.5pt;
            color: #94a3b8;
            border-top: 0.5px solid #e2e8f0;
            padding-top: 1.5px;
            display: flex;
            justify-content: space-between;
        }
        @media screen {
            body {
                margin: 30px auto;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                border-radius: 4px;
            }
        }
    </style>
</head>
<body>
    <div class="header-card">
        <span class="clinic-brand">{{ $clinic->clinic_name ?? 'KLINIK KESEHATAN & MCU' }}</span>
        <span class="badge-card">KARTU PESERTA</span>
    </div>

    <div class="title-mcu">
        {{ $registration->mcuEvent?->event_name ?? 'MEDICAL CHECK UP' }}
    </div>

    <div class="content-grid">
        <table class="info-table">
            <tr>
                <td class="label">Nama</td>
                <td class="val">{{ $patient->name }}</td>
            </tr>
            <tr>
                <td class="label">No. Reg</td>
                <td class="val font-mono" style="font-family: monospace;">{{ $registration->reg_no }}</td>
            </tr>
            <tr>
                <td class="label">NIK / NRM</td>
                <td class="val">{{ $patient->nik ?: $patient->medical_record_no }}</td>
            </tr>
            <tr>
                <td class="label">JK / Usia</td>
                <td class="val">{{ $genderText }} / {{ $age }} tahun</td>
            </tr>
            <tr>
                <td class="label">Bagian</td>
                <td class="val">{{ $registration->department_snapshot ?: '-' }}</td>
            </tr>
            <tr>
                <td class="label">Paket</td>
                <td class="val" style="color: #0f766e;">{{ $registration->package?->name ?? 'Paket MCU' }}</td>
            </tr>
        </table>

        <div class="barcode-side">
            <svg id="barcode" class="barcode-svg"></svg>
        </div>
    </div>

    <div class="footer-note">
        <span>Tgl: {{ $registration->registered_at?->format('d/m/Y') ?? date('d/m/Y') }}</span>
        <span>Harap bawa kartu ini selama rangkaian pemeriksaan</span>
    </div>

    <script>
        JsBarcode("#barcode", "{{ $registration->reg_no }}", {
            format: "CODE128",
            width: 1.1,
            height: 38,
            displayValue: false,
            margin: 0
        });
        window.addEventListener('load', () => {
            window.print();
        });
    </script>
</body>
</html>
