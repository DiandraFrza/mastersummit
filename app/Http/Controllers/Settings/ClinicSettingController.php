<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateClinicSettingRequest;
use App\Models\ClinicSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ClinicSettingController extends Controller
{
    /**
     * Show the clinic settings and letterhead configuration page.
     */
    public function edit(): Response
    {
        $setting = ClinicSetting::current();

        return Inertia::render('Settings/Clinic', [
            'setting' => $setting,
        ]);
    }

    /**
     * Update clinic settings, logos, and letterhead layout.
     */
    public function update(UpdateClinicSettingRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            $setting = ClinicSetting::current();
            $validated = $request->validated();

            // Logo file upload or removal
            if ($request->boolean('remove_logo')) {
                if ($setting->logo_path && Storage::disk('public')->exists($setting->logo_path)) {
                    Storage::disk('public')->delete($setting->logo_path);
                }
                $validated['logo_path'] = null;
            } elseif ($request->hasFile('logo_file')) {
                if ($setting->logo_path && Storage::disk('public')->exists($setting->logo_path)) {
                    Storage::disk('public')->delete($setting->logo_path);
                }
                $validated['logo_path'] = Storage::disk('public')->putFile('clinic', $request->file('logo_file'));
            }

            // Watermark file upload or removal
            if ($request->boolean('remove_watermark')) {
                if ($setting->watermark_path && Storage::disk('public')->exists($setting->watermark_path)) {
                    Storage::disk('public')->delete($setting->watermark_path);
                }
                $validated['watermark_path'] = null;
            } elseif ($request->hasFile('watermark_file')) {
                if ($setting->watermark_path && Storage::disk('public')->exists($setting->watermark_path)) {
                    Storage::disk('public')->delete($setting->watermark_path);
                }
                $validated['watermark_path'] = Storage::disk('public')->putFile('clinic', $request->file('watermark_file'));
            }

            unset($validated['logo_file'], $validated['watermark_file']);

            $setting->update($validated);
        });

        return redirect()->route('settings.clinic.edit')->with('success', 'Pengaturan profil klinik & kop surat berhasil disimpan.');
    }
}
