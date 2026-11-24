<?php

namespace Tests\Feature;

use App\Models\ClinicSetting;
use App\Models\Company;
use App\Models\Package;
use App\Models\Patient;
use App\Models\Registration;
use App\Models\RegistrationItem;
use App\Models\Sample;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Tests\TestCase;

class ControlCardTest extends TestCase
{
    protected User $admin;
    protected Patient $patient;
    protected Company $company;
    protected Registration $registration;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::where('username', 'superadmin')->first();

        // Ensure ClinicSetting exists with complete data
        ClinicSetting::current()->update([
            'clinic_name' => 'Klinik Utama & Laboratorium Master Summit',
            'clinic_subtitle' => 'Pusat Layanan MCU & Kesehatan Kerja Terpadu',
            'izin_klinik_no' => '440/012/KLINIK-UTAMA/2026',
            'address' => 'Jl. Summit Medical No. 88',
            'city' => 'Jakarta Selatan',
            'phone' => '(021) 7890-1234',
            'email' => 'info@mastersummit.co.id',
            'website' => 'https://mastersummit.co.id',
            'control_card_paper_size' => 'A5',
            'watermark_opacity' => 0.08,
            'footer_text' => 'Dokumen sah hasil cetak sistem elektronik klinik.',
        ]);

        $this->company = Company::firstOrCreate(
            ['branch_code' => 'CORP-TEST-CC'],
            [
                'name' => 'PT Sumber Makmur Sejati',
                'is_active' => true,
            ]
        );

        $this->patient = Patient::firstOrCreate(
            ['nik' => '3271888877770002'],
            [
                'name' => 'Budi Santoso, S.T.',
                'gender' => 'L',
                'birth_date' => Carbon::parse('1988-08-20'),
                'phone' => '081234567890',
                'address' => 'Jl. Mawar No. 12, Jakarta',
                'default_company_id' => $this->company->id,
                'default_department' => 'Produksi & Maintenance',
                'is_active' => true,
            ]
        );

        // Create sample registration with items across categories
        $this->registration = Registration::create([
            'patient_id' => $this->patient->id,
            'service_type' => 'mcu',
            'payer_type' => 'corporate',
            'company_id' => $this->company->id,
            'department_snapshot' => 'Produksi & Maintenance',
            'age_years_snapshot' => 38,
            'workflow_status' => 'registered',
            'payment_status' => 'corporate_billed',
        ]);

        $sampleBlood = Sample::firstOrCreate(
            ['code' => 'SMPL-TEST-EDTA'],
            ['name' => 'Darah EDTA', 'is_active' => true]
        );

        $serviceLab = Service::firstOrCreate(
            ['code' => 'SRV-TEST-HEMA'],
            [
                'name' => 'Hematologi Lengkap 18 Parameter',
                'category' => 'lab',
                'sample_id' => $sampleBlood->id,
                'base_price' => 125000,
                'is_active' => true,
            ]
        );

        $serviceRad = Service::firstOrCreate(
            ['code' => 'SRV-TEST-RONTGEN'],
            [
                'name' => 'Rontgen Thorax PA',
                'category' => 'radiology',
                'sample_id' => $sampleBlood->id,
                'base_price' => 150000,
                'is_active' => true,
            ]
        );

        RegistrationItem::create([
            'registration_id' => $this->registration->id,
            'service_id' => $serviceLab->id,
            'service_name_snapshot' => $serviceLab->name,
            'category' => 'lab',
            'sample_id' => $sampleBlood->id,
            'price_snapshot' => 125000,
            'final_price' => 125000,
            'is_from_package' => false,
            'billed_to' => 'corporate',
        ]);

