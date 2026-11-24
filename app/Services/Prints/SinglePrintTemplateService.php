<?php

namespace App\Services\Prints;

use App\Models\ClinicSetting;
use App\Models\Registration;
use App\Models\RegistrationItem;
use Illuminate\Support\Facades\File;
use SimpleSoftwareIO\QrCode\Generator as QrCodeGenerator;
use Spatie\Browsershot\Browsershot;

class SinglePrintTemplateService
{
    /**
     * Map print_template enum to corresponding Blade template.
     */
    public const TEMPLATE_VIEW_MAP = [
        'standard_lab' => 'prints.templates.standard_lab',
        'antigen' => 'prints.templates.antigen',
        'pcr' => 'prints.templates.pcr',
        'narkoba' => 'prints.templates.narkoba',
        'radiology' => 'prints.templates.radiology',
        'electromedical' => 'prints.templates.electromedical',
        'physical' => 'prints.templates.physical',
    ];

    /**
     * Prepare complete data payload for single examination print.
     */
    public function prepareData(Registration $registration, RegistrationItem $item): array
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
        ]);

        $item->loadMissing([
            'service.sample',
            'examinationResults.parameter',
            'sampleTakenBy',
            'resultEnteredBy',
        ]);

        $clinic = ClinicSetting::current();

        // Group results by parameter group_name
        $groupedResults = $item->examinationResults
            ->sortBy('parameter.sort_order')
            ->groupBy(fn ($r) => $r->parameter?->group_name ?: 'General')
            ->map(function ($results) {
                return $results->map(function ($r) {
                    return [
                        'id' => $r->id,
                        'parameter_label' => $r->parameter?->label ?? 'Parameter',
                        'parameter_code' => $r->parameter?->code ?? '',
                        'value_numeric' => $r->value_numeric,
                        'value_text' => $r->value_text,
                        'value_json' => $r->value_json,
                        'unit_snapshot' => $r->unit_snapshot,
                        'reference_snapshot' => $r->reference_snapshot,
                        'flag_status' => $r->flag_status ?? 'normal',
                        'auto_conclusion' => $r->auto_conclusion,
                        'auto_suggestion' => $r->auto_suggestion,
                    ];
                });
            });

        // Doctor & Examiner assignment based on MCU event or fallback
        $doctorName = null;
        $doctorSip = null;
        $doctorSignatureBase64 = null;
        $examinerName = null;
        $examinerSignatureBase64 = null;

        $mcuEvent = $registration->mcuEvent;
        $cat = $item->category ?? $item->service?->category;

        if ($mcuEvent) {
            $assignedDoc = match ($cat) {
                'radiology' => $mcuEvent->doctorRadiology,
                'electromedical' => $mcuEvent->doctorElectromedical ?? $mcuEvent->doctorEkg ?? $mcuEvent->doctorAudiometry,
                'physical' => $mcuEvent->doctorAnamnese,
                default => $mcuEvent->doctorLab ?? $mcuEvent->picMcu,
            };

            if ($assignedDoc) {
                $doctorName = $assignedDoc->name;
                $doctorSip = $assignedDoc->sip;
                $doctorSignatureBase64 = $this->resolveFileBase64($assignedDoc->signature_path);
            }
        }

        // Examiner (petugas analis / pelaksana)
        if ($item->resultEnteredBy) {
            $examinerName = $item->resultEnteredBy->name;
        } elseif ($item->sampleTakenBy) {
            $examinerName = $item->sampleTakenBy->name;
        }

        // Barcode / QR Code for document validation
        $barcodeSvg = $this->generateQrCodeSvg($registration->reg_no);

        // Logo & Watermark base64
        $logoBase64 = $this->resolveFileBase64($clinic->logo_path);
        $watermarkBase64 = $this->resolveFileBase64($clinic->watermark_path);

        return [
            'registration' => $registration,
            'patient' => $registration->patient,
            'item' => $item,
            'service' => $item->service,
            'examinationResults' => $item->examinationResults,
            'groupedResults' => $groupedResults,
            'clinic' => $clinic,
            'logoBase64' => $logoBase64,
            'watermarkBase64' => $watermarkBase64,
            'watermarkOpacity' => $clinic->watermark_opacity ?? 0.08,
            'barcodeSvg' => $barcodeSvg,
            'doctorName' => $doctorName,
            'doctorSip' => $doctorSip,
            'doctorSignatureBase64' => $doctorSignatureBase64,
            'examinerName' => $examinerName,
            'examinerSignatureBase64' => $examinerSignatureBase64,
            'printedDate' => now()->translatedFormat('d F Y'),
        ];
    }

    /**
     * Resolve the Blade view name for an item.
     */
    public function resolveViewName(RegistrationItem $item): string
    {
        $template = $item->service?->print_template ?? 'standard_lab';
        return self::TEMPLATE_VIEW_MAP[$template] ?? 'prints.templates.standard_lab';
    }

    /**
     * Render HTML view for single examination result.
     */
    public function renderHtml(Registration $registration, RegistrationItem $item, bool $autoPrint = false): string
    {
        $data = $this->prepareData($registration, $item);
        $data['autoPrint'] = $autoPrint;
        $viewName = $this->resolveViewName($item);

        return view($viewName, $data)->render();
    }

    /**
     * Generate Browsershot PDF binary string for single examination result.
     */
    public function generatePdf(Registration $registration, RegistrationItem $item): string
    {
        $data = $this->prepareData($registration, $item);
        $data['autoPrint'] = false;
        $viewName = $this->resolveViewName($item);
        $html = view($viewName, $data)->render();

        $browsershot = Browsershot::html($html)
            ->noSandbox()
            ->showBackground()
            ->paperSize(210, 297, 'mm')
            ->margins(8, 10, 8, 10, 'mm');

        $chromePath = $this->resolveChromePath();
        if ($chromePath) {
            $browsershot->setChromePath($chromePath);
        }

        return $browsershot->pdf();
    }

    /**
     * Generate SVG QR Code for verification.
     */
    public function generateQrCodeSvg(string $code): string
    {
        try {
            $generator = new QrCodeGenerator();
            return (string) $generator->size(68)->margin(0)->generate($code);
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
