<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\ExaminationResult;
use App\Models\ExcelImportLog;
use App\Models\McuEvent;
use App\Models\ParameterAutoRule;
use App\Models\ParameterReferenceRange;
use App\Models\Patient;
use App\Models\Referrer;
use App\Models\ReferrerType;
use App\Models\Registration;
use App\Models\RegistrationItem;
use App\Models\Sample;
use App\Models\Service;
use App\Models\ServiceParameter;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\TestCase;

class BulkExcelImportTest extends TestCase
{
    protected User $admin;
    protected Company $company;
    protected Referrer $referrer;
    protected McuEvent $mcuEvent;
    protected Patient $patient1;
    protected Patient $patient2;
    protected Sample $sampleLab;
    protected Sample $sampleAudio;
    protected Service $serviceLab;
    protected Service $serviceAudio;
    protected ServiceParameter $paramHb;
    protected ServiceParameter $paramAudio;
    protected Registration $reg1;
    protected Registration $reg2;
    protected RegistrationItem $itemLab1;
    protected RegistrationItem $itemAudio1;
    protected RegistrationItem $itemLab2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::where('username', 'superadmin')->first();

        $refType = ReferrerType::firstOrCreate(
            ['code' => 'CORP_BULK'],
            ['name' => 'Perusahaan Korporat']
        );

        $this->company = Company::firstOrCreate(
            ['branch_code' => 'CORP-BULK-01'],
            ['name' => 'PT Manufaktur Nusantara Bulk', 'is_active' => true]
        );

        $this->referrer = Referrer::firstOrCreate(
            ['name' => 'HRD PT Manufaktur Nusantara'],
            [
                'referrer_type_id' => $refType->id,
                'company_id' => $this->company->id,
                'is_active' => true,
            ]
        );

        $this->mcuEvent = McuEvent::create([
            'year' => (int) date('Y'),
            'event_code' => 'MCU-BULK-' . uniqid(),
            'event_name' => 'MCU Tahunan Karyawan 2026',
            'referrer_id' => $this->referrer->id,
            'company_id' => $this->company->id,
            'target_participants' => 100,
            'status' => 'ongoing',
        ]);

        $this->sampleLab = Sample::firstOrCreate(
            ['code' => 'SMPL-BLKL'],
            ['name' => 'Darah EDTA Bulk', 'category' => 'lab', 'is_active' => true]
        );

        $this->sampleAudio = Sample::firstOrCreate(
            ['code' => 'SMPL-BLKA'],
            ['name' => 'Audiometri Stasiun Bulk', 'category' => 'electromedical', 'is_active' => true]
        );

        $this->serviceLab = Service::firstOrCreate(
            ['code' => 'SRV-BLKL'],
            [
                'name' => 'Hematologi Bulk',
                'category' => 'lab',
                'sample_id' => $this->sampleLab->id,
                'base_price' => 80000,
                'is_active' => true,
            ]
        );

        $this->serviceAudio = Service::firstOrCreate(
            ['code' => 'SRV-BLKA'],
            [
                'name' => 'Audiometri Bulk',
                'category' => 'electromedical',
                'sample_id' => $this->sampleAudio->id,
                'base_price' => 120000,
                'is_active' => true,
            ]
        );

        $this->paramHb = ServiceParameter::firstOrCreate(
            [
                'service_id' => $this->serviceLab->id,
                'code' => 'hb_bulk',
            ],
            [
                'label' => 'Hemoglobin (Hb)',
                'group_name' => 'Darah Lengkap',
                'input_type' => 'number',
                'unit' => 'g/dL',
                'default_normal_text' => '13.0 - 17.0',
                'sort_order' => 1,
                'is_required' => true,
                'is_active' => true,
            ]
        );

        ParameterReferenceRange::firstOrCreate(
            [
                'parameter_id' => $this->paramHb->id,
                'gender' => 'ALL',
            ],
            [
                'min_value' => 13.0,
                'max_value' => 17.0,
                'display_reference' => '13.0 - 17.0 g/dL',
                'is_active' => true,
            ]
        );

