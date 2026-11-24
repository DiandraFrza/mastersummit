<?php

namespace App\Services\Prints;

use App\Models\ClinicSetting;
use App\Models\Registration;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\File;
use SimpleSoftwareIO\QrCode\Generator as QrCodeGenerator;
use Spatie\Browsershot\Browsershot;

class ControlCardService
{
    /**
     * Prepare data payload for the Control Card template.
     */
    public function prepareData(Registration $registration, ?string $paperSize = null): array
    {
        $registration->loadMissing([
            'patient',
            'company',
            'referrer',
            'package.packageItems.service',
            'items.service.sample',
            'mcuEvent',
        ]);

        $clinic = ClinicSetting::current();
        $paperSize = strtoupper($paperSize ?: ($clinic->control_card_paper_size ?? 'A5'));
        if (! in_array($paperSize, ['A5', 'A6', 'A4_2IN1'], true)) {
            $paperSize = 'A5';
        }

        // Generate SVG Barcode for reg_no
        $barcodeSvg = $this->generateBarcodeSvg($registration->reg_no);

        // Build Stations Checklist
        $stations = $this->buildStationsChecklist($registration);

        // Logo & Watermark base64 for reliable printing / PDF rendering
        $logoBase64 = $this->fileToBase64($clinic->logo_path);
        $watermarkBase64 = $this->fileToBase64($clinic->watermark_path);

        return [
            'registration' => $registration,
            'patient' => $registration->patient,
            'clinic' => $clinic,
            'paperSize' => $paperSize,
            'barcodeSvg' => $barcodeSvg,
            'stations' => $stations,
            'logoBase64' => $logoBase64,
            'watermarkBase64' => $watermarkBase64,
            'watermarkOpacity' => $clinic->watermark_opacity ?? 0.08,
            'printedAt' => now()->translatedFormat('d M Y, H:i'),
        ];
    }

    /**
     * Render HTML view for Control Card.
     */
    public function renderHtml(Registration $registration, ?string $paperSize = null, bool $autoPrint = false): string
    {
        $data = $this->prepareData($registration, $paperSize);
        $data['autoPrint'] = $autoPrint;

        return view('prints.control_card', $data)->render();
    }

    /**
     * Generate Browsershot PDF binary string.
     */
    public function generatePdf(Registration $registration, ?string $paperSize = null): string
    {
        $data = $this->prepareData($registration, $paperSize);
        $data['autoPrint'] = false;
        $html = view('prints.control_card', $data)->render();

        $browsershot = Browsershot::html($html)
            ->noSandbox()
            ->showBackground();

        // Detect Chrome executable path on host
        $chromePath = $this->resolveChromePath();
        if ($chromePath) {
            $browsershot->setChromePath($chromePath);
        }

        // Apply Paper Dimensions based on paperSize
        switch ($data['paperSize']) {
            case 'A6':
                // A6 portrait: 105mm x 148mm
                $browsershot->paperSize(105, 148, 'mm');
                $browsershot->margins(4, 4, 4, 4, 'mm');
                break;
            case 'A4_2IN1':
                // A4 portrait: 210mm x 297mm (contains 2 copies stacked with cut line)
                $browsershot->paperSize(210, 297, 'mm');
                $browsershot->margins(6, 6, 6, 6, 'mm');
                break;
            case 'A5':
            default:
                // A5 portrait: 148mm x 210mm
                $browsershot->paperSize(148, 210, 'mm');
                $browsershot->margins(6, 6, 6, 6, 'mm');
                break;
        }

        return $browsershot->pdf();
    }

    /**
     * Generate SVG QR Code for reg_no.
     */
    public function generateBarcodeSvg(string $code): string
    {
        try {
            $generator = new QrCodeGenerator();
            // Generate clean vector QR Code SVG without margin
            return (string) $generator->size(68)->margin(0)->generate($code);
        } catch (\Throwable $e) {
            return '';
        }
    }

