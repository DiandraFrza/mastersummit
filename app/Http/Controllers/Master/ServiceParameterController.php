<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\StoreAutoRuleRequest;
use App\Http\Requests\Master\StoreReferenceRangeRequest;
use App\Http\Requests\Master\StoreServiceParameterRequest;
use App\Http\Requests\Master\UpdateServiceParameterRequest;
use App\Models\ParameterAutoRule;
use App\Models\ParameterReferenceRange;
use App\Models\Service;
use App\Models\ServiceParameter;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ServiceParameterController extends Controller
{
    /**
     * Display parameter builder for a specific service.
     */
    public function index(Service $service): Response
    {
        $service->load('sample');

        $parameters = $service->parameters()
            ->with([
                'referenceRanges' => fn ($q) => $q->orderBy('gender')->orderBy('min_age_years'),
                'autoRules' => fn ($q) => $q->orderBy('priority')->orderBy('id'),
            ])
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return Inertia::render('Services/Parameters', [
            'service' => $service,
            'parameters' => $parameters,
        ]);
    }

    /**
     * Store a newly created parameter for the service.
     */
    public function store(StoreServiceParameterRequest $request, Service $service): RedirectResponse
    {
        $validated = $request->validated();
        $validated['service_id'] = $service->id;
        $validated['is_active'] = $request->boolean('is_active', true);
        $validated['is_required'] = $request->boolean('is_required', false);

        if (empty($validated['sort_order'])) {
            $maxSort = $service->parameters()->max('sort_order') ?? 0;
            $validated['sort_order'] = $maxSort + 1;
        }

        $service->parameters()->create($validated);

        return redirect()->back()->with('success', "Parameter '{$validated['label']}' berhasil ditambahkan.");
    }

    /**
     * Update the specified parameter.
     */
    public function update(
        UpdateServiceParameterRequest $request,
        Service $service,
        ServiceParameter $parameter
    ): RedirectResponse {
        if ($parameter->service_id !== $service->id) {
            abort(404);
        }

        $validated = $request->validated();
        $validated['is_active'] = $request->boolean('is_active', true);
        $validated['is_required'] = $request->boolean('is_required', false);

        $parameter->update($validated);

        return redirect()->back()->with('success', "Parameter '{$parameter->label}' berhasil diperbarui.");
    }

    /**
     * Toggle parameter active status.
     */
    public function toggleStatus(Service $service, ServiceParameter $parameter): RedirectResponse
    {
        if ($parameter->service_id !== $service->id) {
            abort(404);
        }

        $parameter->update([
            'is_active' => ! $parameter->is_active,
        ]);

        $status = $parameter->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return redirect()->back()->with('success', "Parameter '{$parameter->label}' berhasil {$status}.");
    }

    /**
     * Delete the specified parameter.
     */
    public function destroy(Service $service, ServiceParameter $parameter): RedirectResponse
    {
        if ($parameter->service_id !== $service->id) {
            abort(404);
        }

        $label = $parameter->label;
        $parameter->delete();

        return redirect()->back()->with('success', "Parameter '{$label}' berhasil dihapus.");
    }

    // ==========================================
    // Reference Range Sub-Resource Actions
    // ==========================================

    /**
     * Store a reference range for the parameter.
     */
    public function storeReferenceRange(
        StoreReferenceRangeRequest $request,
        Service $service,
        ServiceParameter $parameter
    ): RedirectResponse {
        if ($parameter->service_id !== $service->id) {
            abort(404);
        }

        $validated = $request->validated();
        $validated['is_active'] = $request->boolean('is_active', true);

        $parameter->referenceRanges()->create($validated);

        return redirect()->back()->with('success', 'Nilai rujukan berhasil ditambahkan.');
    }

    /**
     * Update a reference range for the parameter.
     */
    public function updateReferenceRange(
        StoreReferenceRangeRequest $request,
        Service $service,
        ServiceParameter $parameter,
        ParameterReferenceRange $range
    ): RedirectResponse {
        if ($parameter->service_id !== $service->id || $range->parameter_id !== $parameter->id) {
            abort(404);
        }

        $validated = $request->validated();
        $validated['is_active'] = $request->boolean('is_active', true);

        $range->update($validated);

        return redirect()->back()->with('success', 'Nilai rujukan berhasil diperbarui.');
    }

    /**
     * Delete a reference range.
     */
    public function destroyReferenceRange(
        Service $service,
        ServiceParameter $parameter,
        ParameterReferenceRange $range
    ): RedirectResponse {
        if ($parameter->service_id !== $service->id || $range->parameter_id !== $parameter->id) {
            abort(404);
        }

        $range->delete();

        return redirect()->back()->with('success', 'Nilai rujukan berhasil dihapus.');
    }

    // ==========================================
    // Auto-Rule Sub-Resource Actions
    // ==========================================

    /**
     * Store an auto-rule for the parameter.
     */
    public function storeAutoRule(
        StoreAutoRuleRequest $request,
        Service $service,
        ServiceParameter $parameter
    ): RedirectResponse {
        if ($parameter->service_id !== $service->id) {
            abort(404);
        }

        $validated = $request->validated();
        $validated['include_in_abnormality_recap'] = $request->boolean('include_in_abnormality_recap', false);
        $validated['is_active'] = $request->boolean('is_active', true);

        $parameter->autoRules()->create($validated);

        return redirect()->back()->with('success', 'Auto-rule evaluasi berhasil ditambahkan.');
    }

    /**
     * Update an auto-rule for the parameter.
     */
    public function updateAutoRule(
        StoreAutoRuleRequest $request,
        Service $service,
        ServiceParameter $parameter,
        ParameterAutoRule $rule
    ): RedirectResponse {
        if ($parameter->service_id !== $service->id || $rule->parameter_id !== $parameter->id) {
            abort(404);
        }

        $validated = $request->validated();
        $validated['include_in_abnormality_recap'] = $request->boolean('include_in_abnormality_recap', false);
        $validated['is_active'] = $request->boolean('is_active', true);

        $rule->update($validated);

        return redirect()->back()->with('success', 'Auto-rule evaluasi berhasil diperbarui.');
    }

    /**
     * Delete an auto-rule.
     */
    public function destroyAutoRule(
        Service $service,
        ServiceParameter $parameter,
        ParameterAutoRule $rule
    ): RedirectResponse {
        if ($parameter->service_id !== $service->id || $rule->parameter_id !== $parameter->id) {
            abort(404);
        }

        $rule->delete();

        return redirect()->back()->with('success', 'Auto-rule evaluasi berhasil dihapus.');
    }
}
