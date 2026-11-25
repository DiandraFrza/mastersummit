<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Label Lab - {{ $registration->reg_no }}</title>
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
    <style>
        @page {
            size: 50mm 30mm;
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
            font-size: 7.5pt;
            line-height: 1.15;
            color: #000;
            background: #fff;
            width: 50mm;
            height: 30mm;
            padding: 1.5mm 2mm;
            overflow: hidden;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 0.5pt solid #000;
            padding-bottom: 1px;
            margin-bottom: 1.5px;
            font-size: 6.5pt;
            font-weight: bold;
        }
        .patient-name {
            font-size: 8pt;
            font-weight: bold;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .patient-meta {
            font-size: 7pt;
            display: flex;
            justify-content: space-between;
            margin-top: 1px;
        }
        .barcode-container {
            text-align: center;
            margin: 1px 0;
        }
        .barcode-svg {
            max-width: 44mm;
            height: 9mm;
            display: block;
            margin: 0 auto;
        }
        .specimens-box {
            font-size: 6pt;
            font-weight: bold;
            border-top: 0.5pt solid #000;
            padding-top: 1px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        @media screen {
            body {
                margin: 20px auto;
                border: 1px dashed #ccc;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <span>{{ Str::limit($clinic->clinic_name ?? 'KLINIK MCU', 18) }}</span>
        <span>{{ date('d/m/Y') }}</span>
    </div>

    <div class="patient-name">{{ $patient->name }}</div>
    
    <div class="patient-meta">
        <span>{{ $patient->medical_record_no }} • {{ $genderText }}/{{ $age }} th</span>
        <span>{{ Str::limit($registration->department_snapshot ?? $companyName, 12) }}</span>
    </div>

    <div class="barcode-container">
        <svg id="barcode" class="barcode-svg"></svg>
    </div>

    <div class="specimens-box">
        TUB: {{ $specimens->take(3)->implode(' | ') }}
    </div>

    <script>
        JsBarcode("#barcode", "{{ $registration->reg_no }}", {
            format: "CODE128",
            width: 1.2,
            height: 24,
            displayValue: true,
            fontSize: 8,
            font: "monospace",
            textMargin: 1,
            margin: 0
        });
        window.addEventListener('load', () => {
            window.print();
        });
    </script>
</body>
</html>
