<?php

namespace Tests\Feature;

use App\Models\Package;
use App\Models\ParameterAutoRule;
use App\Models\ParameterReferenceRange;
use App\Models\Sample;
use App\Models\Service;
use App\Models\ServiceParameter;
use Database\Seeders\RealisticClinicSeeder;
use Tests\TestCase;

class RealisticClinicSeederTest extends TestCase
{
    public function test_realistic_clinic_seeder_populates_all_domains_properly(): void
    {
        $this->seed(RealisticClinicSeeder::class);

        // 1. Verify Samples / Specimen Stations
        $expectedSamples = [
            'SMP-EDTA',
            'SMP-SERUM',
            'SMP-2JAMPP',
            'SMP-URIN',
            'SMP-FESES',
            'SMP-EKG',
            'SMP-SPIRO',
            'SMP-AUDIO',
            'SMP-RO',
            'SMP-FISIK',
            'SMP-GIGI',
            'SMP-MATA',
        ];
        foreach ($expectedSamples as $code) {
            $this->assertDatabaseHas('samples', ['code' => $code, 'is_active' => true]);
        }

        // 2. Verify Key Unified Services
        $expectedServices = [
            'LAB-HEMA',
            'LAB-GLU-P',
            'LAB-GLU-2PP',
            'LAB-CHOL-TOT',
            'LAB-LIPID',
            'LAB-GINJAL',
            'LAB-HATI',
            'LAB-URIN',
            'LAB-HBSAG',
            'LAB-NARKOBA-6P',
            'RAD-THORAX-PA',
            'ELK-EKG-12L',
            'ELK-AUDIO-PTA',
            'ELK-SPIRO-LUNG',
            'FSK-DOKTER-MCU',
            'FSK-GIGI',
        ];
        foreach ($expectedServices as $code) {
            $this->assertDatabaseHas('services', ['code' => $code, 'is_active' => true]);
        }

        // 3. Verify Parameters Count & Specific Critical Parameters
        $hema = Service::where('code', 'LAB-HEMA')->first();
        $this->assertNotNull($hema);
        $this->assertTrue($hema->parameters()->where('code', 'hgb')->exists());
        $this->assertTrue($hema->parameters()->where('code', 'leuko')->exists());

        $hgb = $hema->parameters()->where('code', 'hgb')->first();
        $this->assertGreaterThanOrEqual(2, $hgb->referenceRanges()->count());
        $this->assertGreaterThanOrEqual(2, $hgb->autoRules()->count());

        // 4. Verify Formula Parameter (BMI on FSK-DOKTER-MCU)
        $fisik = Service::where('code', 'FSK-DOKTER-MCU')->first();
        $this->assertNotNull($fisik);
        $bmi = $fisik->parameters()->where('code', 'bmi')->first();
        $this->assertNotNull($bmi);
        $this->assertEquals('formula', $bmi->input_type);
        $this->assertStringContainsString('[bb]', $bmi->formula_expression);

        // 5. Verify Audiogram Grid Parameter on ELK-AUDIO-PTA
        $audio = Service::where('code', 'ELK-AUDIO-PTA')->first();
        $this->assertNotNull($audio);
        $this->assertTrue($audio->parameters()->where('input_type', 'audiogram_grid')->exists());

        // 6. Verify MCU Packages & Item Bundling
        $expectedPackages = [
            'Paket MCU Basic / Pra-Kerja Standard',
            'Paket MCU Standard Karyawan Tahunan (Annual)',
            'Paket MCU Corporate Executive Comprehensive',
            'Paket MCU Driver & Operator Pabrik',
        ];
        foreach ($expectedPackages as $pkgName) {
            $pkg = Package::where('name', $pkgName)->first();
            $this->assertNotNull($pkg);
            $this->assertGreaterThan(0, $pkg->packageItems()->count());
            $this->assertGreaterThan(0, (float) $pkg->final_price);
            $this->assertEquals((float) $pkg->total_price - (float) $pkg->discount_amount, (float) $pkg->final_price);
        }
    }
}
