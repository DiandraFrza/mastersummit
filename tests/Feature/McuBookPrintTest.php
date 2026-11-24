<?php

namespace Tests\Feature;

use App\Models\ClinicSetting;
use App\Models\Company;
use App\Models\ExaminationResult;
use App\Models\McuEvent;
use App\Models\McuReview;
use App\Models\Patient;
use App\Models\Registration;
use App\Models\RegistrationItem;
use App\Models\ResultAttachment;
use App\Models\Sample;
use App\Models\Service;
use App\Models\ServiceParameter;
use App\Models\User;
use App\Services\Prints\GenerateMcuBookPdfService;
use Carbon\Carbon;
use Illuminate\Support\Facades\File;
use setasign\Fpdi\Fpdi;
use Tests\TestCase;

class McuBookPrintTest extends TestCase
{
    protected User $admin;
    protected Patient $patient;
    protected Company $company;
    protected McuEvent $mcuEvent;
    protected Registration $registration;
    protected McuReview $mcuReview;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::where('username', 'superadmin')->first();

        ClinicSetting::current()->update([
            'clinic_name' => 'Klinik Utama & Laboratorium Master Summit',
            'clinic_subtitle' => 'Pusat Layanan MCU & Kesehatan Kerja Terpadu',
            'city' => 'Jakarta Selatan',
        ]);

        $this->company = Company::firstOrCreate(
            ['branch_code' => 'CORP-TEST-MCU-BOOK'],
            ['name' => 'PT Mega Mineral Energi', 'is_active' => true]
        );

        $this->mcuEvent = McuEvent::create([
            'year' => 2026,
            'event_code' => 'EVT-BOOK-' . uniqid(),
            'event_name' => 'Annual MCU 2026 PT Mega Mineral Energi',
            'referrer_id' => 1,
            'company_id' => $this->company->id,
            'target_participants' => 150,
            'city' => 'Jakarta',
            'status' => 'ongoing',
        ]);

        $this->patient = Patient::firstOrCreate(
            ['nik' => '3271555566667777'],
            [
                'name' => 'Dewi Sartika, S.E.',
                'gender' => 'P',
                'birth_date' => Carbon::parse('1994-07-22'),
                'phone' => '081388776655',
                'address' => 'Jl. Kebon Jeruk No. 10, Jakarta',
                'default_company_id' => $this->company->id,
            ]
        );

        $this->registration = Registration::create([
            'reg_no' => 'MCU-REG-' . uniqid(),
            'registered_at' => Carbon::parse('2026-11-25 08:00:00'),
            'patient_id' => $this->patient->id,
            'service_type' => 'mcu',
            'payer_type' => 'corporate',
            'company_id' => $this->company->id,
            'mcu_event_id' => $this->mcuEvent->id,
            'department_snapshot' => 'Finance & Accounting',
            'age_years_snapshot' => 32,
            'grand_total' => 1250000,
            'payment_status' => 'corporate_billed',
            'workflow_status' => 'completed',
        ]);

