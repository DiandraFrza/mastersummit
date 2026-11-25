<?php

namespace App\Exports;

use App\Models\McuEvent;
use App\Models\Package;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class McuParticipantsTemplateExport implements FromArray, WithHeadings, WithStyles, ShouldAutoSize, WithTitle
{
    protected McuEvent $mcuEvent;
    protected array $rows = [];

    public function __construct(McuEvent $mcuEvent)
    {
        $this->mcuEvent = $mcuEvent;
        $this->prepareData();
    }

    protected function prepareData(): void
    {
        // Get active packages matching referrer/event/year or any active package
        $packages = Package::where('is_active', true)
            ->where(function ($q) {
                if ($this->mcuEvent->referrer_id) {
                    $q->where('referrer_id', $this->mcuEvent->referrer_id)
                      ->orWhereNull('referrer_id');
                }
            })
            ->pluck('name')
            ->toArray();

        $defaultPackage = ! empty($packages) ? $packages[0] : 'Paket Standar MCU';
        $secondPackage = count($packages) > 1 ? $packages[1] : $defaultPackage;

        // Provide 2 realistic example rows
        $this->rows = [
            [
                'NIK' => '3271011505900001',
                'Nama Lengkap' => 'Ahmad Fauzi',
                'Jenis Kelamin (L/P)' => 'L',
                'Tanggal Lahir (YYYY-MM-DD)' => '1990-05-15',
                'Bagian / Departemen' => 'Operasional',
                'Paket MCU' => $defaultPackage,
                'No. Telepon' => '081234567890',
                'Alamat' => 'Jl. Sudirman No. 45, Jakarta',
            ],
            [
                'NIK' => '3271012208920002',
                'Nama Lengkap' => 'Siti Rahmawati',
                'Jenis Kelamin (L/P)' => 'P',
                'Tanggal Lahir (YYYY-MM-DD)' => '1992-08-22',
                'Bagian / Departemen' => 'Keuangan',
                'Paket MCU' => $secondPackage,
                'No. Telepon' => '081398765432',
                'Alamat' => 'Jl. Thamrin No. 12, Jakarta',
            ],
        ];
    }

    public function headings(): array
    {
        return [
            'NIK',
            'Nama Lengkap',
            'Jenis Kelamin (L/P)',
            'Tanggal Lahir (YYYY-MM-DD)',
            'Bagian / Departemen',
            'Paket MCU',
            'No. Telepon',
            'Alamat',
        ];
    }

    public function array(): array
    {
        return $this->rows;
    }

    public function title(): string
    {
        return 'Peserta MCU';
    }

    public function styles(Worksheet $sheet): array
    {
        // Header styling: Slate dark header with bold white text
        $sheet->getStyle('A1:H1')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['argb' => 'FFFFFFFF'],
                'size' => 11,
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['argb' => 'FF1E293B'], // slate-800
            ],
            'alignment' => [
                'vertical' => Alignment::VERTICAL_CENTER,
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'wrapText' => true,
            ],
        ]);

        $sheet->getRowDimension(1)->setRowHeight(28);

        // Center columns: NIK (A), JK (C), Tgl Lahir (D)
        $sheet->getStyle('A2:A100')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('C2:D100')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Text format for NIK column to prevent scientific notation
        $sheet->getStyle('A2:A100')->getNumberFormat()->setFormatCode('@');
        $sheet->getStyle('G2:G100')->getNumberFormat()->setFormatCode('@');

        // Thin borders for data rows
        $highestRow = count($this->rows) + 1;
        $sheet->getStyle("A1:H{$highestRow}")->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['argb' => 'FFE2E8F0'],
                ],
            ],
        ]);

        return [];
    }
}
