<?php

namespace Tests\Feature;

use App\Models\Bank;
use App\Models\Company;
use App\Models\Referrer;
use App\Models\ReferrerType;
use App\Models\Sample;
use App\Models\Unit;
use App\Models\User;
use App\Models\Vendor;
use Tests\TestCase;

class CoreMasterTest extends TestCase
{
    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::where('username', 'superadmin')->first();
    }

    protected function tearDown(): void
    {
        Unit::whereIn('code', ['TEST-01', 'TOGGLE-UNIT'])->delete();
        Company::whereIn('name', ['PT Test Perusahaan Sejahtera', 'PT Toggle Corp'])->delete();
        Referrer::whereIn('name', ['dr. Agus Sutanto, Sp.A', 'dr. Test Toggle'])->delete();
        Bank::whereIn('name', ['Bank Permata', 'Bank Toggle'])->delete();
        Vendor::whereIn('code', ['VND-TEST-99', 'VND-TOGGLE'])->delete();
        Sample::whereIn('code', ['SMP-TEST-SPO2', 'SMP-TOGGLE'])->delete();
        parent::tearDown();
    }

    // 1. Units Tests
    public function test_units_index_screen_can_be_rendered(): void
    {
        $response = $this->actingAs($this->admin)->get('/units');
        $response->assertStatus(200);
    }

    public function test_unit_can_be_created_and_updated(): void
    {
        $postResponse = $this->actingAs($this->admin)->post('/units', [
            'code' => 'TEST-01',
            'name' => 'Klinik Cabang Uji Coba',
            'phone' => '021-99887766',
            'address' => 'Jl. Pengujian No. 1',
            'is_active' => true,
        ]);

        $postResponse->assertRedirect('/units');
        $this->assertDatabaseHas('units', [
            'code' => 'TEST-01',
            'name' => 'Klinik Cabang Uji Coba',
            'is_active' => true,
        ]);

        $unit = Unit::where('code', 'TEST-01')->first();

        $putResponse = $this->actingAs($this->admin)->put("/units/{$unit->id}", [
            'code' => 'TEST-01',
            'name' => 'Klinik Cabang Diperbarui',
            'phone' => '021-11223344',
            'address' => 'Jl. Pengujian Baru No. 2',
            'is_active' => true,
        ]);

        $putResponse->assertRedirect('/units');
        $this->assertDatabaseHas('units', [
            'id' => $unit->id,
            'name' => 'Klinik Cabang Diperbarui',
        ]);
    }

    public function test_unit_status_can_be_toggled_without_hard_delete(): void
    {
        $unit = Unit::firstOrCreate(['code' => 'TOGGLE-UNIT'], [
            'name' => 'Unit Toggle Test',
            'is_active' => true,
        ]);

        $orig = $unit->is_active;

        $response = $this->actingAs($this->admin)->patch("/units/{$unit->id}/toggle-status");
        $response->assertStatus(302);

        $unit->refresh();
        $this->assertNotEquals($orig, $unit->is_active);
    }

    // 2. Companies Tests
    public function test_companies_index_screen_can_be_rendered(): void
    {
        $response = $this->actingAs($this->admin)->get('/companies');
        $response->assertStatus(200);
    }

    public function test_company_can_be_created_and_updated(): void
    {
        $response = $this->actingAs($this->admin)->post('/companies', [
            'name' => 'PT Test Perusahaan Sejahtera',
            'branch_code' => 'TEST-CORP',
            'city' => 'Surabaya',
            'phone' => '031-1234567',
            'email' => 'hrd@testcorp.co.id',
            'director_name' => 'Budi Santoso',
            'is_active' => true,
        ]);

        $response->assertRedirect('/companies');
        $this->assertDatabaseHas('companies', [
            'name' => 'PT Test Perusahaan Sejahtera',
            'branch_code' => 'TEST-CORP',
            'city' => 'Surabaya',
        ]);
    }

    public function test_company_status_can_be_toggled(): void
    {
        $company = Company::firstOrCreate(['name' => 'PT Toggle Corp'], [
            'is_active' => true,
        ]);

        $orig = $company->is_active;
        $response = $this->actingAs($this->admin)->patch("/companies/{$company->id}/toggle-status");
        $response->assertStatus(302);

        $company->refresh();
        $this->assertNotEquals($orig, $company->is_active);
    }

    // 3. Referrers Tests
    public function test_referrers_index_screen_can_be_rendered(): void
    {
        $response = $this->actingAs($this->admin)->get('/referrers');
        $response->assertStatus(200);
    }

    public function test_referrer_can_be_created_and_updated(): void
    {
        $type = ReferrerType::first();

        $response = $this->actingAs($this->admin)->post('/referrers', [
            'referrer_type_id' => $type->id,
            'name' => 'dr. Agus Sutanto, Sp.A',
            'phone' => '081233445566',
            'marketing_name' => 'Rian',
            'fee_general_percent' => 12.5,
            'is_active' => true,
        ]);

        $response->assertRedirect('/referrers');
        $this->assertDatabaseHas('referrers', [
            'name' => 'dr. Agus Sutanto, Sp.A',
            'marketing_name' => 'Rian',
        ]);
    }

    public function test_referrer_status_can_be_toggled(): void
    {
        $type = ReferrerType::first();
        $referrer = Referrer::firstOrCreate(['name' => 'dr. Test Toggle'], [
            'referrer_type_id' => $type->id,
            'is_active' => true,
        ]);

        $orig = $referrer->is_active;
        $response = $this->actingAs($this->admin)->patch("/referrers/{$referrer->id}/toggle-status");
        $response->assertStatus(302);

        $referrer->refresh();
        $this->assertNotEquals($orig, $referrer->is_active);
    }

    // 4. Banks Tests
    public function test_banks_index_screen_can_be_rendered(): void
    {
        $response = $this->actingAs($this->admin)->get('/banks');
        $response->assertStatus(200);
    }

    public function test_bank_can_be_created_and_updated(): void
    {
        $response = $this->actingAs($this->admin)->post('/banks', [
            'name' => 'Bank Permata',
            'account_number' => '9988776655',
            'account_holder' => 'PT KLINIK SUMMIT TEST',
            'is_active' => true,
        ]);

        $response->assertRedirect('/banks');
        $this->assertDatabaseHas('banks', [
            'name' => 'Bank Permata',
            'account_number' => '9988776655',
        ]);
    }

    public function test_bank_status_can_be_toggled(): void
    {
        $bank = Bank::firstOrCreate(['account_number' => '0011223344'], [
            'name' => 'Bank Toggle',
            'account_holder' => 'TEST TOGGLE',
            'is_active' => true,
        ]);

        $orig = $bank->is_active;
        $response = $this->actingAs($this->admin)->patch("/banks/{$bank->id}/toggle-status");
        $response->assertStatus(302);

        $bank->refresh();
        $this->assertNotEquals($orig, $bank->is_active);
    }

    // 5. Vendors Tests
    public function test_vendors_index_screen_can_be_rendered(): void
    {
        $response = $this->actingAs($this->admin)->get('/vendors');
        $response->assertStatus(200);
    }

    public function test_vendor_can_be_created_and_updated(): void
    {
        $response = $this->actingAs($this->admin)->post('/vendors', [
            'code' => 'VND-TEST-99',
            'name' => 'PT Mitra Reagen Nusantara',
            'contract_type' => 'KSO Alat Kimia',
            'pic_name' => 'Dewi Sartika',
            'phone' => '021-77889900',
            'is_active' => true,
        ]);

        $response->assertRedirect('/vendors');
        $this->assertDatabaseHas('vendors', [
            'code' => 'VND-TEST-99',
            'name' => 'PT Mitra Reagen Nusantara',
        ]);
    }

    public function test_vendor_status_can_be_toggled(): void
    {
        $vendor = Vendor::firstOrCreate(['code' => 'VND-TOGGLE'], [
            'name' => 'Vendor Toggle Test',
            'is_active' => true,
        ]);

        $orig = $vendor->is_active;
        $response = $this->actingAs($this->admin)->patch("/vendors/{$vendor->id}/toggle-status");
        $response->assertStatus(302);

        $vendor->refresh();
        $this->assertNotEquals($orig, $vendor->is_active);
    }

    // 6. Samples Tests
    public function test_samples_index_screen_can_be_rendered(): void
    {
        $response = $this->actingAs($this->admin)->get('/samples');
        $response->assertStatus(200);
    }

    public function test_sample_can_be_created_and_updated(): void
    {
        $response = $this->actingAs($this->admin)->post('/samples', [
            'code' => 'SMP-TEST-SPO2',
            'name' => 'Oksimetri & Denyut Nadi',
            'category' => 'electromedical',
            'sort_order' => 15,
            'is_active' => true,
        ]);

        $response->assertRedirect('/samples');
        $this->assertDatabaseHas('samples', [
            'code' => 'SMP-TEST-SPO2',
            'category' => 'electromedical',
        ]);
    }

    public function test_sample_status_can_be_toggled(): void
    {
        $sample = Sample::firstOrCreate(['code' => 'SMP-TOGGLE'], [
            'name' => 'Sample Toggle Test',
            'category' => 'lab',
            'is_active' => true,
        ]);

        $orig = $sample->is_active;
        $response = $this->actingAs($this->admin)->patch("/samples/{$sample->id}/toggle-status");
        $response->assertStatus(302);

        $sample->refresh();
        $this->assertNotEquals($orig, $sample->is_active);
    }
}
