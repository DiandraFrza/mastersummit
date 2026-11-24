<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    /**
     * Seed clinical roles and granular permission matrix.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // 1. Definition of granular permissions grouped by module
        $permissionGroups = [
            'pendaftaran' => [
                'patients.view' => 'Melihat daftar master pasien',
                'patients.manage' => 'Menambah & mengubah master pasien',
                'registrations.view' => 'Melihat daftar pendaftaran pasien',
                'registrations.create' => 'Membuat pendaftaran pasien baru & APS',
                'registrations.void' => 'Melakukan pembatalan / void pendaftaran',
            ],
            'ambil_sampel' => [
                'samples.view' => 'Melihat antrean stasiun sampel',
                'samples.collect' => 'Check-in specimen & scan barcode ambil sampel',
            ],
            'hasil_penunjang' => [
                'results.lab' => 'Input, edit & validasi hasil Laboratorium',
                'results.radiology' => 'Input, upload foto & validasi Radiologi',
                'results.electromedical' => 'Input hasil & upload PDF EKG/Spirometri',
                'results.physical' => 'Input rekam pemeriksaan fisik dokter & tanda vital',
            ],
            'mcu' => [
                'mcu_events.view' => 'Melihat daftar batch & jadwal event MCU',
                'mcu_events.manage' => 'Membuat & mengelola event MCU perusahaan',
                'mcu_reviews.doctor' => 'Review medis, kesimpulan & saran dokter MCU',
                'mcu_reviews.manager' => 'Quality control & approval lock manajer MCU',
                'results.view' => 'Melihat, cetak hasil & perpanjang link online',
            ],
            'master_data' => [
                'employees.view' => 'Melihat daftar master pegawai',
                'employees.manage' => 'Tambah, ubah data pegawai & tanda tangan digital',
                'users.view' => 'Melihat daftar pengguna sistem',
                'users.manage' => 'Kelola akun login, role & hak akses pengguna',
                'units.view' => 'Melihat daftar unit & cabang',
                'units.manage' => 'Kelola cabang klinik',
                'companies.view' => 'Melihat daftar klien perusahaan',
                'companies.manage' => 'Kelola data perusahaan rekanan',
                'referrers.view' => 'Melihat daftar perujuk',
                'referrers.manage' => 'Kelola dokter / puskesmas / instansi perujuk',
                'services.view' => 'Melihat katalog pemeriksaan',
                'services.manage' => 'Kelola tarif, parameter & aturan auto-rule',
                'packages.view' => 'Melihat daftar paket pemeriksaan',
                'packages.manage' => 'Kelola paket MCU & tarif bundling',
                'banks_vendors.manage' => 'Kelola rekening bank & vendor peralatan',
            ],
            'laporan' => [
                'reports.revenue' => 'Melihat & ekspor laporan pendapatan',
                'reports.examinations' => 'Melihat & ekspor rekapitulasi pemeriksaan',
            ],
            'pengaturan' => [
                'settings.clinic' => 'Mengatur profil klinik, kop surat & watermark',
                'audit_logs.view' => 'Melihat log aktivitas dan jejak audit sistem',
            ],
        ];

        // Create all permissions
        $createdPermissions = [];
        foreach ($permissionGroups as $group => $permissions) {
            foreach ($permissions as $permName => $label) {
                $createdPermissions[$permName] = Permission::firstOrCreate([
                    'name' => $permName,
                    'guard_name' => 'web',
                ]);
            }
        }

        // 2. Clinical Roles & default permissions
        $roleDefinitions = [
            'Super Admin' => array_keys($createdPermissions), // All permissions
            'Dokter Umum' => [
                'registrations.view',
                'results.physical',
                'mcu_reviews.doctor',
                'results.view',
            ],
            'Dokter Spesialis Radiologi' => [
                'results.radiology',
                'results.view',
            ],
            'Petugas Lab' => [
                'samples.view',
                'samples.collect',
                'results.lab',
                'results.view',
            ],
            'Petugas Radiologi' => [
                'samples.view',
                'samples.collect',
                'results.radiology',
                'results.view',
            ],
            'Petugas Elektromedis' => [
                'samples.view',
                'samples.collect',
                'results.electromedical',
                'results.view',
            ],
            'Admin Registrasi' => [
                'registrations.view',
                'registrations.create',
                'results.view',
                'mcu_events.view',
                'companies.view',
                'referrers.view',
                'packages.view',
            ],
            'Kasir' => [
                'registrations.view',
                'reports.revenue',
            ],
            'Manajer MCU' => [
                'mcu_events.view',
                'mcu_events.manage',
                'mcu_reviews.doctor',
                'mcu_reviews.manager',
                'results.view',
                'reports.revenue',
                'reports.examinations',
                'audit_logs.view',
            ],
        ];

        foreach ($roleDefinitions as $roleName => $perms) {
            $role = Role::firstOrCreate([
                'name' => $roleName,
                'guard_name' => 'web',
            ]);
            $role->syncPermissions($perms);
        }
    }
}
