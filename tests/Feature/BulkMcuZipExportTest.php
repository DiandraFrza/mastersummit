<?php

namespace Tests\Feature;

use App\Jobs\GenerateBulkMcuBooksZipJob;
use App\Models\Company;
use App\Models\McuEvent;
use App\Models\Patient;
use App\Models\Registration;
use App\Models\User;
use App\Services\Prints\GenerateMcuBookPdfService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;
use ZipArchive;

class BulkMcuZipExportTest extends TestCase
{
    protected User $admin;
    protected Company $company;
    protected McuEvent $mcuEvent;
    protected Patient $patient1;
    protected Patient $patient2;
    protected Registration $reg1;
    protected Registration $reg2;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::where('username', 'superadmin')->first();

        $this->company = Company::firstOrCreate(
            ['branch_code' => 'CORP-TEST-ZIP'],
            ['name' => 'PT Bulk Zip Sejahtera', 'is_active' => true]
        );

        $this->mcuEvent = McuEvent::create([
            'year' => 2026,
            'event_code' => 'EVT-ZIP-' . uniqid(),
            'event_name' => 'Bulk Export Test Event',
            'referrer_id' => 1,
            'company_id' => $this->company->id,
            'target_participants' => 2,
            'status' => 'ongoing',
        ]);

        $this->patient1 = Patient::create([
            'medical_record_no' => 'RM-ZIP-1-' . uniqid(),
            'name' => 'Peserta Satu',
            'gender' => 'L',
            'birth_date' => Carbon::parse('1990-01-01'),
        ]);

        $this->patient2 = Patient::create([
            'medical_record_no' => 'RM-ZIP-2-' . uniqid(),
            'name' => 'Peserta Dua',
            'gender' => 'P',
            'birth_date' => Carbon::parse('1995-05-05'),
        ]);

        $this->reg1 = Registration::create([
            'reg_no' => 'REG-Z1-' . uniqid(),
            'registered_at' => now(),
            'patient_id' => $this->patient1->id,
            'service_type' => 'mcu',
            'payer_type' => 'corporate',
            'mcu_event_id' => $this->mcuEvent->id,
            'workflow_status' => 'completed',
            'grand_total' => 500000,
        ]);

        $this->reg2 = Registration::create([
            'reg_no' => 'REG-Z2-' . uniqid(),
            'registered_at' => now(),
            'patient_id' => $this->patient2->id,
            'service_type' => 'mcu',
            'payer_type' => 'corporate',
            'mcu_event_id' => $this->mcuEvent->id,
            'workflow_status' => 'completed',
            'grand_total' => 500000,
        ]);
    }

    public function test_guest_cannot_dispatch_or_check_bulk_zip(): void
    {
        $this->postJson("/mcu-events/{$this->mcuEvent->id}/bulk-zip")->assertStatus(401);
        $this->getJson("/mcu-events/{$this->mcuEvent->id}/bulk-zip/status")->assertStatus(401);
    }

    public function test_can_dispatch_bulk_zip_job(): void
    {
        Queue::fake();

        $response = $this->actingAs($this->admin)->postJson("/mcu-events/{$this->mcuEvent->id}/bulk-zip");

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'dispatched',
        ]);

        Queue::assertPushed(GenerateBulkMcuBooksZipJob::class, function ($job) {
            return $job->mcuEvent->id === $this->mcuEvent->id;
        });
    }

    public function test_can_check_bulk_zip_status(): void
    {
        $cacheKey = GenerateBulkMcuBooksZipJob::getCacheKey($this->mcuEvent->id);
        Cache::put($cacheKey, [
            'status' => 'processing',
            'progress' => 50,
            'total' => 2,
            'processed' => 1,
            'message' => 'Memproses...',
        ]);

        $response = $this->actingAs($this->admin)->getJson("/mcu-events/{$this->mcuEvent->id}/bulk-zip/status");

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'processing',
            'progress' => 50,
            'total' => 2,
            'processed' => 1,
        ]);
    }

    public function test_generate_bulk_mcu_books_zip_job_creates_valid_zip_file(): void
    {
        $service = app(GenerateMcuBookPdfService::class);
        $job = new GenerateBulkMcuBooksZipJob($this->mcuEvent);
        $job->handle($service);

        $cacheKey = GenerateBulkMcuBooksZipJob::getCacheKey($this->mcuEvent->id);
        $status = Cache::get($cacheKey);

        $this->assertNotNull($status);
        $this->assertEquals('completed', $status['status']);
        $this->assertEquals(100, $status['progress']);
        $this->assertEquals(2, $status['total']);
        $this->assertEquals(2, $status['processed']);
        $this->assertNotEmpty($status['zip_filename']);

        $zipFullPath = storage_path('app/public/' . $status['zip_path']);
        $this->assertFileExists($zipFullPath);

        // Open ZIP and verify contents
        $zip = new ZipArchive();
        $res = $zip->open($zipFullPath);
        $this->assertTrue($res === true);
        $this->assertEquals(2, $zip->numFiles);

        $name1 = $zip->getNameIndex(0);
        $name2 = $zip->getNameIndex(1);
        $this->assertTrue(str_contains($name1, '.pdf') && str_contains($name2, '.pdf'));

        $zip->close();

        // Test download route
        $downloadRes = $this->actingAs($this->admin)->get("/mcu-events/{$this->mcuEvent->id}/bulk-zip/download");
        $downloadRes->assertStatus(200);
        $this->assertStringContainsString('attachment;', $downloadRes->headers->get('Content-Disposition'));
        $this->assertStringContainsString('.zip', $downloadRes->headers->get('Content-Disposition'));

        // Clean up
        if (File::exists($zipFullPath)) {
            File::delete($zipFullPath);
        }
    }
}
