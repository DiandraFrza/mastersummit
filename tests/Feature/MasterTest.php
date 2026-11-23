<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MasterTest extends TestCase
{
    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::where('username', 'superadmin')->first();
    }

    protected function tearDown(): void
    {
        Employee::where('nik', '3201010101019999')->delete();
        User::where('username', 'petugas_multi')->delete();
        parent::tearDown();
    }

    public function test_employees_index_screen_can_be_rendered(): void
    {
        $response = $this->actingAs($this->admin)->get('/employees');

        $response->assertStatus(200);
    }

    public function test_employee_can_be_created_with_digital_signature(): void
    {
        Storage::fake('public');

        $signature = UploadedFile::fake()->image('signature.png', 200, 100);

        $response = $this->actingAs($this->admin)->post('/employees', [
            'nik' => '3201010101019999',
            'name' => 'dr. John Doe, Sp.PK',
            'job_title' => 'Dokter Patologi Klinik',
            'signature_file' => $signature,
            'is_active' => true,
        ]);

        $response->assertRedirect('/employees');

        $this->assertDatabaseHas('employees', [
            'nik' => '3201010101019999',
            'name' => 'dr. John Doe, Sp.PK',
            'is_active' => true,
        ]);

        $employee = Employee::where('nik', '3201010101019999')->first();
        $this->assertNotNull($employee->signature_path);
        Storage::disk('public')->assertExists($employee->signature_path);
    }

    public function test_employee_status_can_be_toggled_without_hard_delete(): void
    {
        $employee = Employee::where('nik', '3201010101019999')->first()
            ?? Employee::factory()->create();

        $originalStatus = $employee->is_active;

        $response = $this->actingAs($this->admin)->patch("/employees/{$employee->id}/toggle-status");

        $response->assertSessionHas('success');
        $employee->refresh();
        $this->assertNotEquals($originalStatus, $employee->is_active);
    }

    public function test_users_index_screen_can_be_rendered(): void
    {
        $response = $this->actingAs($this->admin)->get('/users');

        $response->assertStatus(200);
    }

    public function test_user_can_be_created_with_multi_roles_and_sample_scopes(): void
    {
        $response = $this->actingAs($this->admin)->post('/users', [
            'name' => 'Petugas Multifungsi',
            'username' => 'petugas_multi',
            'email' => 'multi@mastersummit.co.id',
            'password' => 'password123',
            'roles' => ['Petugas Lab', 'Petugas Elektromedis'],
            'permissions' => ['mcu_events.view'],
            'sample_scopes' => [1, 2, 5],
            'is_active' => true,
        ]);

        $response->assertRedirect('/users');

        $this->assertDatabaseHas('users', [
            'username' => 'petugas_multi',
            'email' => 'multi@mastersummit.co.id',
        ]);

        $user = User::where('username', 'petugas_multi')->first();
        $this->assertTrue($user->hasRole('Petugas Lab'));
        $this->assertTrue($user->hasRole('Petugas Elektromedis'));
        $this->assertTrue($user->hasDirectPermission('mcu_events.view'));

        $this->assertDatabaseHas('user_sample_scopes', [
            'user_id' => $user->id,
            'sample_id' => 1,
        ]);
        $this->assertDatabaseHas('user_sample_scopes', [
            'user_id' => $user->id,
            'sample_id' => 5,
        ]);
    }

    public function test_user_cannot_deactivate_self(): void
    {
        $response = $this->actingAs($this->admin)->patch("/users/{$this->admin->id}/toggle-status");

        $response->assertSessionHas('error');
        $this->admin->refresh();
        $this->assertTrue($this->admin->is_active);
    }
}
