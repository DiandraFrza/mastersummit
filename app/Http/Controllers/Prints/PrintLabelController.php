<?php

namespace App\Http\Controllers\Prints;

use App\Http\Controllers\Controller;
use App\Models\ClinicSetting;
use App\Models\Registration;
use Carbon\Carbon;
use Illuminate\Http\Response;

class PrintLabelController extends Controller
{
    /**
     * Printable thermal label for laboratory specimens.
     */
    public function labelLab(Registration $registration): Response
    {
        if ($registration->workflow_status === 'pending' || empty($registration->reg_no)) {
            return response(
                '<div style="font-family: sans-serif; padding: 20px; text-align: center; color: #dc2626;">' .
                '<h3>Peserta Belum Terdaftar</h3>' .
                '<p>Silakan klik tombol <strong>Daftar</strong> terlebih dahulu sebelum mencetak label.</p>' .
                '</div>',
                400,
                ['Content-Type' => 'text/html; charset=UTF-8']
            );
        }

        $registration->load(['patient', 'mcuEvent.company', 'items.service', 'items.sample']);
        $clinic = ClinicSetting::first();

        // Unique specimen samples for lab items
        $labItems = $registration->items->where('category', 'lab');
        $specimens = $labItems->pluck('sample.name')->unique()->filter()->values();
        if ($specimens->isEmpty()) {
            $specimens = collect(['Darah EDTA', 'Serum / Darah Plain']);
        }

        $patient = $registration->patient;
        $age = $patient->birth_date ? Carbon::parse($patient->birth_date)->age : $registration->age_years_snapshot;
        $genderText = $patient->gender === 'L' ? 'L' : 'P';
        $eventName = $registration->mcuEvent?->event_name ?? 'MCU';
        $companyName = $registration->company?->name ?? $registration->mcuEvent?->company?->name ?? 'Umum';

        $html = view('prints.label_lab', [
            'registration' => $registration,
            'patient' => $patient,
            'age' => $age,
            'genderText' => $genderText,
            'specimens' => $specimens,
            'eventName' => $eventName,
            'companyName' => $companyName,
            'clinic' => $clinic,
        ])->render();

        return response($html, 200, ['Content-Type' => 'text/html; charset=UTF-8']);
    }

    /**
     * Printable thermal label for non-lab examination units (Radiology, EKG, Audiometry, Physical).
     */
    public function labelNonLab(Registration $registration): Response
    {
        if ($registration->workflow_status === 'pending' || empty($registration->reg_no)) {
            return response(
                '<div style="font-family: sans-serif; padding: 20px; text-align: center; color: #dc2626;">' .
                '<h3>Peserta Belum Terdaftar</h3>' .
                '<p>Silakan klik tombol <strong>Daftar</strong> terlebih dahulu sebelum mencetak label.</p>' .
                '</div>',
                400,
                ['Content-Type' => 'text/html; charset=UTF-8']
            );
        }

        $registration->load(['patient', 'mcuEvent.company', 'items']);
        $clinic = ClinicSetting::first();

        $patient = $registration->patient;
        $age = $patient->birth_date ? Carbon::parse($patient->birth_date)->age : $registration->age_years_snapshot;
        $genderText = $patient->gender === 'L' ? 'L' : 'P';
        $eventName = $registration->mcuEvent?->event_name ?? 'MCU';
        $companyName = $registration->company?->name ?? $registration->mcuEvent?->company?->name ?? 'Umum';

        $nonLabCategories = $registration->items
            ->where('category', '!=', 'lab')
            ->pluck('category')
            ->unique()
            ->map(function ($cat) {
                return match ($cat) {
                    'radiology' => 'Rontgen Thorax',
                    'electromedical' => 'EKG / Elektromedis',
                    'physical' => 'Pemeriksaan Fisik',
                    default => ucfirst($cat),
                };
            })
            ->values();

        $html = view('prints.label_non_lab', [
            'registration' => $registration,
            'patient' => $patient,
            'age' => $age,
            'genderText' => $genderText,
            'eventName' => $eventName,
            'companyName' => $companyName,
            'units' => $nonLabCategories,
            'clinic' => $clinic,
        ])->render();

        return response($html, 200, ['Content-Type' => 'text/html; charset=UTF-8']);
    }

    /**
     * Printable Participant ID Card (Kartu Tanda Peserta MCU).
     */
    public function participantCard(Registration $registration): Response
    {
        if ($registration->workflow_status === 'pending' || empty($registration->reg_no)) {
            return response(
                '<div style="font-family: sans-serif; padding: 20px; text-align: center; color: #dc2626;">' .
                '<h3>Peserta Belum Terdaftar</h3>' .
                '<p>Silakan klik tombol <strong>Daftar</strong> terlebih dahulu sebelum mencetak kartu.</p>' .
                '</div>',
                400,
                ['Content-Type' => 'text/html; charset=UTF-8']
            );
        }

        $registration->load(['patient', 'mcuEvent.company', 'package']);
        $clinic = ClinicSetting::first();

        $patient = $registration->patient;
        $age = $patient->birth_date ? Carbon::parse($patient->birth_date)->age : $registration->age_years_snapshot;
        $genderText = $patient->gender === 'L' ? 'Laki-laki' : 'Perempuan';

        $html = view('prints.participant_card', [
            'registration' => $registration,
            'patient' => $patient,
            'age' => $age,
            'genderText' => $genderText,
            'clinic' => $clinic,
        ])->render();

        return response($html, 200, ['Content-Type' => 'text/html; charset=UTF-8']);
    }
}
