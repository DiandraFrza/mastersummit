<?php

namespace Tests\Feature;

use App\Models\ClinicSetting;
use App\Models\Company;
use App\Models\ExaminationResult;
use App\Models\Patient;
use App\Models\Registration;
use App\Models\RegistrationItem;
use App\Models\Sample;
use App\Models\Service;
use App\Models\ServiceParameter;
use App\Models\User;
use Carbon\Carbon;
use Tests\TestCase;

class SpecificPrintTemplateTest extends TestCase
{
    protected User $admin;
    protected Patient $patient;
    protected Company $company;
    protected Registration $registration;
    protected Sample $sampleLab;
    protected Sample $sampleRad;
    protected Sample $sampleAudio;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::where('username', 'superadmin')->first();

        ClinicSetting::current()->update([
            'clinic_name' => 'Klinik Utama & Laboratorium Master Summit',
            'clinic_subtitle' => 'Pusat Layanan MCU & Kesehatan Kerja Terpadu',
            'izin_klinik_no' => '440/012/KLINIK-UTAMA/2026',
            'address' => 'Jl. Summit Medical No. 88',
            'city' => 'Jakarta Selatan',
            'phone' => '(021) 7890-1234',
            'email' => 'info@mastersummit.co.id',
            'website' => 'https://mastersummit.co.id',
        ]);

        $this->company = Company::firstOrCreate(
            ['branch_code' => 'CORP-TEST-PRINT'],
            ['name' => 'PT Print Test Nusantara', 'is_active' => true]
        );

        $this->patient = Patient::firstOrCreate(
            ['nik' => '3271000011112222'],
            [
                'name' => 'Andi Wijaya, S.Kom.',
                'gender' => 'L',
                'birth_date' => Carbon::parse('1992-04-15'),
                'phone' => '081299887766',
                'address' => 'Jl. Tebet Barat No. 5, Jakarta Selatan',
                'default_company_id' => $this->company->id,
            ]
        );

        $this->registration = Registration::create([
            'reg_no' => 'REG-PRINT-' . uniqid(),
            'registered_at' => Carbon::parse('2026-11-25 08:30:00'),
            'patient_id' => $this->patient->id,
            'service_type' => 'mcu',
            'payer_type' => 'corporate',
            'company_id' => $this->company->id,
            'department_snapshot' => 'IT Infrastructure',
            'age_years_snapshot' => 34,
            'total_amount' => 1500000,
            'discount_amount' => 0,
            'grand_total' => 1500000,
            'paid_amount' => 1500000,
            'remaining_amount' => 0,
            'payment_status' => 'corporate_billed',
            'workflow_status' => 'completed',
        ]);

