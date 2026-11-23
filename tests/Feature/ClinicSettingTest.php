<?php

namespace Tests\Feature;

use App\Models\ClinicSetting;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ClinicSettingTest extends TestCase
{
    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::where('username', 'superadmin')->first();
    }

    public function test_unauthenticated_user_cannot_access_clinic_settings(): void
    {
        $response = $this->get('/settings/clinic');

        $response->assertRedirect('/login');
    }

    public function test_clinic_settings_page_can_be_rendered_for_authenticated_user(): void
    {
        $response = $this->actingAs($this->admin)->get('/settings/clinic');

        $response->assertStatus(200);
    }

    public function test_clinic_settings_can_be_updated_with_logo_and_watermark(): void
    {
        Storage::fake('public');

        $logo = UploadedFile::fake()->image('logo.png', 300, 300);
        $watermark = UploadedFile::fake()->image('watermark.png', 500, 500);

        $response = $this->actingAs($this->admin)->post('/settings/clinic', [
            'clinic_name' => 'Klinik Utama Summit Medical',
            'clinic_subtitle' => 'Pusat Diagnostik & MCU',
            'izin_klinik_no' => '503/KLINIK/2026',
            'address' => 'Jl. Summit Sehat No. 10',
            'city' => 'Jakarta Selatan',
            'phone' => '021-99887766',
            'email' => 'kontak@summitmedical.com',
            'website' => 'https://summitmedical.com',
            'watermark_opacity' => 0.12,
            'control_card_paper_size' => 'A4_2IN1',
            'default_online_expiry_days' => 45,
            'footer_text' => 'Dokumen resmi terverifikasi barcode.',
            'logo_file' => $logo,
            'watermark_file' => $watermark,
        ]);

        $response->assertRedirect('/settings/clinic');
        $response->assertSessionHas('success');

        $setting = ClinicSetting::current();
        $this->assertEquals('Klinik Utama Summit Medical', $setting->clinic_name);
        $this->assertEquals('A4_2IN1', $setting->control_card_paper_size);
        $this->assertEquals(0.12, (float) $setting->watermark_opacity);
        $this->assertEquals(45, $setting->default_online_expiry_days);

        $this->assertNotNull($setting->logo_path);
        $this->assertNotNull($setting->watermark_path);
        Storage::disk('public')->assertExists($setting->logo_path);
        Storage::disk('public')->assertExists($setting->watermark_path);
    }

    public function test_invalid_paper_size_is_rejected(): void
    {
        $response = $this->actingAs($this->admin)->post('/settings/clinic', [
            'clinic_name' => 'Klinik Valid',
            'control_card_paper_size' => 'INVALID_SIZE',
            'watermark_opacity' => 0.08,
            'default_online_expiry_days' => 30,
        ]);

        $response->assertSessionHasErrors(['control_card_paper_size']);
    }

    public function test_invalid_watermark_opacity_is_rejected(): void
    {
        $response = $this->actingAs($this->admin)->post('/settings/clinic', [
            'clinic_name' => 'Klinik Valid',
            'control_card_paper_size' => 'A5',
            'watermark_opacity' => 0.99, // Max is 0.50
            'default_online_expiry_days' => 30,
        ]);

        $response->assertSessionHasErrors(['watermark_opacity']);
    }
}