        RegistrationItem::create([
            'registration_id' => $this->registration->id,
            'service_id' => $serviceRad->id,
            'service_name_snapshot' => $serviceRad->name,
            'category' => 'radiology',
            'sample_id' => $serviceRad->sample_id,
            'price_snapshot' => 150000,
            'final_price' => 150000,
            'is_from_package' => false,
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

    public function test_unauthenticated_user_cannot_access_control_card(): void
    {
        $response = $this->get("/registrations/{$this->registration->id}/control-card");
        $response->assertRedirect('/login');

        $pdfResponse = $this->get("/registrations/{$this->registration->id}/control-card/pdf");
        $pdfResponse->assertRedirect('/login');
    }

    // ==========================================
    // 2. HTML View Rendering & Content Verification
    // ==========================================

    public function test_control_card_html_view_can_be_rendered_with_default_paper_size(): void
    {
        $response = $this->actingAs($this->admin)->get("/registrations/{$this->registration->id}/control-card");

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/html; charset=UTF-8');

        $content = $response->getContent();

        // Patient demographics check
        $this->assertStringContainsString('Budi Santoso, S.T.', $content);
        $this->assertStringContainsString($this->patient->medical_record_no, $content);
        $this->assertStringContainsString('3271888877770002', $content);
        $this->assertStringContainsString('Produksi &amp; Maintenance', $content);
        $this->assertStringContainsString('PT Sumber Makmur Sejati', $content);

        // Barcode verification
        $this->assertStringContainsString($this->registration->reg_no, $content);
        $this->assertStringContainsString('<svg', $content);
        $this->assertStringContainsString('barcode-svg-container', $content);

        // Dynamic Kop Surat verification
        $this->assertStringContainsString('Klinik Utama &amp; Laboratorium Master Summit', $content);
        $this->assertStringContainsString('440/012/KLINIK-UTAMA/2026', $content);
        $this->assertStringContainsString('Jl. Summit Medical No. 88', $content);

        // Station Checklist verification
        $this->assertStringContainsString('Loket Pendaftaran &amp; Tanda Vital', $content);
        $this->assertStringContainsString('Laboratorium &amp; Flebotomi', $content);
        $this->assertStringContainsString('Radiologi (Rontgen)', $content);
        $this->assertStringContainsString('Kasir &amp; Pengembalian Berkas', $content);
    }

    // ==========================================
    // 3. Paper Sizes Support (A5, A6, A4_2IN1)
    // ==========================================

    public function test_control_card_supports_a5_a6_and_a4_2in1_paper_sizes(): void
    {
        // 1. A5
        $responseA5 = $this->actingAs($this->admin)->get("/registrations/{$this->registration->id}/control-card?size=A5");
        $responseA5->assertStatus(200);
        $this->assertStringContainsString('size: A5 portrait', $responseA5->getContent());

        // 2. A6
        $responseA6 = $this->actingAs($this->admin)->get("/registrations/{$this->registration->id}/control-card?size=A6");
        $responseA6->assertStatus(200);
        $this->assertStringContainsString('size: A6 portrait', $responseA6->getContent());

        // 3. A4_2IN1 (dual copies with cutting line)
        $responseA4 = $this->actingAs($this->admin)->get("/registrations/{$this->registration->id}/control-card?size=A4_2IN1");
        $responseA4->assertStatus(200);
        $contentA4 = $responseA4->getContent();
        $this->assertStringContainsString('size: A4 portrait', $contentA4);
        $this->assertStringContainsString('LEMBAR PASIEN', $contentA4);
        $this->assertStringContainsString('LEMBAR ARSIP KLINIK', $contentA4);
        $this->assertStringContainsString('POTONG DI SINI (CUT HERE)', $contentA4);
    }

    // ==========================================
    // 4. Browsershot PDF Direct Stream / Download
    // ==========================================

    public function test_control_card_pdf_can_be_generated(): void
    {
        $response = $this->actingAs($this->admin)->get("/registrations/{$this->registration->id}/control-card/pdf");

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/pdf');
        $this->assertStringContainsString("kartu-kontrol-{$this->registration->reg_no}.pdf", $response->headers->get('Content-Disposition'));

        $pdfBinary = $response->getContent();
        // Valid PDF begins with %PDF-
        $this->assertStringStartsWith('%PDF-', $pdfBinary);
        $this->assertGreaterThan(5000, strlen($pdfBinary));
    }
}
