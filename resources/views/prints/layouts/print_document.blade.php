<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Dokumen Cetak')</title>
    <style>
        /* CSS Reset & Print Defaults */
        *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Public Sans", "Inter", sans-serif;
            font-size: 10.5px;
            color: #09090b;
            background-color: #f4f4f5;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            line-height: 1.4;
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
            padding: 10px 24px;
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
            gap: 10px;
        }

        .toolbar-badge {
            display: inline-block;
            font-size: 10px;
            font-weight: 600;
            padding: 2px 8px;
            border-radius: 4px;
            background-color: #27272a;
            color: #a1a1aa;
            text-transform: uppercase;
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

        /* Print Canvas & Sheet */
        .print-canvas {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 24px 0 48px;
        }

        .print-sheet {
            background-color: #ffffff;
            width: 210mm;
            min-height: 297mm;
            padding: 12mm 15mm 12mm 15mm;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            position: relative;
            overflow: hidden;
            margin-bottom: 24px;
        }

        /* Watermark Background */
        .watermark-bg {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 140mm;
            opacity: {{ $watermarkOpacity ?? 0.08 }};
            pointer-events: none;
            z-index: 0;
        }

        .content-relative {
            position: relative;
            z-index: 1;
        }

        /* Kop Surat Header */
        .kop-header {
            display: flex;
            align-items: center;
            gap: 16px;
            padding-bottom: 8px;
            border-bottom: 2px solid #09090b;
            margin-bottom: 12px;
        }

        .kop-logo {
            width: 60px;
            height: 60px;
            object-fit: contain;
            flex-shrink: 0;
        }

        .kop-info {
            flex-grow: 1;
            text-align: center;
        }

        .kop-clinic-name {
            font-size: 15px;
            font-weight: 800;
            letter-spacing: 0.5px;
            color: #09090b;
            text-transform: uppercase;
        }

        .kop-clinic-sub {
            font-size: 10px;
            font-weight: 600;
            color: #4b5563;
            margin-top: 1px;
        }

        .kop-clinic-meta {
            font-size: 9px;
            color: #6b7280;
            margin-top: 3px;
            line-height: 1.3;
        }

        /* Document Title */
        .doc-title-block {
            text-align: center;
            margin-bottom: 12px;
        }

        .doc-title {
            font-size: 13px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #09090b;
            text-decoration: underline;
        }

        .doc-subtitle {
            font-size: 9.5px;
            color: #52525b;
            margin-top: 2px;
        }

        /* Patient Box */
        .patient-box {
            border: 1px solid #d4d4d8;
            border-radius: 4px;
            padding: 8px 12px;
            margin-bottom: 12px;
            background-color: #fafafa;
        }

        .patient-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px 16px;
            font-size: 9.5px;
        }

        .patient-row {
            display: flex;
            align-items: baseline;
        }

        .patient-label {
            width: 120px;
            color: #71717a;
            flex-shrink: 0;
        }

        .patient-sep {
            width: 10px;
            color: #71717a;
            flex-shrink: 0;
        }

        .patient-val {
            font-weight: 600;
            color: #18181b;
            word-break: break-word;
        }

        /* Data Tables */
        .table-exam {
            width: 100%;
            border-collapse: collapse;
            font-size: 9.5px;
            margin-bottom: 12px;
        }

        .table-exam th {
            background-color: #f4f4f5;
            border-top: 1px solid #a1a1aa;
            border-bottom: 1px solid #a1a1aa;
            padding: 5px 8px;
            text-align: left;
            font-weight: 700;
            color: #18181b;
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 0.3px;
        }

        .table-exam td {
            padding: 5px 8px;
            border-bottom: 1px solid #e4e4e7;
            vertical-align: middle;
        }

        .table-exam tr.group-header td {
            background-color: #f4f4f5;
            font-weight: 700;
            color: #18181b;
            text-transform: uppercase;
            font-size: 9px;
            padding: 4px 8px;
            border-bottom: 1px solid #d4d4d8;
        }

        /* Flag Badges */
        .badge-flag {
            display: inline-block;
            padding: 1px 6px;
            border-radius: 3px;
            font-weight: 700;
            font-size: 8.5px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }

        .flag-normal {
            color: #166534;
            background-color: #f0fdf4;
            border: 1px solid #bbf7d0;
        }

        .flag-low {
            color: #854d0e;
            background-color: #fefce8;
            border: 1px solid #fef08a;
        }

        .flag-high {
            color: #991b1b;
            background-color: #fef2f2;
            border: 1px solid #fecaca;
        }

        .flag-critical {
            color: #ffffff;
            background-color: #dc2626;
            border: 1px solid #b91c1c;
        }

        .flag-abnormal {
            color: #9a3412;
            background-color: #fff7ed;
            border: 1px solid #fed7aa;
        }

        /* Signatures Block */
        .signatures-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 16px;
            page-break-inside: avoid;
        }

        .sig-col {
            text-align: center;
        }

        .sig-title {
            font-size: 9.5px;
            color: #71717a;
            margin-bottom: 4px;
        }

        .sig-image-container {
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 4px 0;
        }

        .sig-image {
            max-height: 58px;
            max-width: 150px;
            object-fit: contain;
        }

        .sig-name {
            font-size: 10px;
            font-weight: 700;
            color: #09090b;
            text-decoration: underline;
        }

        .sig-meta {
            font-size: 8.5px;
            color: #71717a;
            margin-top: 1px;
        }

        /* Footer Notes */
        .doc-footer-notes {
            margin-top: 14px;
            padding-top: 6px;
            border-top: 1px dashed #d4d4d8;
            font-size: 8px;
            color: #71717a;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        /* Print Media Styles */
        @media print {
            body {
                background-color: #ffffff;
            }

            .no-print-toolbar {
                display: none !important;
            }

            .print-canvas {
                padding: 0;
            }

            .print-sheet {
                width: 100%;
                min-height: auto;
                box-shadow: none;
                margin: 0;
                padding: 0;
                page-break-after: always;
            }

            .print-sheet:last-child {
                page-break-after: auto;
            }

            @page {
                size: A4 portrait;
                margin: 10mm 12mm 10mm 12mm;
            }
        }
    </style>
    @yield('extra_styles')
</head>
<body>
    {{-- Screen Toolbar --}}
    <div class="no-print-toolbar">
        <div class="toolbar-title">
            <span>@yield('toolbar_title', 'Preview Cetak')</span>
            <span class="toolbar-badge">A4 HVS</span>
        </div>
        <div class="toolbar-actions">
            <button onclick="window.print()" class="btn-toolbar btn-primary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9"></polyline>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                    <rect x="6" y="14" width="12" height="8"></rect>
                </svg>
                Cetak Dokumen
            </button>
            @yield('extra_toolbar_actions')
            <button onclick="window.close()" class="btn-toolbar">
                Tutup
            </button>
        </div>
    </div>

    {{-- Main Printable Sheets --}}
    <div class="print-canvas">
        @yield('content')
    </div>

    @if (! empty($autoPrint))
        <script>
            window.addEventListener('load', function() {
                setTimeout(function() {
                    window.print();
                }, 300);
            });
        </script>
    @endif
</body>
</html>
