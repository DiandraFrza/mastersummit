<?php

namespace App\Jobs;

use App\Models\McuEvent;
use App\Models\Registration;
use App\Services\Prints\GenerateMcuBookPdfService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use ZipArchive;

class GenerateBulkMcuBooksZipJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 600; // 10 minutes timeout for large corporate events

    public function __construct(
        public McuEvent $mcuEvent
    ) {}

    /**
     * Cache key helper for bulk zip status.
     */
    public static function getCacheKey(int $eventId): string
    {
        return "mcu_event_bulk_zip_{$eventId}";
    }

    /**
     * Execute the job.
     */
    public function handle(GenerateMcuBookPdfService $mcuBookService): void
    {
        $cacheKey = self::getCacheKey($this->mcuEvent->id);

        $registrations = Registration::query()
            ->where('mcu_event_id', $this->mcuEvent->id)
            ->where('workflow_status', '!=', 'void')
            ->whereNull('deleted_at')
            ->with(['patient', 'mcuReview', 'items.service', 'resultAttachments'])
            ->get();

        $total = $registrations->count();

        if ($total === 0) {
            Cache::put($cacheKey, [
                'status' => 'completed',
                'progress' => 100,
                'total' => 0,
                'processed' => 0,
                'message' => 'Tidak ada peserta MCU untuk diekspor.',
                'zip_filename' => null,
                'zip_path' => null,
            ], now()->addHours(24));
            return;
        }

        Cache::put($cacheKey, [
            'status' => 'processing',
            'progress' => 0,
            'total' => $total,
            'processed' => 0,
            'message' => "Mempersiapkan ekspor {$total} buku MCU...",
            'zip_filename' => null,
            'zip_path' => null,
        ], now()->addHours(24));

        $exportDir = storage_path('app/public/exports/mcu_bulk');
        if (! File::exists($exportDir)) {
            File::makeDirectory($exportDir, 0755, true);
        }

        $cleanEventName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $this->mcuEvent->event_code . '_' . $this->mcuEvent->event_name);
        $zipFilename = 'MCU_BOOKS_' . $cleanEventName . '_' . date('Ymd_His') . '.zip';
        $zipFullPath = $exportDir . '/' . $zipFilename;

        $zip = new ZipArchive();
        if ($zip->open($zipFullPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            Log::error("Failed to create ZIP archive: {$zipFullPath}");
            Cache::put($cacheKey, [
                'status' => 'failed',
                'progress' => 0,
                'total' => $total,
                'processed' => 0,
                'error' => 'Gagal membuat file ZIP di server.',
            ], now()->addHours(24));
            return;
        }

        $processed = 0;

        foreach ($registrations as $reg) {
            try {
                $pdfBinary = $mcuBookService->generatePdf($reg);

                $patientNameClean = preg_replace('/[^a-zA-Z0-9_-]/', '_', $reg->patient->name);
                $singlePdfName = $reg->reg_no . '_' . $patientNameClean . '.pdf';

                $zip->addFromString($singlePdfName, $pdfBinary);
            } catch (\Throwable $e) {
                Log::warning("Error generating MCU Book for reg [{$reg->reg_no}]: " . $e->getMessage());
            }

            $processed++;
            $progressPercent = (int) round(($processed / $total) * 100);

            Cache::put($cacheKey, [
                'status' => 'processing',
                'progress' => $progressPercent,
                'total' => $total,
                'processed' => $processed,
                'message' => "Memproses {$processed} dari {$total} buku MCU ({$progressPercent}%)...",
                'zip_filename' => null,
                'zip_path' => null,
            ], now()->addHours(24));
        }

        $zip->close();

        Cache::put($cacheKey, [
            'status' => 'completed',
            'progress' => 100,
            'total' => $total,
            'processed' => $processed,
            'message' => "Berhasil mengompilasi {$processed} berkas buku MCU ke dalam file ZIP.",
            'zip_filename' => $zipFilename,
            'zip_path' => 'exports/mcu_bulk/' . $zipFilename,
            'download_url' => route('events.bulk-zip.download', $this->mcuEvent->id),
            'completed_at' => now()->toISOString(),
        ], now()->addHours(24));
    }
}
