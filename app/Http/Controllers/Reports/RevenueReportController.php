<?php

namespace App\Http\Controllers\Reports;

use App\Exports\Reports\RevenueReportExport;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Services\Reports\RevenueReportService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class RevenueReportController extends Controller
{
    public function __construct(
        protected RevenueReportService $revenueService
    ) {}

    /**
     * Display revenue report with KPI cards, recap, and detailed payments table.
     */
    public function index(Request $request): Response
    {
        if (! $request->user()->can('reports.revenue')) {
            abort(403, 'Anda tidak memiliki wewenang untuk mengakses laporan pendapatan.');
        }

        $reportData = $this->revenueService->getData($request->all());
        $companies = Company::where('is_active', true)->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Reports/Revenue', array_merge($reportData, [
            'companies' => $companies,
        ]));
    }

    /**
     * Export revenue report (details and recap) to Excel.
     */
    public function exportExcel(Request $request): BinaryFileResponse
    {
        if (! $request->user()->can('reports.revenue')) {
            abort(403, 'Anda tidak memiliki wewenang untuk mengekspor laporan pendapatan.');
        }

        $exportData = $this->revenueService->getExportData($request->all());
        $filename = 'Laporan_Pendapatan_' . now()->format('Ymd_His') . '.xlsx';

        return Excel::download(new RevenueReportExport($exportData), $filename);
    }
}
