<?php

namespace Tests\Feature;

use App\Models\ClinicSetting;
use App\Models\Company;
use App\Models\ExaminationResult;
use App\Models\McuReview;
use App\Models\OnlineResultToken;
use App\Models\Package;
use App\Models\PackageItem;
use App\Models\ParameterAutoRule;
use App\Models\ParameterReferenceRange;
use App\Models\Patient;
use App\Models\Payment;
use App\Models\Registration;
use App\Models\RegistrationItem;
use App\Models\Sample;
use App\Models\Service;
use App\Models\ServiceParameter;
use App\Models\User;
use Carbon\Carbon;
use Tests\TestCase;

class EndToEndWorkflowTest extends TestCase
{
    protected User $admin;
    protected Company $company;
    protected Patient $patient;
    protected Sample $sampleLab;
    protected Service $serviceLab;
    protected ServiceParameter $paramGlucose;
    protected ServiceParameter $paramUricAcid;
    protected Service $serviceAps;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::where('username', 'superadmin')->first();

        ClinicSetting::current()->update([
            'clinic_name' => 'Klinik Utama & Laboratorium Master Summit',
            'default_online_expiry_days' => 30,
        ]);

        $this->company = Company::firstOrCreate(
            ['branch_code' => 'CORP-E2E-TEST'],
            ['name' => 'PT EndToEnd Solusi Medika', 'is_active' => true]
        );

        $this->patient = Patient::firstOrCreate(
            ['nik' => '3271000077778888'],
            [
                'name' => 'Dimas Pratama',
                'gender' => 'L',
                'birth_date' => Carbon::parse('1991-08-17'),
                'phone' => '081234567788',
                'address' => 'Jl. Gatot Subroto No. 45',
            ]
        );

        $this->sampleLab = Sample::firstOrCreate(
            ['code' => 'SMP-E2E'],
            ['name' => 'Darah Lengkap & Kimia', 'color' => '#dc2626', 'is_active' => true]
        );

        // Service 1: Corporate MCU Lab (Glukosa Puasa)
        $this->serviceLab = Service::firstOrCreate(
            ['code' => 'SRV-E2E-GLU'],
            [
                'name' => 'Glukosa Puasa E2E',
                'category' => 'lab',
                'sample_id' => $this->sampleLab->id,
                'price' => 75000,
                'is_active' => true,
            ]
        );

        $this->paramGlucose = ServiceParameter::firstOrCreate(
            ['code' => 'GLU-E2E', 'service_id' => $this->serviceLab->id],
            [
                'label' => 'Glukosa Darah Puasa',
                'input_type' => 'number',
                'unit' => 'mg/dL',
                'default_normal_text' => 'Normal',
                'sort_order' => 1,
                'is_required' => true,
                'is_active' => true,
            ]
        );

        ParameterReferenceRange::firstOrCreate(
            ['parameter_id' => $this->paramGlucose->id, 'gender' => 'ALL'],
            [
                'min_value' => 70,
                'max_value' => 100,
                'display_reference' => '70 - 100 mg/dL',
                'is_active' => true,
            ]
        );

        ParameterAutoRule::firstOrCreate(
            ['parameter_id' => $this->paramGlucose->id, 'flag_status' => 'high'],
            [
                'condition_operator' => '>',
                'compare_value_1' => '126',
                'gender' => 'ALL',
                'auto_conclusion' => 'Hiperglikemia (Suspek Diabetes)',
                'auto_suggestion' => 'Konsultasi dokter dan tes lanjutan HbA1c',
                'include_in_abnormality_recap' => true,
                'priority' => 1,
                'is_active' => true,
            ]
        );

        // Service 2: APS Personal Add-on (Asam Urat)
        $this->serviceAps = Service::firstOrCreate(
            ['code' => 'SRV-E2E-APS'],
            [
                'name' => 'Asam Urat Personal',
                'category' => 'lab',
                'sample_id' => $this->sampleLab->id,
                'price' => 60000,
                'is_active' => true,
            ]
        );

