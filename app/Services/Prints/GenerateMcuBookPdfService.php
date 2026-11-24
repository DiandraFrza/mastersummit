<?php

namespace App\Services\Prints;

use App\Models\ClinicSetting;
use App\Models\Registration;
use App\Models\ResultAttachment;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use setasign\Fpdi\Fpdi;
use SimpleSoftwareIO\QrCode\Generator as QrCodeGenerator;
use Spatie\Browsershot\Browsershot;

class GenerateMcuBookPdfService
{
    /**
     * Prepare complete data payload for MCU Book rendering.
     */
    public function prepareData(Registration $registration): array
    {
        $registration->loadMissing([
            'patient',
            'company',
            'referrer',
            'mcuEvent.company',
            'mcuEvent.picMcu',
            'mcuEvent.doctorLab',
            'mcuEvent.doctorRadiology',
            'mcuEvent.doctorElectromedical',
            'mcuEvent.doctorAnamnese',
            'mcuReview.doctor',
            'mcuReview.manager',
            'items.service.sample',
            'items.examinationResults.parameter',
            'resultAttachments',
        ]);

        $clinic = ClinicSetting::current();
        $patient = $registration->patient;
        $mcuEvent = $registration->mcuEvent;
        $mcuReview = $registration->mcuReview;

        // Group examination items by logical medical category
        $categoryOrder = ['physical' => 'Pemeriksaan Fisik & Gigi', 'radiology' => 'Radiologi (Rontgen)', 'electromedical' => 'Pemeriksaan Elektromedis', 'lab' => 'Laboratorium'];
        $unitResults = [];

        foreach ($categoryOrder as $catKey => $catLabel) {
            $catItems = $registration->items->filter(fn ($i) => ($i->category ?? $i->service?->category) === $catKey);
            if ($catItems->isNotEmpty()) {
                $allResults = $catItems->flatMap->examinationResults->sortBy('parameter.sort_order');
                $unitResults[] = [
                    'category' => $catKey,
                    'category_label' => $catLabel,
                    'service_names' => $catItems->pluck('service_name_snapshot')->unique()->implode(', '),
                    'group_conclusion' => $catItems->pluck('group_conclusion')->filter()->implode('. '),
                    'group_suggestion' => $catItems->pluck('group_suggestion')->filter()->implode('. '),
                    'examination_results' => $allResults,
                ];
            }
        }

        // Logo, Watermark & Patient Photo Base64
        $logoBase64 = $this->resolveFileBase64($clinic->logo_path);
        $watermarkBase64 = $this->resolveFileBase64($clinic->watermark_path);
        $patientPhotoBase64 = $this->resolveFileBase64($patient->photo_path);

        // Barcode / QR Code
        $barcodeSvg = $this->generateQrCodeSvg($registration->reg_no);

        // Signatures Base64
        $doctorMcuName = $mcuReview?->doctor?->name ?? $mcuEvent?->picMcu?->name ?? 'dr. Dokter MCU';
        $doctorMcuSip = '123/SIP-MCU/' . date('Y');
        $doctorMcuSignatureBase64 = null;

        if ($mcuReview?->doctor?->employee) {
            $doctorMcuSignatureBase64 = $this->resolveFileBase64($mcuReview->doctor->employee->signature_path);
            $doctorMcuSip = $mcuReview->doctor->employee->sip ?: $doctorMcuSip;
        } elseif ($mcuEvent?->picMcu) {
            $doctorMcuSignatureBase64 = $this->resolveFileBase64($mcuEvent->picMcu->signature_path);
            $doctorMcuSip = $mcuEvent->picMcu->sip ?: $doctorMcuSip;
        }

        $managerMcuName = $mcuReview?->manager?->name ?? 'Manajer Pelayanan Medis';
        $managerMcuSignatureBase64 = null;
        if ($mcuReview?->manager?->employee) {
            $managerMcuSignatureBase64 = $this->resolveFileBase64($mcuReview->manager->employee->signature_path);
        }

        return [
            'registration' => $registration,
            'patient' => $patient,
            'clinic' => $clinic,
            'mcuEvent' => $mcuEvent,
            'mcuReview' => $mcuReview,
            'unitResults' => $unitResults,
            'logoBase64' => $logoBase64,
            'watermarkBase64' => $watermarkBase64,
            'watermarkOpacity' => $clinic->watermark_opacity ?? 0.08,
            'patientPhotoBase64' => $patientPhotoBase64,
            'barcodeSvg' => $barcodeSvg,
            'doctorMcuName' => $doctorMcuName,
            'doctorMcuSip' => $doctorMcuSip,
            'doctorMcuSignatureBase64' => $doctorMcuSignatureBase64,
            'managerMcuName' => $managerMcuName,
            'managerMcuSignatureBase64' => $managerMcuSignatureBase64,
            'attachments' => $registration->resultAttachments->where('merge_into_mcu_pdf', true),
        ];
    }

