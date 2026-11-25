<?php

namespace App\Services\Events;

use App\Models\ExcelImportLog;
use App\Models\McuEvent;
use App\Models\Package;
use App\Models\Patient;
use App\Models\Registration;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

class McuParticipantImportService
{
    /**
     * Import MCU participants from uploaded Excel spreadsheet.
     */
    public function import(
        UploadedFile $file,
        McuEvent $mcuEvent,
        User $uploader
    ): ExcelImportLog {
        $storedPath = $file->store("imports/mcu_participants/{$mcuEvent->id}", 'local');
        $fullPath = Storage::disk('local')->path($storedPath);

        $sheetData = [];
        if (class_exists(\PhpOffice\PhpSpreadsheet\IOFactory::class)) {
            try {
                $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($fullPath);
                $worksheet = $spreadsheet->getActiveSheet();
                $sheetData = $worksheet->toArray(null, true, true, true);
            } catch (\Throwable $e) {
                // fallback to CSV reading below
            }
        }

        if (empty($sheetData)) {
            if (($handle = fopen($fullPath, 'r')) !== false) {
                $bom = fread($handle, 3);
                if ($bom !== "\xEF\xBB\xBF") {
                    rewind($handle);
                }
                while (($rowItems = fgetcsv($handle)) !== false) {
                    $rowMap = [];
                    foreach ($rowItems as $idx => $val) {
                        $colLetter = chr(65 + $idx);
                        $rowMap[$colLetter] = $val;
                    }
                    $sheetData[] = $rowMap;
                }
                fclose($handle);
            }
        }

        if (empty($sheetData) || count($sheetData) < 2) {
            return ExcelImportLog::create([
                'mcu_event_id' => $mcuEvent->id,
                'import_type' => 'participants',
                'file_path' => $storedPath,
                'original_filename' => $file->getClientOriginalName(),
                'total_rows' => 0,
                'success_rows' => 0,
                'failed_rows' => 0,
                'error_details_json' => ['File Excel tidak memiliki baris data.'],
                'uploaded_by' => $uploader->id,
            ]);
        }

        // Header row
        $headerRow = array_shift($sheetData);
        $colMap = $this->mapHeaders($headerRow);

        $totalRows = 0;
        $successRows = 0;
        $failedRows = 0;
        $errorDetails = [];

        // Preload packages for this event / referrer
        $packages = Package::where('is_active', true)->get();
        $defaultPackage = $packages->first(function ($p) use ($mcuEvent) {
            return $mcuEvent->referrer_id && $p->referrer_id === $mcuEvent->referrer_id;
        }) ?? $packages->first();

        foreach ($sheetData as $rowIndex => $row) {
            $name = trim((string) ($row[$colMap['name']] ?? ''));
            if ($name === '') {
                continue; // Skip empty row
            }

            $totalRows++;

            try {
                DB::transaction(function () use (
                    $row,
                    $colMap,
                    $mcuEvent,
                    $packages,
                    $defaultPackage,
                    $uploader,
                    $name,
                    $rowIndex,
                    &$successRows
                ) {
                    $nik = isset($colMap['nik']) ? trim((string) ($row[$colMap['nik']] ?? '')) : null;
                    if ($nik !== null && $nik !== '') {
                        $nik = preg_replace('/[^0-9]/', '', $nik);
                    } else {
                        $nik = null;
                    }

                    // Gender: default L
                    $genderRaw = strtoupper(trim((string) ($row[$colMap['gender']] ?? 'L')));
                    $gender = str_starts_with($genderRaw, 'P') || str_starts_with($genderRaw, 'W') ? 'P' : 'L';

                    // Birth date
                    $birthDate = $this->parseDate($row[$colMap['birth_date']] ?? null);
                    if (! $birthDate) {
                        $birthDate = Carbon::parse('1990-01-01');
                    }

                    $department = isset($colMap['department']) ? trim((string) ($row[$colMap['department']] ?? '')) : null;
                    $phone = isset($colMap['phone']) ? trim((string) ($row[$colMap['phone']] ?? '')) : null;
                    $address = isset($colMap['address']) ? trim((string) ($row[$colMap['address']] ?? '')) : null;

                    // Package matching
                    $packageName = isset($colMap['package']) ? trim((string) ($row[$colMap['package']] ?? '')) : '';
                    $package = null;
                    if ($packageName !== '') {
                        $package = $packages->first(function ($p) use ($packageName) {
                            return strcasecmp($p->name, $packageName) === 0;
                        });
                    }
                    if (! $package) {
                        $package = $defaultPackage;
                    }

                    // Find or create patient
                    $patient = null;
                    if ($nik) {
                        $patient = Patient::where('nik', $nik)->first();
                    }
                    if (! $patient) {
                        $patient = Patient::where('name', $name)
                            ->whereDate('birth_date', $birthDate->toDateString())
                            ->first();
                    }

                    if (! $patient) {
                        $patient = Patient::create([
                            'nik' => $nik,
                            'name' => $name,
                            'gender' => $gender,
                            'birth_date' => $birthDate->toDateString(),
                            'default_department' => $department,
                            'default_company_id' => $mcuEvent->company_id,
                            'phone' => $phone,
                            'address' => $address,
                            'created_by' => $uploader->id,
                            'updated_by' => $uploader->id,
                        ]);
                    } else {
                        // Update department or company if missing
                        if ($department && empty($patient->default_department)) {
                            $patient->default_department = $department;
                        }
                        if ($mcuEvent->company_id && empty($patient->default_company_id)) {
                            $patient->default_company_id = $mcuEvent->company_id;
                        }
                        if ($patient->isDirty()) {
                            $patient->save();
                        }
                    }

                    // Check if registration already exists in this event
                    $registration = Registration::where('mcu_event_id', $mcuEvent->id)
                        ->where('patient_id', $patient->id)
                        ->first();

                    if (! $registration) {
                        Registration::create([
                            'patient_id' => $patient->id,
                            'mcu_event_id' => $mcuEvent->id,
                            'company_id' => $mcuEvent->company_id,
                            'referrer_id' => $mcuEvent->referrer_id,
                            'package_id' => $package?->id,
                            'department_snapshot' => $department ?: $patient->default_department,
                            'service_type' => 'mcu',
                            'payer_type' => 'corporate',
                            'workflow_status' => 'pending',
                            'payment_status' => 'corporate_billed',
                            'reg_no' => null,
                            'registered_at' => null,
                            'created_by' => $uploader->id,
                            'updated_by' => $uploader->id,
                        ]);
                    } else {
                        // If already exists but still pending, update package or department
                        if ($registration->workflow_status === 'pending') {
                            $registration->update([
                                'package_id' => $package?->id ?? $registration->package_id,
                                'department_snapshot' => $department ?: $registration->department_snapshot,
                                'updated_by' => $uploader->id,
                            ]);
                        }
                    }

                    $successRows++;
                });
            } catch (\Throwable $e) {
                $failedRows++;
                $errorDetails[] = "Baris {$rowIndex} ({$name}): " . $e->getMessage();
            }
        }

        return ExcelImportLog::create([
            'mcu_event_id' => $mcuEvent->id,
            'import_type' => 'participants',
            'file_path' => $storedPath,
            'original_filename' => $file->getClientOriginalName(),
            'total_rows' => $totalRows,
            'success_rows' => $successRows,
            'failed_rows' => $failedRows,
            'error_details_json' => $errorDetails,
            'uploaded_by' => $uploader->id,
        ]);
    }