    /**
     * Build structured stations checklist from registration items.
     */
    public function buildStationsChecklist(Registration $registration): Collection
    {
        $stations = collect();
        $stationIndex = 1;

        // 1. Stasiun Awal: Pendaftaran & Tanda Vital (Selalu ada)
        $stations->push([
            'number' => $stationIndex++,
            'station_name' => 'Loket Pendaftaran & Tanda Vital',
            'room' => 'Pos 1 (Front Office)',
            'description' => 'Verifikasi Identitas Pasien, Tekanan Darah, Nadi, Suhu, TB & BB, IMT',
            'is_mandatory' => true,
        ]);

        $items = $registration->items;

        // 2. Stasiun Laboratorium (Jika ada item lab / sampling)
        $labItems = $items->filter(function ($item) {
            return ($item->category ?? $item->service?->category) === 'lab' || ! empty($item->sample_id);
        });

        if ($labItems->isNotEmpty()) {
            $labNames = $labItems->pluck('service_name_snapshot')->unique()->implode(', ');
            $samples = $labItems->map(fn ($i) => $i->service?->sample?->name)->filter()->unique()->implode(' & ');
            $sampleDesc = $samples ? "Pengambilan {$samples}: " : 'Pengambilan Sampel: ';

            $stations->push([
                'number' => $stationIndex++,
                'station_name' => 'Laboratorium & Flebotomi',
                'room' => 'Pos 2 (Lab)',
                'description' => $sampleDesc . $labNames,
                'is_mandatory' => true,
            ]);
        }

        // 3. Stasiun Radiologi (Rontgen)
        $radItems = $items->filter(function ($item) {
            return ($item->category ?? $item->service?->category) === 'radiology';
        });

        if ($radItems->isNotEmpty()) {
            $radNames = $radItems->pluck('service_name_snapshot')->unique()->implode(', ');
            $stations->push([
                'number' => $stationIndex++,
                'station_name' => 'Radiologi (Rontgen)',
                'room' => 'Pos 3 (Radiologi)',
                'description' => $radNames,
                'is_mandatory' => true,
            ]);
        }

        // 4. Stasiun Elektromedis (EKG, Treadmill, Spirometri, Audiometri, dll)
        $electroItems = $items->filter(function ($item) {
            return ($item->category ?? $item->service?->category) === 'electromedical';
        });

        if ($electroItems->isNotEmpty()) {
            $electroNames = $electroItems->pluck('service_name_snapshot')->unique()->implode(', ');
            $stations->push([
                'number' => $stationIndex++,
                'station_name' => 'Pemeriksaan Elektromedis',
                'room' => 'Pos 4 (Elektromedis)',
                'description' => $electroNames,
                'is_mandatory' => true,
            ]);
        }

        // 5. Stasiun Pemeriksaan Fisik Dokter
        $physicalItems = $items->filter(function ($item) {
            return ($item->category ?? $item->service?->category) === 'physical';
        });

        if ($physicalItems->isNotEmpty() || $registration->service_type === 'mcu') {
            $physNames = $physicalItems->isNotEmpty()
                ? $physicalItems->pluck('service_name_snapshot')->unique()->implode(', ')
                : 'Pemeriksaan Fisik Umum, Mata (Visus/Buta Warna), THT, & Gigi';

            $stations->push([
                'number' => $stationIndex++,
                'station_name' => 'Pemeriksaan Dokter (Fisik & Gigi)',
                'room' => 'Pos 5 (Poli Dokter)',
                'description' => $physNames,
                'is_mandatory' => true,
            ]);
        }

        // 6. Layanan Tambahan Lainnya (jika tidak masuk kategori di atas)
        $otherItems = $items->filter(function ($item) {
            $cat = $item->category ?? $item->service?->category;
            return ! in_array($cat, ['lab', 'radiology', 'electromedical', 'physical'], true) && empty($item->sample_id);
        });

        if ($otherItems->isNotEmpty()) {
            $otherNames = $otherItems->pluck('service_name_snapshot')->unique()->implode(', ');
            $stations->push([
                'number' => $stationIndex++,
                'station_name' => 'Pemeriksaan Tambahan',
                'room' => 'Pos Khusus',
                'description' => $otherNames,
                'is_mandatory' => false,
            ]);
        }

        // 7. Stasiun Akhir: Verifikasi & Kepulangan (Selalu ada)
        $stations->push([
            'number' => $stationIndex++,
            'station_name' => 'Kasir & Pengembalian Berkas',
            'room' => 'Pos Selesai (Meja Administrasi)',
            'description' => 'Verifikasi seluruh paraf pos pemeriksaan, penyelesaian administrasi kasir & tanda terima',
            'is_mandatory' => true,
        ]);

        return $stations;
    }

    /**
     * Resolve Chrome / Chromium executable path on local system.
     */
    protected function resolveChromePath(): ?string
    {
        $possiblePaths = [
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
            'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
            '/usr/bin/google-chrome',
            '/usr/bin/chromium',
            '/usr/bin/chromium-browser',
        ];

        foreach ($possiblePaths as $path) {
            if (File::exists($path)) {
                return $path;
            }
        }

        return null;
    }

    /**
     * Convert storage or public file path to base64 Data URL.
     */
    protected function fileToBase64(?string $path): ?string
    {
        if (empty($path)) {
            return null;
        }

        $fullPath = null;
        if (File::exists(public_path($path))) {
            $fullPath = public_path($path);
        } elseif (File::exists(storage_path('app/public/' . $path))) {
            $fullPath = storage_path('app/public/' . $path);
        } elseif (File::exists($path)) {
            $fullPath = $path;
        }

        if ($fullPath && File::exists($fullPath)) {
            $mime = File::mimeType($fullPath);
            $content = File::get($fullPath);
            return 'data:' . $mime . ';base64,' . base64_encode($content);
        }

        return null;
    }
}
