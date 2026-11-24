<?php

namespace Database\Seeders;

use App\Models\Bank;
use App\Models\Company;
use App\Models\Referrer;
use App\Models\ReferrerType;
use App\Models\Sample;
use App\Models\Unit;
use App\Models\Vendor;
use Illuminate\Database\Seeder;

class CoreMasterSeeder extends Seeder
{
    /**
     * Seed initial core master data for Task 2A.
     */
    public function run(): void
    {
        // 1. Units
        Unit::firstOrCreate(['code' => 'PST-01'], [
            'name' => 'Klinik Utama Pusat',
            'address' => 'Jl. Kesehatan Raya No. 45, Jakarta Pusat',
            'phone' => '021-3901234',
            'is_active' => true,
        ]);

        Unit::firstOrCreate(['code' => 'CBG-02'], [
            'name' => 'Klinik Cabang Barat',
            'address' => 'Jl. Boulevard Barat No. 12, Jakarta Barat',
            'phone' => '021-5805678',
            'is_active' => true,
        ]);

        // 2. Companies
        Company::firstOrCreate(['name' => 'PT Nusantara Petro Energi'], [
            'branch_code' => 'NPE-HQ',
            'address' => 'Gedung Wisma Energi Lt. 18, Jakarta Selatan',
            'city' => 'Jakarta Selatan',
            'phone' => '021-5259988',
            'email' => 'hrd@petroenergi.co.id',
            'director_name' => 'Ir. Bambang Soetjipto',
            'is_active' => true,
        ]);

        Company::firstOrCreate(['name' => 'PT Astra Agro Mandiri'], [
            'branch_code' => 'AAM-JKT',
            'address' => 'Kawasan Industri Pulogadung Blok C-4, Jakarta Timur',
            'city' => 'Jakarta Timur',
            'phone' => '021-4601122',
            'email' => 'mcu@astraagro.co.id',
            'director_name' => 'Dra. Endang Lestari',
            'is_active' => true,
        ]);

        // 3. Referrer Types
        $defaultTypes = [
            ['code' => 'APS', 'name' => 'Atas Permintaan Sendiri (APS)'],
            ['code' => 'CORP', 'name' => 'Perusahaan / Corporate'],
            ['code' => 'DR_UMUM', 'name' => 'Dokter Umum'],
            ['code' => 'DR_SPESIALIS', 'name' => 'Dokter Spesialis'],
            ['code' => 'BIDAN', 'name' => 'Bidan Praktik Mandiri'],
            ['code' => 'DR_GIGI', 'name' => 'Dokter Gigi'],
            ['code' => 'PUSKESMAS', 'name' => 'Puskesmas / Faskes 1'],
            ['code' => 'KOMUNITAS', 'name' => 'Komunitas / Lembaga'],
        ];

        foreach ($defaultTypes as $type) {
            ReferrerType::firstOrCreate(['code' => $type['code']], [
                'name' => $type['name'],
                'is_active' => true,
            ]);
        }

        // 4. Sample Referrers
        $drType = ReferrerType::where('code', 'DR_UMUM')->first();
        if ($drType) {
            Referrer::firstOrCreate(['name' => 'dr. Hendra Pratama, Sp.PK'], [
                'referrer_type_id' => $drType->id,
                'phone' => '081298765432',
                'email' => 'dr.hendra@gmail.com',
                'address' => 'Praktek Bersama Sehati, Rawamangun',
                'marketing_name' => 'Agus Setiawan',
                'fee_general_percent' => 10.00,
                'fee_special_note' => 'Fee dibayar bulanan via transfer bank',
                'is_active' => true,
            ]);
        }

        // 5. Banks
        Bank::firstOrCreate(['account_number' => '8880192837'], [
            'name' => 'BCA',
            'account_holder' => 'PT KLINIK SUMMIT MEDIKA',
            'is_active' => true,
        ]);

        Bank::firstOrCreate(['account_number' => '1220009847162'], [
            'name' => 'Bank Mandiri',
            'account_holder' => 'PT KLINIK SUMMIT MEDIKA',
            'is_active' => true,
        ]);

        // 6. Vendors
        Vendor::firstOrCreate(['code' => 'VND-001'], [
            'name' => 'PT Sysmex Indonesia',
            'npwp' => '01.345.678.9-012.000',
            'address' => 'Cyber 2 Tower Lt. 5, Jl. HR Rasuna Said, Jakarta',
            'phone' => '021-2998877',
            'email' => 'support@sysmex.co.id',
            'contract_number' => 'KTR/2026/SYS/001',
            'contract_type' => 'KSO Reagen Hematologi',
            'pic_name' => 'Anton Wijaya',
            'pic_phone' => '081122334455',
            'is_active' => true,
        ]);

        Vendor::firstOrCreate(['code' => 'VND-002'], [
            'name' => 'PT Kimia Farma Diagnostika',
            'npwp' => '01.222.333.4-055.000',
            'address' => 'Jl. Veteran No. 9, Jakarta Pusat',
            'phone' => '021-3847722',
            'email' => 'lab.rujukan@kimiafarma.co.id',
            'contract_number' => 'KTR/2026/KF/088',
            'contract_type' => 'Laboratorium Rujukan Luar',
            'pic_name' => 'Rina Marlina',
            'pic_phone' => '081344556677',
            'is_active' => true,
        ]);

        // 7. Samples (Dynamic Specimen & Stations)
        $defaultSamples = [
            ['code' => 'SMP-EDTA', 'name' => 'Darah EDTA', 'category' => 'lab', 'sort_order' => 1],
            ['code' => 'SMP-SERUM', 'name' => 'Darah Beku (Serum/Clot)', 'category' => 'lab', 'sort_order' => 2],
            ['code' => 'SMP-URIN', 'name' => 'Urin Lengkap', 'category' => 'lab', 'sort_order' => 3],
            ['code' => 'SMP-FESES', 'name' => 'Feses Rutin', 'category' => 'lab', 'sort_order' => 4],
            ['code' => 'SMP-EKG', 'name' => 'Elektrokardiografi (EKG)', 'category' => 'electromedical', 'sort_order' => 5],
            ['code' => 'SMP-SPIRO', 'name' => 'Spirometri', 'category' => 'electromedical', 'sort_order' => 6],
            ['code' => 'SMP-AUDIO', 'name' => 'Audiometri', 'category' => 'electromedical', 'sort_order' => 7],
            ['code' => 'SMP-RO', 'name' => 'Rontgen Thorax', 'category' => 'radiology', 'sort_order' => 8],
            ['code' => 'SMP-FISIK', 'name' => 'Pemeriksaan Fisik Dokter', 'category' => 'physical', 'sort_order' => 9],
        ];

        foreach ($defaultSamples as $sample) {
            Sample::firstOrCreate(['code' => $sample['code']], [
                'name' => $sample['name'],
                'category' => $sample['category'],
                'sort_order' => $sample['sort_order'],
                'is_active' => true,
            ]);
        }
    }
}
