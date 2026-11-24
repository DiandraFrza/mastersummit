<?php

namespace App\Http\Controllers\Events;

use App\Http\Controllers\Controller;
use App\Jobs\GenerateBulkMcuBooksZipJob;
use App\Models\McuEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class BulkMcuPrintController extends Controller
{
    /**
     * Dispatch queue job to export all MCU Books for an event as a ZIP.
     */
    public function dispatchBulkZip(McuEvent $mcuEvent, Request $request): JsonResponse
    {
        $cacheKey = GenerateBulkMcuBooksZipJob::getCacheKey($mcuEvent->id);

        // Check if an existing export is already in progress
        $currentStatus = Cache::get($cacheKey);
        if ($currentStatus && ($currentStatus['status'] ?? '') === 'processing') {
            return response()->json([
                'status' => 'processing',
                'message' => 'Proses pembuatan file ZIP sedang berjalan...',
                'data' => $currentStatus,
            ]);
        }

        // Dispatch background queue job
        GenerateBulkMcuBooksZipJob::dispatch($mcuEvent);

        return response()->json([
            'status' => 'dispatched',
            'message' => 'Proses ekspor massal Buku MCU berhasil dijadwalkan ke antrean (Queue).',
            'data' => [
                'event_id' => $mcuEvent->id,
                'event_code' => $mcuEvent->event_code,
                'status' => 'processing',
                'progress' => 0,
            ],
        ]);
    }

    /**
     * Poll / check status of bulk MCU ZIP export job.
     */
    public function checkBulkZipStatus(McuEvent $mcuEvent): JsonResponse
    {
        $cacheKey = GenerateBulkMcuBooksZipJob::getCacheKey($mcuEvent->id);
        $status = Cache::get($cacheKey, [
            'status' => 'idle',
            'progress' => 0,
            'message' => 'Belum ada permintaan ekspor ZIP.',
        ]);

        return response()->json($status);
    }

    /**
     * Download the compiled ZIP file.
     */
    public function downloadBulkZip(McuEvent $mcuEvent): BinaryFileResponse
    {
        $cacheKey = GenerateBulkMcuBooksZipJob::getCacheKey($mcuEvent->id);
        $status = Cache::get($cacheKey);

        if (! $status || empty($status['zip_path'])) {
            // Check if file exists on disk directly
            $exportDir = storage_path('app/public/exports/mcu_bulk');
            $files = File::glob($exportDir . '/MCU_BOOKS_' . $mcuEvent->event_code . '_*.zip');
            if (! empty($files)) {
                $latestFile = end($files);
                return response()->download($latestFile);
            }

            abort(404, 'File ZIP belum dibuat atau sudah kedaluwarsa.');
        }

        $fullPath = storage_path('app/public/' . $status['zip_path']);
        if (! File::exists($fullPath)) {
            abort(404, 'File ZIP tidak ditemukan di penyimpanan server.');
        }

        return response()->download($fullPath, $status['zip_filename'] ?? basename($fullPath));
    }
}
