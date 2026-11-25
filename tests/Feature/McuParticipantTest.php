<?php

namespace Tests\Feature;

use App\Models\McuEvent;
use App\Models\Package;
use App\Models\Patient;
use App\Models\Registration;
use App\Models\User;
use Carbon\Carbon;
use Tests\TestCase;

class McuParticipantTest extends TestCase
{
    protected User $admin;
    protected McuEvent $mcuEvent;
    protected Package $package;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::where('username', 'superadmin')->first();

        $this->mcuEvent = McuEvent::first() ?? McuEvent::create([
            'year' => (int) date('Y'),
            'event_code' => 'MCU-TEST-PARTICIPANT',
            'event_name' => 'MCU Test Participant Event',
            'target_participants' => 50,
            'status' => 'ongoing',
        ]);

        $this->package = Package::has('packageItems')->with('packageItems.service.sample')->first();
    }

    public function test_participants_index_can_be_rendered(): void
    {
        $response = $this->actingAs($this->admin)
            ->get(route('events.participants.index', $this->mcuEvent->id));

        $response->assertStatus(200);
    }

    public function test_participant_can_be_added_manually(): void
    {
        $payload = [
            'name' => 'Budi Peserta Baru',
            'nik' => '3271019900001111',
            'gender' => 'L',
            'birth_date' => '1995-04-12',
            'department' => 'Logistik',
            'package_id' => $this->package?->id,
            'phone' => '081234567890',
            'address' => 'Jl. Uji Peserta No. 1',
        ];

        $response = $this->actingAs($this->admin)
            ->post(route('events.participants.store', $this->mcuEvent->id), $payload);

        $response->assertRedirect();

        $this->assertDatabaseHas('patients', [
            'name' => 'Budi Peserta Baru',
            'nik' => '3271019900001111',
        ]);

        $this->assertDatabaseHas('registrations', [
            'mcu_event_id' => $this->mcuEvent->id,
            'workflow_status' => 'pending',
            'reg_no' => null,
        ]);
    }

    public function test_participant_check_in_generates_reg_no_and_unpacks_items(): void
    {
        $patient = Patient::create([
            'name' => 'Siti CheckIn',
            'nik' => '3271019900002222',
            'gender' => 'P',
            'birth_date' => '1993-08-20',
        ]);

        $reg = Registration::create([
            'patient_id' => $patient->id,
            'mcu_event_id' => $this->mcuEvent->id,
            'workflow_status' => 'pending',
            'service_type' => 'mcu',
            'reg_no' => null,
        ]);

        $checkInPayload = [
            'package_id' => $this->package->id,
            'registered_at' => Carbon::now()->toDateString(),
            'photo' => 'data:image/jpeg;base64,' . base64_encode('fake-image-bytes'),
        ];

        $response = $this->actingAs($this->admin)
            ->post(route('events.participants.check-in', [$this->mcuEvent->id, $reg->id]), $checkInPayload);

        $response->assertRedirect();

        $reg->refresh();
        $this->assertEquals('registered', $reg->workflow_status);
        $this->assertNotNull($reg->reg_no);
        $this->assertStringStartsWith('REG-', $reg->reg_no);

        // Ensure package items were unpacked
        $this->assertGreaterThan(0, $reg->items()->count());

        // Test label and card prints
        $labResponse = $this->actingAs($this->admin)->get(route('registrations.label-lab', $reg->id));
        $labResponse->assertStatus(200);

        $nonLabResponse = $this->actingAs($this->admin)->get(route('registrations.label-non-lab', $reg->id));
        $nonLabResponse->assertStatus(200);

        $cardResponse = $this->actingAs($this->admin)->get(route('registrations.participant-card', $reg->id));
        $cardResponse->assertStatus(200);

        // Cleanup
        $reg->items()->delete();
        $reg->forceDelete();
        $patient->forceDelete();
    }

    public function test_template_download(): void
    {
        $response = $this->actingAs($this->admin)
            ->get(route('events.participants.template', $this->mcuEvent->id));

        $response->assertStatus(200);
        $contentType = $response->headers->get('content-type');
        $this->assertTrue(str_contains($contentType, 'spreadsheetml') || str_contains($contentType, 'text/csv'));
    }

    public function test_import_participants_csv(): void
    {
        $csvContent = "NIK,Nama Lengkap,Jenis Kelamin (L/P),Tanggal Lahir (YYYY-MM-DD),Bagian / Departemen,Paket MCU\n" .
                      "3271019900003333,Doni Import,L,1991-03-10,Gudang,Paket Test\n";

        $tempFile = tempnam(sys_get_temp_dir(), 'csv_import_');
        file_put_contents($tempFile, $csvContent);

        $uploadedFile = new \Illuminate\Http\UploadedFile(
            $tempFile,
            'participants.csv',
            'text/csv',
            null,
            true
        );

        $response = $this->actingAs($this->admin)
            ->post(route('events.participants.import', $this->mcuEvent->id), [
                'file' => $uploadedFile,
            ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('patients', [
            'name' => 'Doni Import',
            'nik' => '3271019900003333',
        ]);

        $this->assertDatabaseHas('registrations', [
            'mcu_event_id' => $this->mcuEvent->id,
            'workflow_status' => 'pending',
            'department_snapshot' => 'Gudang',
        ]);

        @unlink($tempFile);
    }
}
