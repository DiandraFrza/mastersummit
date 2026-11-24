<?php

namespace App\Http\Controllers\Audit;

use App\Http\Controllers\Controller;
use App\Services\Audit\AuditLogService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function __construct(
        protected AuditLogService $auditService
    ) {}

    /**
     * Display audit trail log index with filterable activity table and diff modal.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        if (! $user->hasRole('Super Admin') && ! $user->can('audit_logs.view')) {
            abort(403, 'Akses terbatas untuk Super Admin atau pemegang wewenang Audit Trail.');
        }

        $data = $this->auditService->getData($request->all());

        return Inertia::render('Audit/Index', $data);
    }
}
