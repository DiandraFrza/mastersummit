<?php

namespace App\Services\Examinations;

use App\Models\ExcelImportLog;
use App\Models\ExaminationResult;
use App\Models\McuEvent;
use App\Models\Registration;
use App\Models\RegistrationItem;
use App\Models\ServiceParameter;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\IOFactory;

class BulkExcelImportService
{
    protected EvaluateLabRulesService $evaluator;

    public function __construct(EvaluateLabRulesService $evaluator)
    {
        $this->evaluator = $evaluator;
    }

    /**
     * Import examination results spreadsheet for an MCU Event.
     *
     * @param UploadedFile $file
     * @param McuEvent $mcuEvent
     * @param string $importType 'lab_results', 'audiometry', 'physical'
     * @param User $uploader
     * @return ExcelImportLog
     */
    public function import(
        UploadedFile $file,
        McuEvent $mcuEvent,
        string $importType,
        User $uploader
    ): ExcelImportLog {
        // Store uploaded file for historical audit
        $storedPath = $file->store("imports/mcu_events/{$mcuEvent->id}", 'local');
        $fullPath = Storage::disk('local')->path($storedPath);

        $spreadsheet = IOFactory::load($fullPath);
        $worksheet = $spreadsheet->getActiveSheet();
        $sheetData = $worksheet->toArray(null, true, true, true);

        if (empty($sheetData) || count($sheetData) < 2) {
            return ExcelImportLog::create([
                'mcu_event_id' => $mcuEvent->id,
                'import_type' => $importType,
                'file_path' => $storedPath,
                'original_filename' => $file->getClientOriginalName(),
                'total_rows' => 0,
                'success_rows' => 0,
                'failed_rows' => 0,
                'error_details_json' => ['File Excel tidak memiliki baris data.'],
                'uploaded_by' => $uploader->id,
            ]);
        }

        // Row 1: Headers
        $headerRow = array_shift($sheetData);
        $columnMap = $this->parseHeaders($headerRow, $importType);

        $totalRows = count($sheetData);
        $successRows = 0;
        $failedRows = 0;
        $errorDetails = [];

        $now = now();
        $userId = $uploader->id;

        foreach ($sheetData as $rowIndex => $row) {
            $regNo = trim((string) ($row[$columnMap['reg_no_col']] ?? ''));

            // Skip empty rows
            if ($regNo === '') {
                $totalRows--;
                continue;
            }

            // Find registration in this event
            $registration = Registration::query()
                ->with(['patient', 'items.service.parameters'])
                ->where('reg_no', $regNo)
                ->where('mcu_event_id', $mcuEvent->id)
                ->where('workflow_status', '!=', 'void')
                ->first();

            if (! $registration) {
                $failedRows++;
                $errorDetails[] = [
                    'row' => $rowIndex,
                    'reg_no' => $regNo,
                    'error' => "No. Registrasi [{$regNo}] tidak terdaftar pada Event MCU [{$mcuEvent->event_code}].",
                ];
                continue;
            }

            try {
                DB::transaction(function () use ($row, $registration, $columnMap, $importType, $userId, $now) {
                    $patient = $registration->patient;
                    $gender = $patient ? ($patient->gender === 'P' ? 'P' : 'L') : 'L';
                    $age = $registration->age_years_snapshot ?? ($patient->age ?? 25);

                    if ($importType === 'audiometry') {
                        $this->processAudiometryRow($row, $registration, $columnMap['audiometry_cols'], $userId, $now);
                    } else {
                        $this->processParameterRows($row, $registration, $columnMap['param_cols'], $gender, $age, $userId, $now);
                    }

                    // Auto-transition registration to result_entered if all items have results
                    $allItemsCount = $registration->items()->count();
                    $enteredCount = $registration->items()
                        ->whereIn('result_status', ['entered', 'verified'])
                        ->count();

                    if ($allItemsCount > 0 && $enteredCount >= $allItemsCount) {
                        if ($registration->workflow_status === 'in_progress' || $registration->workflow_status === 'registered') {
                            $registration->update(['workflow_status' => 'result_entered']);
                        }
                    }
                });

                $successRows++;
            } catch (\Throwable $e) {
                $failedRows++;
                $errorDetails[] = [
                    'row' => $rowIndex,
                    'reg_no' => $regNo,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return ExcelImportLog::create([
            'mcu_event_id' => $mcuEvent->id,
            'import_type' => $importType,
            'file_path' => $storedPath,
            'original_filename' => $file->getClientOriginalName(),
            'total_rows' => $totalRows,
            'success_rows' => $successRows,
            'failed_rows' => $failedRows,
            'error_details_json' => ! empty($errorDetails) ? $errorDetails : null,
            'uploaded_by' => $uploader->id,
        ]);
    }

    /**
     * Map Excel column letters to parameter codes or fields.
     */
    protected function parseHeaders(array $headerRow, string $importType): array
    {
        $regNoCol = 'A';
        $paramCols = []; // [colLetter => ServiceParameter]
        $audiometryCols = []; // [field => colLetter]

        foreach ($headerRow as $colLetter => $rawHeader) {
            $header = trim((string) $rawHeader);
            if ($header === '') continue;

            $lower = strtolower($header);

            // Match Registration Number column
            if (str_contains($lower, 'no. reg') || str_contains($lower, 'reg_no') || str_contains($lower, 'registrasi')) {
                $regNoCol = $colLetter;
                continue;
            }

            if ($importType === 'audiometry') {
                // Match Audiometry frequency headers, e.g. [AD_250_AC], [AS_500_BC], [DIAGNOSIS], [RECOMMENDATION]
                if (preg_match('/\[([a-zA-Z0-9_]+)\]/i', $header, $matches)) {
                    $key = strtolower($matches[1]);
                    $audiometryCols[$key] = $colLetter;
                }
            } else {
                // Extract parameter code between brackets: [code]
                if (preg_match('/\[([a-zA-Z0-9_\-]+)\]/i', $header, $matches)) {
                    $code = trim($matches[1]);
                    $parameter = ServiceParameter::where('code', $code)
                        ->with(['referenceRanges' => fn ($q) => $q->where('is_active', true), 'autoRules' => fn ($q) => $q->where('is_active', true)])
                        ->first();

                    if ($parameter) {
                        $paramCols[$colLetter] = $parameter;
                    }
                }
            }
        }

        return [
            'reg_no_col' => $regNoCol,
            'param_cols' => $paramCols,
            'audiometry_cols' => $audiometryCols,
        ];
    }

    /**
     * Process standard parameter values (Lab or Physical).
     */
    protected function processParameterRows(
        array $row,
        Registration $registration,
        array $paramCols,
        string $gender,
        int $age,
        int $userId,
        $now
    ): void {
        $affectedItemIds = [];

        foreach ($paramCols as $colLetter => $parameter) {
            $valRaw = $row[$colLetter] ?? null;
            if ($valRaw === null || trim((string) $valRaw) === '') {
                continue; // Skip unfilled cell
            }

            $val = trim((string) $valRaw);

            // Find registration item associated with this parameter's service
            $item = $registration->items
                ->first(function ($it) use ($parameter) {
                    return $it->service_id === $parameter->service_id;
                });

            // Fallback: match by category if service_id didn't match directly
            if (! $item) {
                $item = $registration->items
                    ->first(function ($it) use ($parameter) {
                        return $it->category === $parameter->service?->category;
                    });
            }

            if (! $item) {
                continue;
            }

            // Evaluate rule and reference range
            $evalResult = $this->evaluator->evaluate($parameter, $gender, $age, $val);

            $numericVal = is_numeric($val) ? (float) $val : null;
            $textVal = is_numeric($val) ? null : $val;

            ExaminationResult::updateOrCreate(
                [
                    'registration_item_id' => $item->id,
                    'parameter_id' => $parameter->id,
                ],
                [
                    'registration_id' => $registration->id,
                    'value_numeric' => $numericVal,
                    'value_text' => $textVal,
                    'value_json' => null,
                    'unit_snapshot' => $evalResult['unit_snapshot'] ?? $parameter->unit,
                    'reference_snapshot' => $evalResult['reference_snapshot'] ?? null,
                    'flag_status' => $evalResult['flag_status'] ?? 'normal',
                    'auto_conclusion' => $evalResult['auto_conclusion'] ?? null,
                    'auto_suggestion' => $evalResult['auto_suggestion'] ?? null,
                    'is_manually_overridden' => false,
                    'input_source' => 'excel_bulk',
                    'updated_by' => $userId,
                ]
            );

            $affectedItemIds[$item->id] = true;
        }

        // Update item result status
        foreach (array_keys($affectedItemIds) as $itemId) {
            RegistrationItem::where('id', $itemId)->update([
                'result_status' => 'entered',
                'result_entered_at' => $now,
                'result_entered_by' => $userId,
            ]);
        }
    }

    /**
     * Process Audiometry grid data from Excel row.
     */
    protected function processAudiometryRow(
        array $row,
        Registration $registration,
        array $audiometryCols,
        int $userId,
        $now
    ): void {
        $frequencies = [250, 500, 1000, 2000, 3000, 4000, 6000, 8000];
        $rightAc = [];
        $rightBc = [];
        $leftAc = [];
        $leftBc = [];

        foreach ($frequencies as $freq) {
            // Right AC
            $rAcKey = "ad_{$freq}_ac";
            if (isset($audiometryCols[$rAcKey])) {
                $val = $row[$audiometryCols[$rAcKey]] ?? null;
                $rightAc[$freq] = (is_numeric($val) && $val !== '') ? (int) $val : null;
            }

            // Right BC
            $rBcKey = "ad_{$freq}_bc";
            if (isset($audiometryCols[$rBcKey])) {
                $val = $row[$audiometryCols[$rBcKey]] ?? null;
                $rightBc[$freq] = (is_numeric($val) && $val !== '') ? (int) $val : null;
            }

            // Left AC
            $lAcKey = "as_{$freq}_ac";
            if (isset($audiometryCols[$lAcKey])) {
                $val = $row[$audiometryCols[$lAcKey]] ?? null;
                $leftAc[$freq] = (is_numeric($val) && $val !== '') ? (int) $val : null;
            }

            // Left BC
            $lBcKey = "as_{$freq}_bc";
            if (isset($audiometryCols[$lBcKey])) {
                $val = $row[$audiometryCols[$lBcKey]] ?? null;
                $leftBc[$freq] = (is_numeric($val) && $val !== '') ? (int) $val : null;
            }
        }

        // PTA Calculation (500, 1k, 2k, 4k)
        $rightPta = $this->calculatePta($rightAc);
        $leftPta = $this->calculatePta($leftAc);

        $rightClassification = $this->getClassification($rightPta);
        $leftClassification = $this->getClassification($leftPta);

        $customDiagnosis = isset($audiometryCols['diagnosis']) ? ($row[$audiometryCols['diagnosis']] ?? null) : null;
        $customRecommendation = isset($audiometryCols['recommendation']) ? ($row[$audiometryCols['recommendation']] ?? null) : null;

        $diagnosis = $customDiagnosis ?: $this->generateDiagnosis($rightPta, $leftPta);

        $audiogramData = [
            'frequencies' => $frequencies,
            'right_ear' => [
                'ac' => $rightAc,
                'bc' => $rightBc,
            ],
            'left_ear' => [
                'ac' => $leftAc,
                'bc' => $leftBc,
            ],
            'right_pta' => $rightPta,
            'left_pta' => $leftPta,
            'right_classification' => $rightClassification,
            'left_classification' => $leftClassification,
            'diagnosis' => $diagnosis,
            'recommendation' => $customRecommendation,
        ];

        // Find audiometry item & parameter
        $item = $registration->items
            ->first(function ($it) {
                return $it->category === 'electromedical' || str_contains(strtolower($it->service_name_snapshot), 'audio');
            });

        if (! $item) {
            return;
        }

        $param = ServiceParameter::where('service_id', $item->service_id)
            ->where('input_type', 'audiogram_grid')
            ->first();

        if (! $param) {
            $param = ServiceParameter::where('input_type', 'audiogram_grid')->first();
        }

        if (! $param) {
            return;
        }

        ExaminationResult::updateOrCreate(
            [
                'registration_item_id' => $item->id,
                'parameter_id' => $param->id,
            ],
            [
                'registration_id' => $registration->id,
                'value_numeric' => null,
                'value_text' => null,
                'value_json' => $audiogramData,
                'unit_snapshot' => null,
                'reference_snapshot' => 'Bilateral Normal <= 25 dB',
                'flag_status' => ($rightPta !== null && $rightPta > 25) || ($leftPta !== null && $leftPta > 25) ? 'abnormal' : 'normal',
                'auto_conclusion' => $diagnosis,
                'auto_suggestion' => $customRecommendation,
                'is_manually_overridden' => false,
                'input_source' => 'excel_bulk',
                'updated_by' => $userId,
            ]
        );

        $item->update([
            'result_status' => 'entered',
            'result_entered_at' => $now,
            'result_entered_by' => $userId,
            'group_conclusion' => $diagnosis,
            'group_suggestion' => $customRecommendation,
        ]);
    }

    protected function calculatePta(array $acValues): ?float
    {
        $sum = 0;
        $count = 0;
        foreach ([500, 1000, 2000, 4000] as $freq) {
            if (isset($acValues[$freq]) && $acValues[$freq] !== null) {
                $sum += (float) $acValues[$freq];
                $count++;
            }
        }
        return $count > 0 ? round($sum / $count, 1) : null;
    }

    protected function getClassification(?float $pta): ?string
    {
        if ($pta === null) return null;
        if ($pta <= 25) return 'Normal (<= 25 dB)';
        if ($pta <= 40) return 'Tuli Ringan (26 - 40 dB)';
        if ($pta <= 55) return 'Tuli Sedang (41 - 55 dB)';
        if ($pta <= 70) return 'Tuli Sedang-Berat (56 - 70 dB)';
        if ($pta <= 90) return 'Tuli Berat (71 - 90 dB)';
        return 'Tuli Sangat Berat (> 90 dB)';
    }

    protected function generateDiagnosis(?float $rightPta, ?float $leftPta): ?string
    {
        if ($rightPta === null && $leftPta === null) return null;
        if (($rightPta === null || $rightPta <= 25) && ($leftPta === null || $leftPta <= 25)) {
            return 'Pendengaran kedua telinga dalam batas normal (Normal hearing bilateral).';
        }
        $parts = [];
        if ($rightPta !== null) {
            $parts[] = "Kanan: " . $this->getClassification($rightPta) . " ({$rightPta} dB)";
        }
        if ($leftPta !== null) {
            $parts[] = "Kiri: " . $this->getClassification($leftPta) . " ({$leftPta} dB)";
        }
        return implode('; ', $parts) . '.';
    }
}
