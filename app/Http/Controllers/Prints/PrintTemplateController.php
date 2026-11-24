<?php

namespace App\Http\Controllers\Prints;

use App\Http\Controllers\Controller;
use App\Models\Registration;
use App\Models\RegistrationItem;
use App\Services\Prints\GenerateMcuBookPdfService;
use App\Services\Prints\SinglePrintTemplateService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class PrintTemplateController extends Controller
{
    public function __construct(
        protected SinglePrintTemplateService $singlePrintService,
        protected GenerateMcuBookPdfService $mcuBookService
    ) {}

    /**
     * Display printable HTML view for a single examination result.
     */
    public function printSingle(Registration $registration, RegistrationItem $item, Request $request): Response
    {
        // Check that item belongs to registration
        if ($item->registration_id !== $registration->id) {
            abort(404, 'Item pemeriksaan tidak ditemukan pada registrasi ini.');
        }

        $autoPrint = $request->boolean('autoprint', false);
        $html = $this->singlePrintService->renderHtml($registration, $item, $autoPrint);

        return response($html, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
        ]);
    }

    /**
     * Stream or download PDF for a single examination result.
     */
    public function printSinglePdf(Registration $registration, RegistrationItem $item, Request $request): Response
    {
        if ($item->registration_id !== $registration->id) {
            abort(404, 'Item pemeriksaan tidak ditemukan pada registrasi ini.');
        }

        $pdfBinary = $this->singlePrintService->generatePdf($registration, $item);
        $filename = 'Hasil_' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $item->service_name_snapshot) . '_' . $registration->reg_no . '.pdf';

        return response($pdfBinary, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => ($request->boolean('download') ? 'attachment' : 'inline') . '; filename="' . $filename . '"',
        ]);
    }

    /**
     * Display printable HTML view of the complete MCU Book.
     */
    public function mcuBook(Registration $registration, Request $request): Response
    {
        $autoPrint = $request->boolean('autoprint', false);
        $html = $this->mcuBookService->renderHtml($registration, $autoPrint);

        return response($html, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
        ]);
    }

    /**
     * Stream or download the complete consolidated MCU Book PDF (with FPDI auto-merge).
     */
    public function mcuBookPdf(Registration $registration, Request $request): Response
    {
        $pdfBinary = $this->mcuBookService->generatePdf($registration);
        $filename = 'Buku_MCU_' . $registration->reg_no . '_' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $registration->patient->name) . '.pdf';

        return response($pdfBinary, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => ($request->boolean('download') ? 'attachment' : 'inline') . '; filename="' . $filename . '"',
        ]);
    }
}