        $this->sampleLab = Sample::firstOrCreate(['code' => 'SMP-TEST-LAB'], ['name' => 'Darah EDTA', 'category' => 'lab']);
        $this->sampleRad = Sample::firstOrCreate(['code' => 'SMP-TEST-RAD'], ['name' => 'Rontgen', 'category' => 'radiology']);
        $this->sampleAudio = Sample::firstOrCreate(['code' => 'SMP-TEST-AUDIO'], ['name' => 'Audiometri', 'category' => 'electromedical']);
    }

    public function test_guest_cannot_access_print_endpoints(): void
    {
        $service = Service::firstOrCreate(
            ['code' => 'SRV-TEST-LAB-1'],
            ['name' => 'Hematologi Lengkap', 'category' => 'lab', 'sample_id' => $this->sampleLab->id, 'print_template' => 'standard_lab', 'base_price' => 150000]
        );

        $item = RegistrationItem::create([
            'registration_id' => $this->registration->id,
            'service_id' => $service->id,
            'service_name_snapshot' => $service->name,
            'category' => 'lab',
            'sample_id' => $this->sampleLab->id,
            'price_snapshot' => 150000,
            'final_price' => 150000,
            'is_from_package' => false,
            'billed_to' => 'corporate',
            'sample_status' => 'taken',
            'result_status' => 'verified',
        ]);

        $this->get("/registrations/{$this->registration->id}/items/{$item->id}/print")->assertRedirect('/login');
        $this->get("/registrations/{$this->registration->id}/items/{$item->id}/pdf")->assertRedirect('/login');
    }

    public function test_404_if_item_does_not_belong_to_registration(): void
    {
        $service = Service::firstOrCreate(
            ['code' => 'SRV-TEST-404'],
            ['name' => 'Test Service', 'category' => 'lab', 'sample_id' => $this->sampleLab->id, 'print_template' => 'standard_lab', 'base_price' => 50000]
        );

        $otherReg = Registration::create([
            'reg_no' => 'REG-OTHER-' . uniqid(),
            'registered_at' => now(),
            'patient_id' => $this->patient->id,
            'service_type' => 'regular',
            'payer_type' => 'aps',
            'grand_total' => 50000,
            'workflow_status' => 'registered',
        ]);

        $otherItem = RegistrationItem::create([
            'registration_id' => $otherReg->id,
            'service_id' => $service->id,
            'service_name_snapshot' => $service->name,
            'category' => 'lab',
            'sample_id' => $this->sampleLab->id,
            'price_snapshot' => 50000,
            'final_price' => 50000,
            'billed_to' => 'personal',
        ]);

        $this->actingAs($this->admin)
            ->get("/registrations/{$this->registration->id}/items/{$otherItem->id}/print")
            ->assertStatus(404);
    }

    public function test_can_render_standard_lab_print_template(): void
    {
        $service = Service::firstOrCreate(
            ['code' => 'SRV-TEST-LAB-PRINT'],
            ['name' => 'Hematologi Rutin', 'category' => 'lab', 'sample_id' => $this->sampleLab->id, 'print_template' => 'standard_lab', 'base_price' => 100000]
        );

        $paramHb = ServiceParameter::firstOrCreate(
            ['service_id' => $service->id, 'code' => 'hb_test'],
            ['label' => 'Hemoglobin', 'group_name' => 'Hematologi', 'input_type' => 'number', 'unit' => 'g/dL', 'sort_order' => 1]
        );

        $item = RegistrationItem::create([
            'registration_id' => $this->registration->id,
            'service_id' => $service->id,
            'service_name_snapshot' => $service->name,
            'category' => 'lab',
            'sample_id' => $this->sampleLab->id,
            'price_snapshot' => 100000,
            'final_price' => 100000,
            'billed_to' => 'corporate',
            'sample_status' => 'taken',
            'result_status' => 'verified',
        ]);

        ExaminationResult::create([
            'registration_id' => $this->registration->id,
            'registration_item_id' => $item->id,
            'parameter_id' => $paramHb->id,
            'value_numeric' => 14.8,
            'unit_snapshot' => 'g/dL',
            'reference_snapshot' => '13.0 - 17.5',
            'flag_status' => 'normal',
        ]);

        $response = $this->actingAs($this->admin)->get("/registrations/{$this->registration->id}/items/{$item->id}/print");

        $response->assertStatus(200);
        $content = $response->getContent();
        $this->assertStringContainsString('HASIL PEMERIKSAAN LABORATORIUM', $content);
        $this->assertStringContainsString('Hematologi Rutin', $content);
        $this->assertStringContainsString('Hemoglobin', $content);
        $this->assertStringContainsString('14.8', $content);
        $this->assertStringContainsString('13.0 - 17.5', $content);
        $this->assertStringContainsString('Andi Wijaya', $content);
    }

    public function test_can_render_antigen_print_template(): void
    {
        $service = Service::firstOrCreate(
            ['code' => 'SRV-TEST-AG'],
            ['name' => 'Swab Antigen SARS-CoV-2', 'category' => 'lab', 'sample_id' => $this->sampleLab->id, 'print_template' => 'antigen', 'base_price' => 95000]
        );

        $param = ServiceParameter::firstOrCreate(
            ['service_id' => $service->id, 'code' => 'sars_ag'],
            ['label' => 'SARS-CoV-2 Antigen', 'input_type' => 'select', 'sort_order' => 1]
        );

        $item = RegistrationItem::create([
            'registration_id' => $this->registration->id,
            'service_id' => $service->id,
            'service_name_snapshot' => $service->name,
            'category' => 'lab',
            'sample_id' => $this->sampleLab->id,
            'price_snapshot' => 95000,
            'final_price' => 95000,
            'billed_to' => 'corporate',
        ]);

        ExaminationResult::create([
            'registration_id' => $this->registration->id,
            'registration_item_id' => $item->id,
            'parameter_id' => $param->id,
            'value_text' => 'NEGATIF',
            'flag_status' => 'normal',
        ]);

        $response = $this->actingAs($this->admin)->get("/registrations/{$this->registration->id}/items/{$item->id}/print");

        $response->assertStatus(200);
        $content = $response->getContent();
        $this->assertStringContainsString('RAPID DIAGNOSTIC TEST (RDT) ANTIGEN', $content);
        $this->assertStringContainsString('NEGATIF', $content);
        $this->assertStringContainsString('Swab Nasofaring / Orofaring', $content);
    }

    public function test_can_render_pcr_print_template(): void
    {
        $service = Service::firstOrCreate(
            ['code' => 'SRV-TEST-PCR'],
            ['name' => 'RT-PCR SARS-CoV-2', 'category' => 'lab', 'sample_id' => $this->sampleLab->id, 'print_template' => 'pcr', 'base_price' => 275000]
        );

        $param = ServiceParameter::firstOrCreate(
            ['service_id' => $service->id, 'code' => 'pcr_target'],
            ['label' => 'Gen Target RdRp & N', 'input_type' => 'text', 'sort_order' => 1]
        );

        $item = RegistrationItem::create([
            'registration_id' => $this->registration->id,
            'service_id' => $service->id,
            'service_name_snapshot' => $service->name,
            'category' => 'lab',
            'sample_id' => $this->sampleLab->id,
            'price_snapshot' => 275000,
            'final_price' => 275000,
            'billed_to' => 'corporate',
        ]);

        ExaminationResult::create([
            'registration_id' => $this->registration->id,
            'registration_item_id' => $item->id,
            'parameter_id' => $param->id,
            'value_text' => 'Undetected',
            'flag_status' => 'normal',
        ]);

        $response = $this->actingAs($this->admin)->get("/registrations/{$this->registration->id}/items/{$item->id}/print");

        $response->assertStatus(200);
        $content = $response->getContent();
        $this->assertStringContainsString('RT-PCR SARS-CoV-2', $content);
        $this->assertStringContainsString('Undetected', $content);
        $this->assertStringContainsString('NEGATIF (SARS-CoV-2 RNA NOT DETECTED)', $content);
    }

    public function test_can_render_narkoba_print_template(): void
    {
        $service = Service::firstOrCreate(
            ['code' => 'SRV-TEST-NARKOBA'],
            ['name' => 'Skrining Narkoba 6 Parameter', 'category' => 'lab', 'sample_id' => $this->sampleLab->id, 'print_template' => 'narkoba', 'base_price' => 180000]
        );

        $paramAmp = ServiceParameter::firstOrCreate(
            ['service_id' => $service->id, 'code' => 'drug_amp'],
            ['label' => 'Amphetamine (AMP)', 'input_type' => 'select', 'sort_order' => 1]
        );

        $item = RegistrationItem::create([
            'registration_id' => $this->registration->id,
            'service_id' => $service->id,
            'service_name_snapshot' => $service->name,
            'category' => 'lab',
            'sample_id' => $this->sampleLab->id,
            'price_snapshot' => 180000,
            'final_price' => 180000,
            'billed_to' => 'corporate',
        ]);

        ExaminationResult::create([
            'registration_id' => $this->registration->id,
            'registration_item_id' => $item->id,
            'parameter_id' => $paramAmp->id,
            'value_text' => 'NEGATIF',
            'reference_snapshot' => '1000 ng/mL',
            'flag_status' => 'normal',
        ]);

        $response = $this->actingAs($this->admin)->get("/registrations/{$this->registration->id}/items/{$item->id}/print");

        $response->assertStatus(200);
        $content = $response->getContent();
        $this->assertStringContainsString('SURAT KETERANGAN BEBAS NARKOBA (SKBN)', $content);
        $this->assertStringContainsString('Amphetamine (AMP)', $content);
        $this->assertStringContainsString('BEBAS / TIDAK MENGANDUNG ZAT NARKOTIKA', $content);
    }

    public function test_can_render_radiology_print_template(): void
    {
        $service = Service::firstOrCreate(
            ['code' => 'SRV-TEST-RAD-1'],
            ['name' => 'Rontgen Thorax PA', 'category' => 'radiology', 'sample_id' => $this->sampleRad->id, 'print_template' => 'radiology', 'base_price' => 165000]
        );

        $param = ServiceParameter::firstOrCreate(
            ['service_id' => $service->id, 'code' => 'rontgen_expertise'],
            ['label' => 'Deskripsi Ekspertise Rontgen', 'input_type' => 'textarea', 'sort_order' => 1]
        );

        $item = RegistrationItem::create([
            'registration_id' => $this->registration->id,
            'service_id' => $service->id,
            'service_name_snapshot' => $service->name,
            'category' => 'radiology',
            'sample_id' => $this->sampleRad->id,
            'price_snapshot' => 165000,
            'final_price' => 165000,
            'group_conclusion' => 'Cor dan Pulmo dalam batas normal.',
            'billed_to' => 'corporate',
        ]);

        ExaminationResult::create([
            'registration_id' => $this->registration->id,
            'registration_item_id' => $item->id,
            'parameter_id' => $param->id,
            'value_text' => 'Cor: CTR < 50%, aorta normal.\nPulmo: Corakan bronkovaskuler normal, infiltrat (-).\nSinus kostofrenikus lancip dan diafragma licin normal.',
            'flag_status' => 'normal',
        ]);

        $response = $this->actingAs($this->admin)->get("/registrations/{$this->registration->id}/items/{$item->id}/print");

        $response->assertStatus(200);
        $content = $response->getContent();
        $this->assertStringContainsString('LEMBAR EKSPERTISE PEMERIKSAAN RADIOLOGI', $content);
        $this->assertStringContainsString('Rontgen Thorax PA', $content);
        $this->assertStringContainsString('Cor: CTR &lt; 50%', $content);
        $this->assertStringContainsString('Dokter Spesialis Radiologi (Sp.Rad)', $content);
    }

    public function test_can_render_electromedical_with_audiogram_svg(): void
    {
        $service = Service::firstOrCreate(
            ['code' => 'SRV-TEST-AUDIO-1'],
            ['name' => 'Audiometri Nada Murni', 'category' => 'electromedical', 'sample_id' => $this->sampleAudio->id, 'print_template' => 'electromedical', 'base_price' => 125000]
        );

        $param = ServiceParameter::firstOrCreate(
            ['service_id' => $service->id, 'code' => 'audio_grid'],
            ['label' => 'Grafik Audiometri AC/BC', 'input_type' => 'audiogram_grid', 'sort_order' => 1]
        );

        $item = RegistrationItem::create([
            'registration_id' => $this->registration->id,
            'service_id' => $service->id,
            'service_name_snapshot' => $service->name,
            'category' => 'electromedical',
            'sample_id' => $this->sampleAudio->id,
            'price_snapshot' => 125000,
            'final_price' => 125000,
            'billed_to' => 'corporate',
        ]);

        ExaminationResult::create([
            'registration_id' => $this->registration->id,
            'registration_item_id' => $item->id,
            'parameter_id' => $param->id,
            'value_json' => [
                'right_ac' => [250 => 15, 500 => 15, 1000 => 20, 2000 => 20, 4000 => 25, 8000 => 20],
                'left_ac' => [250 => 20, 500 => 20, 1000 => 20, 2000 => 25, 4000 => 25, 8000 => 25],
                'right_pta' => 18.3,
                'left_pta' => 21.7,
            ],
            'flag_status' => 'normal',
        ]);

        $response = $this->actingAs($this->admin)->get("/registrations/{$this->registration->id}/items/{$item->id}/print");

        $response->assertStatus(200);
        $content = $response->getContent();
        $this->assertStringContainsString('HASIL PEMERIKSAAN ELEKTROMEDIS &amp; DIAGNOSTIK', $content);
        $this->assertStringContainsString('GRAFIK AUDIOGRAM (Vector)', $content);
        $this->assertStringContainsString('<svg viewBox="0 0 300 180"', $content);
        $this->assertStringContainsString('18.3 dB', $content);
        $this->assertStringContainsString('21.7 dB', $content);
    }

    public function test_can_render_physical_print_template(): void
    {
        $service = Service::firstOrCreate(
            ['code' => 'SRV-TEST-PHYS-1'],
            ['name' => 'Pemeriksaan Fisik Dokter & Gigi', 'category' => 'physical', 'sample_id' => $this->sampleLab->id, 'print_template' => 'physical', 'base_price' => 75000]
        );

        $paramBp = ServiceParameter::firstOrCreate(
            ['service_id' => $service->id, 'code' => 'tekanan_darah'],
            ['label' => 'Tekanan Darah', 'input_type' => 'text', 'sort_order' => 1]
        );

        $item = RegistrationItem::create([
            'registration_id' => $this->registration->id,
            'service_id' => $service->id,
            'service_name_snapshot' => $service->name,
            'category' => 'physical',
            'sample_id' => $this->sampleLab->id,
            'price_snapshot' => 75000,
            'final_price' => 75000,
            'billed_to' => 'corporate',
        ]);

        ExaminationResult::create([
            'registration_id' => $this->registration->id,
            'registration_item_id' => $item->id,
            'parameter_id' => $paramBp->id,
            'value_text' => '118/78',
            'flag_status' => 'normal',
        ]);

        $response = $this->actingAs($this->admin)->get("/registrations/{$this->registration->id}/items/{$item->id}/print");

        $response->assertStatus(200);
        $content = $response->getContent();
        $this->assertStringContainsString('LEMBAR HASIL PEMERIKSAAN FISIK UMUM &amp; GIGI', $content);
        $this->assertStringContainsString('118/78 mmHg', $content);
        $this->assertStringContainsString('Tanda Vital &amp; Antropometri', $content);
    }

    public function test_can_generate_browsershot_pdf_for_single_item(): void
    {
        $service = Service::firstOrCreate(
            ['code' => 'SRV-TEST-PDF-1'],
            ['name' => 'Hematologi Rutin PDF', 'category' => 'lab', 'sample_id' => $this->sampleLab->id, 'print_template' => 'standard_lab', 'base_price' => 100000]
        );

        $item = RegistrationItem::create([
            'registration_id' => $this->registration->id,
            'service_id' => $service->id,
            'service_name_snapshot' => $service->name,
            'category' => 'lab',
            'sample_id' => $this->sampleLab->id,
            'price_snapshot' => 100000,
            'final_price' => 100000,
            'billed_to' => 'corporate',
        ]);

        $response = $this->actingAs($this->admin)->get("/registrations/{$this->registration->id}/items/{$item->id}/pdf");

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/pdf');
        $this->assertStringStartsWith('%PDF-', $response->getContent());
        $this->assertGreaterThan(5000, strlen($response->getContent()));
    }
}
