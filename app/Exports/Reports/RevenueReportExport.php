<?php

namespace App\Exports\Reports;

use Maatwebsite\Excel\Concerns\Export;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class RevenueReportExport implements WithMultipleSheets, Export
{
    public function __construct(protected array $data) {}

    public function sheets(): array
    {
        return [
            new RevenuePaymentsSheet($this->data),
            new RevenueRecapSheet($this->data),
        ];
    }
}

class RevenuePaymentsSheet implements FromArray, WithHeadings, WithStyles, ShouldAutoSize, WithTitle
{
    protected array $rows = [];

    public function __construct(protected array $data)
    {
        $this->prepareRows();
    }

    public function title(): string
    {
        return 'Rincian Pembayaran';
    }

    public function headings(): array
    {
        return [
            'No. Kwitansi',
            'Tanggal Bayar',
            'No. Registrasi',
            'No. RM',
            'Nama Pasien',
            'Jenis Pasien',
            'Perusahaan / Penjamin',
            'Metode Pembayaran',
            'Bank',
            'No. Referensi / Ref',
            'Jumlah Bayar (Rp)',
            'Status Tagihan Registrasi',
            'Kasir / Penerima',
        ];
    }

    public function prepareRows(): void
    {
        $payments = $this->data['payments']->items();
        foreach ($payments as $pay) {
            $reg = $pay->registration;
            $patient = $reg?->patient;

            $payerLabel = match ($reg?->payer_type) {
                'corporate' => 'Corporate MCU',
                'referrer' => 'Rujukan Luar',
                default => 'APS (Pribadi)',
            };

            $methodLabel = match ($pay->payment_method) {
                'cash' => 'Tunai',
                'transfer' => 'Transfer Bank',
                'qris' => 'QRIS',
                'edc' => 'Debit/EDC',
                'invoice_corporate' => 'Invoice Perusahaan',
                default => strtoupper($pay->payment_method),
            };

            $this->rows[] = [
                $pay->payment_no,
                $pay->paid_at ? $pay->paid_at->format('d/m/Y H:i') : '-',
                $reg?->reg_no ?? '-',
                $patient?->medical_record_no ?? '-',
                $patient?->name ?? '-',
                $payerLabel,
                $reg?->company?->name ?? $reg?->referrer?->name ?? '-',
                $methodLabel,
                $pay->bank?->name ?? '-',
                $pay->reference_no ?? '-',
                (float) $pay->amount,
                strtoupper($reg?->payment_status ?? '-'),
                $pay->receivedBy?->name ?? '-',
            ];
        }
    }

    public function array(): array
    {
        return $this->rows;
    }

    public function styles(Worksheet $sheet): array
    {
        $lastRow = count($this->rows) + 1;
        $sheet->getStyle('A1:M1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 10],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '0F172A']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
        ]);

        $sheet->getRowDimension(1)->setRowHeight(24);

        if ($lastRow > 1) {
            $sheet->getStyle("K2:K{$lastRow}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle("A2:M{$lastRow}")->getFont()->setSize(9.5);
            $sheet->getStyle("A2:D{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        }

        return [];
    }
}

class RevenueRecapSheet implements FromArray, WithHeadings, WithStyles, ShouldAutoSize, WithTitle
{
    protected array $rows = [];

    public function __construct(protected array $data)
    {
        $this->prepareRows();
    }

    public function title(): string
    {
        return 'Rekapitulasi Pendapatan';
    }

    public function headings(): array
    {
        return [
            'Kategori / Uraian',
            'Jumlah Transaksi / Pasien',
            'Total Nilai Tagihan (Rp)',
            'Total Diterima / Lunas (Rp)',
            'Sisa Piutang / Tagihan (Rp)',
        ];
    }

    public function prepareRows(): void
    {
        // 1. Rekap per Jenis Pasien
        $this->rows[] = ['--- REKAP MENURUT PENJAMIN & SPLIT BILLING ---', '', '', '', ''];
        foreach ($this->data['recap_by_payer'] as $item) {
            $this->rows[] = [
                $item['label'],
                $item['reg_count'],
                $item['total_final'],
                $item['total_paid'],
                $item['total_remaining'],
            ];
        }

        $this->rows[] = ['', '', '', '', ''];
        $this->rows[] = ['--- REKAP MENURUT METODE PEMBAYARAN ---', '', '', '', ''];
        foreach ($this->data['recap_by_method'] as $m) {
            $this->rows[] = [
                $m['label'],
                $m['count'],
                '-',
                $m['total_amount'],
                '-',
            ];
        }

        $this->rows[] = ['', '', '', '', ''];
        $this->rows[] = ['--- TOTAL KESELURUHAN (KPI) ---', '', '', '', ''];
        $this->rows[] = [
            'Total Seluruh Pendapatan Masuk (Kas/Bank/QRIS/Invoice)',
            '-',
            $this->data['kpi']['total_billed'],
            $this->data['kpi']['total_revenue'],
            $this->data['kpi']['remaining_receivables'],
        ];
    }

    public function array(): array
    {
        return $this->rows;
    }

    public function styles(Worksheet $sheet): array
    {
        $lastRow = count($this->rows) + 1;
        $sheet->getStyle('A1:E1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 10],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '0F172A']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        $sheet->getRowDimension(1)->setRowHeight(24);

        if ($lastRow > 1) {
            $sheet->getStyle("C2:E{$lastRow}")->getNumberFormat()->setFormatCode('#,##0');
        }

        return [];
    }
}