        ParameterAutoRule::firstOrCreate(
            [
                'parameter_id' => $this->paramHb->id,
                'condition_operator' => '<',
                'compare_value_1' => '13.0',
            ],
            [
                'gender' => 'ALL',
                'flag_status' => 'low',
                'auto_conclusion' => 'Kadar Hemoglobin Rendah',
                'priority' => 10,
                'is_active' => true,
            ]
        );

        $this->paramAudio = ServiceParameter::firstOrCreate(
            [
                'service_id' => $this->serviceAudio->id,
                'code' => 'audiogram_grid_bulk',
            ],
            [
                'label' => 'Audiogram Grid Bulk',
                'group_name' => 'Audiometri',
                'input_type' => 'audiogram_grid',
                'default_normal_text' => 'Normal <= 25 dB',
                'sort_order' => 1,
                'is_required' => true,
                'is_active' => true,
            ]
        );

        // Patients & Registrations for this Event
        $this->patient1 = Patient::create([
            'medical_record_no' => 'NRM-BLK-1-' . uniqid(),
            'nik' => '3271' . rand(100000000000, 999999999999),
            'name' => 'Ahmad Fauzi',
            'gender' => 'L',
            'birth_date' => Carbon::parse('1992-04-10'),
            'default_company_id' => $this->company->id,
            'default_department' => 'Produksi',
        ]);

        $this->reg1 = Registration::create([
            'reg_no' => 'REG-BLK-1-' . uniqid(),
            'registered_at' => now(),
            'patient_id' => $this->patient1->id,
            'service_type' => 'mcu',
            'payer_type' => 'corporate',
            'company_id' => $this->company->id,
            'mcu_event_id' => $this->mcuEvent->id,
            'workflow_status' => 'in_progress',
        ]);

        $this->itemLab1 = RegistrationItem::create([
            'registration_id' => $this->reg1->id,
            'service_id' => $this->serviceLab->id,
            'service_name_snapshot' => $this->serviceLab->name,
            'category' => 'lab',
            'sample_id' => $this->sampleLab->id,
            'price_snapshot' => 80000,
            'final_price' => 80000,
            'is_from_package' => true,
            'billed_to' => 'corporate',
            'sample_status' => 'taken',
            'result_status' => 'pending',
        ]);

        $this->itemAudio1 = RegistrationItem::create([
            'registration_id' => $this->reg1->id,
            'service_id' => $this->serviceAudio->id,
            'service_name_snapshot' => $this->serviceAudio->name,
            'category' => 'electromedical',
            'sample_id' => $this->sampleAudio->id,
            'price_snapshot' => 120000,
            'final_price' => 120000,
            'is_from_package' => true,
            'billed_to' => 'corporate',
            'sample_status' => 'taken',
            'result_status' => 'pending',
        ]);

        // Patient 2 (only Lab)
        $this->patient2 = Patient::create([
            'medical_record_no' => 'NRM-BLK-2-' . uniqid(),
            'nik' => '3271' . rand(100000000000, 999999999999),
            'name' => 'Siti Nurhaliza',
            'gender' => 'P',
            'birth_date' => Carbon::parse('1995-07-22'),
            'default_company_id' => $this->company->id,
            'default_department' => 'Keuangan',
        ]);

        $this->reg2 = Registration::create([
            'reg_no' => 'REG-BLK-2-' . uniqid(),
            'registered_at' => now(),
            'patient_id' => $this->patient2->id,
            'service_type' => 'mcu',
            'payer_type' => 'corporate',
            'company_id' => $this->company->id,
            'mcu_event_id' => $this->mcuEvent->id,
            'workflow_status' => 'in_progress',
        ]);

