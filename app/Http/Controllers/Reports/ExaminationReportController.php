<?php

namespace App\Http\Controllers\Reports;

use App\Exports\Reports\ExaminationReportExport;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Service;
use App\Services\Reports\ExaminationReportService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ExaminationReportController extends Controller
{
    public function __construct(
        protected ExaminationReportService $examinationService
    ) {}

    /**
     * Display examination report with KPI cards, volume recap, and detailed items table.
     */
    public function index(Request $request): Response
    {
        if (! $request->user()->can('reports.examinations')) {
            abort(403, 'Anda tidak memiliki wewenang untuk mengakses laporan pemeriksaan.');
        }

        $reportData = $this->examinationService->getData($request->all());
        $companies = Company::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $services = Service::where('is_active', true)->orderBy('name')->get(['id', 'name', 'category', 'code']);

        return Inertia::render('Reports/Examinations', array_merge($reportData, [
            'companies' => $companies,
            'services' => $services,
        ]));
    }

    /**
     * Export examination report (details and volume recap) to Excel.
     */
    public function exportExcel(Request $request): BinaryFileResponse
    {
        if (! $request->user()->can('reports.examinations')) {
            abort(403, 'Anda tidak memiliki wewenang untuk mengekspor laporan pemeriksaan.');
        }

        $exportData = $this->examinationService->getExportData($request->all());
        $filename = 'Laporan_Pemeriksaan_' . now()->format('Ymd_His') . '.xlsx';

        return Excel::download(new ExaminationReportExport($exportData), $filename);
    }
}
