<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\ExaminationResult;
use App\Models\McuEvent;
use App\Models\McuReview;
use App\Models\Package;
use App\Models\Patient;
use App\Models\Referrer;
use App\Models\ReferrerType;
use App\Models\Registration;
use App\Models\RegistrationItem;
use App\Models\Sample;
use App\Models\Service;
use App\Models\ServiceParameter;
use App\Models\User;
use App\Services\Examinations\CompileAbnormalityRecapService;
use Carbon\Carbon;
use Tests\TestCase;

class McuReviewTest extends TestCase
{
    protected User $admin;
    protected User $doctor;
    protected User $manager;
    protected User $regularStaff;
    protected Company $company;
    protected McuEvent $mcuEvent;
    protected Patient $patient;
    protected Package $package;
    protected Service $serviceLab;
    protected ServiceParameter $paramCholesterol;
    protected Registration $registration;
    protected RegistrationItem $regItem;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::where('username', 'superadmin')->first();

        // 1. Doctor User with 'mcu_reviews.doctor' permission
        $this->doctor = User::firstOrCreate(
            ['username' => 'dokter_mcu_test'],
            [
                'name' => 'dr. MCU Specialist',
                'email' => 'dokter.mcu@mastersummit.test',
                'password' => bcrypt('password'),
                'is_active' => true,
            ]
        );
        $this->doctor->syncRoles([]);
        $this->doctor->givePermissionTo('mcu_reviews.doctor');

        // 2. Manager User with 'mcu_reviews.manager' permission
        $this->manager = User::firstOrCreate(
            ['username' => 'manajer_mcu_test'],
            [
                'name' => 'Manajer Operasional MCU',
                'email' => 'manajer.mcu@mastersummit.test',
                'password' => bcrypt('password'),
                'is_active' => true,
            ]
        );
        $this->manager->syncRoles([]);
        $this->manager->givePermissionTo(['mcu_reviews.doctor', 'mcu_reviews.manager']);

        // 3. Regular Staff without MCU review permissions
        $this->regularStaff = User::firstOrCreate(
            ['username' => 'staf_reguler_test'],
            [
                'name' => 'Staf Reguler Tanpa Akses Review',
                'email' => 'staf.reguler@mastersummit.test',
                'password' => bcrypt('password'),
                'is_active' => true,
            ]
        );
        $this->regularStaff->syncRoles([]);

        // 4. Test Master Data
        $uniqueSuffix = uniqid();
        $this->company = Company::firstOrCreate(
            ['branch_code' => 'CORP-REV-TEST'],
            ['name' => 'PT Health & Safety Review', 'is_active' => true]
        );

        $refType = ReferrerType::firstOrCreate(
            ['code' => 'CORP_REV_TEST'],
            ['name' => 'Korporat Review Test']
        );

        $referrer = Referrer::firstOrCreate(
            ['name' => 'HRD PT Health Review'],
            [
                'referrer_type_id' => $refType->id,
                'company_id' => $this->company->id,
                'is_active' => true,
            ]
        );

        $this->mcuEvent = McuEvent::create([
            'year' => (int) date('Y'),
            'event_code' => 'EVT-REV-' . $uniqueSuffix,
            'company_id' => $this->company->id,
            'referrer_id' => $referrer->id,
            'event_name' => 'Batch MCU Review Safety 2026',
            'status' => 'ongoing',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(2)->toDateString(),
        ]);

        $this->patient = Patient::create([
            'medical_record_no' => 'NRM-REV-' . $uniqueSuffix,
            'name' => 'Kandidat Pekerja MCU',
            'nik' => '320199887766' . rand(1000, 9999),
            'birth_date' => '1995-05-15',
            'gender' => 'L',
            'phone' => '081299887766',
        ]);

        $sample = Sample::firstOrCreate(
            ['code' => 'SMP-SER-TEST'],
            ['name' => 'Serum Darah Test', 'tube_color' => 'Merah']
        );

        $this->serviceLab = Service::firstOrCreate(
            ['code' => 'SRV-KIMIA-TEST'],
            [
                'name' => 'Kimia Darah Lengkap Test',
                'category' => 'lab',
                'sample_id' => $sample->id,
                'price' => 150000,
                'is_active' => true,
            ]
        );

        $this->paramCholesterol = ServiceParameter::firstOrCreate(
            ['code' => 'PARAM-CHOL-TEST'],
            [
                'service_id' => $this->serviceLab->id,
                'label' => 'Kolesterol Total Test',
                'input_type' => 'number',
                'unit' => 'mg/dL',
                'default_normal_text' => '< 200',
                'sort_order' => 1,
                'is_active' => true,
            ]
        );

