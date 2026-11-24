<?php

namespace App\Exports;

use App\Models\McuEvent;
use App\Models\Registration;
use App\Models\ServiceParameter;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class McuEventResultsTemplateExport implements FromArray, WithHeadings, WithStyles, ShouldAutoSize, WithTitle
{
    protected McuEvent $mcuEvent;
    protected string $category; // 'lab', 'audiometry', 'physical'
    protected array $headings = [];
    protected array $rows = [];
    protected Collection $parameters;

    public function __construct(McuEvent $mcuEvent, string $category = 'lab')
    {
        $this->mcuEvent = $mcuEvent;
        $this->category = $category;
        $this->prepareData();
    }

    protected function prepareData(): void
    {
        // 1. Fetch participants registered for this event
        $registrations = Registration::query()
            ->with(['patient', 'items.service.parameters' => function ($q) {
                $q->where('is_active', true)->orderBy('sort_order');
            }])
            ->where('mcu_event_id', $this->mcuEvent->id)
            ->where('workflow_status', '!=', 'void')
            ->orderBy('reg_no')
            ->get();

        // 2. Build parameter list for this category
        $parameters = collect();

        if ($this->category === 'audiometry') {
            // Standard Audiometry frequency list
            $this->headings = [
                'No. Reg',
                'NIK',
                'Nama Pasien',
                'JK',
                'Usia',
                'Departemen',
                '[AD_250_AC] Kanan 250Hz AC',
                '[AD_250_BC] Kanan 250Hz BC',
                '[AD_500_AC] Kanan 500Hz AC',
                '[AD_500_BC] Kanan 500Hz BC',
                '[AD_1000_AC] Kanan 1000Hz AC',
                '[AD_1000_BC] Kanan 1000Hz BC',
                '[AD_2000_AC] Kanan 2000Hz AC',
                '[AD_2000_BC] Kanan 2000Hz BC',
                '[AD_3000_AC] Kanan 3000Hz AC',
                '[AD_3000_BC] Kanan 3000Hz BC',
                '[AD_4000_AC] Kanan 4000Hz AC',
                '[AD_4000_BC] Kanan 4000Hz BC',
                '[AD_6000_AC] Kanan 6000Hz AC',
                '[AD_6000_BC] Kanan 6000Hz BC',
                '[AD_8000_AC] Kanan 8000Hz AC',
                '[AD_8000_BC] Kanan 8000Hz BC',
                '[AS_250_AC] Kiri 250Hz AC',
                '[AS_250_BC] Kiri 250Hz BC',
                '[AS_500_AC] Kiri 500Hz AC',
                '[AS_500_BC] Kiri 500Hz BC',
                '[AS_1000_AC] Kiri 1000Hz AC',
                '[AS_1000_BC] Kiri 1000Hz BC',
                '[AS_2000_AC] Kiri 2000Hz AC',
                '[AS_2000_BC] Kiri 2000Hz BC',
                '[AS_3000_AC] Kiri 3000Hz AC',
                '[AS_3000_BC] Kiri 3000Hz BC',
                '[AS_4000_AC] Kiri 4000Hz AC',
                '[AS_4000_BC] Kiri 4000Hz BC',
                '[AS_6000_AC] Kiri 6000Hz AC',
                '[AS_6000_BC] Kiri 6000Hz BC',
                '[AS_8000_AC] Kiri 8000Hz AC',
                '[AS_8000_BC] Kiri 8000Hz BC',
                '[DIAGNOSIS] Kesimpulan Audiometri',
                '[RECOMMENDATION] Saran Medis',
            ];
        } else {
            // Lab or Physical
            $targetCategory = $this->category === 'physical' ? 'physical' : 'lab';

            foreach ($registrations as $reg) {
                foreach ($reg->items as $item) {
                    if ($item->category === $targetCategory && $item->service) {
                        foreach ($item->service->parameters as $param) {
                            if (! $parameters->has($param->id)) {
                                $parameters->put($param->id, $param);
                            }
                        }
                    }
                }
            }

            // Fallback: If no parameters registered yet, load active parameters for that category
            if ($parameters->isEmpty()) {
                $defaultParams = ServiceParameter::whereHas('service', function ($q) use ($targetCategory) {
                    $q->where('category', $targetCategory)->where('is_active', true);
                })
                    ->where('is_active', true)
                    ->orderBy('sort_order')
                    ->get();

                foreach ($defaultParams as $dp) {
                    $parameters->put($dp->id, $dp);
                }
            }

            $this->parameters = $parameters;

            $baseHeadings = [
                'No. Reg',
                'NIK',
                'Nama Pasien',
                'JK',
                'Usia',
                'Departemen',
            ];

            $paramHeadings = [];
            foreach ($parameters as $param) {
                $unit = $param->unit ? " ({$param->unit})" : '';
                $paramHeadings[] = "[{$param->code}] {$param->label}{$unit}";
            }

            $this->headings = array_merge($baseHeadings, $paramHeadings);
        }

        // 3. Build Participant Rows
        $this->rows = [];
        foreach ($registrations as $reg) {
            $patient = $reg->patient;
            $row = [
                $reg->reg_no,
                $patient->nik ?? '-',
                $patient->name ?? '-',
                $patient->gender ?? 'L',
                $reg->age_years_snapshot ?? $patient->age ?? 25,
                $reg->department_snapshot ?? $patient->default_department ?? '-',
            ];

            // Fill empty values for parameters
            $numParamCols = count($this->headings) - 6;
            for ($i = 0; $i < $numParamCols; $i++) {
                $row[] = '';
            }

            $this->rows[] = $row;
        }
    }

    public function headings(): array
    {
        return $this->headings;
    }

    public function array(): array
    {
        return $this->rows;
    }

    public function title(): string
    {
        return strtoupper($this->category) . ' - ' . $this->mcuEvent->event_code;
    }

    public function styles(Worksheet $sheet): array
    {
        $lastColumn = $sheet->getHighestColumn();
        $lastRow = max(count($this->rows) + 1, 1);

        // Header Style: Dark Navy Background + Bold White Text
        $sheet->getStyle("A1:{$lastColumn}1")->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size' => 10,
                'name' => 'Arial',
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '1E293B'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
                'wrapText' => true,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => '334155'],
                ],
            ],
        ]);

        $sheet->getRowDimension(1)->setRowHeight(28);

        // Data Rows Borders & Alignment
        if ($lastRow > 1) {
            $sheet->getStyle("A2:{$lastColumn}{$lastRow}")->applyFromArray([
                'font' => [
                    'size' => 9.5,
                    'name' => 'Arial',
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => 'E2E8F0'],
                    ],
                ],
            ]);

            // Demographic Columns Left/Center
            $sheet->getStyle("A2:A{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("B2:B{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("D2:E{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        }

        // Freeze top header row and demographic columns
        $sheet->freezePane('G2');

        return [];
    }
}