    /**
     * Map spreadsheet column letters to fields.
     */
    protected function mapHeaders(array $headerRow): array
    {
        $map = [
            'nik' => 'A',
            'name' => 'B',
            'gender' => 'C',
            'birth_date' => 'D',
            'department' => 'E',
            'package' => 'F',
            'phone' => 'G',
            'address' => 'H',
        ];

        foreach ($headerRow as $colLetter => $headerText) {
            $h = strtolower(trim((string) $headerText));
            if (str_contains($h, 'nik') || str_contains($h, 'ktp') || str_contains($h, 'identitas')) {
                $map['nik'] = $colLetter;
            } elseif (str_contains($h, 'nama') || str_contains($h, 'pasien') || str_contains($h, 'peserta')) {
                $map['name'] = $colLetter;
            } elseif (str_contains($h, 'kelamin') || str_contains($h, 'jk') || str_contains($h, 'gender')) {
                $map['gender'] = $colLetter;
            } elseif (str_contains($h, 'lahir') || str_contains($h, 'tgl') || str_contains($h, 'birth')) {
                $map['birth_date'] = $colLetter;
            } elseif (str_contains($h, 'bagian') || str_contains($h, 'departemen') || str_contains($h, 'divisi') || str_contains($h, 'unit')) {
                $map['department'] = $colLetter;
            } elseif (str_contains($h, 'paket') || str_contains($h, 'pemeriksaan')) {
                $map['package'] = $colLetter;
            } elseif (str_contains($h, 'telepon') || str_contains($h, 'telp') || str_contains($h, 'hp') || str_contains($h, 'wa')) {
                $map['phone'] = $colLetter;
            } elseif (str_contains($h, 'alamat') || str_contains($h, 'domisili')) {
                $map['address'] = $colLetter;
            }
        }

        return $map;
    }

    /**
     * Parse date from string or Excel serial number.
     */
    protected function parseDate($raw): ?Carbon
    {
        if (empty($raw)) {
            return null;
        }

        if (is_numeric($raw)) {
            try {
                return Carbon::instance(ExcelDate::excelToDateTimeObject((float) $raw));
            } catch (\Throwable) {
                // fallback
            }
        }

        $str = trim((string) $raw);
        $formats = ['Y-m-d', 'd/m/Y', 'd-m-Y', 'Y/m/d', 'd.m.Y'];
        foreach ($formats as $fmt) {
            try {
                return Carbon::createFromFormat($fmt, $str)->startOfDay();
            } catch (\Throwable) {
                continue;
            }
        }

        try {
            return Carbon::parse($str)->startOfDay();
        } catch (\Throwable) {
            return null;
        }
    }
}
