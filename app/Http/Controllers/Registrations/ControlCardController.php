<?php

namespace App\Http\Controllers\Registrations;

use App\Http\Controllers\Controller;
use App\Models\Registration;
use App\Services\Prints\ControlCardService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ControlCardController extends Controller
{
    /**
     * Display printable HTML view of the Control Card.
     */
    public function show(Request $request, Registration $registration, ControlCardService $service): Response
    {
        $paperSize = $request->query('size');
        $autoPrint = $request->boolean('print', false);

        $html = $service->renderHtml($registration, $paperSize, $autoPrint);

        return response($html, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
        ]);
    }

    /**
     * Download or stream direct PDF of the Control Card.
     */
    public function pdf(Request $request, Registration $registration, ControlCardService $service): Response
    {
        $paperSize = $request->query('size');

        $pdfBinary = $service->generatePdf($registration, $paperSize);

        $filename = "kartu-kontrol-{$registration->reg_no}.pdf";

        return response($pdfBinary, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "inline; filename=\"{$filename}\"",
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
        ]);
    }
}