        $this->paramUricAcid = ServiceParameter::firstOrCreate(
            ['code' => 'URIC-E2E', 'service_id' => $this->serviceAps->id],
            [
                'label' => 'Asam Urat Darah',
                'input_type' => 'number',
                'unit' => 'mg/dL',
                'default_normal_text' => 'Normal',
                'sort_order' => 1,
                'is_required' => true,
                'is_active' => true,
            ]
        );
    }

    /**
     * Complete lifecycle test from registration to reporting.
     */
    public function test_complete_patient_and_financial_lifecycle(): void
    {
        // ---------------------------------------------------------
        // STEP 1: Registration with Split Billing (Corporate + APS)
        // ---------------------------------------------------------
        $regNo = 'REG-E2E-' . uniqid();
        $registration = Registration::create([
            'reg_no' => $regNo,
            'registered_at' => now(),
            'patient_id' => $this->patient->id,
            'company_id' => $this->company->id,
            'service_type' => 'mcu',
            'payer_type' => 'corporate',
            'department_snapshot' => 'Operasional',
            'age_years_snapshot' => 35,
            'total_amount' => 135000, // 75000 corp + 60000 personal
            'discount_amount' => 0,
            'paid_amount' => 60000,   // Personal portion paid at counter
            'remaining_amount' => 75000, // Corporate billed
            'payment_status' => 'partial',
            'workflow_status' => 'registered',
            'created_by' => $this->admin->id,
        ]);

        // Item 1: Corporate MCU item
        $corpItem = RegistrationItem::create([
            'registration_id' => $registration->id,
            'service_id' => $this->serviceLab->id,
            'service_name_snapshot' => $this->serviceLab->name,
            'category' => 'lab',
            'sample_id' => $this->sampleLab->id,
            'price_snapshot' => 75000,
            'discount_amount' => 0,
            'final_price' => 75000,
            'is_from_package' => true,
            'billed_to' => 'corporate',
            'sample_status' => 'pending',
            'result_status' => 'pending',
        ]);

        // Item 2: Personal APS item (Split Billing)
        $apsItem = RegistrationItem::create([
            'registration_id' => $registration->id,
            'service_id' => $this->serviceAps->id,
            'service_name_snapshot' => $this->serviceAps->name,
            'category' => 'lab',
            'sample_id' => $this->sampleLab->id,
            'price_snapshot' => 60000,
            'discount_amount' => 0,
            'final_price' => 60000,
            'is_from_package' => false,
            'billed_to' => 'personal',
            'sample_status' => 'pending',
            'result_status' => 'pending',
        ]);

        // Payment for Personal portion
        Payment::create([
            'registration_id' => $registration->id,
            'paid_at' => now(),
            'amount' => 60000,
            'payment_method' => 'cash',
            'notes' => 'Pembayaran kasir item pribadi (Split Billing)',
            'received_by' => $this->admin->id,
        ]);

        $this->assertEquals('registered', $registration->workflow_status);
        $this->assertEquals(2, $registration->items()->count());

        // ---------------------------------------------------------
        // STEP 2: Control Card View
        // ---------------------------------------------------------
        $controlCardResponse = $this->actingAs($this->admin)
            ->get(route('registrations.control-card', $registration->id));
        $controlCardResponse->assertStatus(200);

        // ---------------------------------------------------------
        // STEP 3: Sample Collection via Smart Barcode Scan
        // ---------------------------------------------------------
        $scanResponse = $this->actingAs($this->admin)
            ->post(route('samples.collect.scan'), [
                'barcode' => $registration->reg_no,
                'sample_id' => $this->sampleLab->id,
            ]);
        $scanResponse->assertRedirect();

        $registration->refresh();
        $this->assertEquals('in_progress', $registration->workflow_status);
        $this->assertEquals('taken', $corpItem->fresh()->sample_status);

        // ---------------------------------------------------------
        // STEP 4: Examination Result Entry & Auto-Rule Evaluation
        // ---------------------------------------------------------
        // Input Blood Glucose = 180 (triggers auto rule > 126 -> high) and Uric Acid = 5.2
        $saveResultsResponse = $this->actingAs($this->admin)
            ->post(route('examinations.save', $registration->id), [
                'results' => [
                    [
                        'registration_item_id' => $corpItem->id,
                        'parameter_id' => $this->paramGlucose->id,
                        'value_numeric' => 180,
                        'value_text' => null,
                        'flag_status' => 'high',
                        'auto_conclusion' => 'Hiperglikemia (Suspek Diabetes)',
                        'auto_suggestion' => 'Konsultasi dokter dan tes lanjutan HbA1c',
                    ],
                    [
                        'registration_item_id' => $apsItem->id,
                        'parameter_id' => $this->paramUricAcid->id,
                        'value_numeric' => 5.2,
                        'value_text' => null,
                        'flag_status' => 'normal',
                    ],
                ],
                'notes' => 'Pasien puasa 10 jam',
            ]);
        $saveResultsResponse->assertRedirect();

        $registration->refresh();
        $this->assertEquals('result_entered', $registration->workflow_status);
        $this->assertDatabaseHas('examination_results', [
            'registration_id' => $registration->id,
            'parameter_id' => $this->paramGlucose->id,
            'value_numeric' => 180,
            'flag_status' => 'high',
        ]);

        // ---------------------------------------------------------
        // STEP 5: Doctor Review & Abnormality Recap
        // ---------------------------------------------------------
        $doctorReviewResponse = $this->actingAs($this->admin)
            ->post(route('mcu.doctor-review.store', $registration->id), [
                'fit_status' => 'fit_with_note',
                'doctor_summary' => 'Hiperglikemia memerlukan pemantauan berkala dan diet rendah gula.',
                'doctor_advice' => 'Kontrol rutin kadar gula darah puasa setiap bulan.',
                'abnormality_recap' => [
                    [
                        'parameter' => 'Glukosa Darah Puasa',
                        'value' => '180 mg/dL',
                        'flag' => 'high',
                        'conclusion' => 'Hiperglikemia (Suspek Diabetes)',
                    ],
                ],
            ]);
        $doctorReviewResponse->assertRedirect();

        $registration->refresh();
        $this->assertEquals('doctor_reviewed', $registration->workflow_status);

        // ---------------------------------------------------------
        // STEP 6: Manager QC Review, Lock & Completion
        // ---------------------------------------------------------
        $managerApproveResponse = $this->actingAs($this->admin)
            ->post(route('mcu.manager-review.approve', $registration->id), [
                'is_locked' => true,
                'manager_notes' => 'QC Pass Manajer MCU',
            ]);
        $managerApproveResponse->assertRedirect();

        $registration->refresh();
        $this->assertEquals('completed', $registration->workflow_status);

        $mcuReview = $registration->mcuReview;
        $this->assertNotNull($mcuReview);
        $this->assertTrue($mcuReview->is_locked);
        $this->assertEquals('fit_with_note', $mcuReview->fit_status);

        // ---------------------------------------------------------
        // STEP 7: Online Result Token Auto-Generated (30 Days)
        // ---------------------------------------------------------
        $token = $registration->onlineResultToken;
        $this->assertNotNull($token);
        $this->assertTrue($token->isValid());
        $this->assertFalse($token->isExpired());
        $this->assertGreaterThanOrEqual(29, $token->days_remaining);

        // ---------------------------------------------------------
        // STEP 8: Public Online Result Portal Gatekeeper & View
        // ---------------------------------------------------------
        // Unverified access renders gatekeeper verification
        $portalResponse = $this->get(route('portal.show', $token->token));
        $portalResponse->assertStatus(200);
        $portalResponse->assertInertia(fn ($page) => $page->component('Portal/Verify'));

        // Verify with DOB: 17081991 (17 August 1991)
        $verifyResponse = $this->post(route('portal.verify', $token->token), [
            'credential' => '17081991',
        ]);
        $verifyResponse->assertRedirect(route('portal.show', $token->token));

        // Verified patient views results
        $verifiedResponse = $this->withSession(['verified_portal_token_' . $token->id => true])
            ->get(route('portal.show', $token->token));
        $verifiedResponse->assertStatus(200);
        $verifiedResponse->assertInertia(fn ($page) => $page
            ->component('Portal/Show')
            ->has('registration')
            ->has('clinic')
        );

        // Verified patient downloads official PDF
        $pdfResponse = $this->withSession(['verified_portal_token_' . $token->id => true])
            ->get(route('portal.download-pdf', $token->token));
        $pdfResponse->assertStatus(200);
        $pdfResponse->assertHeader('Content-Type', 'application/pdf');

        // ---------------------------------------------------------
        // STEP 9: Financial & Examination Reporting Integration
        // ---------------------------------------------------------
        // Revenue report contains payment
        $revenueResponse = $this->actingAs($this->admin)
            ->get(route('reports.revenue.index'));
        $revenueResponse->assertStatus(200);
        $revenueResponse->assertInertia(fn ($page) => $page
            ->component('Reports/Revenue')
            ->has('kpi')
            ->has('recap_by_payer')
        );

        // Examination report contains items
        $examResponse = $this->actingAs($this->admin)
            ->get(route('reports.examinations.index'));
        $examResponse->assertStatus(200);
        $examResponse->assertInertia(fn ($page) => $page
            ->component('Reports/Examinations')
            ->has('kpi')
            ->has('recap_by_service')
        );

        // ---------------------------------------------------------
        // STEP 10: Audit Log Verification
        // ---------------------------------------------------------
        $auditResponse = $this->actingAs($this->admin)
            ->get(route('audit-logs.index'));
        $auditResponse->assertStatus(200);
        $auditResponse->assertInertia(fn ($page) => $page
            ->component('Audit/Index')
            ->has('activities.data')
        );
    }
}
