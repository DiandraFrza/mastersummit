<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kartu Kontrol - {{ $registration->reg_no }} - {{ $patient->name }}</title>
    <style>
        /* CSS Reset & Print Defaults */
        *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Public Sans", Inter, sans-serif;
            font-size: 10px;
            color: #09090b;
            background-color: #f4f4f5;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .tabular-nums {
            font-variant-numeric: tabular-nums;
        }

        /* Screen Toolbar */
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

        .toolbar-title {
            font-size: 13px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .toolbar-actions {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .btn-toolbar {
            background-color: #27272a;
            color: #ffffff;
            border: 1px solid #3f3f46;
            padding: 6px 14px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: all 0.15s ease;
        }

        .btn-toolbar:hover {
            background-color: #3f3f46;
        }

        .btn-primary {
            background-color: #2563eb;
            border-color: #1d4ed8;
        }

        .btn-primary:hover {
            background-color: #1d4ed8;
        }

        .size-selector {
            background-color: #27272a;
            color: #ffffff;
            border: 1px solid #3f3f46;
            padding: 6px 10px;
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
        }

        /* Sheet Containers on Screen */
        .print-canvas {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 24px 0 48px;
            gap: 24px;
        }

        .control-card-page {
            background: #ffffff;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
            position: relative;
            overflow: hidden;
        }

        /* Page Size Specifications */
        @if ($paperSize === 'A5')
            @page {
                size: A5 portrait;
                margin: 5mm;
            }
            .control-card-page {
                width: 148mm;
                min-height: 205mm;
                padding: 7mm 8mm;
            }
        @elseif ($paperSize === 'A6')
            @page {
                size: A6 portrait;
                margin: 3mm;
            }
            .control-card-page {
                width: 105mm;
                min-height: 144mm;
                padding: 4mm 5mm;
                font-size: 8.5px;
            }
        @elseif ($paperSize === 'A4_2IN1')
            @page {
                size: A4 portrait;
                margin: 5mm;
            }
            .control-card-page {
                width: 210mm;
                min-height: 290mm;
                padding: 6mm 10mm;
            }
            .a4-wrapper {
                display: flex;
                flex-direction: column;
                height: 100%;
                justify-content: space-between;
            }
            .card-half {
                height: 48.5%;
                position: relative;
            }
            .cutting-line {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                margin: 6px 0;
                color: #71717a;
                font-size: 9px;
                font-weight: 500;
                border-top: 1px dashed #a1a1aa;
                padding-top: 4px;
            }
        @endif

        /* Dynamic Kop Surat */
        .kop-header {
            display: flex;
            align-items: center;
            gap: 12px;
            padding-bottom: 6px;
            border-bottom: 2.5px double #18181b;
            position: relative;
        }

        .kop-logo {
            width: 48px;
            height: 48px;
            object-fit: contain;
            flex-shrink: 0;
        }

        .kop-info {
            flex-grow: 1;
            text-align: center;
        }

        .kop-clinic-name {
            font-size: {{ $paperSize === 'A6' ? '11px' : '13px' }};
            font-weight: 800;
            letter-spacing: 0.5px;
            color: #09090b;
            text-transform: uppercase;
            line-height: 1.2;
        }

        .kop-clinic-sub {
            font-size: {{ $paperSize === 'A6' ? '7.5px' : '8.5px' }};
            font-weight: 500;
            color: #3f3f46;
            margin-top: 1px;
            line-height: 1.2;
        }

        .kop-clinic-meta {
            font-size: {{ $paperSize === 'A6' ? '7px' : '8px' }};
            color: #52525b;
            margin-top: 2px;
            line-height: 1.3;
        }

        /* Watermark Background */
        .watermark-bg {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 55%;
            opacity: {{ $watermarkOpacity }};
            pointer-events: none;
            z-index: 0;
        }

        /* Document Title & Barcode Row */
        .doc-title-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 8px;
            margin-bottom: 6px;
            position: relative;
            z-index: 1;
        }

        .doc-title-block h1 {
            font-size: {{ $paperSize === 'A6' ? '10px' : '12px' }};
            font-weight: 800;
            letter-spacing: 0.5px;
            color: #09090b;
            text-transform: uppercase;
        }

        .doc-title-block p {
            font-size: {{ $paperSize === 'A6' ? '7px' : '8px' }};
            color: #52525b;
            margin-top: 1px;
        }

        .barcode-block {
            text-align: right;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            justify-content: center;
        }

        .barcode-svg-container {
            height: {{ $paperSize === 'A6' ? '42px' : '52px' }};
            width: {{ $paperSize === 'A6' ? '42px' : '52px' }};
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .barcode-svg-container svg {
            height: 100%;
            width: 100%;
        }

        .barcode-text {
            font-family: monospace;
            font-size: {{ $paperSize === 'A6' ? '7.5px' : '8.5px' }};
            font-weight: 700;
            letter-spacing: 0.5px;
            color: #09090b;
            margin-top: 2px;
            text-align: center;
        }

        /* Patient Demographic Block */
        .patient-box {
            border: 1px solid #18181b;
            background-color: rgba(255, 255, 255, 0.85);
            border-radius: 3px;
            padding: {{ $paperSize === 'A6' ? '4px 6px' : '6px 8px' }};
            margin-bottom: 8px;
            position: relative;
            z-index: 1;
        }

        .patient-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            column-gap: 12px;
            row-gap: {{ $paperSize === 'A6' ? '2px' : '3px' }};
        }

        .patient-row {
            display: flex;
            align-items: baseline;
            font-size: {{ $paperSize === 'A6' ? '7.5px' : '9px' }};
            line-height: 1.3;
        }

        .patient-label {
            width: {{ $paperSize === 'A6' ? '65px' : '85px' }};
            color: #52525b;
            font-weight: 500;
            flex-shrink: 0;
        }

        .patient-separator {
            margin-right: 4px;
            color: #71717a;
        }

        .patient-val {
            font-weight: 600;
            color: #09090b;
            word-break: break-word;
        }

        /* Stations Checklist Table */
        .station-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
            position: relative;
            z-index: 1;
        }

        .station-table th,
        .station-table td {
            border: 1px solid #18181b;
            padding: {{ $paperSize === 'A6' ? '3px 4px' : '4px 6px' }};
            vertical-align: middle;
        }

        .station-table th {
            background-color: #f4f4f5;
            font-size: {{ $paperSize === 'A6' ? '7.5px' : '8.5px' }};
            font-weight: 700;
            text-transform: uppercase;
            text-align: center;
            letter-spacing: 0.3px;
        }

        .station-table td {
            font-size: {{ $paperSize === 'A6' ? '7.5px' : '8.5px' }};
            line-height: 1.25;
        }

        .col-num {
            width: {{ $paperSize === 'A6' ? '20px' : '24px' }};
            text-align: center;
            font-weight: 600;
        }

        .col-station {
            width: {{ $paperSize === 'A6' ? '100px' : '140px' }};
        }

        .station-title {
            font-weight: 700;
            color: #09090b;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .station-room {
            font-size: {{ $paperSize === 'A6' ? '6.5px' : '7.5px' }};
            color: #52525b;
            font-weight: normal;
        }

        .station-desc {
            font-size: {{ $paperSize === 'A6' ? '7px' : '8px' }};
            color: #3f3f46;
        }

        .col-time {
            width: {{ $paperSize === 'A6' ? '40px' : '50px' }};
            text-align: center;
        }

        .col-signature {
            width: {{ $paperSize === 'A6' ? '75px' : '95px' }};
            text-align: center;
        }

        .col-notes {
            width: {{ $paperSize === 'A6' ? '70px' : '85px' }};
        }

        .checkbox-square {
            display: inline-block;
            width: 9px;
            height: 9px;
            border: 1px solid #18181b;
            border-radius: 1px;
            margin-right: 3px;
            vertical-align: middle;
        }

        /* Footer Notes & Rules */
        .footer-block {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: auto;
            padding-top: 4px;
            border-top: 1px solid #d4d4d8;
            font-size: {{ $paperSize === 'A6' ? '6.5px' : '7.5px' }};
            color: #52525b;
            position: relative;
            z-index: 1;
        }

        .rules-list {
            list-style: none;
            line-height: 1.35;
        }

        .rules-list li::before {
            content: "• ";
            color: #71717a;
            font-weight: bold;
        }

        .print-meta {
            text-align: right;
            line-height: 1.35;
            flex-shrink: 0;
        }

        /* Print Specific Behavior */
        @media print {
            body {
                background: none;
                margin: 0;
            }

            .no-print-toolbar {
                display: none !important;
            }

            .print-canvas {
                padding: 0;
                gap: 0;
            }

            .control-card-page {
                box-shadow: none;
                margin: 0;
                page-break-after: always;
            }
        }
    </style>
