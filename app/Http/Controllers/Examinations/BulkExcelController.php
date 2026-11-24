<?php

namespace App\Http\Controllers\Examinations;

use App\Exports\McuEventResultsTemplateExport;
use App\Http\Controllers\Controller;
use App\Models\ExcelImportLog;
use App\Models\McuEvent;
use App\Services\Examinations\BulkExcelImportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class BulkExcelController extends Controller
{
    /**
     * Display Bulk Excel Import & Export Center for an MCU Event.
     */
    public function index(McuEvent $mcuEvent): Response
    {
        $mcuEvent->load([
            'company',
            'referrer',
            'picMcu',
            'doctorLab',
            'doctorAudiometry',
        ]);

        $registrations = $mcuEvent->registrations()
            ->with(['patient', 'items'])
            ->where('workflow_status', '!=', 'void')
            ->get();

        $kpi = [
            'total' => $registrations->count(),
            'registered' => $registrations->where('workflow_status', 'registered')->count(),
            'in_progress' => $registrations->where('workflow_status', 'in_progress')->count(),
            'result_entered' => $registrations->whereIn('workflow_status', ['result_entered', 'doctor_reviewed', 'manager_approved'])->count(),
            'completed' => $registrations->where('workflow_status', 'completed')->count(),
        ];

        $importLogs = $mcuEvent->excelImportLogs()
            ->with('uploader')
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Examinations/Bulk', [
            'mcuEvent' => $mcuEvent,
            'kpi' => $kpi,
            'importLogs' => $importLogs,
        ]);
    }

    /**
     * Download pre-filled Excel template for specific category (lab, audiometry, physical).
     */
    public function template(Request $request, McuEvent $mcuEvent): BinaryFileResponse
    {
        $category = (string) $request->input('category', 'lab');
        if (! in_array($category, ['lab', 'audiometry', 'physical'], true)) {
            $category = 'lab';
        }

        $filename = "Template_Hasil_{$category}_{$mcuEvent->event_code}.xlsx";

        return Excel::download(new McuEventResultsTemplateExport($mcuEvent, $category), $filename);
    }

    /**
     * Upload and chunk-process Excel file for bulk examination results.
     */
    public function import(
        Request $request,
        McuEvent $mcuEvent,
        BulkExcelImportService $importService
    ): RedirectResponse {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:20480'],
            'import_type' => ['required', 'in:lab_results,audiometry,physical'],
        ], [
            'file.required' => 'Silakan pilih berkas Excel (.xlsx / .xls) untuk diunggah.',
            'file.mimes' => 'Format berkas harus berupa Excel (.xlsx, .xls) atau CSV.',
            'file.max' => 'Ukuran berkas tidak boleh melebihi 20MB.',
            'import_type.required' => 'Pilih jenis hasil pemeriksaan yang diimpor.',
        ]);

        $file = $request->file('file');
        $importType = $request->input('import_type');

        $log = $importService->import($file, $mcuEvent, $importType, $request->user());

        if ($log->failed_rows > 0) {
            $msg = "Import selesai dengan catatan: {$log->success_rows} berhasil, {$log->failed_rows} gagal dari total {$log->total_rows} baris.";
            return redirect()->back()->with('warning', $msg);
        }

        $msg = "Berhasil mengimpor {$log->success_rows} baris hasil pemeriksaan secara massal!";
        return redirect()->back()->with('success', $msg);
    }
}
