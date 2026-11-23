<?php

namespace Database\Seeders;

use App\Models\ClinicSetting;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Roles & Granular Permissions
        $this->call(RolePermissionSeeder::class);

        $superAdminRole = Role::where('name', 'Super Admin')->first();

        // 2. Default Super Admin Employee Profile
        $adminEmployee = Employee::firstOrCreate(
            ['nik' => '1000000000000001'],
            [
                'nip' => 'ADM-001',
                'name' => 'Administrator Utama',
                'email' => 'admin@mastersummit.co.id',
                'phone' => '081234567890',
                'job_title' => 'Super Administrator',
                'is_active' => true,
            ]
        );

        // 3. Default Super Admin User
        $superAdmin = User::firstOrCreate(
            ['username' => 'superadmin'],
            [
                'employee_id' => $adminEmployee->id,
                'name' => 'Super Admin',
                'email' => 'admin@mastersummit.co.id',
                'password' => Hash::make('password'),
                'is_active' => true,
            ]
        );

        if (! $superAdmin->hasRole('Super Admin')) {
            $superAdmin->assignRole($superAdminRole);
        }

        // 4. Default Clinic Setting (Domain B)
        ClinicSetting::current();
    }
}
