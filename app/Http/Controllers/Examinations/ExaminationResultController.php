<?php

namespace App\Http\Controllers\Examinations;

use App\Http\Controllers\Controller;
use App\Http\Requests\Examinations\SaveExaminationResultsRequest;
use App\Http\Requests\Examinations\UploadResultAttachmentRequest;
use App\Models\Company;
use App\Models\ExaminationResult;
use App\Models\Registration;
use App\Models\RegistrationItem;
use App\Models\ResultAttachment;
use App\Models\ServiceParameter;
use App\Services\Examinations\EvaluateLabRulesService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ExaminationResultController extends Controller
{
    /**
     * Display work queue for examination results input.
     */
    public function index(Request $request): Response
    {
        $category = $request->input('category', 'all');
        $status = $request->input('status', 'all');
        $companyId = $request->input('company_id', 'all');
        $date = $request->input('date', '');
        $search = trim((string) $request->input('search', ''));

        $allowedPerPage = [10, 20, 50, 100, 300, 500];
        $perPage = (int) $request->input('per_page', 20);
        if (! in_array($perPage, $allowedPerPage, true)) {
            $perPage = 20;
        }

        $query = Registration::query()
            ->with([
                'patient',
                'company',
                'package',
                'items.service',
                'items.sample',
            ])
            ->where('workflow_status', '!=', 'void')
            ->whereNull('deleted_at');

        if (! empty($date)) {
            $query->whereDate('registered_at', $date);
        }

        if ($companyId !== 'all' && is_numeric($companyId)) {
            $query->where('company_id', (int) $companyId);
        }

        if ($status !== 'all') {
            $query->where('workflow_status', $status);
        }

        if ($category !== 'all' && in_array($category, ['lab', 'radiology', 'electromedical', 'physical'], true)) {
            $query->whereHas('items', function ($iq) use ($category) {
                $iq->where('category', $category);
            });
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('reg_no', 'like', "%{$search}%")
                    ->orWhereHas('patient', function ($pq) use ($search) {
                        $pq->where('name', 'like', "%{$search}%")
                            ->orWhere('medical_record_no', 'like', "%{$search}%")
                            ->orWhere('nik', 'like', "%{$search}%");
                    });
            });
        }

        $registrations = $query
            ->orderByRaw("CASE WHEN workflow_status = 'in_progress' THEN 0 WHEN workflow_status = 'result_entered' THEN 1 ELSE 2 END")
            ->orderBy('registered_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        $companies = Company::where('is_active', true)->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Examinations/Index', [
            'registrations' => $registrations,
            'companies' => $companies,
            'filters' => [
                'category' => $category,
                'status' => $status,
                'company_id' => $companyId,
                'date' => $date,
                'search' => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Display dynamic parameter result entry screen grouped by category tabs.
     */
    public function entry(Registration $registration, Request $request): Response
    {
        $registration->load([
            'patient',
            'company',
            'package',
            'items' => function ($q) {
                $q->with([
                    'service.parameters' => function ($pq) {
                        $pq->where('is_active', true)
                            ->with([
                                'referenceRanges' => fn ($rq) => $rq->where('is_active', true),
                                'autoRules' => fn ($aq) => $aq->where('is_active', true)->orderBy('priority', 'desc'),
                            ])
                            ->orderBy('sort_order');
                    },
                    'service.sample',
                    'examinationResults.parameter',
                ]);
            },
            'resultAttachments.uploader',
        ]);

        // Group items by category: lab, radiology, electromedical, physical
        $categoriesAvailable = $registration->items->pluck('category')->unique()->values()->all();

        $currentCategory = $request->input('category');
        if (! $currentCategory || ! in_array($currentCategory, $categoriesAvailable, true)) {
            $currentCategory = $categoriesAvailable[0] ?? 'lab';
        }

        return Inertia::render('Examinations/Entry', [
            'registration' => $registration,
            'currentCategory' => $currentCategory,
            'categoriesAvailable' => $categoriesAvailable,
        ]);
    }

    /**
     * Save dynamic results for a registration item and evaluate rules.
     */
    public function save(SaveExaminationResultsRequest $request, Registration $registration): RedirectResponse
    {
        $userId = $request->user()->id;
        $now = now();
        $payload = $request->validated();

        DB::transaction(function () use ($payload, $registration, $userId, $now) {
            $affectedItemIds = [];

            foreach ($payload['results'] as $res) {
                $itemId = $res['registration_item_id'];
                $paramId = $res['parameter_id'];

                $numericVal = isset($res['value_numeric']) && is_numeric($res['value_numeric'])
                    ? (float) $res['value_numeric']
                    : null;

                ExaminationResult::updateOrCreate(
                    [
                        'registration_item_id' => $itemId,
                        'parameter_id' => $paramId,
                    ],
                    [
                        'registration_id' => $registration->id,
                        'value_numeric' => $numericVal,
                        'value_text' => $res['value_text'] ?? null,
                        'value_json' => $res['value_json'] ?? null,
                        'unit_snapshot' => $res['unit_snapshot'] ?? null,
                        'reference_snapshot' => $res['reference_snapshot'] ?? null,
                        'flag_status' => $res['flag_status'] ?? 'normal',
                        'auto_conclusion' => $res['auto_conclusion'] ?? null,
                        'auto_suggestion' => $res['auto_suggestion'] ?? null,
                        'is_manually_overridden' => (bool) ($res['is_manually_overridden'] ?? false),
                        'input_source' => 'web_single',
                        'updated_by' => $userId,
                    ]
                );

                $affectedItemIds[$itemId] = true;
            }

            // Update registration items result_status to entered
            foreach (array_keys($affectedItemIds) as $itemId) {
                $item = RegistrationItem::find($itemId);
                if ($item) {
                    $itemUpdate = [
                        'result_status' => 'entered',
                        'result_entered_at' => $now,
                        'result_entered_by' => $userId,
                    ];
                    if (! empty($payload['group_conclusion'])) {
                        $itemUpdate['group_conclusion'] = $payload['group_conclusion'];
                    }
                    if (! empty($payload['group_suggestion'])) {
                        $itemUpdate['group_suggestion'] = $payload['group_suggestion'];
                    }
                    $item->update($itemUpdate);
                }
            }

            // Check if all registration items now have results entered
            $allItemsCount = $registration->items()->count();
            $enteredCount = $registration->items()
                ->whereIn('result_status', ['entered', 'verified'])
                ->count();

            if ($allItemsCount > 0 && $enteredCount >= $allItemsCount) {
                if ($registration->workflow_status === 'in_progress' || $registration->workflow_status === 'registered') {
                    $registration->update(['workflow_status' => 'result_entered']);
                }
            }
        });

        return redirect()->back()->with('success', 'Hasil pemeriksaan penunjang berhasil disimpan.');
    }

    /**
     * AJAX endpoint to evaluate reference range and auto rules in real time.
     */
    public function evaluate(Request $request, EvaluateLabRulesService $evaluator): JsonResponse
    {
        $parameterId = (int) $request->input('parameter_id');
        $parameter = ServiceParameter::findOrFail($parameterId);

        $gender = (string) $request->input('gender', 'L');
        $ageYears = $request->input('age_years') ? (int) $request->input('age_years') : null;
        $value = $request->input('value');

        $result = $evaluator->evaluate($parameter, $gender, $ageYears, $value);

        return response()->json($result);
    }

    /**
     * Upload offline diagnostic machine result attachment (EKG, Spiro, Rontgen PDF/JPG).
     */
    public function uploadAttachment(UploadResultAttachmentRequest $request, Registration $registration): RedirectResponse
    {
        $file = $request->file('file');
        $attachmentType = $request->input('attachment_type', 'other');
        $itemId = $request->input('registration_item_id');

        $directory = "attachments/{$registration->id}";
        $path = $file->store($directory, 'public');

        ResultAttachment::create([
            'registration_id' => $registration->id,
            'registration_item_id' => $itemId,
            'attachment_type' => $attachmentType,
            'file_path' => $path,
            'original_filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType() ?: 'application/octet-stream',
            'file_size' => $file->getSize(),
            'merge_into_mcu_pdf' => (bool) $request->input('merge_into_mcu_pdf', true),
            'uploaded_by' => $request->user()->id,
        ]);

        return redirect()->back()->with('success', "Lampiran berkas {$file->getClientOriginalName()} berhasil diunggah.");
    }

    /**
     * Delete result attachment.
     */
    public function deleteAttachment(ResultAttachment $attachment): RedirectResponse
    {
        if (Storage::disk('public')->exists($attachment->file_path)) {
            Storage::disk('public')->delete($attachment->file_path);
        }

        $attachment->delete();

        return redirect()->back()->with('success', 'Lampiran berkas berhasil dihapus.');
    }
}
