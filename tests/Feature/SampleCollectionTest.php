<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Patient;
use App\Models\Registration;
use App\Models\RegistrationItem;
use App\Models\Sample;
use App\Models\Service;
use App\Models\User;
use App\Models\UserSampleScope;
use Carbon\Carbon;
use Tests\TestCase;

class SampleCollectionTest extends TestCase
{
    protected User $admin;
    protected User $labTech;
    protected Patient $patient;
    protected Company $company;
    protected Sample $sampleEDTA;
    protected Sample $sampleUrine;
    protected Service $serviceEDTA;
    protected Service $serviceUrine;
    protected Registration $registration;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::where('username', 'superadmin')->first();

        // Specific sample station models
        $this->sampleEDTA = Sample::firstOrCreate(
            ['code' => 'SMPL-TEST-EDTA-COL'],
            ['name' => 'Darah EDTA Stasiun', 'is_active' => true, 'sort_order' => 1]
        );

        $this->sampleUrine = Sample::firstOrCreate(
            ['code' => 'SMPL-TEST-URIN-COL'],
            ['name' => 'Urin Rutin Stasiun', 'is_active' => true, 'sort_order' => 2]
        );

        // Lab Tech user with restricted station scope (only EDTA)
        $this->labTech = User::firstOrCreate(
            ['username' => 'analis_edta_test'],
            [
                'name' => 'Analis Laboratorium EDTA',
                'email' => 'analis.edta@mastersummit.test',
                'password' => bcrypt('password'),
                'is_active' => true,
            ]
        );
        $this->labTech->syncRoles([]);
        $this->labTech->givePermissionTo('samples.collect');

        UserSampleScope::firstOrCreate([
            'user_id' => $this->labTech->id,
            'sample_id' => $this->sampleEDTA->id,
        ]);

        $this->company = Company::firstOrCreate(
            ['branch_code' => 'CORP-TEST-SMPL'],
            ['name' => 'PT Manufaktur Sampel Prima', 'is_active' => true]
        );

        $this->patient = Patient::firstOrCreate(
            ['nik' => '3271777766660003'],
            [
                'name' => 'Rina Wijaya, S.Farm.',
                'gender' => 'P',
                'birth_date' => Carbon::parse('1994-03-10'),
                'phone' => '081399998888',
                'address' => 'Jl. Laboratorium Sehat No. 3',
                'default_company_id' => $this->company->id,
                'default_department' => 'Quality Control',
                'is_active' => true,
            ]
        );

        $this->serviceEDTA = Service::firstOrCreate(
            ['code' => 'SRV-TEST-HEMA-COL'],
            [
                'name' => 'Darah Lengkap 18 Parameter',
                'category' => 'lab',
                'sample_id' => $this->sampleEDTA->id,
                'base_price' => 120000,
                'is_active' => true,
            ]
        );

        $this->serviceUrine = Service::firstOrCreate(
            ['code' => 'SRV-TEST-URIN-COL'],
            [
                'name' => 'Urin Lengkap 10 Parameter',
                'category' => 'lab',
                'sample_id' => $this->sampleUrine->id,
                'base_price' => 85000,
                'is_active' => true,
            ]
        );

        // Registration with 2 items in pending status
        $this->registration = Registration::create([
            'patient_id' => $this->patient->id,
            'service_type' => 'mcu',
            'payer_type' => 'corporate',
            'company_id' => $this->company->id,
            'department_snapshot' => 'Quality Control',
            'workflow_status' => 'registered',
            'payment_status' => 'corporate_billed',
            'registered_at' => now(),
        ]);

        RegistrationItem::create([
            'registration_id' => $this->registration->id,
            'service_id' => $this->serviceEDTA->id,
            'service_name_snapshot' => $this->serviceEDTA->name,
            'category' => 'lab',
            'sample_id' => $this->sampleEDTA->id,
            'price_snapshot' => 120000,
            'final_price' => 120000,
            'sample_status' => 'pending',
            'billed_to' => 'corporate',
        ]);

        RegistrationItem::create([
            'registration_id' => $this->registration->id,
            'service_id' => $this->serviceUrine->id,
            'service_name_snapshot' => $this->serviceUrine->name,
            'category' => 'lab',
            'sample_id' => $this->sampleUrine->id,
            'price_snapshot' => 85000,
            'final_price' => 85000,
            'sample_status' => 'pending',
            'billed_to' => 'corporate',
        ]);