        $this->package = Package::firstOrCreate(
            ['name' => 'Paket MCU Fit to Work Test'],
            [
                'year' => 2026,
                'total_price' => 200000,
                'discount_amount' => 0,
                'final_price' => 200000,
                'is_active' => true,
            ]
        );

        // 5. Test Registration
        $this->registration = Registration::create([
            'reg_no' => 'REG-REV-' . $uniqueSuffix,
            'registered_at' => now(),
            'patient_id' => $this->patient->id,
            'service_type' => 'mcu',
            'payer_type' => 'corporate',
            'company_id' => $this->company->id,
            'mcu_event_id' => $this->mcuEvent->id,
            'package_id' => $this->package->id,
            'department_snapshot' => 'Divisi Operasional & Lapangan',
            'age_years_snapshot' => 31,
            'total_amount' => 200000,
            'discount_amount' => 0,
            'grand_total' => 200000,
            'paid_amount' => 200000,
            'remaining_amount' => 0,
            'payment_status' => 'paid',
            'workflow_status' => 'result_entered',
        ]);

        $this->regItem = RegistrationItem::create([
            'registration_id' => $this->registration->id,
            'service_id' => $this->serviceLab->id,
            'service_name_snapshot' => $this->serviceLab->name,
            'category' => 'lab',
            'sample_id' => $sample->id,
            'price_snapshot' => 150000,
            'discount_amount' => 0,
            'final_price' => 150000,
            'is_from_package' => true,
            'billed_to' => 'corporate',
            'sample_status' => 'taken',
            'result_status' => 'entered',
        ]);

