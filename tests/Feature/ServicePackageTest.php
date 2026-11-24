<?php

namespace Tests\Feature;

use App\Models\Package;
use App\Models\Sample;
use App\Models\Service;
use App\Models\User;
use Tests\TestCase;

class ServicePackageTest extends TestCase
{
    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::where('username', 'superadmin')->first();
    }

    protected function tearDown(): void
    {
        Service::whereIn('code', ['TEST-SVC-01', 'SVC-TOGGLE'])->delete();
        Package::whereIn('name', ['Paket Test Auto Sum', 'Paket Test Auto Sum Updated', 'Paket Test Recalculate Initial', 'Toggle Pkg Test'])->delete();
        parent::tearDown();
    }

    // 1. Services Tests
    public function test_services_index_screen_can_be_rendered(): void
    {
        $response = $this->actingAs($this->admin)->get('/services');
        $response->assertStatus(200);
    }

    public function test_service_can_be_created_and_updated(): void
    {
        $sample = Sample::first();

        $postResponse = $this->actingAs($this->admin)->post('/services', [
            'code' => 'TEST-SVC-01',
            'name' => 'Pemeriksaan Asam Urat Serum',
            'category' => 'lab',
            'sub_group' => 'Kimia Klinik',
            'sample_id' => $sample->id,
            'base_price' => 45000,
            'print_template' => 'standard_lab',
            'is_active' => true,
        ]);

        $postResponse->assertRedirect('/services');
        $this->assertDatabaseHas('services', [
            'code' => 'TEST-SVC-01',
            'name' => 'Pemeriksaan Asam Urat Serum',
            'base_price' => 45000.00,
        ]);

        $svc = Service::where('code', 'TEST-SVC-01')->first();

        $putResponse = $this->actingAs($this->admin)->put("/services/{$svc->id}", [
            'code' => 'TEST-SVC-01',
            'name' => 'Pemeriksaan Asam Urat (Uric Acid)',
            'category' => 'lab',
            'sub_group' => 'Kimia Klinik',
            'sample_id' => $sample->id,
            'base_price' => 50000,
            'print_template' => 'standard_lab',
            'is_active' => true,
        ]);

        $putResponse->assertRedirect('/services');
        $this->assertDatabaseHas('services', [
            'id' => $svc->id,
            'name' => 'Pemeriksaan Asam Urat (Uric Acid)',
            'base_price' => 50000.00,
        ]);
    }

    public function test_service_status_can_be_toggled(): void
    {
        $sample = Sample::first();
        $svc = Service::firstOrCreate(['code' => 'SVC-TOGGLE'], [
            'name' => 'Toggle Service Test',
            'category' => 'lab',
            'sample_id' => $sample->id,
            'base_price' => 30000,
            'print_template' => 'standard_lab',
            'is_active' => true,
        ]);

        $orig = $svc->is_active;
        $response = $this->actingAs($this->admin)->patch("/services/{$svc->id}/toggle-status");
        $response->assertStatus(302);

        $svc->refresh();
        $this->assertNotEquals($orig, $svc->is_active);
    }

    // 2. Packages Tests
    public function test_packages_index_screen_can_be_rendered(): void
    {
        $response = $this->actingAs($this->admin)->get('/packages');
        $response->assertStatus(200);
    }

    public function test_package_can_be_created_with_auto_sum_and_discount(): void
    {
        $services = Service::take(3)->get();
        $this->assertGreaterThanOrEqual(2, $services->count());

        $expectedTotal = (float) $services[0]->base_price + (float) $services[1]->base_price;
        $discount = 20000.00;
        $expectedFinal = max(0, $expectedTotal - $discount);

        $postResponse = $this->actingAs($this->admin)->post('/packages', [
            'name' => 'Paket Test Auto Sum',
            'year' => 2026,
            'event_label' => 'Test Batch MCU',
            'discount_amount' => $discount,
            'is_active' => true,
            'items' => [
                ['service_id' => $services[0]->id, 'item_price_override' => null],
                ['service_id' => $services[1]->id, 'item_price_override' => null],
            ],
        ]);

        $postResponse->assertRedirect('/packages');

        $this->assertDatabaseHas('packages', [
            'name' => 'Paket Test Auto Sum',
            'year' => 2026,
            'total_price' => $expectedTotal,
            'discount_amount' => $discount,
            'final_price' => $expectedFinal,
        ]);

        $pkg = Package::where('name', 'Paket Test Auto Sum')->first();
        $this->assertCount(2, $pkg->packageItems);
    }

    public function test_package_items_can_be_updated_and_recalculated(): void
    {
        $services = Service::take(3)->get();
        $this->assertGreaterThanOrEqual(1, $services->count());

        $pkg = Package::create([
            'name' => 'Paket Test Recalculate Initial',
            'year' => 2026,
            'event_label' => 'Initial Batch',
            'total_price' => 50000,
            'discount_amount' => 5000,
            'final_price' => 45000,
            'is_active' => true,
        ]);

        // Update with 1 item overridden price
        $putResponse = $this->actingAs($this->admin)->put("/packages/{$pkg->id}", [
            'name' => 'Paket Test Auto Sum Updated',
            'year' => 2026,
            'event_label' => 'Updated Batch',
            'discount_amount' => 10000,
            'is_active' => true,
            'items' => [
                ['service_id' => $services[0]->id, 'item_price_override' => 100000],
            ],
        ]);

        $putResponse->assertRedirect('/packages');

        $pkg->refresh();
        $this->assertEquals(100000.00, (float) $pkg->total_price);
        $this->assertEquals(90000.00, (float) $pkg->final_price);
        $this->assertCount(1, $pkg->packageItems);
    }

    public function test_package_status_can_be_toggled(): void
    {
        $pkg = Package::firstOrCreate(['name' => 'Toggle Pkg Test'], [
            'year' => 2026,
            'total_price' => 50000,
            'final_price' => 50000,
            'is_active' => true,
        ]);

        $orig = $pkg->is_active;
        $response = $this->actingAs($this->admin)->patch("/packages/{$pkg->id}/toggle-status");
        $response->assertStatus(302);

        $pkg->refresh();
        $this->assertNotEquals($orig, $pkg->is_active);
    }
}