        $this->registration->recalculateFinancials();
    }

    protected function tearDown(): void
    {
        if ($this->registration && $this->registration->exists) {
            $this->registration->items()->forceDelete();
            $this->registration->payments()->forceDelete();
            $this->registration->forceDelete();
        }

        parent::tearDown();
    }

    // ==========================================
    // 1. Authentication Check
    // ==========================================

    public function test_unauthenticated_user_cannot_access_sample_collection(): void
    {
        $response = $this->get('/samples/collect');
        $response->assertRedirect('/login');

        $scanResponse = $this->post('/samples/collect/scan', ['barcode' => 'REG-123']);
        $scanResponse->assertRedirect('/login');
    }

    // ==========================================
    // 2. Index Screen & KPI Verification
    // ==========================================

    public function test_sample_collection_index_screen_can_be_rendered_with_kpi_and_stations(): void
    {
        $response = $this->actingAs($this->admin)->get('/samples/collect');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Samples/Collect')
            ->has('stations')
            ->has('stationCounts')
            ->has('currentStation')
            ->has('kpi')
            ->has('items')
            ->has('companies')
            ->has('filters')
            ->where('kpi.pending', fn ($val) => $val >= 2)
            ->where('kpi.total', fn ($val) => $val >= 2)
        );
    }

    // ==========================================
    // 3. User Sample Scopes Filter Visible Tabs
    // ==========================================

    public function test_user_sample_scopes_filter_visible_station_tabs(): void
    {
        $response = $this->actingAs($this->labTech)->get('/samples/collect');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Samples/Collect')
            ->has('stations', 1) // Only Darah EDTA station!
            ->where('stations.0.id', $this->sampleEDTA->id)
        );
    }

    // ==========================================
    // 4. Smart Barcode Scan Check-In & Auto Workflow Transition
    // ==========================================

    public function test_scan_barcode_marks_items_taken_and_transitions_registration_to_in_progress(): void
    {
        $this->assertEquals('registered', $this->registration->workflow_status);

        $response = $this->actingAs($this->admin)->post('/samples/collect/scan', [
            'barcode' => $this->registration->reg_no,
            'sample_id' => $this->sampleEDTA->id,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        // Verify EDTA item is marked taken
        $edtaItem = $this->registration->items()->where('sample_id', $this->sampleEDTA->id)->first();
        $this->assertEquals('taken', $edtaItem->sample_status);
        $this->assertNotNull($edtaItem->sample_taken_at);
        $this->assertEquals($this->admin->id, $edtaItem->sample_taken_by);

        // Urine item remains pending
        $urineItem = $this->registration->items()->where('sample_id', $this->sampleUrine->id)->first();
        $this->assertEquals('pending', $urineItem->sample_status);

        // Crucial Clinical Rule: registration workflow status automatically transitions to in_progress!
        $this->registration->refresh();
        $this->assertEquals('in_progress', $this->registration->workflow_status);
    }

    // ==========================================
    // 5. Scan Barcode Using Patient Medical Record No (NRM)
    // ==========================================

    public function test_scan_barcode_by_patient_nrm_works_seamlessly(): void
    {
        $response = $this->actingAs($this->admin)->post('/samples/collect/scan', [
            'barcode' => $this->patient->medical_record_no,
            'sample_id' => $this->sampleUrine->id,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $urineItem = $this->registration->items()->where('sample_id', $this->sampleUrine->id)->first();
        $this->assertEquals('taken', $urineItem->sample_status);
    }

    // ==========================================
    // 6. Void Registration Barcode Is Rejected
    // ==========================================

    public function test_scan_barcode_for_void_registration_is_rejected(): void
    {
        $this->registration->update(['workflow_status' => 'void']);

        $response = $this->actingAs($this->admin)->post('/samples/collect/scan', [
            'barcode' => $this->registration->reg_no,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('error');

        // Items should remain untouched
        $items = $this->registration->items()->get();
        foreach ($items as $item) {
            $this->assertEquals('pending', $item->sample_status);
        }
    }

    // ==========================================
    // 7. Individual Status Update & Reset Action
    // ==========================================

    public function test_individual_sample_status_can_be_updated_and_reset(): void
    {
        $item = $this->registration->items()->first();

        // 1. Mark as taken
        $responseTaken = $this->actingAs($this->admin)->post("/samples/collect/{$item->id}/update-status", [
            'sample_status' => 'taken',
        ]);
        $responseTaken->assertRedirect();
        $responseTaken->assertSessionHas('success');

        $item->refresh();
        $this->assertEquals('taken', $item->sample_status);
        $this->assertNotNull($item->sample_taken_at);

        // 2. Reset back to pending
        $responseReset = $this->actingAs($this->admin)->post("/samples/collect/{$item->id}/update-status", [
            'sample_status' => 'pending',
        ]);
        $responseReset->assertRedirect();
        $responseReset->assertSessionHas('success');

        $item->refresh();
        $this->assertEquals('pending', $item->sample_status);
        $this->assertNull($item->sample_taken_at);
        $this->assertNull($item->sample_taken_by);
    }

    // ==========================================
    // 8. Sample Rejection with Clinical Reason
    // ==========================================

    public function test_sample_rejection_with_reason(): void
    {
        $item = $this->registration->items()->first();

        $response = $this->actingAs($this->admin)->post("/samples/collect/{$item->id}/update-status", [
            'sample_status' => 'rejected',
            'rejection_reason' => 'Sampel Lisis / Hemolisis parah',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $item->refresh();
        $this->assertEquals('rejected', $item->sample_status);
        $this->assertStringContainsString('Sampel Lisis', $item->group_conclusion);
    }
}
