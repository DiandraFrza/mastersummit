<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Payment;
use App\Models\Patient;
use App\Models\Registration;
use App\Models\RegistrationItem;
use App\Models\Sample;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Tests\TestCase;

class ReportTest extends TestCase
{
    protected User $admin;
    protected User $staffWithoutPerms;
    protected Patient $patient;
    protected Company $company;
    protected Service $serviceLab;
    protected Service $serviceRad;
    protected Sample $sampleLab;
    protected Registration $regAps;
    protected Registration $regCorp;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::where('username', 'superadmin')->first();

        $this->staffWithoutPerms = User::firstOrCreate(
            ['username' => 'teststaffnoperms'],
            [
                'name' => 'Staf Tanpa Hak Laporan',
                'email' => 'stafnoperms@test.com',
                'password' => bcrypt('password'),
                'is_active' => true,
            ]
        );

        $this->company = Company::firstOrCreate(
            ['branch_code' => 'CORP-TEST-REP'],
            ['name' => 'PT Laporan Medis Prima', 'is_active' => true]
        );

        $this->patient = Patient::firstOrCreate(
            ['nik' => '3271000088889999'],
            [
                'name' => 'Rina Sugiarto',
                'gender' => 'P',
                'birth_date' => Carbon::parse('1994-06-10'),
                'phone' => '081234500000',
                'address' => 'Jl. Salemba Raya No. 12',
            ]
        );

        $this->sampleLab = Sample::firstOrCreate(
            ['code' => 'SMP-REP-TEST'],
            ['name' => 'Serum Darah', 'color' => '#dc2626', 'is_active' => true]
        );

        $this->serviceLab = Service::firstOrCreate(
            ['code' => 'SRV-REP-LAB'],
            [
                'name' => 'Glukosa Puasa Test',
                'category' => 'lab',
                'sample_id' => $this->sampleLab->id,
                'price' => 50000,
                'is_active' => true,
            ]
        );

        $this->serviceRad = Service::firstOrCreate(
            ['code' => 'SRV-REP-RAD'],
            [
                'name' => 'Rontgen Thorax Test',
                'category' => 'radiology',
                'sample_id' => $this->sampleLab->id,
                'price' => 200000,
                'is_active' => true,
            ]
        );

        // 1. APS Registration
        $this->regAps = Registration::create([
            'reg_no' => 'REG-REP-APS-' . uniqid(),
            'registered_at' => now(),
            'patient_id' => $this->patient->id,
            'service_type' => 'regular',
            'payer_type' => 'aps',
            'total_amount' => 50000,
            'discount_amount' => 0,
            'paid_amount' => 50000,
            'remaining_amount' => 0,
            'payment_status' => 'paid',
            'workflow_status' => 'completed',
            'created_by' => $this->admin->id,
        ]);

        RegistrationItem::create([
            'registration_id' => $this->regAps->id,
            'service_id' => $this->serviceLab->id,
            'service_name_snapshot' => $this->serviceLab->name,
            'category' => 'lab',
            'sample_id' => $this->sampleLab->id,
            'price_snapshot' => 50000,
            'discount_amount' => 0,
            'final_price' => 50000,
            'is_from_package' => false,
            'billed_to' => 'personal',
            'sample_status' => 'taken',
            'result_status' => 'verified',
        ]);

        Payment::create([
            'registration_id' => $this->regAps->id,
            'paid_at' => now(),
            'amount' => 50000,
            'payment_method' => 'cash',
            'notes' => 'Pembayaran lunas tunai APS',
            'received_by' => $this->admin->id,
        ]);

        // 2. Corporate Registration
        $this->regCorp = Registration::create([
            'reg_no' => 'REG-REP-CORP-' . uniqid(),
            'registered_at' => now(),
            'patient_id' => $this->patient->id,
            'company_id' => $this->company->id,
            'service_type' => 'mcu',
            'payer_type' => 'corporate',
            'total_amount' => 200000,
            'discount_amount' => 0,
            'paid_amount' => 200000,
            'remaining_amount' => 0,
            'payment_status' => 'paid',
            'workflow_status' => 'completed',
            'created_by' => $this->admin->id,
        ]);

        RegistrationItem::create([
            'registration_id' => $this->regCorp->id,
            'service_id' => $this->serviceRad->id,
            'service_name_snapshot' => $this->serviceRad->name,
            'category' => 'radiology',
            'sample_id' => $this->sampleLab->id,
            'price_snapshot' => 200000,
            'discount_amount' => 0,
            'final_price' => 200000,
            'is_from_package' => false,
            'billed_to' => 'corporate',
            'sample_status' => 'taken',
            'result_status' => 'verified',
        ]);

