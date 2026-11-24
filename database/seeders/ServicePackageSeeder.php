<?php

namespace Database\Seeders;

use App\Models\Package;
use App\Models\PackageItem;
use App\Models\Sample;
use App\Models\Service;
use Illuminate\Database\Seeder;

class ServicePackageSeeder extends Seeder
{
    /**
     * Seed initial examination services and bundling packages for Task 2B.
     */
    public function run(): void
    {
        $samples = Sample::all()->keyBy('code');

        // 1. Examination Services
        $serviceCatalog = [
            [
                'code' => 'LAB-HEMA',
                'name' => 'Hematologi Lengkap (CBC + Diff)',
                'category' => 'lab',
                'sub_group' => 'Hematologi',
                'sample_code' => 'SMP-EDTA',
                'base_price' => 95000.00,
                'print_template' => 'standard_lab',
            ],
            [
                'code' => 'LAB-GLU-P',
                'name' => 'Glukosa Darah Puasa (GDP)',
                'category' => 'lab',
                'sub_group' => 'Kimia Darah',
                'sample_code' => 'SMP-SERUM',
                'base_price' => 45000.00,
                'print_template' => 'standard_lab',
            ],
            [
                'code' => 'LAB-CHOL-TOT',
                'name' => 'Kolesterol Total',
                'category' => 'lab',
                'sub_group' => 'Profil Lipid',
                'sample_code' => 'SMP-SERUM',
                'base_price' => 50000.00,
                'print_template' => 'standard_lab',
            ],
            [
                'code' => 'LAB-URIN',
                'name' => 'Urin Lengkap Rutin',
                'category' => 'lab',
                'sub_group' => 'Urinalisis',
                'sample_code' => 'SMP-URIN',
                'base_price' => 55000.00,
                'print_template' => 'standard_lab',
            ],
            [
                'code' => 'LAB-HBSAG',
                'name' => 'HBsAg Rapid Kualitatif',
                'category' => 'lab',
                'sub_group' => 'Imunoserologi',
                'sample_code' => 'SMP-SERUM',
                'base_price' => 85000.00,
                'print_template' => 'antigen',
            ],
            [
                'code' => 'LAB-NARKOBA-6P',
                'name' => 'Skrining Narkoba 6 Parameter',
                'category' => 'lab',
                'sub_group' => 'Toksikologi',
                'sample_code' => 'SMP-URIN',
                'base_price' => 175000.00,
                'print_template' => 'narkoba',
            ],
            [
                'code' => 'RAD-THORAX-PA',
                'name' => 'Rontgen Thorax PA (Dada)',
                'category' => 'radiology',
                'sub_group' => 'Foto Polos Radiologi',
                'sample_code' => 'SMP-RO',
                'base_price' => 160000.00,
                'print_template' => 'radiology',
            ],
            [
                'code' => 'ELK-EKG-12L',
                'name' => 'Elektrokardiografi (EKG 12-Lead)',
                'category' => 'electromedical',
                'sub_group' => 'Kardiologi',
                'sample_code' => 'SMP-EKG',
                'base_price' => 110000.00,
                'print_template' => 'electromedical',
            ],
            [
                'code' => 'ELK-AUDIO-PTA',
                'name' => 'Audiometri Nada Murni (PTA AC/BC)',
                'category' => 'electromedical',
                'sub_group' => 'Audiologi',
                'sample_code' => 'SMP-AUDIO',
                'base_price' => 125000.00,
                'print_template' => 'electromedical',
            ],
            [
                'code' => 'ELK-SPIRO-LUNG',
                'name' => 'Spirometri Uji Fungsi Paru',
                'category' => 'electromedical',
                'sub_group' => 'Paru',
                'sample_code' => 'SMP-SPIRO',
                'base_price' => 130000.00,
                'print_template' => 'electromedical',
            ],
            [
                'code' => 'FSK-DOKTER-MCU',
                'name' => 'Pemeriksaan Fisik Dokter & Vital Sign',
                'category' => 'physical',
                'sub_group' => 'Dokter Pemeriksa',
                'sample_code' => 'SMP-FISIK',
                'base_price' => 75000.00,
                'print_template' => 'physical',
            ],
        ];

        $createdServices = [];
        foreach ($serviceCatalog as $item) {
            $sample = $samples->get($item['sample_code']) ?? Sample::first();
            $createdServices[$item['code']] = Service::firstOrCreate(
                ['code' => $item['code']],
                [
                    'name' => $item['name'],
                    'category' => $item['category'],
                    'sub_group' => $item['sub_group'],
                    'sample_id' => $sample->id,
                    'base_price' => $item['base_price'],
                    'print_template' => $item['print_template'],
                    'is_active' => true,
                ]
            );
        }

        // 2. Sample MCU Bundling Packages
        // Package A: Paket Basic Pra-Kerja
        $basicPkg = Package::firstOrCreate(
            ['name' => 'Paket MCU Basic / Pra-Kerja Standard'],
            [
                'year' => 2026,
                'event_label' => 'Standard Clinic MCU 2026',
                'discount_amount' => 35000.00,
                'is_active' => true,
            ]
        );

        $basicServices = [
            'LAB-HEMA',
            'LAB-URIN',
            'RAD-THORAX-PA',
            'FSK-DOKTER-MCU',
        ];

        foreach ($basicServices as $code) {
            if (isset($createdServices[$code])) {
                PackageItem::firstOrCreate([
                    'package_id' => $basicPkg->id,
                    'service_id' => $createdServices[$code]->id,
                ]);
            }
        }
        $basicPkg->recalculateTotals();

        // Package B: Paket Executive Corporate MCU
        $execPkg = Package::firstOrCreate(
            ['name' => 'Paket MCU Corporate Executive Comprehensive'],
            [
                'year' => 2026,
                'event_label' => 'Annual Corporate MCU 2026',
                'discount_amount' => 75000.00,
                'is_active' => true,
            ]
        );

        $execServices = [
            'LAB-HEMA',
            'LAB-GLU-P',
            'LAB-CHOL-TOT',
            'LAB-URIN',
            'RAD-THORAX-PA',
            'ELK-EKG-12L',
            'ELK-AUDIO-PTA',
            'FSK-DOKTER-MCU',
        ];

        foreach ($execServices as $code) {
            if (isset($createdServices[$code])) {
                PackageItem::firstOrCreate([
                    'package_id' => $execPkg->id,
                    'service_id' => $createdServices[$code]->id,
                ]);
            }
        }
        $execPkg->recalculateTotals();
    }
}