</head>
<body>

    {{-- Screen Interactive Toolbar --}}
    <div class="no-print-toolbar">
        <div class="toolbar-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
            <span>Pratinjau Cetak Kartu Kontrol ({{ $registration->reg_no }})</span>
        </div>
        <div class="toolbar-actions">
            <form method="GET" action="" style="display: inline-flex; align-items: center; gap: 6px;">
                <label for="size" style="font-size: 11px; color: #a1a1aa;">Ukuran Kertas:</label>
                <select name="size" id="size" class="size-selector" onchange="this.form.submit()">
                    <option value="A5" {{ $paperSize === 'A5' ? 'selected' : '' }}>A5 (Standar Single)</option>
                    <option value="A6" {{ $paperSize === 'A6' ? 'selected' : '' }}>A6 (Saku Kompak)</option>
                    <option value="A4_2IN1" {{ $paperSize === 'A4_2IN1' ? 'selected' : '' }}>A4 (2 in 1 Hemat Kertas)</option>
                </select>
            </form>
            <a href="{{ route('registrations.control-card.pdf', ['registration' => $registration->id, 'size' => $paperSize]) }}" class="btn-toolbar" target="_blank">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span>Unduh PDF</span>
            </a>
            <button onclick="window.print()" class="btn-toolbar btn-primary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                <span>Cetak Sekarang</span>
            </button>
            <button onclick="window.close()" class="btn-toolbar" style="color: #f87171;">
                <span>Tutup</span>
            </button>
        </div>
    </div>

    {{-- Main Printable Sheet Canvas --}}
    <div class="print-canvas">

        @if ($paperSize === 'A4_2IN1')
            {{-- A4 2 IN 1: Dual Copies on a Single A4 Page --}}
            <div class="control-card-page">
                <div class="a4-wrapper">
                    {{-- Copy 1 (Atas: Lembar Pasien) --}}
                    <div class="card-half">
                        @include('prints.partials.control_card_body', ['copyLabel' => 'LEMBAR PASIEN'])
                    </div>

                    {{-- Garis Pemotong --}}
                    <div class="cutting-line">
                        <span>✂</span>
                        <span>POTONG DI SINI (CUT HERE)</span>
                        <span>✂</span>
                    </div>

                    {{-- Copy 2 (Bawah: Lembar Rekam Medis / Klinik) --}}
                    <div class="card-half">
                        @include('prints.partials.control_card_body', ['copyLabel' => 'LEMBAR ARSIP KLINIK'])
                    </div>
                </div>
            </div>
        @else
            {{-- A5 / A6 Standard Single Page --}}
            <div class="control-card-page">
                @include('prints.partials.control_card_body', ['copyLabel' => 'KARTU ALUR PEMERIKSAAN'])
            </div>
        @endif

    </div>

    @if (! empty($autoPrint))
        <script>
            window.addEventListener('load', function() {
                setTimeout(function() {
                    window.print();
                }, 400);
            });
        </script>
    @endif

</body>
</html>
