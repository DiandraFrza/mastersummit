<?php

namespace Database\Seeders;

use App\Models\Package;
use App\Models\PackageItem;
use App\Models\ParameterAutoRule;
use App\Models\ParameterReferenceRange;
use App\Models\Sample;
use App\Models\Service;
use App\Models\ServiceParameter;
use Illuminate\Database\Seeder;

class RealisticClinicSeeder extends Seeder
{
    /**
     * Run realistic clinic seeding for Task 2D.
     */
    public function run(): void
    {
        // ==========================================
        // 1. Samples / Specimen Stations
        // ==========================================
        $samplesData = [
            ['code' => 'SMP-EDTA', 'name' => 'Darah EDTA', 'category' => 'lab', 'sort_order' => 1],
            ['code' => 'SMP-SERUM', 'name' => 'Darah Beku (Serum/Clot)', 'category' => 'lab', 'sort_order' => 2],
            ['code' => 'SMP-2JAMPP', 'name' => 'Darah 2 Jam PP (Fluoride NaF)', 'category' => 'lab', 'sort_order' => 3],
            ['code' => 'SMP-URIN', 'name' => 'Urin Lengkap Rutin', 'category' => 'lab', 'sort_order' => 4],
            ['code' => 'SMP-FESES', 'name' => 'Feses Rutin', 'category' => 'lab', 'sort_order' => 5],
            ['code' => 'SMP-EKG', 'name' => 'Elektrokardiografi (EKG 12-Lead)', 'category' => 'electromedical', 'sort_order' => 6],
            ['code' => 'SMP-SPIRO', 'name' => 'Spirometri Uji Fungsi Paru', 'category' => 'electromedical', 'sort_order' => 7],
            ['code' => 'SMP-AUDIO', 'name' => 'Audiometri Nada Murni', 'category' => 'electromedical', 'sort_order' => 8],
            ['code' => 'SMP-RO', 'name' => 'Rontgen Thorax Radiologi', 'category' => 'radiology', 'sort_order' => 9],
            ['code' => 'SMP-FISIK', 'name' => 'Pemeriksaan Fisik Dokter Umum', 'category' => 'physical', 'sort_order' => 10],
            ['code' => 'SMP-GIGI', 'name' => 'Pemeriksaan Dokter Gigi', 'category' => 'physical', 'sort_order' => 11],
            ['code' => 'SMP-MATA', 'name' => 'Pemeriksaan Refraksi & Mata', 'category' => 'physical', 'sort_order' => 12],
        ];

        $samples = [];
        foreach ($samplesData as $s) {
            $samples[$s['code']] = Sample::updateOrCreate(
                ['code' => $s['code']],
                [
                    'name' => $s['name'],
                    'category' => $s['category'],
                    'sort_order' => $s['sort_order'],
                    'is_active' => true,
                ]
            );
        }

        // ==========================================
        // 2. Examination Services
        // ==========================================
        $servicesCatalog = [
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
                'code' => 'LAB-GLU-2PP',
                'name' => 'Glukosa Darah 2 Jam PP',
                'category' => 'lab',
                'sub_group' => 'Kimia Darah',
                'sample_code' => 'SMP-2JAMPP',
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
                'code' => 'LAB-LIPID',
                'name' => 'Profil Lipid Lengkap (Total, HDL, LDL, TG)',
                'category' => 'lab',
                'sub_group' => 'Profil Lipid',
                'sample_code' => 'SMP-SERUM',
                'base_price' => 165000.00,
                'print_template' => 'standard_lab',
            ],
            [
                'code' => 'LAB-GINJAL',
                'name' => 'Faal Ginjal (Ureum, Kreatinin, Asam Urat)',
                'category' => 'lab',
                'sub_group' => 'Fungsi Ginjal',
                'sample_code' => 'SMP-SERUM',
                'base_price' => 135000.00,
                'print_template' => 'standard_lab',
            ],
            [
                'code' => 'LAB-HATI',
                'name' => 'Faal Hati (SGOT & SGPT)',
                'category' => 'lab',
                'sub_group' => 'Fungsi Hati',
                'sample_code' => 'SMP-SERUM',
                'base_price' => 90000.00,
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
            [
                'code' => 'FSK-GIGI',
                'name' => 'Pemeriksaan Gigi & Mulut',
                'category' => 'physical',
                'sub_group' => 'Kesehatan Gigi',
                'sample_code' => 'SMP-GIGI',
                'base_price' => 60000.00,
                'print_template' => 'physical',
            ],
        ];

        $services = [];
        foreach ($servicesCatalog as $item) {
            $sample = $samples[$item['sample_code']] ?? Sample::first();
            $services[$item['code']] = Service::updateOrCreate(
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

        // ==========================================
        // 3. Parameters, Reference Ranges, Auto-Rules
        // ==========================================

        // --- A. Hematologi Lengkap (LAB-HEMA) ---
        $hema = $services['LAB-HEMA'];
        $hemaParams = [
            [
                'code' => 'hgb',
                'label' => 'Hemoglobin (Hb)',
                'group' => 'Darah Lengkap',
                'type' => 'number',
                'unit' => 'g/dL',
                'sort' => 1,
                'ranges' => [
                    ['gender' => 'L', 'min' => 13.0, 'max' => 17.5, 'display' => '13.0 - 17.5 g/dL'],
                    ['gender' => 'P', 'min' => 12.0, 'max' => 16.0, 'display' => '12.0 - 16.0 g/dL'],
                ],
                'rules' => [
                    ['op' => '<', 'val1' => '13.0', 'gender' => 'L', 'flag' => 'low', 'concl' => 'Anemia (Kadar Hemoglobin Rendah)', 'sugg' => 'Konsultasi dokter dan evaluasi kecukupan asupan zat besi', 'recap' => true, 'prio' => 1],
                    ['op' => '<', 'val1' => '12.0', 'gender' => 'P', 'flag' => 'low', 'concl' => 'Anemia (Kadar Hemoglobin Rendah)', 'sugg' => 'Konsultasi dokter dan evaluasi kecukupan asupan zat besi', 'recap' => true, 'prio' => 1],
                    ['op' => '>', 'val1' => '18.0', 'gender' => 'ALL', 'flag' => 'high', 'concl' => 'Polisitemia Relatif', 'sugg' => 'Perbanyak hidrasi air putih dan konsultasi dokter', 'recap' => true, 'prio' => 2],
                ],
            ],
            [
                'code' => 'leuko',
                'label' => 'Leukosit (WBC)',
                'group' => 'Darah Lengkap',
                'type' => 'number',
                'unit' => '/uL',
                'sort' => 2,
                'ranges' => [
                    ['gender' => 'ALL', 'min' => 4000, 'max' => 10000, 'display' => '4.000 - 10.000 /uL'],
                ],
                'rules' => [
                    ['op' => '<', 'val1' => '4000', 'gender' => 'ALL', 'flag' => 'low', 'concl' => 'Leukopenia', 'sugg' => 'Waspadai penurunan sistem daya tahan tubuh', 'recap' => true, 'prio' => 1],
                    ['op' => '>', 'val1' => '10000', 'gender' => 'ALL', 'flag' => 'high', 'concl' => 'Leukositosis', 'sugg' => 'Evaluasi kemungkinan adanya infeksi atau proses peradangan akut/kronis', 'recap' => true, 'prio' => 1],
                ],
            ],
            [
                'code' => 'ery',
                'label' => 'Eritrosit (RBC)',
                'group' => 'Darah Lengkap',
                'type' => 'number',
                'unit' => '10^6/uL',
                'sort' => 3,
                'ranges' => [
                    ['gender' => 'L', 'min' => 4.5, 'max' => 5.9, 'display' => '4.5 - 5.9 x10^6/uL'],
                    ['gender' => 'P', 'min' => 4.0, 'max' => 5.2, 'display' => '4.0 - 5.2 x10^6/uL'],
                ],
                'rules' => [],
            ],
            [
                'code' => 'ht',
                'label' => 'Hematokrit (Ht)',
                'group' => 'Darah Lengkap',
                'type' => 'number',
                'unit' => '%',
                'sort' => 4,
                'ranges' => [
                    ['gender' => 'L', 'min' => 40.0, 'max' => 52.0, 'display' => '40.0 - 52.0 %'],
                    ['gender' => 'P', 'min' => 36.0, 'max' => 46.0, 'display' => '36.0 - 46.0 %'],
                ],
                'rules' => [],
            ],
            [
                'code' => 'plt',
                'label' => 'Trombosit (Platelet)',
                'group' => 'Darah Lengkap',
                'type' => 'number',
                'unit' => '/uL',
                'sort' => 5,
                'ranges' => [
                    ['gender' => 'ALL', 'min' => 150000, 'max' => 450000, 'display' => '150.000 - 450.000 /uL'],
                ],
                'rules' => [
                    ['op' => '<', 'val1' => '150000', 'gender' => 'ALL', 'flag' => 'low', 'concl' => 'Trombositopenia', 'sugg' => 'Waspadai perdarahan spontan (gusi, mimisan) dan periksa ulang', 'recap' => true, 'prio' => 1],
                    ['op' => '>', 'val1' => '450000', 'gender' => 'ALL', 'flag' => 'high', 'concl' => 'Trombositosis', 'sugg' => 'Evaluasi kemungkinan proses infeksi reaktif', 'recap' => true, 'prio' => 1],
                ],
            ],
            [
                'code' => 'led',
                'label' => 'Laju Endap Darah (LED/ESR)',
                'group' => 'Darah Lengkap',
                'type' => 'number',
                'unit' => 'mm/jam',
                'sort' => 6,
                'ranges' => [
                    ['gender' => 'L', 'min' => 0, 'max' => 15, 'display' => '0 - 15 mm/jam'],
                    ['gender' => 'P', 'min' => 0, 'max' => 20, 'display' => '0 - 20 mm/jam'],
                ],
                'rules' => [
                    ['op' => '>', 'val1' => '20', 'gender' => 'ALL', 'flag' => 'high', 'concl' => 'Laju Endap Darah Meningkat', 'sugg' => 'Dapat mengindikasikan inflamasi/infeksi sistemik', 'recap' => true, 'prio' => 1],
                ],
            ],
            [
                'code' => 'diff_seg',
                'label' => 'Neutrofil Segmen',
                'group' => 'Hitung Jenis (Diff)',
                'type' => 'number',
                'unit' => '%',
                'sort' => 7,
                'ranges' => [
                    ['gender' => 'ALL', 'min' => 50, 'max' => 70, 'display' => '50 - 70 %'],
                ],
                'rules' => [],
            ],
            [
                'code' => 'diff_lim',
                'label' => 'Limfosit',
                'group' => 'Hitung Jenis (Diff)',
                'type' => 'number',
                'unit' => '%',
                'sort' => 8,
                'ranges' => [
                    ['gender' => 'ALL', 'min' => 20, 'max' => 40, 'display' => '20 - 40 %'],
                ],
                'rules' => [],
            ],
        ];
        $this->seedParametersForService($hema, $hemaParams);

        // --- B. Glukosa Darah Puasa (LAB-GLU-P) ---
        $gdp = $services['LAB-GLU-P'];
        $gdpParams = [
            [
                'code' => 'gdp',
                'label' => 'Glukosa Darah Puasa',
                'group' => 'Gula Darah',
                'type' => 'number',
                'unit' => 'mg/dL',
                'sort' => 1,
                'ranges' => [
                    ['gender' => 'ALL', 'min' => 70, 'max' => 99, 'display' => '70 - 99 mg/dL'],
                ],
                'rules' => [
                    ['op' => '<', 'val1' => '70', 'gender' => 'ALL', 'flag' => 'low', 'concl' => 'Hipoglikemia', 'sugg' => 'Waspadai gejala lemas/keringat dingin dan konsumsi karbohidrat', 'recap' => true, 'prio' => 1],
                    ['op' => 'between', 'val1' => '100', 'val2' => '125', 'gender' => 'ALL', 'flag' => 'high', 'concl' => 'Prediabetes (Impaired Fasting Glucose)', 'sugg' => 'Modifikasi gaya hidup: diet rendah karbohidrat sederhana dan olahraga teratur', 'recap' => true, 'prio' => 2],
                    ['op' => '>=', 'val1' => '126', 'gender' => 'ALL', 'flag' => 'critical', 'concl' => 'Suspek Diabetes Mellitus (Hiperglikemia)', 'sugg' => 'Konsultasi Spesialis Penyakit Dalam dan lakukan pemeriksaan HbA1c', 'recap' => true, 'prio' => 3],
                ],
            ],
        ];
        $this->seedParametersForService($gdp, $gdpParams);

        // --- C. Profil Lipid Lengkap (LAB-LIPID) ---
        $lipid = $services['LAB-LIPID'];
        $lipidParams = [
            [
                'code' => 'chol_total',
                'label' => 'Kolesterol Total',
                'group' => 'Profil Lipid',
                'type' => 'number',
                'unit' => 'mg/dL',
                'sort' => 1,
                'ranges' => [
                    ['gender' => 'ALL', 'min' => 0, 'max' => 199, 'display' => '< 200 mg/dL'],
                ],
                'rules' => [
                    ['op' => 'between', 'val1' => '200', 'val2' => '239', 'gender' => 'ALL', 'flag' => 'high', 'concl' => 'Borderline High Kolesterol', 'sugg' => 'Batasi konsumsi makanan tinggi lemak jenuh dan perbanyak serat', 'recap' => true, 'prio' => 1],
                    ['op' => '>=', 'val1' => '240', 'gender' => 'ALL', 'flag' => 'abnormal', 'concl' => 'Hiperkolesterolemia', 'sugg' => 'Diet rendah kolesterol, rutin berolahraga, dan konsultasi terapi obat penurun lipid', 'recap' => true, 'prio' => 2],
                ],
            ],
            [
                'code' => 'trigliserida',
                'label' => 'Trigliserida',
                'group' => 'Profil Lipid',
                'type' => 'number',
                'unit' => 'mg/dL',
                'sort' => 2,
                'ranges' => [
                    ['gender' => 'ALL', 'min' => 0, 'max' => 149, 'display' => '< 150 mg/dL'],
                ],
                'rules' => [
                    ['op' => '>=', 'val1' => '150', 'gender' => 'ALL', 'flag' => 'high', 'concl' => 'Hipertrigliseridemia', 'sugg' => 'Kurangi konsumsi gula pasir, gorengan, tepung, dan alkohol', 'recap' => true, 'prio' => 1],
                ],
            ],
            [
                'code' => 'hdl',
                'label' => 'Kolesterol HDL (Baik)',
                'group' => 'Profil Lipid',
                'type' => 'number',
                'unit' => 'mg/dL',
                'sort' => 3,
                'ranges' => [
                    ['gender' => 'L', 'min' => 40, 'max' => 90, 'display' => '> 40 mg/dL'],
                    ['gender' => 'P', 'min' => 50, 'max' => 90, 'display' => '> 50 mg/dL'],
                ],
                'rules' => [
                    ['op' => '<', 'val1' => '40', 'gender' => 'L', 'flag' => 'low', 'concl' => 'Kadar HDL Kolesterol Rendah', 'sugg' => 'Tingkatkan aktivitas aerobik 150 menit/minggu dan konsumsi lemak sehat', 'recap' => true, 'prio' => 1],
                    ['op' => '<', 'val1' => '50', 'gender' => 'P', 'flag' => 'low', 'concl' => 'Kadar HDL Kolesterol Rendah', 'sugg' => 'Tingkatkan aktivitas aerobik 150 menit/minggu dan konsumsi lemak sehat', 'recap' => true, 'prio' => 1],
                ],
            ],
            [
                'code' => 'ldl',
                'label' => 'Kolesterol LDL (Jahat)',
                'group' => 'Profil Lipid',
                'type' => 'number',
                'unit' => 'mg/dL',
                'sort' => 4,
                'ranges' => [
                    ['gender' => 'ALL', 'min' => 0, 'max' => 99, 'display' => '< 100 mg/dL'],
                ],
                'rules' => [
                    ['op' => 'between', 'val1' => '130', 'val2' => '159', 'gender' => 'ALL', 'flag' => 'high', 'concl' => 'Kolesterol LDL Batas Tinggi', 'sugg' => 'Diet rendah lemak jenuh dan olahraga kardio', 'recap' => true, 'prio' => 1],
                    ['op' => '>=', 'val1' => '160', 'gender' => 'ALL', 'flag' => 'abnormal', 'concl' => 'Dislipidemia (Kadar LDL Tinggi)', 'sugg' => 'Faktor risiko kardiovaskular; konsultasikan ke dokter untuk intervensi', 'recap' => true, 'prio' => 2],
                ],
            ],
        ];
        $this->seedParametersForService($lipid, $lipidParams);

        // --- D. Faal Ginjal (LAB-GINJAL) ---
        $ginjal = $services['LAB-GINJAL'];
        $ginjalParams = [
            [
                'code' => 'asam_urat',
                'label' => 'Asam Urat (Uric Acid)',
                'group' => 'Faal Ginjal',
                'type' => 'number',
                'unit' => 'mg/dL',
                'sort' => 1,
                'ranges' => [
                    ['gender' => 'L', 'min' => 3.5, 'max' => 7.2, 'display' => '3.5 - 7.2 mg/dL'],
                    ['gender' => 'P', 'min' => 2.6, 'max' => 6.0, 'display' => '2.6 - 6.0 mg/dL'],
                ],
                'rules' => [
                    ['op' => '>', 'val1' => '7.2', 'gender' => 'L', 'flag' => 'high', 'concl' => 'Hiperurisemia (Asam Urat Tinggi)', 'sugg' => 'Hindari konsumsi jeroan, emping, seafood, dan perbanyak minum air putih', 'recap' => true, 'prio' => 1],
                    ['op' => '>', 'val1' => '6.0', 'gender' => 'P', 'flag' => 'high', 'concl' => 'Hiperurisemia (Asam Urat Tinggi)', 'sugg' => 'Hindari konsumsi jeroan, emping, seafood, dan perbanyak minum air putih', 'recap' => true, 'prio' => 1],
                ],
            ],
            [
                'code' => 'ureum',
                'label' => 'Ureum (Blood Urea Nitrogen)',
                'group' => 'Faal Ginjal',
                'type' => 'number',
                'unit' => 'mg/dL',
                'sort' => 2,
                'ranges' => [
                    ['gender' => 'ALL', 'min' => 15, 'max' => 45, 'display' => '15 - 45 mg/dL'],
                ],
                'rules' => [
                    ['op' => '>', 'val1' => '45', 'gender' => 'ALL', 'flag' => 'high', 'concl' => 'Ureum Darah Meningkat', 'sugg' => 'Evaluasi hidrasi cairan dan fungsi ekskresi ginjal', 'recap' => true, 'prio' => 1],
                ],
            ],
            [
                'code' => 'kreatinin',
                'label' => 'Kreatinin Serum',
                'group' => 'Faal Ginjal',
                'type' => 'number',
                'unit' => 'mg/dL',
                'sort' => 3,
                'ranges' => [
                    ['gender' => 'L', 'min' => 0.7, 'max' => 1.3, 'display' => '0.7 - 1.3 mg/dL'],
                    ['gender' => 'P', 'min' => 0.6, 'max' => 1.1, 'display' => '0.6 - 1.1 mg/dL'],
                ],
                'rules' => [
                    ['op' => '>', 'val1' => '1.3', 'gender' => 'L', 'flag' => 'high', 'concl' => 'Kreatinin Serum Meningkat', 'sugg' => 'Konsultasikan dengan Dokter Spesialis Penyakit Dalam / Nefrologi', 'recap' => true, 'prio' => 1],
                    ['op' => '>', 'val1' => '1.1', 'gender' => 'P', 'flag' => 'high', 'concl' => 'Kreatinin Serum Meningkat', 'sugg' => 'Konsultasikan dengan Dokter Spesialis Penyakit Dalam / Nefrologi', 'recap' => true, 'prio' => 1],
                ],
            ],
        ];
        $this->seedParametersForService($ginjal, $ginjalParams);

        // --- E. Faal Hati (LAB-HATI) ---
        $hati = $services['LAB-HATI'];
        $hatiParams = [
            [
                'code' => 'sgot',
                'label' => 'SGOT (AST)',
                'group' => 'Faal Hati',
                'type' => 'number',
                'unit' => 'U/L',
                'sort' => 1,
                'ranges' => [
                    ['gender' => 'L', 'min' => 0, 'max' => 35, 'display' => '< 35 U/L'],
                    ['gender' => 'P', 'min' => 0, 'max' => 31, 'display' => '< 31 U/L'],
                ],
                'rules' => [
                    ['op' => '>', 'val1' => '35', 'gender' => 'L', 'flag' => 'high', 'concl' => 'SGOT / AST Meningkat', 'sugg' => 'Evaluasi fungsi sel hati dan hindari konsumsi alkohol/obat hepatotoksik', 'recap' => true, 'prio' => 1],
                    ['op' => '>', 'val1' => '31', 'gender' => 'P', 'flag' => 'high', 'concl' => 'SGOT / AST Meningkat', 'sugg' => 'Evaluasi fungsi sel hati dan hindari konsumsi alkohol/obat hepatotoksik', 'recap' => true, 'prio' => 1],
                ],
            ],
            [
                'code' => 'sgpt',
                'label' => 'SGPT (ALT)',
                'group' => 'Faal Hati',
                'type' => 'number',
                'unit' => 'U/L',
                'sort' => 2,
                'ranges' => [
                    ['gender' => 'L', 'min' => 0, 'max' => 45, 'display' => '< 45 U/L'],
                    ['gender' => 'P', 'min' => 0, 'max' => 34, 'display' => '< 34 U/L'],
                ],
                'rules' => [
                    ['op' => '>', 'val1' => '45', 'gender' => 'L', 'flag' => 'high', 'concl' => 'SGPT / ALT Meningkat', 'sugg' => 'Evaluasi adanya perlemakan hati (fatty liver) atau hepatitis', 'recap' => true, 'prio' => 1],
                    ['op' => '>', 'val1' => '34', 'gender' => 'P', 'flag' => 'high', 'concl' => 'SGPT / ALT Meningkat', 'sugg' => 'Evaluasi adanya perlemakan hati (fatty liver) atau hepatitis', 'recap' => true, 'prio' => 1],
                ],
            ],
        ];
        $this->seedParametersForService($hati, $hatiParams);

        // --- F. Urinalisis Rutin (LAB-URIN) ---
        $urin = $services['LAB-URIN'];
        $urinParams = [
            [
                'code' => 'urin_warna',
                'label' => 'Warna Urin',
                'group' => 'Fisik Urin',
                'type' => 'select',
                'options' => ['Kuning Muda', 'Kuning', 'Kuning Tua', 'Kemerahan', 'Coklat Teh'],
                'default_text' => 'Kuning Muda',
                'sort' => 1,
                'ranges' => [['gender' => 'ALL', 'display' => 'Kuning Muda - Kuning']],
                'rules' => [],
            ],
            [
                'code' => 'urin_kejernihan',
                'label' => 'Kejernihan',
                'group' => 'Fisik Urin',
                'type' => 'select',
                'options' => ['Jernih', 'Agak Keruh', 'Keruh'],
                'default_text' => 'Jernih',
                'sort' => 2,
                'ranges' => [['gender' => 'ALL', 'display' => 'Jernih']],
                'rules' => [
                    ['op' => '==', 'val1' => 'Keruh', 'gender' => 'ALL', 'flag' => 'abnormal', 'concl' => 'Urin Keruh', 'sugg' => 'Perbanyak minum air dan evaluasi infeksi saluran kemih', 'recap' => false, 'prio' => 1],
                ],
            ],
            [
                'code' => 'urin_protein',
                'label' => 'Protein Urin (Albumin)',
                'group' => 'Kimia Urin',
                'type' => 'select',
                'options' => ['Negatif', 'Trace', 'Positif (+)', 'Positif (++)', 'Positif (+++)'],
                'default_text' => 'Negatif',
                'sort' => 3,
                'ranges' => [['gender' => 'ALL', 'display' => 'Negatif']],
                'rules' => [
                    ['op' => '!=', 'val1' => 'Negatif', 'gender' => 'ALL', 'flag' => 'abnormal', 'concl' => 'Proteinuria Terdeteksi', 'sugg' => 'Evaluasi permeabilitas ginjal dan fungsi ekskresi', 'recap' => true, 'prio' => 1],
                ],
            ],
            [
                'code' => 'urin_glukosa',
                'label' => 'Glukosa Urin',
                'group' => 'Kimia Urin',
                'type' => 'select',
                'options' => ['Negatif', 'Positif (+)', 'Positif (++)', 'Positif (+++)'],
                'default_text' => 'Negatif',
                'sort' => 4,
                'ranges' => [['gender' => 'ALL', 'display' => 'Negatif']],
                'rules' => [
                    ['op' => '!=', 'val1' => 'Negatif', 'gender' => 'ALL', 'flag' => 'abnormal', 'concl' => 'Glukosuria', 'sugg' => 'Pemeriksaan gula darah puasa / HbA1c lebih lanjut', 'recap' => true, 'prio' => 1],
                ],
            ],
            [
                'code' => 'urin_sedimen_leuko',
                'label' => 'Sedimen Leukosit',
                'group' => 'Mikroskopis Urin',
                'type' => 'text',
                'unit' => '/LPB',
                'default_text' => '0 - 2 /LPB',
                'sort' => 5,
                'ranges' => [['gender' => 'ALL', 'display' => '0 - 5 /LPB']],
                'rules' => [],
            ],
            [
                'code' => 'urin_sedimen_eritro',
                'label' => 'Sedimen Eritrosit',
                'group' => 'Mikroskopis Urin',
                'type' => 'text',
                'unit' => '/LPB',
                'default_text' => '0 - 1 /LPB',
                'sort' => 6,
                'ranges' => [['gender' => 'ALL', 'display' => '0 - 1 /LPB']],
                'rules' => [],
            ],
        ];
        $this->seedParametersForService($urin, $urinParams);

        // --- G. Rontgen Thorax PA (RAD-THORAX-PA) ---
        $rontgen = $services['RAD-THORAX-PA'];
        $roParams = [
            [
                'code' => 'ro_cor',
                'label' => 'Cor (Jantung)',
                'group' => 'Deskripsi Radiologi',
                'type' => 'textarea',
                'default_text' => 'Bentuk dan ukuran dalam batas normal, CTR < 50%',
                'sort' => 1,
                'ranges' => [['gender' => 'ALL', 'display' => 'Bentuk & ukuran normal (CTR < 50%)']],
                'rules' => [],
            ],
            [
                'code' => 'ro_pulmo',
                'label' => 'Pulmo (Paru)',
                'group' => 'Deskripsi Radiologi',
                'type' => 'textarea',
                'default_text' => 'Corakan bronkovaskular dalam batas normal, tidak tampak infiltrat maupun nodul aktif',
                'sort' => 2,
                'ranges' => [['gender' => 'ALL', 'display' => 'Corakan normal, infiltrat (-)']],
                'rules' => [],
            ],
            [
                'code' => 'ro_sinus_diafragma',
                'label' => 'Sinus & Diafragma',
                'group' => 'Deskripsi Radiologi',
                'type' => 'text',
                'default_text' => 'Sinus kostofrenikus kanan dan kiri tajam, hemidiafragma normal',
                'sort' => 3,
                'ranges' => [['gender' => 'ALL', 'display' => 'Sinus tajam, diafragma licin']],
                'rules' => [],
            ],
            [
                'code' => 'ro_kesimpulan',
                'label' => 'Kesimpulan Radiologi',
                'group' => 'Kesimpulan',
                'type' => 'textarea',
                'default_text' => 'Cor dan Pulmo dalam batas normal (Tidak tampak kelainan radiologis aktif)',
                'sort' => 4,
                'ranges' => [['gender' => 'ALL', 'display' => 'Dalam batas normal']],
                'rules' => [
                    ['op' => 'contains', 'val1' => 'Kardiomegali', 'gender' => 'ALL', 'flag' => 'abnormal', 'concl' => 'Kardiomegali (Pembesaran Jantung)', 'sugg' => 'Konsultasikan dengan Dokter Spesialis Jantung & Pembuluh Darah', 'recap' => true, 'prio' => 1],
                    ['op' => 'contains', 'val1' => 'Infiltrat', 'gender' => 'ALL', 'flag' => 'critical', 'concl' => 'Suspek TB Paru / Pneumonia (Infiltrat Paru)', 'sugg' => 'Pemeriksaan dahak BTA/TCM Sputum dan konsultasi Spesialis Paru', 'recap' => true, 'prio' => 2],
                    ['op' => 'contains', 'val1' => 'Bronchitis', 'gender' => 'ALL', 'flag' => 'abnormal', 'concl' => 'Bronkitis Kronis / Corakan Meningkat', 'sugg' => 'Hindari polusi udara, debu, asap rokok, dan gunakan masker saat bekerja', 'recap' => true, 'prio' => 3],
                ],
            ],
        ];
        $this->seedParametersForService($rontgen, $roParams);

        // --- H. EKG 12-Lead (ELK-EKG-12L) ---
        $ekg = $services['ELK-EKG-12L'];
        $ekgParams = [
            [
                'code' => 'ekg_irama',
                'label' => 'Irama Jantung',
                'group' => 'Parameter EKG',
                'type' => 'select',
                'options' => ['Sinus Rhythm (Normal)', 'Sinus Takikardia', 'Sinus Bradikardia', 'Atrial Fibrilasi', 'Ventrikular Ekstrasistol (VES)'],
                'default_text' => 'Sinus Rhythm (Normal)',
                'sort' => 1,
                'ranges' => [['gender' => 'ALL', 'display' => 'Sinus Rhythm']],
                'rules' => [],
            ],
            [
                'code' => 'ekg_hr',
                'label' => 'Heart Rate (Frekuensi Nadi)',
                'group' => 'Parameter EKG',
                'type' => 'number',
                'unit' => 'bpm',
                'sort' => 2,
                'ranges' => [['gender' => 'ALL', 'min' => 60, 'max' => 100, 'display' => '60 - 100 bpm']],
                'rules' => [
                    ['op' => '<', 'val1' => '60', 'gender' => 'ALL', 'flag' => 'low', 'concl' => 'Sinus Bradikardia', 'sugg' => 'Evaluasi riwayat atletik atau gejala pusing/berkunang-kunang', 'recap' => true, 'prio' => 1],
                    ['op' => '>', 'val1' => '100', 'gender' => 'ALL', 'flag' => 'high', 'concl' => 'Sinus Takikardia', 'sugg' => 'Istirahat sejenak, hindari kafein, dan evaluasi dehidrasi/stres', 'recap' => true, 'prio' => 1],
                ],
            ],
            [
                'code' => 'ekg_kesimpulan',
                'label' => 'Kesimpulan Rekaman EKG',
                'group' => 'Kesimpulan',
                'type' => 'textarea',
                'default_text' => 'Normal Sinus Rhythm (Rekaman EKG dalam batas normal)',
                'sort' => 3,
                'ranges' => [['gender' => 'ALL', 'display' => 'Normal Sinus Rhythm']],
                'rules' => [
                    ['op' => 'contains', 'val1' => 'Iskemik', 'gender' => 'ALL', 'flag' => 'critical', 'concl' => 'Suspek Iskemik Miokardial', 'sugg' => 'Segera konsultasi ke Dokter Spesialis Jantung & Pembuluh Darah', 'recap' => true, 'prio' => 1],
                    ['op' => 'contains', 'val1' => 'Infark', 'gender' => 'ALL', 'flag' => 'critical', 'concl' => 'Old Myocardial Infarction / OMI', 'sugg' => 'Pemeriksaan ekokardiografi dan evaluasi kardiologi lanjutan', 'recap' => true, 'prio' => 2],
                ],
            ],
        ];
        $this->seedParametersForService($ekg, $ekgParams);

        // --- I. Audiometri Nada Murni (ELK-AUDIO-PTA) ---
        $audio = $services['ELK-AUDIO-PTA'];
        $audioParams = [
            [
                'code' => 'audio_grid',
                'label' => 'Grafik Grid Audiogram (250 - 8000 Hz)',
                'group' => 'Ambang Dengar',
                'type' => 'audiogram_grid',
                'sort' => 1,
                'ranges' => [],
                'rules' => [],
            ],
            [
                'code' => 'pta_kanan',
                'label' => 'PTA Rata-rata Telinga Kanan (Right Ear)',
                'group' => 'Nilai Rata-rata (PTA)',
                'type' => 'number',
                'unit' => 'dB',
                'sort' => 2,
                'ranges' => [['gender' => 'ALL', 'min' => 0, 'max' => 25, 'display' => '0 - 25 dB (Normal)']],
                'rules' => [
                    ['op' => 'between', 'val1' => '26', 'val2' => '40', 'gender' => 'ALL', 'flag' => 'abnormal', 'concl' => 'Tuli Derajat Ringan Telinga Kanan (Mild Hearing Loss)', 'sugg' => 'Gunakan APD Ear Plug saat di area bising dan konsultasi Dokter THT', 'recap' => true, 'prio' => 1],
                    ['op' => '>', 'val1' => '40', 'gender' => 'ALL', 'flag' => 'critical', 'concl' => 'Gangguan Pendengaran Sedang/Berat Telinga Kanan', 'sugg' => 'Konsultasi Spesialis THT dan rotasi kerja dari area bising tinggi', 'recap' => true, 'prio' => 2],
                ],
            ],
            [
                'code' => 'pta_kiri',
                'label' => 'PTA Rata-rata Telinga Kiri (Left Ear)',
                'group' => 'Nilai Rata-rata (PTA)',
                'type' => 'number',
                'unit' => 'dB',
                'sort' => 3,
                'ranges' => [['gender' => 'ALL', 'min' => 0, 'max' => 25, 'display' => '0 - 25 dB (Normal)']],
                'rules' => [
                    ['op' => 'between', 'val1' => '26', 'val2' => '40', 'gender' => 'ALL', 'flag' => 'abnormal', 'concl' => 'Tuli Derajat Ringan Telinga Kiri (Mild Hearing Loss)', 'sugg' => 'Gunakan APD Ear Plug saat di area bising dan konsultasi Dokter THT', 'recap' => true, 'prio' => 1],
                    ['op' => '>', 'val1' => '40', 'gender' => 'ALL', 'flag' => 'critical', 'concl' => 'Gangguan Pendengaran Sedang/Berat Telinga Kiri', 'sugg' => 'Konsultasi Spesialis THT dan rotasi kerja dari area bising tinggi', 'recap' => true, 'prio' => 2],
                ],
            ],
            [
                'code' => 'audio_kesimpulan',
                'label' => 'Kesimpulan Audiometri',
                'group' => 'Kesimpulan',
                'type' => 'textarea',
                'default_text' => 'Pendengaran kedua telinga dalam batas normal (Normal Hearing bilaterally)',
                'sort' => 4,
                'ranges' => [['gender' => 'ALL', 'display' => 'Normal Hearing (0-25 dB)']],
                'rules' => [],
            ],
        ];
        $this->seedParametersForService($audio, $audioParams);

        // --- J. Spirometri (ELK-SPIRO-LUNG) ---
        $spiro = $services['ELK-SPIRO-LUNG'];
        $spiroParams = [
            [
                'code' => 'spiro_fvc',
                'label' => 'FVC (% Prediksi)',
                'group' => 'Parameter Spirometri',
                'type' => 'number',
                'unit' => '%',
                'sort' => 1,
                'ranges' => [['gender' => 'ALL', 'min' => 80, 'max' => 120, 'display' => '>= 80 %']],
                'rules' => [
                    ['op' => '<', 'val1' => '80', 'gender' => 'ALL', 'flag' => 'abnormal', 'concl' => 'Gangguan Ventilasi Restriktif Paru', 'sugg' => 'Konsultasikan dengan Dokter Paru, hindari asap rokok dan polusi industri', 'recap' => true, 'prio' => 1],
                ],
            ],
            [
                'code' => 'spiro_fev1',
                'label' => 'FEV1 (% Prediksi)',
                'group' => 'Parameter Spirometri',
                'type' => 'number',
                'unit' => '%',
                'sort' => 2,
                'ranges' => [['gender' => 'ALL', 'min' => 80, 'max' => 120, 'display' => '>= 80 %']],
                'rules' => [],
            ],
            [
                'code' => 'spiro_ratio',
                'label' => 'FEV1 / FVC Ratio (%)',
                'group' => 'Parameter Spirometri',
                'type' => 'number',
                'unit' => '%',
                'sort' => 3,
                'ranges' => [['gender' => 'ALL', 'min' => 70, 'max' => 100, 'display' => '>= 70 %']],
                'rules' => [
                    ['op' => '<', 'val1' => '70', 'gender' => 'ALL', 'flag' => 'abnormal', 'concl' => 'Gangguan Ventilasi Obstruktif Paru', 'sugg' => 'Waspadai PPOK / Asma Kerja; gunakan masker respirator saat bertugas', 'recap' => true, 'prio' => 1],
                ],
            ],
            [
                'code' => 'spiro_kesimpulan',
                'label' => 'Kesimpulan Spirometri',
                'group' => 'Kesimpulan',
                'type' => 'textarea',
                'default_text' => 'Fungsi faal paru dalam batas normal (Normal spirometry result)',
                'sort' => 4,
                'ranges' => [['gender' => 'ALL', 'display' => 'Normal']],
                'rules' => [],
            ],
        ];
        $this->seedParametersForService($spiro, $spiroParams);

        // --- K. Pemeriksaan Fisik Dokter & Vital Sign (FSK-DOKTER-MCU) ---
        $fisik = $services['FSK-DOKTER-MCU'];
        $fisikParams = [
            [
                'code' => 'tb',
                'label' => 'Tinggi Badan (TB)',
                'group' => 'Antropometri',
                'type' => 'number',
                'unit' => 'cm',
                'sort' => 1,
                'ranges' => [],
                'rules' => [],
            ],
            [
                'code' => 'bb',
                'label' => 'Berat Badan (BB)',
                'group' => 'Antropometri',
                'type' => 'number',
                'unit' => 'kg',
                'sort' => 2,
                'ranges' => [],
                'rules' => [],
            ],
            [
                'code' => 'bmi',
                'label' => 'Body Mass Index (BMI)',
                'group' => 'Antropometri',
                'type' => 'formula',
                'formula' => '[bb] / (([tb]/100) * ([tb]/100))',
                'unit' => 'kg/m2',
                'sort' => 3,
                'ranges' => [['gender' => 'ALL', 'min' => 18.5, 'max' => 24.9, 'display' => '18.5 - 24.9 kg/m2 (Normal)']],
                'rules' => [
                    ['op' => '<', 'val1' => '18.5', 'gender' => 'ALL', 'flag' => 'low', 'concl' => 'Underweight (Berat Badan Kurang)', 'sugg' => 'Tingkatkan asupan makanan bernutrisi seimbang dan cukup kalori', 'recap' => true, 'prio' => 1],
                    ['op' => 'between', 'val1' => '25.0', 'val2' => '29.9', 'gender' => 'ALL', 'flag' => 'high', 'concl' => 'Overweight (Kelebihan Berat Badan)', 'sugg' => 'Lakukan pengaturan pola makan defisit kalori dan olahraga kardio rutin', 'recap' => true, 'prio' => 2],
                    ['op' => '>=', 'val1' => '30.0', 'gender' => 'ALL', 'flag' => 'abnormal', 'concl' => 'Obesitas', 'sugg' => 'Konsultasikan dengan Ahli Gizi untuk program penurunan berat badan terukur', 'recap' => true, 'prio' => 3],
                ],
            ],
            [
                'code' => 'td_sistolik',
                'label' => 'Tekanan Darah Sistolik',
                'group' => 'Tanda Vital',
                'type' => 'number',
                'unit' => 'mmHg',
                'sort' => 4,
                'ranges' => [['gender' => 'ALL', 'min' => 90, 'max' => 120, 'display' => '90 - 120 mmHg']],
                'rules' => [
                    ['op' => 'between', 'val1' => '121', 'val2' => '139', 'gender' => 'ALL', 'flag' => 'high', 'concl' => 'Pre-Hipertensi Sistolik', 'sugg' => 'Batasi asupan garam, kelola stres, dan kontrol tekanan darah berkala', 'recap' => true, 'prio' => 1],
                    ['op' => 'between', 'val1' => '140', 'val2' => '159', 'gender' => 'ALL', 'flag' => 'abnormal', 'concl' => 'Hipertensi Derajat 1', 'sugg' => 'Konsultasi dokter dan pertimbangkan terapi antihipertensi', 'recap' => true, 'prio' => 2],
                    ['op' => '>=', 'val1' => '160', 'gender' => 'ALL', 'flag' => 'critical', 'concl' => 'Hipertensi Derajat 2', 'sugg' => 'Waspadai komplikasi kardiovaskular; segera konsultasi dokter spesialis', 'recap' => true, 'prio' => 3],
                ],
            ],
            [
                'code' => 'td_diastolik',
                'label' => 'Tekanan Darah Diastolik',
                'group' => 'Tanda Vital',
                'type' => 'number',
                'unit' => 'mmHg',
                'sort' => 5,
                'ranges' => [['gender' => 'ALL', 'min' => 60, 'max' => 80, 'display' => '60 - 80 mmHg']],
                'rules' => [
                    ['op' => 'between', 'val1' => '81', 'val2' => '89', 'gender' => 'ALL', 'flag' => 'high', 'concl' => 'Pre-Hipertensi Diastolik', 'sugg' => 'Kurangi konsumsi natrium/garam', 'recap' => true, 'prio' => 1],
                    ['op' => '>=', 'val1' => '90', 'gender' => 'ALL', 'flag' => 'abnormal', 'concl' => 'Hipertensi Diastolik', 'sugg' => 'Konsultasikan ke dokter untuk penanganan hipertensi', 'recap' => true, 'prio' => 2],
                ],
            ],
            [
                'code' => 'nadi',
                'label' => 'Frekuensi Denyut Nadi',
                'group' => 'Tanda Vital',
                'type' => 'number',
                'unit' => 'x/menit',
                'sort' => 6,
                'ranges' => [['gender' => 'ALL', 'min' => 60, 'max' => 100, 'display' => '60 - 100 x/menit']],
                'rules' => [],
            ],
            [
                'code' => 'visus_od',
                'label' => 'Visus Mata Kanan (OD)',
                'group' => 'Mata & Refraksi',
                'type' => 'text',
                'default_text' => '6/6',
                'sort' => 7,
                'ranges' => [['gender' => 'ALL', 'display' => '6/6']],
                'rules' => [],
            ],
            [
                'code' => 'visus_os',
                'label' => 'Visus Mata Kiri (OS)',
                'group' => 'Mata & Refraksi',
                'type' => 'text',
                'default_text' => '6/6',
                'sort' => 8,
                'ranges' => [['gender' => 'ALL', 'display' => '6/6']],
                'rules' => [],
            ],
            [
                'code' => 'buta_warna',
                'label' => 'Tes Buta Warna (Ishihara)',
                'group' => 'Mata & Refraksi',
                'type' => 'select',
                'options' => ['Normal', 'Buta Warna Parsial', 'Buta Warna Total'],
                'default_text' => 'Normal',
                'sort' => 9,
                'ranges' => [['gender' => 'ALL', 'display' => 'Normal']],
                'rules' => [
                    ['op' => '!=', 'val1' => 'Normal', 'gender' => 'ALL', 'flag' => 'abnormal', 'concl' => 'Buta Warna Terdeteksi', 'sugg' => 'Evaluasi kelayakan kerja pada area yang mensyaratkan pembedaan warna', 'recap' => true, 'prio' => 1],
                ],
            ],
            [
                'code' => 'fisik_umum',
                'label' => 'Pemeriksaan Organ & Fisik Umum',
                'group' => 'Status Generalis',
                'type' => 'textarea',
                'default_text' => 'Kepala: Normocephali. Mata: Konjungtiva tidak anemis, sklera tidak ikterik. THT: DBN. Thorax: Cor dan Pulmo DBN. Abdomen: Supel, nyeri tekan (-), hepar/lien tidak teraba. Ekstremitas: Akral hangat, CRT < 2 detik, edema (-).',
                'sort' => 10,
                'ranges' => [['gender' => 'ALL', 'display' => 'Dalam batas normal']],
                'rules' => [],
            ],
        ];
        $this->seedParametersForService($fisik, $fisikParams);

        // --- L. Skrining Narkoba 6P (LAB-NARKOBA-6P) ---
        $narkoba = $services['LAB-NARKOBA-6P'];
        $narkobaParams = [
            [
                'code' => 'narkoba_amp',
                'label' => 'Amphetamine (AMP)',
                'group' => 'Skrining Narkoba',
                'type' => 'select',
                'options' => ['Negatif', 'Positif'],
                'default_text' => 'Negatif',
                'sort' => 1,
                'ranges' => [['gender' => 'ALL', 'display' => 'Negatif']],
                'rules' => [
                    ['op' => '==', 'val1' => 'Positif', 'gender' => 'ALL', 'flag' => 'critical', 'concl' => 'Skrining Amphetamine POSITIF', 'sugg' => 'Konfirmasi uji konfirmatori GC-MS / LC-MS laboratorium rujukan BNN', 'recap' => true, 'prio' => 1],
                ],
            ],
            [
                'code' => 'narkoba_met',
                'label' => 'Methamphetamine (MET)',
                'group' => 'Skrining Narkoba',
                'type' => 'select',
                'options' => ['Negatif', 'Positif'],
                'default_text' => 'Negatif',
                'sort' => 2,
                'ranges' => [['gender' => 'ALL', 'display' => 'Negatif']],
                'rules' => [
                    ['op' => '==', 'val1' => 'Positif', 'gender' => 'ALL', 'flag' => 'critical', 'concl' => 'Skrining Methamphetamine POSITIF', 'sugg' => 'Konfirmasi uji laboratorium rujukan BNN', 'recap' => true, 'prio' => 1],
                ],
            ],
            [
                'code' => 'narkoba_thc',
                'label' => 'THC / Marijuana (Ganja)',
                'group' => 'Skrining Narkoba',
                'type' => 'select',
                'options' => ['Negatif', 'Positif'],
                'default_text' => 'Negatif',
                'sort' => 3,
                'ranges' => [['gender' => 'ALL', 'display' => 'Negatif']],
                'rules' => [
                    ['op' => '==', 'val1' => 'Positif', 'gender' => 'ALL', 'flag' => 'critical', 'concl' => 'Skrining THC (Ganja) POSITIF', 'sugg' => 'Konfirmasi laboratorium rujukan', 'recap' => true, 'prio' => 1],
                ],
            ],
            [
                'code' => 'narkoba_mop',
                'label' => 'Morphine / Opiates (MOP)',
                'group' => 'Skrining Narkoba',
                'type' => 'select',
                'options' => ['Negatif', 'Positif'],
                'default_text' => 'Negatif',
                'sort' => 4,
                'ranges' => [['gender' => 'ALL', 'display' => 'Negatif']],
                'rules' => [
                    ['op' => '==', 'val1' => 'Positif', 'gender' => 'ALL', 'flag' => 'critical', 'concl' => 'Skrining Morphine POSITIF', 'sugg' => 'Konfirmasi laboratorium rujukan', 'recap' => true, 'prio' => 1],
                ],
            ],
            [
                'code' => 'narkoba_bzo',
                'label' => 'Benzodiazepine (BZO)',
                'group' => 'Skrining Narkoba',
                'type' => 'select',
                'options' => ['Negatif', 'Positif'],
                'default_text' => 'Negatif',
                'sort' => 5,
                'ranges' => [['gender' => 'ALL', 'display' => 'Negatif']],
                'rules' => [
                    ['op' => '==', 'val1' => 'Positif', 'gender' => 'ALL', 'flag' => 'critical', 'concl' => 'Skrining Benzodiazepine POSITIF', 'sugg' => 'Verifikasi resep obat dokter dan uji konfirmatori', 'recap' => true, 'prio' => 1],
                ],
            ],
            [
                'code' => 'narkoba_coc',
                'label' => 'Cocaine (COC)',
                'group' => 'Skrining Narkoba',
                'type' => 'select',
                'options' => ['Negatif', 'Positif'],
                'default_text' => 'Negatif',
                'sort' => 6,
                'ranges' => [['gender' => 'ALL', 'display' => 'Negatif']],
                'rules' => [
                    ['op' => '==', 'val1' => 'Positif', 'gender' => 'ALL', 'flag' => 'critical', 'concl' => 'Skrining Cocaine POSITIF', 'sugg' => 'Uji konfirmasi laboratorium rujukan', 'recap' => true, 'prio' => 1],
                ],
            ],
        ];
        $this->seedParametersForService($narkoba, $narkobaParams);

        // --- M. Pemeriksaan Gigi (FSK-GIGI) ---
        $gigi = $services['FSK-GIGI'];
        $gigiParams = [
            [
                'code' => 'gigi_caries',
                'label' => 'Karies Gigi / Gigi Berlubang',
                'group' => 'Odontogram',
                'type' => 'text',
                'default_text' => 'Tidak ditemukan karies aktif',
                'sort' => 1,
                'ranges' => [['gender' => 'ALL', 'display' => 'Karies (-)']],
                'rules' => [],
            ],
            [
                'code' => 'gigi_karang',
                'label' => 'Karang Gigi (Calculus)',
                'group' => 'Odontogram',
                'type' => 'select',
                'options' => ['Tidak Ada', 'Ringan', 'Sedang', 'Berat'],
                'default_text' => 'Tidak Ada',
                'sort' => 2,
                'ranges' => [['gender' => 'ALL', 'display' => 'Tidak Ada']],
                'rules' => [
                    ['op' => '!=', 'val1' => 'Tidak Ada', 'gender' => 'ALL', 'flag' => 'abnormal', 'concl' => 'Calculus Gigi Terdeteksi', 'sugg' => 'Dianjurkan pembersihan karang gigi (Scaling) ke Dokter Gigi berkala', 'recap' => true, 'prio' => 1],
                ],
            ],
            [
                'code' => 'gigi_kesimpulan',
                'label' => 'Kesimpulan Kesehatan Gigi & Mulut',
                'group' => 'Kesimpulan',
                'type' => 'textarea',
                'default_text' => 'Kesehatan gigi dan rongga mulut dalam batas normal',
                'sort' => 3,
                'ranges' => [['gender' => 'ALL', 'display' => 'Dalam batas normal']],
                'rules' => [],
            ],
        ];
        $this->seedParametersForService($gigi, $gigiParams);

        // ==========================================
        // 4. Realistic MCU Bundling Packages
        // ==========================================
        $packagesConfig = [
            [
                'name' => 'Paket MCU Basic / Pra-Kerja Standard',
                'year' => 2026,
                'event_label' => 'Pre-Employment MCU 2026',
                'discount' => 35000.00,
                'services' => ['FSK-DOKTER-MCU', 'LAB-HEMA', 'LAB-URIN', 'RAD-THORAX-PA'],
            ],
            [
                'name' => 'Paket MCU Standard Karyawan Tahunan (Annual)',
                'year' => 2026,
                'event_label' => 'Annual Corporate MCU 2026',
                'discount' => 60000.00,
                'services' => [
                    'FSK-DOKTER-MCU',
                    'LAB-HEMA',
                    'LAB-GLU-P',
                    'LAB-CHOL-TOT',
                    'LAB-URIN',
                    'RAD-THORAX-PA',
                    'ELK-EKG-12L',
                ],
            ],
            [
                'name' => 'Paket MCU Corporate Executive Comprehensive',
                'year' => 2026,
                'event_label' => 'Executive Corporate MCU 2026',
                'discount' => 120000.00,
                'services' => [
                    'FSK-DOKTER-MCU',
                    'LAB-HEMA',
                    'LAB-GLU-P',
                    'LAB-LIPID',
                    'LAB-GINJAL',
                    'LAB-HATI',
                    'LAB-URIN',
                    'LAB-HBSAG',
                    'RAD-THORAX-PA',
                    'ELK-EKG-12L',
                    'ELK-AUDIO-PTA',
                    'ELK-SPIRO-LUNG',
                    'FSK-GIGI',
                ],
            ],
            [
                'name' => 'Paket MCU Driver & Operator Pabrik',
                'year' => 2026,
                'event_label' => 'Heavy Equipment & Driver MCU 2026',
                'discount' => 85000.00,
                'services' => [
                    'FSK-DOKTER-MCU',
                    'LAB-HEMA',
                    'LAB-URIN',
                    'LAB-NARKOBA-6P',
                    'RAD-THORAX-PA',
                    'ELK-AUDIO-PTA',
                    'ELK-EKG-12L',
                ],
            ],
        ];

        foreach ($packagesConfig as $pData) {
            $package = Package::updateOrCreate(
                ['name' => $pData['name']],
                [
                    'year' => $pData['year'],
                    'event_label' => $pData['event_label'],
                    'discount_amount' => $pData['discount'],
                    'is_active' => true,
                ]
            );

            // Sync items
            PackageItem::where('package_id', $package->id)->delete();
            foreach ($pData['services'] as $svcCode) {
                if (isset($services[$svcCode])) {
                    PackageItem::create([
                        'package_id' => $package->id,
                        'service_id' => $services[$svcCode]->id,
                    ]);
                }
            }
            $package->recalculateTotals();
        }
    }

    /**
     * Helper to seed parameters, reference ranges, and auto rules for a service.
     */
    private function seedParametersForService(Service $service, array $params): void
    {
        foreach ($params as $p) {
            $param = ServiceParameter::updateOrCreate(
                [
                    'service_id' => $service->id,
                    'code' => $p['code'],
                ],
                [
                    'label' => $p['label'],
                    'group_name' => $p['group'] ?? null,
                    'input_type' => $p['type'],
                    'unit' => $p['unit'] ?? null,
                    'options_json' => $p['options'] ?? null,
                    'formula_expression' => $p['formula'] ?? null,
                    'default_normal_text' => $p['default_text'] ?? null,
                    'sort_order' => $p['sort'],
                    'is_required' => true,
                    'is_active' => true,
                ]
            );

            // Reference Ranges
            if (! empty($p['ranges'])) {
                foreach ($p['ranges'] as $r) {
                    ParameterReferenceRange::updateOrCreate(
                        [
                            'parameter_id' => $param->id,
                            'gender' => $r['gender'],
                            'min_age_years' => $r['min_age'] ?? null,
                            'max_age_years' => $r['max_age'] ?? null,
                        ],
                        [
                            'min_value' => $r['min'] ?? null,
                            'max_value' => $r['max'] ?? null,
                            'normal_text_value' => $r['text'] ?? null,
                            'display_reference' => $r['display'] ?? null,
                            'is_active' => true,
                        ]
                    );
                }
            }

            // Auto Rules
            if (! empty($p['rules'])) {
                foreach ($p['rules'] as $rule) {
                    ParameterAutoRule::updateOrCreate(
                        [
                            'parameter_id' => $param->id,
                            'condition_operator' => $rule['op'],
                            'compare_value_1' => (string) $rule['val1'],
                            'gender' => $rule['gender'] ?? 'ALL',
                            'flag_status' => $rule['flag'],
                        ],
                        [
                            'compare_value_2' => isset($rule['val2']) ? (string) $rule['val2'] : null,
                            'auto_conclusion' => $rule['concl'] ?? null,
                            'auto_suggestion' => $rule['sugg'] ?? null,
                            'include_in_abnormality_recap' => $rule['recap'] ?? false,
                            'priority' => $rule['prio'] ?? 0,
                            'is_active' => true,
                        ]
                    );
                }
            }
        }
    }
}
