<?php

namespace App\Http\Controllers\Events;

use App\Exports\McuParticipantsTemplateExport;
use App\Http\Controllers\Controller;
use App\Models\McuEvent;
use App\Models\Package;
use App\Models\Patient;
use App\Models\Registration;
use App\Models\RegistrationItem;
use App\Services\Events\McuParticipantImportService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class McuParticipantController extends Controller
{
    /**
     * Display a listing of participants in the MCU Event.
     */
    public function index(Request $request, McuEvent $mcuEvent): Response
    {
        $allowedPerPage = [10, 20, 50, 100, 300, 500];
        $perPage = (int) $request->input('per_page', 20);
        if (! in_array($perPage, $allowedPerPage, true)) {
            $perPage = 20;
        }

        $sort = $request->input('sort', 'id');
        $direction = strtolower($request->input('direction', 'desc')) === 'asc' ? 'asc' : 'desc';
        $allowedSorts = ['id', 'reg_no', 'registered_at', 'workflow_status', 'created_at'];
        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'id';
        }

        $search = trim((string) $request->input('search', ''));
        $statusFilter = $request->input('status', 'all');

        $query = Registration::query()
            ->with(['patient', 'package', 'company', 'referrer'])
            ->where('mcu_event_id', $mcuEvent->id)
            ->where('workflow_status', '!=', 'void');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('reg_no', 'like', "%{$search}%")
                    ->orWhere('department_snapshot', 'like', "%{$search}%")
                    ->orWhereHas('patient', function ($pq) use ($search) {
                        $pq->where('name', 'like', "%{$search}%")
                            ->orWhere('nik', 'like', "%{$search}%")
                            ->orWhere('medical_record_no', 'like', "%{$search}%");
                    });
            });
        }

        if ($statusFilter === 'pending') {
            $query->where('workflow_status', 'pending');
        } elseif ($statusFilter === 'registered') {
            $query->where('workflow_status', '!=', 'pending');
        }

        $participants = $query->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString();

        // Packages available for this event
        $packages = Package::where('is_active', true)
            ->where(function ($q) use ($mcuEvent) {
                if ($mcuEvent->referrer_id) {
                    $q->where('referrer_id', $mcuEvent->referrer_id)
                      ->orWhereNull('referrer_id');
                }
            })
            ->orderBy('name')
            ->get(['id', 'name', 'total_price', 'discount_amount', 'final_price']);

        $mcuEvent->load(['company', 'referrer']);

        // Summary counts
        $totalCount = Registration::where('mcu_event_id', $mcuEvent->id)->where('workflow_status', '!=', 'void')->count();
        $registeredCount = Registration::where('mcu_event_id', $mcuEvent->id)->where('workflow_status', '!=', 'pending')->where('workflow_status', '!=', 'void')->count();
        $pendingCount = $totalCount - $registeredCount;

        return Inertia::render('Events/Participants/Index', [
            'mcuEvent' => $mcuEvent,
            'participants' => $participants,
            'packages' => $packages,
            'stats' => [
                'total' => $totalCount,
                'registered' => $registeredCount,
                'pending' => $pendingCount,
            ],
            'filters' => [
                'search' => $search,
                'status' => $statusFilter,
                'sort' => $sort,
                'direction' => $direction,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Store manually added participant into the MCU Event.
     */
    public function store(Request $request, McuEvent $mcuEvent): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'nik' => ['nullable', 'string', 'max:20'],
            'gender' => ['required', 'in:L,P'],
            'birth_date' => ['required', 'date'],
            'department' => ['nullable', 'string', 'max:255'],
            'package_id' => ['nullable', 'exists:packages,id'],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($validated, $mcuEvent, $request) {
            $patient = null;
            if (! empty($validated['nik'])) {
                $patient = Patient::where('nik', $validated['nik'])->first();
            }
            if (! $patient) {
                $patient = Patient::where('name', $validated['name'])
                    ->whereDate('birth_date', $validated['birth_date'])
                    ->first();
            }

            if (! $patient) {
                $patient = Patient::create([
                    'name' => $validated['name'],
                    'nik' => $validated['nik'] ?? null,
                    'gender' => $validated['gender'],
                    'birth_date' => $validated['birth_date'],
                    'default_department' => $validated['department'] ?? null,
                    'default_company_id' => $mcuEvent->company_id,
                    'phone' => $validated['phone'] ?? null,
                    'address' => $validated['address'] ?? null,
                    'created_by' => $request->user()->id,
                    'updated_by' => $request->user()->id,
                ]);
            }

            Registration::create([
                'patient_id' => $patient->id,
                'mcu_event_id' => $mcuEvent->id,
                'company_id' => $mcuEvent->company_id,
                'referrer_id' => $mcuEvent->referrer_id,
                'package_id' => $validated['package_id'] ?? null,
                'department_snapshot' => $validated['department'] ?? $patient->default_department,
                'service_type' => 'mcu',
                'payer_type' => 'corporate',
                'workflow_status' => 'pending',
                'payment_status' => 'corporate_billed',
                'reg_no' => null,
                'registered_at' => null,
                'created_by' => $request->user()->id,
                'updated_by' => $request->user()->id,
            ]);
        });

        return back()->with('success', 'Peserta MCU berhasil ditambahkan.');
    }

    /**
     * Update participant demographics.
     */
    public function update(Request $request, McuEvent $mcuEvent, Registration $registration): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'nik' => ['nullable', 'string', 'max:20'],
            'gender' => ['required', 'in:L,P'],
            'birth_date' => ['required', 'date'],
            'department' => ['nullable', 'string', 'max:255'],
            'package_id' => ['nullable', 'exists:packages,id'],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($validated, $registration, $request) {
            $patient = $registration->patient;
            if ($patient) {
                $patient->update([
                    'name' => $validated['name'],
                    'nik' => $validated['nik'] ?? null,
                    'gender' => $validated['gender'],
                    'birth_date' => $validated['birth_date'],
                    'phone' => $validated['phone'] ?? $patient->phone,
                    'address' => $validated['address'] ?? $patient->address,
                    'updated_by' => $request->user()->id,
                ]);
            }

            $registration->update([
                'package_id' => $validated['package_id'] ?? $registration->package_id,
                'department_snapshot' => $validated['department'] ?? $registration->department_snapshot,
                'updated_by' => $request->user()->id,
            ]);
        });

        return back()->with('success', 'Biodata peserta berhasil diperbarui.');
    }

    /**
     * Soft delete participant from MCU Event.
     */
    public function destroy(McuEvent $mcuEvent, Registration $registration): RedirectResponse
    {
        if ($registration->examinationResults()->exists()) {
            return back()->with('error', 'Peserta tidak dapat dihapus karena sudah memiliki hasil pemeriksaan.');
        }

        $registration->items()->delete();
        $registration->delete();

        return back()->with('success', 'Peserta berhasil dihapus dari event MCU.');
    }

    /**
     * Download template Excel or CSV for MCU Participants.
     */
    public function template(McuEvent $mcuEvent)
    {
        if (class_exists(\Maatwebsite\Excel\Facades\Excel::class)) {
            $filename = "template-peserta-mcu-{$mcuEvent->event_code}.xlsx";
            return \Maatwebsite\Excel\Facades\Excel::download(new McuParticipantsTemplateExport($mcuEvent), $filename);
        }

        // Native CSV download fallback
        $filename = "template-peserta-mcu-{$mcuEvent->event_code}.csv";
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $packages = Package::where('is_active', true)
            ->where(function ($q) use ($mcuEvent) {
                if ($mcuEvent->referrer_id) {
                    $q->where('referrer_id', $mcuEvent->referrer_id)->orWhereNull('referrer_id');
                }
            })
            ->pluck('name')
            ->toArray();

        $defaultPackage = ! empty($packages) ? $packages[0] : 'Paket Standar MCU';
        $secondPackage = count($packages) > 1 ? $packages[1] : $defaultPackage;

        $callback = function () use ($defaultPackage, $secondPackage) {
            $file = fopen('php://output', 'w');
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            fputcsv($file, [
                'NIK',
                'Nama Lengkap',
                'Jenis Kelamin (L/P)',
                'Tanggal Lahir (YYYY-MM-DD)',
                'Bagian / Departemen',
                'Paket MCU',
                'No. Telepon',
                'Alamat',
            ]);
            fputcsv($file, [
                '3271011505900001',
                'Ahmad Fauzi',
                'L',
                '1990-05-15',
                'Operasional',
                $defaultPackage,
                '081234567890',
                'Jl. Sudirman No. 45, Jakarta',
            ]);
            fputcsv($file, [
                '3271012208920002',
                'Siti Rahmawati',
                'P',
                '1992-08-22',
                'Keuangan',
                $secondPackage,
                '081398765432',
                'Jl. Thamrin No. 12, Jakarta',
            ]);
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Import participants from uploaded Excel file.
     */
    public function importExcel(
        Request $request,
        McuEvent $mcuEvent,
        McuParticipantImportService $importer
    ): RedirectResponse {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:10240'],
        ], [
            'file.required' => 'Pilih file Excel yang akan diunggah.',
            'file.mimes' => 'Format file harus berupa .xlsx, .xls, atau .csv.',
            'file.max' => 'Ukuran file maksimal 10MB.',
        ]);

        $log = $importer->import($request->file('file'), $mcuEvent, $request->user());

        if ($log->failed_rows > 0 && $log->success_rows === 0) {
            return back()->with('error', "Gagal mengimpor peserta. {$log->failed_rows} baris bermasalah.");
        }

        return back()->with('success', "Berhasil mengimpor {$log->success_rows} peserta MCU.");
    }

    /**
     * Execute check-in / "Daftar" with Webcam photo, package override, reg_no generation & item unpacking.
     */
    public function checkIn(Request $request, McuEvent $mcuEvent, Registration $registration): RedirectResponse
    {
        $validated = $request->validate([
            'package_id' => ['required', 'exists:packages,id'],
            'registered_at' => ['required', 'date'],
            'photo' => ['nullable'],
        ]);

        DB::transaction(function () use ($validated, $registration, $request) {
            $patient = $registration->patient;

            // Handle webcam photo (base64 or file upload)
            if (! empty($validated['photo'])) {
                $photo = $validated['photo'];

                if (is_string($photo) && str_starts_with($photo, 'data:image')) {
                    // Extract base64
                    @list($type, $photoData) = explode(';', $photo);
                    @list(, $photoData) = explode(',', $photoData);

                    if ($photoData) {
                        $binary = base64_decode($photoData);
                        $filename = "patient_{$patient->id}_" . time() . '.jpg';
                        $path = "patients/photos/{$filename}";
                        Storage::disk('public')->put($path, $binary);

                        $patient->photo_path = $path;
                        $patient->save();
                    }
                } elseif ($request->hasFile('photo')) {
                    $path = $request->file('photo')->store('patients/photos', 'public');
                    $patient->photo_path = $path;
                    $patient->save();
                }
            }

            // Resolve selected package with services and items
            $package = Package::with(['packageItems.service.sample'])->findOrFail($validated['package_id']);

            $regNo = $registration->reg_no ?: Registration::generateNextRegNo();
            $age = $patient->birth_date ? Carbon::parse($patient->birth_date)->age : null;
            $registeredAt = Carbon::parse($validated['registered_at'])->setTimeFrom(now());

            $registration->update([
                'reg_no' => $regNo,
                'registered_at' => $registeredAt,
                'package_id' => $package->id,
                'age_years_snapshot' => $age,
                'workflow_status' => 'registered',
                'total_amount' => $package->total_price,
                'discount_amount' => $package->discount_amount,
                'grand_total' => $package->final_price,
                'paid_amount' => 0,
                'remaining_amount' => $package->final_price,
                'payment_status' => 'corporate_billed',
                'updated_by' => $request->user()->id,
            ]);

            // Unpack package items into registration_items
            $registration->items()->delete();

            foreach ($package->packageItems as $pkgItem) {
                $service = $pkgItem->service;
                if (! $service) continue;

                $priceSnapshot = (float) ($pkgItem->item_price_override ?? $service->base_price);

                RegistrationItem::create([
                    'registration_id' => $registration->id,
                    'service_id' => $service->id,
                    'service_name_snapshot' => $service->name,
                    'category' => $service->category,
                    'sample_id' => $service->sample_id,
                    'price_snapshot' => $priceSnapshot,
                    'discount_amount' => 0,
                    'final_price' => $priceSnapshot,
                    'is_from_package' => true,
                    'billed_to' => 'corporate',
                    'sample_status' => 'pending',
                    'result_status' => 'pending',
                ]);
            }
        });

        return back()->with('success', "Peserta {$registration->patient->name} berhasil didaftarkan ({$registration->reg_no}).");
    }
}