        // Insert abnormal result (Kolesterol: 245 mg/dL -> High)
        ExaminationResult::create([
            'registration_id' => $this->registration->id,
            'registration_item_id' => $this->regItem->id,
            'parameter_id' => $this->paramCholesterol->id,
            'value_numeric' => 245.0000,
            'unit_snapshot' => 'mg/dL',
            'reference_snapshot' => '< 200',
            'flag_status' => 'high',
            'auto_conclusion' => 'Hiperkolesterolemia Ringan',
            'auto_suggestion' => 'Kurangi konsumsi lemak jenuh dan lakukan diet seimbang.',
            'input_source' => 'web_single',
        ]);
    }

    protected function tearDown(): void
    {
        McuReview::where('registration_id', $this->registration->id)->delete();
        ExaminationResult::where('registration_id', $this->registration->id)->delete();
        RegistrationItem::where('registration_id', $this->registration->id)->delete();
        $this->registration->forceDelete();
        $this->patient->forceDelete();
        $this->mcuEvent->forceDelete();

        parent::tearDown();
    }

    public function test_abnormality_compilation_service_extracts_abnormal_parameters_and_generates_draft(): void
    {
        $service = app(CompileAbnormalityRecapService::class);
        $recap = $service->compile($this->registration);

        $this->assertGreaterThanOrEqual(1, $recap['total_abnormalities']);
        $this->assertEquals(McuReview::FIT_STATUS_FIT_WITH_NOTE, $recap['suggested_fit_status']);
        $this->assertArrayHasKey('Laboratorium', $recap['by_category']);
        $this->assertStringContainsString('Kolesterol Total Test', $recap['summary_draft']);
        $this->assertStringContainsString('245', $recap['summary_draft']);
        $this->assertStringContainsString('Kurangi konsumsi lemak jenuh', $recap['advice_draft']);
    }

    public function test_unauthorized_user_cannot_access_doctor_review(): void
    {
        $response = $this->actingAs($this->regularStaff)->get(route('mcu.doctor-review.index'));
        $response->assertStatus(403);

        $responseShow = $this->actingAs($this->regularStaff)->get(route('mcu.doctor-review.show', $this->registration));
        $responseShow->assertStatus(403);
    }

    public function test_authorized_doctor_can_view_doctor_review_queue_and_detail(): void
    {
        $response = $this->actingAs($this->doctor)->get(route('mcu.doctor-review.index'));
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Mcu/DoctorReview/Index')
            ->has('registrations.data')
            ->has('kpi')
        );

        $responseShow = $this->actingAs($this->doctor)->get(route('mcu.doctor-review.show', $this->registration));
        $responseShow->assertStatus(200);
        $responseShow->assertInertia(fn ($page) => $page
            ->component('Mcu/DoctorReview/Show')
            ->has('compiledRecap')
            ->where('registration.id', $this->registration->id)
        );
    }

    public function test_doctor_can_save_review_and_advance_workflow_status(): void
    {
        $payload = [
            'fit_status' => 'fit_with_note',
            'doctor_summary' => 'Ditemukan hiperkolesterolemia ringan pada pasien.',
            'doctor_advice' => 'Diet rendah kolesterol, perbanyak olahraga teratur.',
            'doctor_notes' => 'Pasien dianjurkan kontrol profil lipid 3 bulan lagi.',
        ];

        $response = $this->actingAs($this->doctor)->post(
            route('mcu.doctor-review.store', $this->registration),
            $payload
        );

        $response->assertRedirect(route('mcu.doctor-review.show', $this->registration));
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('mcu_reviews', [
            'registration_id' => $this->registration->id,
            'fit_status' => 'fit_with_note',
            'doctor_reviewed_by' => $this->doctor->id,
            'is_locked' => false,
        ]);

        $this->assertEquals('doctor_reviewed', $this->registration->fresh()->workflow_status);
    }

    public function test_doctor_cannot_modify_review_when_locked_by_manager(): void
    {
        // Setup existing locked review
        McuReview::create([
            'registration_id' => $this->registration->id,
            'fit_status' => 'fit',
            'doctor_summary' => 'Catatan dokter awal',
            'doctor_advice' => 'Anjuran awal',
            'doctor_reviewed_by' => $this->doctor->id,
            'doctor_reviewed_at' => now(),
            'is_locked' => true,
        ]);

        $payload = [
            'fit_status' => 'unfit',
            'doctor_summary' => 'Mencoba mengubah review yang sudah terkunci',
            'doctor_advice' => 'Tidak boleh berubah',
        ];

        $response = $this->actingAs($this->doctor)->post(
            route('mcu.doctor-review.store', $this->registration),
            $payload
        );

        $response->assertSessionHas('error');

        $this->assertDatabaseHas('mcu_reviews', [
            'registration_id' => $this->registration->id,
            'fit_status' => 'fit', // Not updated
        ]);
    }

    public function test_authorized_manager_can_view_manager_review_and_approve_lock(): void
    {
        // 1. View Index & Show
        $response = $this->actingAs($this->manager)->get(route('mcu.manager-review.index'));
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Mcu/ManagerReview/Index')
            ->has('registrations.data')
        );

        $responseShow = $this->actingAs($this->manager)->get(route('mcu.manager-review.show', $this->registration));
        $responseShow->assertStatus(200);
        $responseShow->assertInertia(fn ($page) => $page
            ->component('Mcu/ManagerReview/Show')
            ->where('registration.id', $this->registration->id)
        );

        // 2. Approve and Lock (QC Pass)
        $approvePayload = [
            'manager_notes' => 'QC Berkas lengkap, resume medis dokter telah diverifikasi dan siap terbit.',
            'is_locked' => true,
        ];

        $responseApprove = $this->actingAs($this->manager)->post(
            route('mcu.manager-review.approve', $this->registration),
            $approvePayload
        );

        $responseApprove->assertRedirect(route('mcu.manager-review.show', $this->registration));
        $responseApprove->assertSessionHas('success');

        $this->assertDatabaseHas('mcu_reviews', [
            'registration_id' => $this->registration->id,
            'manager_approved_by' => $this->manager->id,
            'is_locked' => true,
        ]);

        // State machine should transition to 'completed'
        $this->assertEquals('completed', $this->registration->fresh()->workflow_status);
    }

    public function test_manager_can_unlock_mcu_review_for_doctor_revision(): void
    {
        // Create locked review with 'completed' workflow
        McuReview::create([
            'registration_id' => $this->registration->id,
            'fit_status' => 'fit',
            'manager_approved_by' => $this->manager->id,
            'manager_approved_at' => now(),
            'is_locked' => true,
        ]);
        $this->registration->update(['workflow_status' => 'completed']);

        // Manager executes unlock
        $responseUnlock = $this->actingAs($this->manager)->post(
            route('mcu.manager-review.unlock', $this->registration)
        );

        $responseUnlock->assertRedirect(route('mcu.manager-review.show', $this->registration));
        $responseUnlock->assertSessionHas('success');

        $this->assertDatabaseHas('mcu_reviews', [
            'registration_id' => $this->registration->id,
            'is_locked' => false,
        ]);

        $this->assertEquals('doctor_reviewed', $this->registration->fresh()->workflow_status);
    }
}