        Payment::create([
            'registration_id' => $this->regCorp->id,
            'paid_at' => now(),
            'amount' => 200000,
            'payment_method' => 'transfer',
            'reference_no' => 'TRF-CORP-999',
            'notes' => 'Pembayaran transfer bank corporate',
            'received_by' => $this->admin->id,
        ]);
    }

    /**
     * Test unauthenticated users cannot access reports.
     */
    public function test_unauthenticated_users_cannot_access_reports(): void
    {
        $this->get(route('reports.revenue.index'))->assertRedirect(route('login'));
        $this->get(route('reports.revenue.export'))->assertRedirect(route('login'));
        $this->get(route('reports.examinations.index'))->assertRedirect(route('login'));
        $this->get(route('reports.examinations.export'))->assertRedirect(route('login'));
    }

    /**
     * Test users without permissions cannot access reports (403 Forbidden).
     */
    public function test_users_without_permission_cannot_access_reports(): void
    {
        $this->actingAs($this->staffWithoutPerms)
            ->get(route('reports.revenue.index'))
            ->assertStatus(403);

        $this->actingAs($this->staffWithoutPerms)
            ->get(route('reports.revenue.export'))
            ->assertStatus(403);

        $this->actingAs($this->staffWithoutPerms)
            ->get(route('reports.examinations.index'))
            ->assertStatus(403);

        $this->actingAs($this->staffWithoutPerms)
            ->get(route('reports.examinations.export'))
            ->assertStatus(403);
    }

    /**
     * Test authorized user can view revenue report page.
     */
    public function test_authorized_user_can_view_revenue_report(): void
    {
        $response = $this->actingAs($this->admin)->get(route('reports.revenue.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Reports/Revenue')
            ->has('kpi')
            ->has('recap_by_payer')
            ->has('recap_by_method')
            ->has('payments')
            ->has('companies')
            ->has('filters')
        );
    }

    /**
     * Test revenue report filters by payer type and payment method.
     */
    public function test_revenue_report_filters_by_payer_type_and_payment_method(): void
    {
        // 1. Filter by APS
        $responseAps = $this->actingAs($this->admin)->get(route('reports.revenue.index', [
            'payer_type' => 'aps',
        ]));
        $responseAps->assertStatus(200);
        $responseAps->assertInertia(fn ($page) => $page
            ->has('payments.data')
            ->where('filters.payer_type', 'aps')
        );

        // 2. Filter by Transfer
        $responseTrf = $this->actingAs($this->admin)->get(route('reports.revenue.index', [
            'payment_method' => 'transfer',
        ]));
        $responseTrf->assertStatus(200);
        $responseTrf->assertInertia(fn ($page) => $page
            ->has('payments.data')
            ->where('filters.payment_method', 'transfer')
        );
    }

    /**
     * Test revenue report can be exported to Excel.
     */
    public function test_revenue_report_can_be_exported_to_excel(): void
    {
        $response = $this->actingAs($this->admin)->get(route('reports.revenue.export'));

        $response->assertStatus(200);
        $this->assertTrue(
            str_contains($response->headers->get('content-type') ?? '', 'spreadsheet') ||
            str_contains($response->headers->get('content-type') ?? '', 'excel') ||
            str_contains($response->headers->get('content-type') ?? '', 'octet-stream')
        );
    }

    /**
     * Test authorized user can view examinations report page.
     */
    public function test_authorized_user_can_view_examinations_report(): void
    {
        $response = $this->actingAs($this->admin)->get(route('reports.examinations.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Reports/Examinations')
            ->has('kpi')
            ->has('recap_by_service')
            ->has('items')
            ->has('companies')
            ->has('services')
            ->has('filters')
        );
    }

    /**
     * Test examinations report filters by category and billed to.
     */
    public function test_examinations_report_filters_by_category_and_billed_to(): void
    {
        // 1. Filter by Lab
        $responseLab = $this->actingAs($this->admin)->get(route('reports.examinations.index', [
            'category' => 'lab',
        ]));
        $responseLab->assertStatus(200);
        $responseLab->assertInertia(fn ($page) => $page
            ->has('items.data')
            ->where('filters.category', 'lab')
        );

        // 2. Filter by Corporate billed
        $responseCorp = $this->actingAs($this->admin)->get(route('reports.examinations.index', [
            'billed_to' => 'corporate',
        ]));
        $responseCorp->assertStatus(200);
        $responseCorp->assertInertia(fn ($page) => $page
            ->has('items.data')
            ->where('filters.billed_to', 'corporate')
        );
    }

    /**
     * Test examinations report can be exported to Excel.
     */
    public function test_examinations_report_can_be_exported_to_excel(): void
    {
        $response = $this->actingAs($this->admin)->get(route('reports.examinations.export'));

        $response->assertStatus(200);
        $this->assertTrue(
            str_contains($response->headers->get('content-type') ?? '', 'spreadsheet') ||
            str_contains($response->headers->get('content-type') ?? '', 'excel') ||
            str_contains($response->headers->get('content-type') ?? '', 'octet-stream')
        );
    }
}
