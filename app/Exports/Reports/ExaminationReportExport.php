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
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ExaminationReportExport implements WithMultipleSheets, Export
{
    public function __construct(protected array $data) {}

    public function sheets(): array
    {
        return [
            new ExaminationItemsSheet($this->data),
            new ExaminationRecapSheet($this->data),
        ];
    }
}

class ExaminationItemsSheet implements FromArray, WithHeadings, WithStyles, ShouldAutoSize, WithTitle
{
    protected array $rows = [];

    public function __construct(protected array $data)
    {
        $this->prepareRows();
    }

    public function title(): string
    {
        return 'Rincian Pemeriksaan';
    }

    public function headings(): array
    {
        return [
            'ID Item',
            'Tanggal Registrasi',
            'No. Registrasi',
            'No. RM',
            'Nama Pasien',
            'Jenis Kelamin',
            'Nama Layanan / Pemeriksaan',
            'Kategori',
            'Penjamin (Billed To)',
            'Perusahaan / Event MCU',
            'Tarif / Harga (Rp)',
            'Status Sampel',
            'Status Hasil',
        ];
    }

    public function prepareRows(): void
    {
        $items = $this->data['items']->items();
        foreach ($items as $item) {
            $reg = $item->registration;
            $patient = $reg?->patient;

            $categoryLabel = match ($item->category) {
                'lab' => 'Laboratorium',
                'radiology' => 'Radiologi',
                'electromedical' => 'Elektromedis',
                'physical' => 'Pemeriksaan Fisik',
                default => strtoupper($item->category),
            };

            $this->rows[] = [
                $item->id,
                $reg?->registered_at ? $reg->registered_at->format('d/m/Y H:i') : '-',
                $reg?->reg_no ?? '-',
                $patient?->medical_record_no ?? '-',
                $patient?->name ?? '-',
                $patient?->gender === 'L' ? 'L' : 'P',
                $item->service_name_snapshot,
                $categoryLabel,
                strtoupper($item->billed_to),
                $reg?->company?->name ?? $reg?->mcuEvent?->event_name ?? '-',
                (float) $item->final_price,
                strtoupper($item->sample_status),
                strtoupper($item->result_status),
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
            $sheet->getStyle("F2:F{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        }

        return [];
    }
}

class ExaminationRecapSheet implements FromArray, WithHeadings, WithStyles, ShouldAutoSize, WithTitle
{
    protected array $rows = [];

    public function __construct(protected array $data)
    {
        $this->prepareRows();
    }

    public function title(): string
    {
        return 'Rekap Volume & Nilai Layanan';
    }

    public function headings(): array
    {
        return [
            'Nama Layanan / Pemeriksaan',
            'Kategori',
            'Total Volume (Pasien/Item)',
            'Volume Pribadi (APS)',
            'Volume Corporate MCU',
            'Volume Perujuk',
            'Total Nilai Pendapatan (Rp)',
        ];
    }

    public function prepareRows(): void
    {
        foreach ($this->data['recap_by_service'] as $svc) {
            $categoryLabel = match ($svc->category) {
                'lab' => 'Laboratorium',
                'radiology' => 'Radiologi',
                'electromedical' => 'Elektromedis',
                'physical' => 'Pemeriksaan Fisik',
                default => strtoupper($svc->category),
            };

            $this->rows[] = [
                $svc->service_name,
                $categoryLabel,
                (int) $svc->total_volume,
                (int) $svc->personal_volume,
                (int) $svc->corporate_volume,
                (int) $svc->referrer_volume,
                (float) $svc->total_revenue,
            ];
        }

        $this->rows[] = ['', '', '', '', '', '', ''];
        $this->rows[] = [
            'TOTAL KESELURUHAN ITEM',
            '-',
            (int) $this->data['kpi']['total_items'],
            '-',
            '-',
            '-',
            (float) $this->data['kpi']['total_nominal'],
        ];
    }

    public function array(): array
    {
        return $this->rows;
    }

    public function styles(Worksheet $sheet): array
    {
        $lastRow = count($this->rows) + 1;
        $sheet->getStyle('A1:G1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 10],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '0F172A']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        $sheet->getRowDimension(1)->setRowHeight(24);

        if ($lastRow > 1) {
            $sheet->getStyle("C2:F{$lastRow}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle("G2:G{$lastRow}")->getNumberFormat()->setFormatCode('#,##0');
        }

        return [];
    }
}
