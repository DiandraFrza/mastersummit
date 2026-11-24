<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Employee;
use App\Models\McuEvent;
use App\Models\Patient;
use App\Models\Referrer;
use App\Models\User;
use Tests\TestCase;

class PatientEventTest extends TestCase
{
    protected User $admin;
    protected Company $company;
    protected Referrer $referrer;
    protected Employee $doctor;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::where('username', 'superadmin')->first();

        $this->company = Company::first() ?? Company::create([
            'branch_code' => 'TEST-CORP',
            'name' => 'PT Test Korpora Indonesia',
            'is_active' => true,
        ]);

        $this->referrer = Referrer::first() ?? Referrer::create([
            'name' => 'Dr. H. Bambang Subagyo, Sp.PK',
            'referrer_type_id' => 1,
            'fee_general_percent' => 10,
            'is_active' => true,
        ]);

        $this->doctor = Employee::first() ?? Employee::create([
            'nik' => '3271000000000099',
            'name' => 'dr. Sarah Amanda, Sp.OK',
            'job_title' => 'Dokter Okupasi MCU',
            'is_active' => true,
        ]);
    }

    protected function tearDown(): void
    {
        Patient::where('name', 'like', 'Pasien Test%')->forceDelete();
        McuEvent::where('event_name', 'like', 'Event MCU Test%')->forceDelete();
        parent::tearDown();
    }

    // ==========================================
    // Patient Tests
    // ==========================================

    public function test_patients_index_screen_can_be_rendered(): void
    {
        $response = $this->actingAs($this->admin)->get('/patients');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Patients/Index')
            ->has('patients')
            ->has('companies')
            ->has('nextNrm')
        );
    }

    public function test_patient_can_be_created_with_auto_generated_nrm(): void
    {
        $response = $this->actingAs($this->admin)->post('/patients', [
            'name' => 'Pasien Test Sutrisno',
            'nik' => '3201012304900001',
            'gender' => 'L',
            'birth_date' => '1990-04-23',
            'phone' => '081234567899',
            'email' => 'sutrisno.test@example.com',
            'address' => 'Jl. Merdeka No. 45, Jakarta Pusat',
            'default_company_id' => $this->company->id,
            'default_department' => 'Operasional IT',
        ]);

        $response->assertSessionHas('success');

        $this->assertDatabaseHas('patients', [
            'name' => 'Pasien Test Sutrisno',
            'nik' => '3201012304900001',
            'gender' => 'L',
            'default_company_id' => $this->company->id,
            'default_department' => 'Operasional IT',
        ]);

        $patient = Patient::where('nik', '3201012304900001')->first();
        $this->assertNotNull($patient);
        $this->assertNotEmpty($patient->medical_record_no);
        $this->assertStringStartsWith('NRM-', $patient->medical_record_no);
        $this->assertNotNull($patient->age);
    }

    public function test_patient_can_be_updated_and_soft_deleted(): void
    {
        $patient = Patient::create([
            'medical_record_no' => 'NRM-TEST-0099',
            'name' => 'Pasien Test Awal',
            'gender' => 'P',
            'birth_date' => '1995-08-17',
            'phone' => '081999888777',
        ]);

        // Update
        $putResponse = $this->actingAs($this->admin)->put("/patients/{$patient->id}", [
            'medical_record_no' => 'NRM-TEST-0099',
            'name' => 'Pasien Test Diperbarui',
            'gender' => 'P',
            'birth_date' => '1995-08-17',
            'phone' => '081999888666',
            'address' => 'Jl. Kebon Jeruk Baru No. 12',
        ]);

        $putResponse->assertSessionHas('success');
        $this->assertDatabaseHas('patients', [
            'id' => $patient->id,
            'name' => 'Pasien Test Diperbarui',
            'phone' => '081999888666',
        ]);

        // Soft Delete
        $delResponse = $this->actingAs($this->admin)->delete("/patients/{$patient->id}");
        $delResponse->assertSessionHas('success');

        $this->assertSoftDeleted('patients', [
            'id' => $patient->id,
        ]);
    }

    public function test_patient_export_csv(): void
    {
        Patient::create([
            'name' => 'Pasien Test Export 1',
            'gender' => 'L',
            'birth_date' => '1988-01-01',
        ]);

        $response = $this->actingAs($this->admin)->get('/patients/export');
        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
    }

    // ==========================================
    // MCU Event Tests
    // ==========================================

    public function test_mcu_events_index_screen_can_be_rendered(): void
    {
        $response = $this->actingAs($this->admin)->get('/mcu-events');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Events/Index')
            ->has('events')
            ->has('companies')
            ->has('referrers')
            ->has('employees')
            ->has('nextEventCode')
        );
    }

    public function test_mcu_event_can_be_created_with_auto_generated_event_code(): void
    {
        $response = $this->actingAs($this->admin)->post('/mcu-events', [
            'year' => 2026,
            'event_name' => 'Event MCU Test Karyawan PT Telkom',
            'referrer_id' => $this->referrer->id,
            'company_id' => $this->company->id,
            'target_participants' => 250,
            'city' => 'Jakarta Barat',
            'start_date' => '2026-05-10',
            'end_date' => '2026-05-12',
            'pic_mcu_id' => $this->doctor->id,
            'doctor_anamnese_id' => $this->doctor->id,
            'status' => 'draft',
            'notes' => 'MCU onsite di kantor pusat lantai 8',
        ]);

        $response->assertSessionHas('success');

        $this->assertDatabaseHas('mcu_events', [
            'year' => 2026,
            'event_name' => 'Event MCU Test Karyawan PT Telkom',
            'referrer_id' => $this->referrer->id,
            'company_id' => $this->company->id,
            'target_participants' => 250,
            'status' => 'draft',
        ]);

        $event = McuEvent::where('event_name', 'Event MCU Test Karyawan PT Telkom')->first();
        $this->assertNotNull($event);
        $this->assertNotEmpty($event->event_code);
        $this->assertStringStartsWith('MCU-2026-', $event->event_code);
    }

    public function test_mcu_event_can_be_updated_status_and_soft_deleted(): void
    {
        $event = McuEvent::create([
            'year' => 2026,
            'event_code' => 'MCU-2026-TEST99',
            'event_name' => 'Event MCU Test Status Update',
            'referrer_id' => $this->referrer->id,
            'company_id' => $this->company->id,
            'target_participants' => 50,
            'status' => 'draft',
        ]);

        // Status update via patch
        $statusResponse = $this->actingAs($this->admin)->patch("/mcu-events/{$event->id}/update-status", [
            'status' => 'ongoing',
        ]);
        $statusResponse->assertSessionHas('success');
        $this->assertEquals('ongoing', $event->fresh()->status);

        // General update
        $putResponse = $this->actingAs($this->admin)->put("/mcu-events/{$event->id}", [
            'year' => 2026,
            'event_code' => 'MCU-2026-TEST99',
            'event_name' => 'Event MCU Test Status Update (Revised)',
            'referrer_id' => $this->referrer->id,
            'company_id' => $this->company->id,
            'target_participants' => 75,
            'status' => 'review',
        ]);
        $putResponse->assertSessionHas('success');
        $this->assertEquals('Event MCU Test Status Update (Revised)', $event->fresh()->event_name);
        $this->assertEquals('review', $event->fresh()->status);

        // Soft Delete
        $delResponse = $this->actingAs($this->admin)->delete("/mcu-events/{$event->id}");
        $delResponse->assertSessionHas('success');

        $this->assertSoftDeleted('mcu_events', [
            'id' => $event->id,
        ]);
    }
}
