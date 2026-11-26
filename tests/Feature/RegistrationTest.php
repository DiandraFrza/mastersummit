<?php

namespace Tests\Feature;

use App\Models\Bank;
use App\Models\Company;
use App\Models\McuEvent;
use App\Models\Package;
use App\Models\Patient;
use App\Models\Payment;
use App\Models\Referrer;
use App\Models\Registration;
use App\Models\RegistrationItem;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    protected User $admin;
    protected Patient $patient;
    protected Company $company;
    protected Referrer $referrer;
    protected Package $package;
    protected Bank $bank;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::where('username', 'superadmin')->first();

        $this->company = Company::first() ?? Company::create([
            'branch_code' => 'TEST-REG-CORP',
            'name' => 'PT Registrasi Sejahtera',
            'is_active' => true,
        ]);

        $this->patient = Patient::firstOrCreate(
            ['nik' => '3271999988880001'],
            [
                'name' => 'Pasien Uji Pendaftaran',
                'gender' => 'L',
                'birth_date' => Carbon::parse('1990-05-15'),
                'phone' => '081299990001',
                'address' => 'Jl. Uji Registrasi No. 10',
                'default_company_id' => $this->company->id,
                'default_department' => 'Engineering',
                'is_active' => true,
            ]
        );

        $this->referrer = Referrer::first() ?? Referrer::create([
            'name' => 'Dr. Bambang Registrasi',
            'referrer_type_id' => 1,
            'fee_general_percent' => 10,
            'is_active' => true,
        ]);

        $this->bank = Bank::first() ?? Bank::create([
            'name' => 'BCA',
            'account_number' => '1234567890',
            'account_holder' => 'Klinik Summit',
            'is_active' => true,
        ]);

        $this->package = Package::has('packageItems')->with('packageItems.service')->first() ?? Package::first();
    }

    protected function tearDown(): void
    {
        $testRegIds = Registration::withTrashed()
            ->where('patient_id', $this->patient->id)
            ->pluck('id');

        if ($testRegIds->isNotEmpty()) {
            Payment::whereIn('registration_id', $testRegIds)->forceDelete();
            RegistrationItem::whereIn('registration_id', $testRegIds)->forceDelete();
            Registration::withTrashed()->whereIn('id', $testRegIds)->forceDelete();
        }

        parent::tearDown();
    }

    // ==========================================
    // 1. Index Page Rendering
    // ==========================================

    public function test_registrations_index_screen_can_be_rendered(): void
    {
        $response = $this->actingAs($this->admin)->get('/registrations');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Registrations/Index')
            ->has('registrations')
            ->has('companies')
            ->has('referrers')
            ->has('packages')
            ->has('services')
            ->has('mcuEvents')
            ->has('banks')
            ->has('filters')
            ->has('nextRegNo')
        );
    }

    // ==========================================
    // 2. Regular Registration with Add-on Services
    // ==========================================

    public function test_regular_registration_can_be_created_with_additional_services(): void
    {
        $services = Service::where('is_active', true)->take(2)->get();
        $this->assertCount(2, $services, 'Perlu minimal 2 layanan aktif untuk test.');

        $expectedTotal = (float) $services->sum('base_price');

        $payload = [
            'patient_id' => $this->patient->id,
            'service_type' => 'regular',
            'payer_type' => 'aps',
            'discount_amount' => 10000,
            'additional_services' => [
                [
                    'service_id' => $services[0]->id,
                    'price' => (float) $services[0]->base_price,
                    'discount' => 0,
                    'billed_to' => 'personal',
                ],
                [
                    'service_id' => $services[1]->id,
                    'price' => (float) $services[1]->base_price,
                    'discount' => 0,
                    'billed_to' => 'personal',
                ],
            ],
        ];

        $response = $this->actingAs($this->admin)->post('/registrations', $payload);
        $response->assertRedirect();
        $response->assertSessionHas('success');

        $registration = Registration::where('patient_id', $this->patient->id)->latest()->first();
        $this->assertNotNull($registration);
        $this->assertStringStartsWith('REG-', $registration->reg_no);
        $this->assertEquals('regular', $registration->service_type);
        $this->assertEquals('aps', $registration->payer_type);
        $this->assertEquals('Engineering', $registration->department_snapshot);
        $this->assertEquals(Carbon::parse($this->patient->birth_date)->age, $registration->age_years_snapshot);

        // Check Items
        $this->assertCount(2, $registration->items);
        $this->assertEquals($expectedTotal, (float) $registration->total_amount);
        $this->assertEquals(max(0, $expectedTotal - 10000), (float) $registration->grand_total);
        $this->assertEquals('unpaid', $registration->payment_status);
        $this->assertEquals('registered', $registration->workflow_status);

        foreach ($registration->items as $item) {
            $this->assertFalse((bool) $item->is_from_package);
            $this->assertEquals('personal', $item->billed_to);
            $this->assertEquals('pending', $item->sample_status);
            $this->assertEquals('pending', $item->result_status);
        }
    }

    // ==========================================
    // 3. MCU Registration, Package Unpacking & Split Billing
    // ==========================================

    public function test_mcu_registration_unpacks_package_and_handles_split_billing(): void
    {
        $this->assertNotNull($this->package, 'Perlu minimal 1 paket aktif.');
        $packageItemsCount = $this->package->packageItems()->count();
        $this->assertGreaterThan(0, $packageItemsCount, 'Paket harus memiliki item.');

        // Extra add-on service
        $addonService = Service::where('is_active', true)
            ->whereNotIn('id', $this->package->packageItems()->pluck('service_id'))
            ->first() ?? Service::where('is_active', true)->first();

        $payload = [
            'patient_id' => $this->patient->id,
            'service_type' => 'mcu',
            'payer_type' => 'corporate',
            'company_id' => $this->company->id,
            'package_id' => $this->package->id,
            'package_billed_to' => 'corporate',
            'department_snapshot' => 'Operations Division',
            'additional_services' => [
                [
                    'service_id' => $addonService->id,
                    'price' => (float) $addonService->base_price,
                    'discount' => 5000,
                    'billed_to' => 'personal', // Split billing!
                ],
            ],
        ];

        $response = $this->actingAs($this->admin)->post('/registrations', $payload);
        $response->assertRedirect();
        $response->assertSessionHas('success');

        $registration = Registration::where('patient_id', $this->patient->id)->latest()->first();
        $this->assertNotNull($registration);
        $this->assertEquals('mcu', $registration->service_type);
        $this->assertEquals('corporate', $registration->payer_type);
        $this->assertEquals('Operations Division', $registration->department_snapshot);

        // Verify Items Unpacked
        $items = $registration->items;
        $this->assertCount($packageItemsCount + 1, $items);

        $packageItems = $items->where('is_from_package', true);
        $this->assertCount($packageItemsCount, $packageItems);
        foreach ($packageItems as $pkgItem) {
            $this->assertEquals('corporate', $pkgItem->billed_to);
        }

        $addonItems = $items->where('is_from_package', false);
        $this->assertCount(1, $addonItems);
        $addonItem = $addonItems->first();
        $this->assertEquals('personal', $addonItem->billed_to);
        $this->assertEquals(5000, (float) $addonItem->discount_amount);
        $this->assertEquals(max(0, (float) $addonService->base_price - 5000), (float) $addonItem->final_price);

        // Corporate billed status verification
        $this->assertEquals('corporate_billed', $registration->payment_status);
    }

    // ==========================================
    // 4. Registration with Initial Payment
    // ==========================================

    public function test_registration_records_initial_payment_and_updates_status(): void
    {
        $service = Service::where('is_active', true)->first();
        $price = (float) $service->base_price;
        $paymentAmount = min(50000, $price);

        $payload = [
            'patient_id' => $this->patient->id,
            'service_type' => 'regular',
            'payer_type' => 'aps',
            'additional_services' => [
                [
                    'service_id' => $service->id,
                    'price' => $price,
                    'billed_to' => 'personal',
                ],
            ],
            'payment' => [
                'amount' => $paymentAmount,
                'payment_method' => 'cash',
                'notes' => 'Uang muka tunai di kasir',
            ],
        ];

        $response = $this->actingAs($this->admin)->post('/registrations', $payload);
        $response->assertRedirect();
        $response->assertSessionHas('success');

        $registration = Registration::where('patient_id', $this->patient->id)->latest()->first();
        $this->assertNotNull($registration);

        // Verify Payment Created
        $this->assertCount(1, $registration->payments);
        $payment = $registration->payments->first();
        $this->assertStringStartsWith('PAY-', $payment->payment_no);
        $this->assertEquals($paymentAmount, (float) $payment->amount);
        $this->assertEquals('cash', $payment->payment_method);

        // Verify Financial Recalculation
        $this->assertEquals($paymentAmount, (float) $registration->paid_amount);
        $expectedRemaining = max(0, (float) $registration->grand_total - $paymentAmount);
        $this->assertEquals($expectedRemaining, (float) $registration->remaining_amount);

        if ($paymentAmount >= (float) $registration->grand_total) {
            $this->assertEquals('paid', $registration->payment_status);
        } else {
            $this->assertEquals('partial', $registration->payment_status);
        }
    }

    // ==========================================
    // 5. Void Registration with Mandatory Reason
    // ==========================================

    public function test_registration_can_be_voided_with_mandatory_reason(): void
    {
        $service = Service::where('is_active', true)->first();

        $registration = Registration::create([
            'patient_id' => $this->patient->id,
            'service_type' => 'regular',
            'payer_type' => 'aps',
            'workflow_status' => 'registered',
        ]);

        // Validation test: reason missing or too short
        $badResponse = $this->actingAs($this->admin)->post("/registrations/{$registration->id}/void", [
            'void_reason' => 'abc', // Min 5 characters
        ]);
        $badResponse->assertSessionHasErrors(['void_reason']);

        // Successful void
        $response = $this->actingAs($this->admin)->post("/registrations/{$registration->id}/void", [
            'void_reason' => 'Pasien berhalangan hadir dan membatalkan janji temu',
        ]);
        $response->assertRedirect();
        $response->assertSessionHas('success');

        $registration->refresh();
        $this->assertEquals('void', $registration->workflow_status);
        $this->assertEquals('Pasien berhalangan hadir dan membatalkan janji temu', $registration->void_reason);
        $this->assertEquals($this->admin->id, $registration->voided_by);
        $this->assertNotNull($registration->voided_at);
    }

    // ==========================================
    // 6. Completed Registration Cannot Be Voided
    // ==========================================

    public function test_completed_registration_cannot_be_voided(): void
    {
        $registration = Registration::create([
            'patient_id' => $this->patient->id,
            'service_type' => 'regular',
            'payer_type' => 'aps',
            'workflow_status' => 'completed',
        ]);

        $response = $this->actingAs($this->admin)->post("/registrations/{$registration->id}/void", [
            'void_reason' => 'Mencoba membatalkan transaksi yang sudah selesai',
        ]);
        $response->assertRedirect();
        $response->assertSessionHas('error');

        $registration->refresh();
        $this->assertEquals('completed', $registration->workflow_status);
    }

    // ==========================================
    // 7. Receipt Print & Patient Quick Store / Search
    // ==========================================

    public function test_receipt_can_be_rendered(): void
    {
        $registration = Registration::create([
            'patient_id' => $this->patient->id,
            'service_type' => 'regular',
            'payer_type' => 'aps',
            'workflow_status' => 'registered',
            'grand_total' => 150000,
            'paid_amount' => 150000,
            'payment_status' => 'paid',
        ]);

        $response = $this->actingAs($this->admin)->get("/registrations/{$registration->id}/receipt");
        $response->assertStatus(200);
        $response->assertSee('KWITANSI PEMBAYARAN');
        $response->assertSee($this->patient->name);
    }

    public function test_patient_search_and_quick_store(): void
    {
        // 1. Search existing patient
        $searchRes = $this->actingAs($this->admin)->get('/patients/search?q=' . substr($this->patient->name, 0, 4));
        $searchRes->assertStatus(200);
        $searchRes->assertJsonFragment(['name' => $this->patient->name]);

        // 2. Quick create new patient
        $quickRes = $this->actingAs($this->admin)->postJson('/patients/quick', [
            'name' => 'Budi Santoso Walkin',
            'nik' => '3201019901010099',
            'gender' => 'L',
            'birth_date' => '1995-05-15',
            'phone' => '081234567899',
            'default_department' => 'Produksi',
            'address' => 'Jl. Merdeka No. 45',
        ]);
        $quickRes->assertStatus(200);
        $quickRes->assertJsonPath('success', true);
        $quickRes->assertJsonPath('patient.name', 'Budi Santoso Walkin');

        $this->assertDatabaseHas('patients', [
            'name' => 'Budi Santoso Walkin',
            'nik' => '3201019901010099',
        ]);
    }
}