        $this->itemLab2 = RegistrationItem::create([
            'registration_id' => $this->reg2->id,
            'service_id' => $this->serviceLab->id,
            'service_name_snapshot' => $this->serviceLab->name,
            'category' => 'lab',
            'sample_id' => $this->sampleLab->id,
            'price_snapshot' => 80000,
            'final_price' => 80000,
            'is_from_package' => true,
            'billed_to' => 'corporate',
            'sample_status' => 'taken',
            'result_status' => 'pending',
        ]);
    }

    protected function tearDown(): void
    {
        if (isset($this->reg1) && $this->reg1->exists) {
            $this->reg1->examinationResults()->forceDelete();
            $this->reg1->items()->forceDelete();
            $this->reg1->forceDelete();
        }
        if (isset($this->reg2) && $this->reg2->exists) {
            $this->reg2->examinationResults()->forceDelete();
            $this->reg2->items()->forceDelete();
            $this->reg2->forceDelete();
        }
        if (isset($this->mcuEvent) && $this->mcuEvent->exists) {
            $this->mcuEvent->excelImportLogs()->delete();
            $this->mcuEvent->forceDelete();
        }
        if (isset($this->patient1) && $this->patient1->exists) {
            $this->patient1->forceDelete();
        }
        if (isset($this->patient2) && $this->patient2->exists) {
            $this->patient2->forceDelete();
        }

        parent::tearDown();
    }

    public function test_guest_cannot_access_bulk_results_center(): void
    {
        $response = $this->get("/mcu-events/{$this->mcuEvent->id}/bulk-results");
        $response->assertRedirect('/login');
    }

    public function test_authorized_user_can_access_bulk_results_center(): void
    {
        $response = $this->actingAs($this->admin)->get("/mcu-events/{$this->mcuEvent->id}/bulk-results");
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Examinations/Bulk')
            ->has('mcuEvent')
            ->has('kpi')
            ->has('importLogs')
        );
    }

    public function test_can_download_prefilled_excel_template_for_lab(): void
    {
        $response = $this->actingAs($this->admin)->get("/mcu-events/{$this->mcuEvent->id}/bulk-results/template?category=lab");
        $response->assertStatus(200);
        $this->assertStringContainsString('Template_Hasil_lab_' . $this->mcuEvent->event_code, (string) $response->headers->get('Content-Disposition'));
    }

    public function test_can_download_prefilled_excel_template_for_audiometry(): void
    {
        $response = $this->actingAs($this->admin)->get("/mcu-events/{$this->mcuEvent->id}/bulk-results/template?category=audiometry");
        $response->assertStatus(200);
        $this->assertStringContainsString('Template_Hasil_audiometry_' . $this->mcuEvent->event_code, (string) $response->headers->get('Content-Disposition'));
    }

    public function test_can_import_lab_results_excel_and_auto_evaluate_rules(): void
    {
        // Create sample in-memory Excel file
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Row 1: Headers with [param_code]
        $sheet->fromArray([
            'No. Reg',
            'NIK',
            'Nama Pasien',
            'JK',
            'Usia',
            'Departemen',
            "[{$this->paramHb->code}] Hemoglobin (g/dL)",
        ], null, 'A1');

        // Row 2: Reg 1 with Normal Hb = 14.5
        $sheet->fromArray([
            $this->reg1->reg_no,
            $this->patient1->nik,
            $this->patient1->name,
            $this->patient1->gender,
            34,
            'Produksi',
            '14.5',
        ], null, 'A2');

        // Row 3: Reg 2 with Low Hb = 11.2 (Anemia)
        $sheet->fromArray([
            $this->reg2->reg_no,
            $this->patient2->nik,
            $this->patient2->name,
            $this->patient2->gender,
            31,
            'Keuangan',
            '11.2',
        ], null, 'A3');

        $tempFile = tempnam(sys_get_temp_dir(), 'test_lab_excel_') . '.xlsx';
        $writer = new Xlsx($spreadsheet);
        $writer->save($tempFile);

        $uploadedFile = new UploadedFile($tempFile, 'hasil_lab.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);

        $response = $this->actingAs($this->admin)->post("/mcu-events/{$this->mcuEvent->id}/bulk-results/import", [
            'file' => $uploadedFile,
            'import_type' => 'lab_results',
        ]);

        $response->assertSessionHas('success');

        // Verify Reg 1 examination result
        $this->assertDatabaseHas('examination_results', [
            'registration_id' => $this->reg1->id,
            'parameter_id' => $this->paramHb->id,
            'value_numeric' => 14.5,
            'flag_status' => 'normal',
            'input_source' => 'excel_bulk',
        ]);

        // Verify Reg 2 examination result (Low flag from auto rule)
        $this->assertDatabaseHas('examination_results', [
            'registration_id' => $this->reg2->id,
            'parameter_id' => $this->paramHb->id,
            'value_numeric' => 11.2,
            'flag_status' => 'low',
            'auto_conclusion' => 'Kadar Hemoglobin Rendah',
            'input_source' => 'excel_bulk',
        ]);

        // Reg 2 had only 1 item (Lab), so it should auto-transition to result_entered!
        $this->reg2->refresh();
        $this->assertEquals('result_entered', $this->reg2->workflow_status);

        // Check ExcelImportLog record
        $this->assertDatabaseHas('excel_import_logs', [
            'mcu_event_id' => $this->mcuEvent->id,
            'import_type' => 'lab_results',
            'total_rows' => 2,
            'success_rows' => 2,
            'failed_rows' => 0,
        ]);

        if (file_exists($tempFile)) {
            unlink($tempFile);
        }
    }

    public function test_can_import_audiometry_excel_with_pta_and_classification(): void
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Row 1: Audiometry headers
        $sheet->fromArray([
            'No. Reg',
            'Nama Pasien',
            '[AD_250_AC]', '[AD_500_AC]', '[AD_1000_AC]', '[AD_2000_AC]', '[AD_4000_AC]', '[AD_8000_AC]',
            '[AS_250_AC]', '[AS_500_AC]', '[AS_1000_AC]', '[AS_2000_AC]', '[AS_4000_AC]', '[AS_8000_AC]',
            '[DIAGNOSIS]',
        ], null, 'A1');

        // Row 2: Reg 1 with 15 dB across all frequencies (Normal)
        $sheet->fromArray([
            $this->reg1->reg_no,
            $this->patient1->name,
            15, 15, 15, 15, 15, 15,
            15, 15, 15, 15, 15, 15,
            'Pendengaran normal bilateral',
        ], null, 'A2');

        $tempFile = tempnam(sys_get_temp_dir(), 'test_audio_excel_') . '.xlsx';
        $writer = new Xlsx($spreadsheet);
        $writer->save($tempFile);

        $uploadedFile = new UploadedFile($tempFile, 'hasil_audiometri.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);

        $response = $this->actingAs($this->admin)->post("/mcu-events/{$this->mcuEvent->id}/bulk-results/import", [
            'file' => $uploadedFile,
            'import_type' => 'audiometry',
        ]);

        $response->assertSessionHas('success');

        $this->itemAudio1->refresh();
        $this->assertEquals('entered', $this->itemAudio1->result_status);

        $result = ExaminationResult::where('registration_item_id', $this->itemAudio1->id)->first();
        $this->assertNotNull($result);
        $this->assertNotNull($result->value_json);
        $this->assertEquals(15, $result->value_json['right_pta']);
        $this->assertEquals(15, $result->value_json['left_pta']);
        $this->assertEquals('Normal (<= 25 dB)', $result->value_json['right_classification']);

        if (file_exists($tempFile)) {
            unlink($tempFile);
        }
    }

    public function test_records_error_details_when_registration_not_found_in_event(): void
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        $sheet->fromArray([
            'No. Reg',
            'Nama Pasien',
            "[{$this->paramHb->code}]",
        ], null, 'A1');

        // Non-existent registration number
        $sheet->fromArray([
            'REG-UNKNOWN-999999',
            'Hantu Belau',
            '14.0',
        ], null, 'A2');

        $tempFile = tempnam(sys_get_temp_dir(), 'test_err_excel_') . '.xlsx';
        $writer = new Xlsx($spreadsheet);
        $writer->save($tempFile);

        $uploadedFile = new UploadedFile($tempFile, 'hasil_error.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);

        $response = $this->actingAs($this->admin)->post("/mcu-events/{$this->mcuEvent->id}/bulk-results/import", [
            'file' => $uploadedFile,
            'import_type' => 'lab_results',
        ]);

        $response->assertSessionHas('warning');

        $log = ExcelImportLog::where('mcu_event_id', $this->mcuEvent->id)->latest()->first();
        $this->assertNotNull($log);
        $this->assertEquals(1, $log->failed_rows);
        $this->assertNotNull($log->error_details_json);
        $this->assertStringContainsString('REG-UNKNOWN-999999', json_encode($log->error_details_json));

        if (file_exists($tempFile)) {
            unlink($tempFile);
        }
    }
}