        // Review Dokter MCU
        $this->mcuReview = McuReview::create([
            'registration_id' => $this->registration->id,
            'fit_status' => 'fit_with_note',
            'abnormality_recap' => [
                [
                    'parameter_label' => 'Kolesterol Total',
                    'value' => '225 mg/dL',
                    'reference' => '< 200 mg/dL',
                    'flag' => 'high',
                    'suggestion' => 'Kurangi konsumsi lemak jenuh, diet rendah kolesterol, evaluasi profil lipid 3 bulan.',
                ],
            ],
            'doctor_summary' => 'Secara klinis dalam kondisi baik, ditemukan hiperkolesterolemia ringan yang dapat dikontrol dengan modifikasi gaya hidup.',
            'doctor_advice' => 'Diet rendah lemak jenuh dan perbanyak serat. Olahraga kardio aerobik 150 menit per minggu.',
            'doctor_reviewed_by' => $this->admin->id,
            'doctor_reviewed_at' => now(),
            'manager_approved_by' => $this->admin->id,
            'manager_approved_at' => now(),
            'is_locked' => true,
        ]);
    }

    public function test_guest_cannot_access_mcu_book_endpoints(): void
    {
        $this->get("/registrations/{$this->registration->id}/mcu-book")->assertRedirect('/login');
        $this->get("/registrations/{$this->registration->id}/mcu-book/pdf")->assertRedirect('/login');
    }

    public function test_can_render_mcu_book_html_with_cover_resume_and_units(): void
    {
        // Add sample items
        $sample = Sample::first();
        $serviceLab = Service::firstOrCreate(
            ['code' => 'SRV-BOOK-LAB'],
            ['name' => 'Hematologi Lengkap MCU', 'category' => 'lab', 'sample_id' => $sample->id, 'print_template' => 'standard_lab', 'base_price' => 150000]
        );
        $serviceRad = Service::firstOrCreate(
            ['code' => 'SRV-BOOK-RAD'],
            ['name' => 'Rontgen Thorax MCU', 'category' => 'radiology', 'sample_id' => $sample->id, 'print_template' => 'radiology', 'base_price' => 175000]
        );

        RegistrationItem::create([
            'registration_id' => $this->registration->id,
            'service_id' => $serviceLab->id,
            'service_name_snapshot' => $serviceLab->name,
            'category' => 'lab',
            'sample_id' => $sample->id,
            'price_snapshot' => 150000,
            'final_price' => 150000,
            'billed_to' => 'corporate',
            'group_conclusion' => 'Hasil laboratorium dalam batas normal.',
        ]);

        RegistrationItem::create([
            'registration_id' => $this->registration->id,
            'service_id' => $serviceRad->id,
            'service_name_snapshot' => $serviceRad->name,
            'category' => 'radiology',
            'sample_id' => $sample->id,
            'price_snapshot' => 175000,
            'final_price' => 175000,
            'billed_to' => 'corporate',
            'group_conclusion' => 'Cor dan Pulmo dalam batas normal.',
        ]);

        $response = $this->actingAs($this->admin)->get("/registrations/{$this->registration->id}/mcu-book");

        $response->assertStatus(200);
        $content = $response->getContent();

        // Check Cover
        $this->assertStringContainsString('LAPORAN HASIL', $content);
        $this->assertStringContainsString('MEDICAL CHECK UP', $content);
        $this->assertStringContainsString('Dewi Sartika', $content);
        $this->assertStringContainsString('PT Mega Mineral Energi', $content);
        $this->assertStringContainsString($this->registration->reg_no, $content);

        // Check Resume
        $this->assertStringContainsString('RESUME MEDIS &amp; REKAPITULASI KELAINAN MCU', $content);
        $this->assertStringContainsString('FIT WITH NOTE (LAIK DENGAN CATATAN)', $content);
        $this->assertStringContainsString('Kolesterol Total', $content);
        $this->assertStringContainsString('225 mg/dL', $content);
        $this->assertStringContainsString('Diet rendah lemak jenuh', $content);

        // Check Units
        $this->assertStringContainsString('HASIL PEMERIKSAAN LABORATORIUM', $content);
        $this->assertStringContainsString('HASIL PEMERIKSAAN RADIOLOGI', $content);
    }

    public function test_can_generate_mcu_book_pdf(): void
    {
        $response = $this->actingAs($this->admin)->get("/registrations/{$this->registration->id}/mcu-book/pdf");

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/pdf');
        $this->assertStringStartsWith('%PDF-', $response->getContent());
        $this->assertGreaterThan(10000, strlen($response->getContent()));
    }

    public function test_fpdi_auto_merges_uploaded_tool_pdf_into_mcu_book(): void
    {
        // 1. Create a tiny test PDF file using Fpdi / Fpdf
        $tempDir = storage_path('app/public/attachments/test');
        if (! File::exists($tempDir)) {
            File::makeDirectory($tempDir, 0755, true);
        }

        $dummyAttachmentPath = $tempDir . '/ekg_strip_test.pdf';
        $fpdf = new \FPDF();
        $fpdf->AddPage();
        $fpdf->SetFont('Arial', 'B', 16);
        $fpdf->Cell(0, 10, 'EKG Strip Diagnostic Output - Machine GE MAC 2000', 0, 1, 'C');
        $fpdf->Output('F', $dummyAttachmentPath);

        $this->assertFileExists($dummyAttachmentPath);

        // 2. Attach to registration
        $att = ResultAttachment::create([
            'registration_id' => $this->registration->id,
            'attachment_type' => 'ekg_pdf',
            'file_path' => 'attachments/test/ekg_strip_test.pdf',
            'original_filename' => 'ekg_strip_test.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => File::size($dummyAttachmentPath),
            'merge_into_mcu_pdf' => true,
        ]);

        // 3. Generate merged PDF via service
        /** @var GenerateMcuBookPdfService $service */
        $service = app(GenerateMcuBookPdfService::class);
        $mergedPdf = $service->generatePdf($this->registration->fresh());

        $this->assertStringStartsWith('%PDF-', $mergedPdf);
        $this->assertGreaterThan(10000, strlen($mergedPdf));

        // Clean up
        if (File::exists($dummyAttachmentPath)) {
            File::delete($dummyAttachmentPath);
        }
    }
}
