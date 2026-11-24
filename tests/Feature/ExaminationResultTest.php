<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\ExaminationResult;
use App\Models\ParameterAutoRule;
use App\Models\ParameterReferenceRange;
use App\Models\Patient;
use App\Models\Registration;
use App\Models\RegistrationItem;
use App\Models\ResultAttachment;
use App\Models\Sample;
use App\Models\Service;
use App\Models\ServiceParameter;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ExaminationResultTest extends TestCase
{
    protected User $admin;
    protected User $analyst;
    protected Company $company;
    protected Patient $patient;
    protected Sample $sampleLab;
    protected Sample $sampleAudio;
    protected Service $serviceHematology;
    protected Service $serviceAudiometry;
    protected ServiceParameter $paramHb;
    protected ServiceParameter $paramAudiogram;
    protected Registration $registration;
    protected RegistrationItem $itemHema;
    protected RegistrationItem $itemAudio;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::where('username', 'superadmin')->first();

        $this->analyst = User::firstOrCreate(
            ['username' => 'analis_hasil_test'],
            [
                'name' => 'Analis Hasil Penunjang',
                'email' => 'analis.hasil@mastersummit.test',
                'password' => bcrypt('password'),
                'is_active' => true,
            ]
        );
        $this->analyst->syncRoles([]);
        $this->analyst->givePermissionTo('results.lab');

        $this->company = Company::firstOrCreate(
            ['branch_code' => 'CORP-TEST-EXAM'],
            ['name' => 'PT Hasil Diagnostika Sejahtera', 'is_active' => true]
        );

        $this->patient = Patient::firstOrCreate(
            ['nik' => '3271888877770001'],
            [
                'name' => 'Budi Santoso, S.T.',
                'gender' => 'L',
                'birth_date' => Carbon::parse('1990-05-15'),
                'phone' => '081288887777',
                'address' => 'Jl. Merdeka No. 45',
                'default_company_id' => $this->company->id,
                'default_department' => 'Operasional',
                'is_active' => true,
            ]
        );

        $this->sampleLab = Sample::firstOrCreate(
            ['code' => 'SMPL-TEST-EXAM-LAB'],
            ['name' => 'Darah EDTA Exam', 'category' => 'lab', 'is_active' => true, 'sort_order' => 1]
        );

        $this->sampleAudio = Sample::firstOrCreate(
            ['code' => 'SMPL-TEST-EXAM-AUD'],
            ['name' => 'Stasiun Audiometri Exam', 'category' => 'electromedical', 'is_active' => true, 'sort_order' => 2]
        );

        $this->serviceHematology = Service::firstOrCreate(
            ['code' => 'SRV-TEST-EXAM-HEMA'],
            [
                'name' => 'Hematologi Rutin Test',
                'category' => 'lab',
                'sample_id' => $this->sampleLab->id,
                'base_price' => 90000,
                'is_active' => true,
            ]
        );

        $this->serviceAudiometry = Service::firstOrCreate(
            ['code' => 'SRV-TEST-EXAM-AUD'],
            [
                'name' => 'Audiometri Nada Murni Test',
                'category' => 'electromedical',
                'sample_id' => $this->sampleAudio->id,
                'base_price' => 150000,
                'is_active' => true,
            ]
        );

        // Service Parameter: Hemoglobin (Numeric)
        $this->paramHb = ServiceParameter::firstOrCreate(
            [
                'service_id' => $this->serviceHematology->id,
                'code' => 'hb_test',
            ],
            [
                'label' => 'Hemoglobin (Hb)',
                'group_name' => 'Darah Lengkap',
                'input_type' => 'number',
                'unit' => 'g/dL',
                'default_normal_text' => '13.5 - 17.5',
                'sort_order' => 1,
                'is_required' => true,
                'is_active' => true,
            ]
        );

        // Reference range for Hb (Male)
        ParameterReferenceRange::firstOrCreate(
            [
                'parameter_id' => $this->paramHb->id,
                'gender' => 'L',
            ],
            [
                'min_age_years' => 15,
                'max_age_years' => 99,
                'min_value' => 13.5,
                'max_value' => 17.5,
                'display_reference' => '13.5 - 17.5 g/dL (Laki-laki)',
                'is_active' => true,
            ]
        );

        // Auto rule for low Hb (Anemia)
        ParameterAutoRule::firstOrCreate(
            [
                'parameter_id' => $this->paramHb->id,
                'condition_operator' => '<',
                'compare_value_1' => '13.5',
            ],
            [
                'gender' => 'L',
                'flag_status' => 'low',
                'auto_conclusion' => 'Anemia Ringan / Hemoglobin Rendah',
                'auto_suggestion' => 'Perbanyak konsumsi zat besi dan konsultasi dokter.',
                'include_in_abnormality_recap' => true,
                'priority' => 10,
                'is_active' => true,
            ]
        );

        // Service Parameter: Audiogram Grid
        $this->paramAudiogram = ServiceParameter::firstOrCreate(
            [
                'service_id' => $this->serviceAudiometry->id,
                'code' => 'audiogram_grid_test',
            ],
            [
                'label' => 'Grafik & Grid Audiogram',
                'group_name' => 'Audiometri',
                'input_type' => 'audiogram_grid',
                'default_normal_text' => 'Bilateral Normal <= 25 dB',
                'sort_order' => 1,
                'is_required' => true,
                'is_active' => true,
            ]
        );

        // Registration with 2 items (Lab + Audiometry)
        $this->registration = Registration::create([
            'reg_no' => 'REG-TEST-EXAM-' . time() . '-' . rand(100, 999),
            'registered_at' => Carbon::now(),
            'patient_id' => $this->patient->id,
            'service_type' => 'mcu',
            'payer_type' => 'corporate',
            'company_id' => $this->company->id,
            'department_snapshot' => 'Operasional',
            'age_years_snapshot' => 34,
            'total_amount' => 240000,
            'discount_amount' => 0,
            'grand_total' => 240000,
            'paid_amount' => 0,
            'remaining_amount' => 240000,
            'payment_status' => 'corporate_billed',
            'workflow_status' => 'in_progress',
        ]);

        $this->itemHema = RegistrationItem::create([
            'registration_id' => $this->registration->id,
            'service_id' => $this->serviceHematology->id,
            'service_name_snapshot' => 'Hematologi Rutin Test',
            'category' => 'lab',
            'sample_id' => $this->sampleLab->id,
            'price_snapshot' => 90000,
            'discount_amount' => 0,
            'final_price' => 90000,
            'is_from_package' => false,
            'billed_to' => 'corporate',
            'sample_status' => 'taken',
            'result_status' => 'pending',
        ]);

        $this->itemAudio = RegistrationItem::create([
            'registration_id' => $this->registration->id,
            'service_id' => $this->serviceAudiometry->id,
            'service_name_snapshot' => 'Audiometri Nada Murni Test',
            'category' => 'electromedical',
            'sample_id' => $this->sampleAudio->id,
            'price_snapshot' => 150000,
            'discount_amount' => 0,
            'final_price' => 150000,
            'is_from_package' => false,
            'billed_to' => 'corporate',
            'sample_status' => 'taken',
            'result_status' => 'pending',
        ]);
    }

    public function test_guest_cannot_access_examinations_queue(): void
    {
        $response = $this->get('/examinations');
        $response->assertRedirect('/login');
    }

    public function test_authorized_user_can_access_examinations_queue(): void
    {
        $response = $this->actingAs($this->admin)->get('/examinations');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Examinations/Index')
            ->has('registrations')
            ->has('companies')
            ->has('filters')
        );
    }

    public function test_can_filter_queue_by_category_and_status(): void
    {
        $response = $this->actingAs($this->admin)->get('/examinations?category=lab&status=in_progress');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->where('filters.category', 'lab')
            ->where('filters.status', 'in_progress')
        );
    }

    public function test_can_load_examination_entry_screen_with_dynamic_parameters(): void
    {
        $response = $this->actingAs($this->admin)->get("/examinations/{$this->registration->id}?category=lab");
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Examinations/Entry')
            ->has('registration')
            ->where('currentCategory', 'lab')
            ->has('categoriesAvailable')
        );
    }

    public function test_can_evaluate_parameter_rules_via_ajax(): void
    {
        // Test Normal Hb (e.g. 15.0)
        $responseNormal = $this->actingAs($this->admin)->postJson('/examinations/evaluate', [
            'parameter_id' => $this->paramHb->id,
            'gender' => 'L',
            'age_years' => 34,
            'value' => '15.2',
        ]);

        $responseNormal->assertStatus(200);
        $responseNormal->assertJson([
            'flag_status' => 'normal',
        ]);

        // Test Low Hb (e.g. 11.5) matching Auto Rule
        $responseLow = $this->actingAs($this->admin)->postJson('/examinations/evaluate', [
            'parameter_id' => $this->paramHb->id,
            'gender' => 'L',
            'age_years' => 34,
            'value' => '11.5',
        ]);

        $responseLow->assertStatus(200);
        $responseLow->assertJson([
            'flag_status' => 'low',
            'auto_conclusion' => 'Anemia Ringan / Hemoglobin Rendah',
        ]);
    }

    public function test_can_save_examination_results_and_update_item_status(): void
    {
        $payload = [
            'results' => [
                [
                    'registration_item_id' => $this->itemHema->id,
                    'parameter_id' => $this->paramHb->id,
                    'value_numeric' => 11.5,
                    'value_text' => null,
                    'value_json' => null,
                    'unit_snapshot' => 'g/dL',
                    'reference_snapshot' => '13.5 - 17.5 g/dL (Laki-laki)',
                    'flag_status' => 'low',
                    'auto_conclusion' => 'Anemia Ringan / Hemoglobin Rendah',
                    'auto_suggestion' => 'Konsumsi zat besi.',
                    'is_manually_overridden' => false,
                ],
            ],
            'group_conclusion' => 'Hb rendah mengarah anemia',
            'group_suggestion' => 'Evaluasi pola makan',
        ];

        $response = $this->actingAs($this->admin)
            ->post("/examinations/{$this->registration->id}", $payload);

        $response->assertSessionHas('success');

        $this->assertDatabaseHas('examination_results', [
            'registration_id' => $this->registration->id,
            'registration_item_id' => $this->itemHema->id,
            'parameter_id' => $this->paramHb->id,
            'value_numeric' => 11.5,
            'flag_status' => 'low',
        ]);

        $this->itemHema->refresh();
        $this->assertEquals('entered', $this->itemHema->result_status);
        $this->assertEquals('Hb rendah mengarah anemia', $this->itemHema->group_conclusion);

        // Registration should still be in_progress because itemAudio is not entered yet
        $this->registration->refresh();
        $this->assertEquals('in_progress', $this->registration->workflow_status);
    }

    public function test_saving_all_items_auto_transitions_registration_to_result_entered(): void
    {
        // 1. Enter Hema item
        $this->itemHema->update([
            'result_status' => 'entered',
            'result_entered_at' => now(),
            'result_entered_by' => $this->admin->id,
        ]);

        // 2. Save Audio item
        $audioData = [
            'frequencies' => [250, 500, 1000, 2000, 3000, 4000, 6000, 8000],
            'right_ear' => [
                'ac' => ['250' => 15, '500' => 15, '1000' => 15, '2000' => 15, '3000' => 15, '4000' => 15, '6000' => 15, '8000' => 15],
                'bc' => ['250' => 10, '500' => 10, '1000' => 10, '2000' => 10, '3000' => 10, '4000' => 10, '6000' => 10, '8000' => 10],
            ],
            'left_ear' => [
                'ac' => ['250' => 15, '500' => 15, '1000' => 15, '2000' => 15, '3000' => 15, '4000' => 15, '6000' => 15, '8000' => 15],
                'bc' => ['250' => 10, '500' => 10, '1000' => 10, '2000' => 10, '3000' => 10, '4000' => 10, '6000' => 10, '8000' => 10],
            ],
            'right_pta' => 15,
            'left_pta' => 15,
            'right_classification' => 'Normal (<= 25 dB)',
            'left_classification' => 'Normal (<= 25 dB)',
            'diagnosis' => 'Pendengaran bilateral normal',
        ];

        $payload = [
            'results' => [
                [
                    'registration_item_id' => $this->itemAudio->id,
                    'parameter_id' => $this->paramAudiogram->id,
                    'value_numeric' => null,
                    'value_text' => null,
                    'value_json' => $audioData,
                    'unit_snapshot' => null,
                    'reference_snapshot' => 'Bilateral Normal <= 25 dB',
                    'flag_status' => 'normal',
                    'auto_conclusion' => 'Pendengaran bilateral normal',
                    'auto_suggestion' => null,
                    'is_manually_overridden' => false,
                ],
            ],
            'group_conclusion' => 'Audiometri normal',
            'group_suggestion' => 'Pelihara kebersihan telinga',
        ];

        $response = $this->actingAs($this->admin)
            ->post("/examinations/{$this->registration->id}", $payload);

        $response->assertSessionHas('success');

        $this->itemAudio->refresh();
        $this->assertEquals('entered', $this->itemAudio->result_status);

        // All items entered -> registration auto-transitions to result_entered!
        $this->registration->refresh();
        $this->assertEquals('result_entered', $this->registration->workflow_status);
    }

    public function test_can_upload_and_delete_diagnostic_attachment(): void
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->create('ekg_record.pdf', 500, 'application/pdf');

        $response = $this->actingAs($this->admin)->post("/examinations/{$this->registration->id}/attachments", [
            'file' => $file,
            'attachment_type' => 'ekg_pdf',
            'registration_item_id' => $this->itemAudio->id,
            'merge_into_mcu_pdf' => 1,
        ]);

        $response->assertSessionHas('success');

        $attachment = ResultAttachment::where('registration_id', $this->registration->id)->first();
        $this->assertNotNull($attachment);
        $this->assertEquals('ekg_pdf', $attachment->attachment_type);
        $this->assertEquals('ekg_record.pdf', $attachment->original_filename);
        $this->assertTrue($attachment->merge_into_mcu_pdf);

        Storage::disk('public')->assertExists($attachment->file_path);

        // Test delete attachment
        $deleteResponse = $this->actingAs($this->admin)->delete("/examinations/attachments/{$attachment->id}");
        $deleteResponse->assertSessionHas('success');

        $this->assertDatabaseMissing('result_attachments', ['id' => $attachment->id]);
        Storage::disk('public')->assertMissing($attachment->file_path);
    }
}