    /**
     * Render the multi-sheet HTML view of the MCU Book.
     */
    public function renderHtml(Registration $registration, bool $autoPrint = false): string
    {
        $data = $this->prepareData($registration);
        $data['autoPrint'] = $autoPrint;

        return view('prints.mcu_book.book_wrapper', $data)->render();
    }

    /**
     * Generate complete consolidated MCU Book PDF with Browsershot + FPDI auto-merge.
     */
    public function generatePdf(Registration $registration): string
    {
        $data = $this->prepareData($registration);
        $data['autoPrint'] = false;
        $html = view('prints.mcu_book.book_wrapper', $data)->render();

        // 1. Generate base MCU Book PDF via Browsershot
        $browsershot = Browsershot::html($html)
            ->noSandbox()
            ->showBackground()
            ->paperSize(210, 297, 'mm')
            ->margins(8, 10, 8, 10, 'mm');

        $chromePath = $this->resolveChromePath();
        if ($chromePath) {
            $browsershot->setChromePath($chromePath);
        }

        $basePdfString = $browsershot->pdf();

        // 2. Check for uploaded tool PDFs to merge via FPDI
        $attachments = $registration->resultAttachments
            ->where('merge_into_mcu_pdf', true)
            ->filter(function (ResultAttachment $att) {
                return str_contains(strtolower($att->mime_type), 'pdf') || str_ends_with(strtolower($att->file_path), '.pdf');
            });

        if ($attachments->isEmpty()) {
            return $basePdfString;
        }

        return $this->mergeAttachmentsWithFpdi($basePdfString, $attachments);
    }

    /**
     * Merge base MCU book PDF with uploaded diagnostic tool PDFs using FPDI.
     */
    public function mergeAttachmentsWithFpdi(string $basePdfString, $attachments): string
    {
        $tempDir = storage_path('app/temp');
        if (! File::exists($tempDir)) {
            File::makeDirectory($tempDir, 0755, true);
        }

        $baseTempPath = $tempDir . '/base_' . uniqid() . '.pdf';
        File::put($baseTempPath, $basePdfString);

        try {
            $fpdi = new Fpdi();

            // Import all pages of the base MCU Book
            $basePageCount = $fpdi->setSourceFile($baseTempPath);
            for ($p = 1; $p <= $basePageCount; $p++) {
                $tpl = $fpdi->importPage($p);
                $size = $fpdi->getTemplateSize($tpl);
                $fpdi->AddPage($size['orientation'], [$size['width'], $size['height']]);
                $fpdi->useTemplate($tpl);
            }

            // Append each uploaded tool PDF
            foreach ($attachments as $att) {
                $attFullPath = $this->resolveDiskPath($att->file_path);
                if ($attFullPath && File::exists($attFullPath)) {
                    try {
                        $attPageCount = $fpdi->setSourceFile($attFullPath);
                        for ($p = 1; $p <= $attPageCount; $p++) {
                            $tpl = $fpdi->importPage($p);
                            $size = $fpdi->getTemplateSize($tpl);
                            $fpdi->AddPage($size['orientation'], [$size['width'], $size['height']]);
                            $fpdi->useTemplate($tpl);
                        }
                    } catch (\Throwable $e) {
                        // In case an attachment PDF has an unsupported compression/encryption, skip gracefully
                        logger()->warning("Could not merge PDF attachment [{$att->id}]: " . $e->getMessage());
                    }
                }
            }

            $mergedOutput = $fpdi->Output('S');
            File::delete($baseTempPath);

            return $mergedOutput;
        } catch (\Throwable $e) {
            logger()->error('FPDI Merge Failed: ' . $e->getMessage());
            if (File::exists($baseTempPath)) {
                File::delete($baseTempPath);
            }
            return $basePdfString;
        }
    }

    /**
     * Resolve absolute disk path of stored attachment.
     */
    protected function resolveDiskPath(?string $path): ?string
    {
        if (empty($path)) {
            return null;
        }

        if (File::exists(storage_path('app/public/' . $path))) {
            return storage_path('app/public/' . $path);
        }

        if (File::exists(storage_path('app/' . $path))) {
            return storage_path('app/' . $path);
        }

        if (File::exists(public_path($path))) {
            return public_path($path);
        }

        if (File::exists($path)) {
            return $path;
        }

        return null;
    }

    /**
     * Generate SVG QR Code.
     */
    public function generateQrCodeSvg(string $code): string
    {
        try {
            $generator = new QrCodeGenerator();
            return (string) $generator->size(70)->margin(0)->generate($code);
        } catch (\Throwable $e) {
            return '';
        }
    }

    /**
     * Convert storage or public file path to base64 Data URL.
     */
    public function resolveFileBase64(?string $path): ?string
    {
        if (empty($path)) {
            return null;
        }

        $fullPath = $this->resolveDiskPath($path);
        if ($fullPath && File::exists($fullPath)) {
            $mime = File::mimeType($fullPath);
            $content = File::get($fullPath);
            return 'data:' . $mime . ';base64,' . base64_encode($content);
        }

        return null;
    }

    /**
     * Resolve Chrome / Chromium executable path on local system.
     */
    public function resolveChromePath(): ?string
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
}
