<?php

namespace App\Http\Controllers\Patients;

use App\Http\Controllers\Controller;
use App\Http\Requests\Patients\StorePatientRequest;
use App\Http\Requests\Patients\UpdatePatientRequest;
use App\Models\Company;
use App\Models\Patient;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PatientController extends Controller
{
    /**
     * Display a listing of patients.
     */
    public function index(Request $request): Response
    {
        $allowedPerPage = [10, 20, 50, 100, 300, 500];
        $perPage = (int) $request->input('per_page', 10);
        if (! in_array($perPage, $allowedPerPage, true)) {
            $perPage = 10;
        }

        $sort = $request->input('sort', 'medical_record_no');
        $direction = strtolower($request->input('direction', 'desc')) === 'asc' ? 'asc' : 'desc';
        $allowedSorts = ['id', 'medical_record_no', 'nik', 'name', 'gender', 'birth_date', 'default_department', 'created_at'];
        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'medical_record_no';
        }

        $search = trim((string) $request->input('search', ''));
        $genderFilter = $request->input('gender', 'all');
        $companyFilter = $request->input('company_id', 'all');

        $query = Patient::query()->with('defaultCompany');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('medical_record_no', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('nik', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if (in_array($genderFilter, ['L', 'P'], true)) {
            $query->where('gender', $genderFilter);
        }

        if ($companyFilter !== 'all' && is_numeric($companyFilter)) {
            $query->where('default_company_id', (int) $companyFilter);
        }

        $patients = $query->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString();

        $companies = Company::where('is_active', true)->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Patients/Index', [
            'patients' => $patients,
            'companies' => $companies,
            'filters' => [
                'search' => $search,
                'gender' => $genderFilter,
                'company_id' => $companyFilter,
                'sort' => $sort,
                'direction' => $direction,
                'per_page' => $perPage,
            ],
            'nextNrm' => Patient::generateNextMedicalRecordNo(),
        ]);
    }

    /**
     * Store a newly created patient.
     */
    public function store(StorePatientRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        if ($request->hasFile('photo')) {
            $validated['photo_path'] = $request->file('photo')->store('patients/photos', 'public');
        }

        $patient = Patient::create($validated);

        return redirect()->back()->with('success', "Pasien {$patient->name} ({$patient->medical_record_no}) berhasil didaftarkan.");
    }

    /**
     * Update the specified patient.
     */
    public function update(UpdatePatientRequest $request, Patient $patient): RedirectResponse
    {
        $validated = $request->validated();

        if ($request->hasFile('photo')) {
            if ($patient->photo_path && Storage::disk('public')->exists($patient->photo_path)) {
                Storage::disk('public')->delete($patient->photo_path);
            }
            $validated['photo_path'] = $request->file('photo')->store('patients/photos', 'public');
        }

        $patient->update($validated);

        return redirect()->back()->with('success', "Data pasien {$patient->name} berhasil diperbarui.");
    }

    /**
     * Soft delete the specified patient.
     */
    public function destroy(Patient $patient): RedirectResponse
    {
        $name = $patient->name;
        $nrm = $patient->medical_record_no;
        $patient->delete();

        return redirect()->back()->with('success', "Data pasien {$name} ({$nrm}) berhasil dihapus.");
    }

    /**
     * Export filtered patients to CSV.
     */
    public function export(Request $request): StreamedResponse
    {
        $search = trim((string) $request->input('search', ''));
        $genderFilter = $request->input('gender', 'all');
        $companyFilter = $request->input('company_id', 'all');

        $query = Patient::query()->with('defaultCompany');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('medical_record_no', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('nik', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if (in_array($genderFilter, ['L', 'P'], true)) {
            $query->where('gender', $genderFilter);
        }

        if ($companyFilter !== 'all' && is_numeric($companyFilter)) {
            $query->where('default_company_id', (int) $companyFilter);
        }

        $fileName = 'data_pasien_' . date('Ymd_His') . '.csv';

        return response()->streamDownload(function () use ($query) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['No. Rekam Medis', 'NIK', 'Nama Lengkap', 'Gender', 'Tanggal Lahir', 'Usia', 'No. HP', 'Email', 'Perusahaan', 'Departemen', 'Alamat']);

            $query->chunk(200, function ($patients) use ($handle) {
                foreach ($patients as $p) {
                    fputcsv($handle, [
                        $p->medical_record_no,
                        $p->nik,
                        $p->name,
                        $p->gender === 'L' ? 'Laki-laki' : 'Perempuan',
                        $p->birth_date?->format('Y-m-d'),
                        $p->age,
                        $p->phone,
                        $p->email,
                        $p->defaultCompany?->name ?? '',
                        $p->default_department,
                        $p->address,
                    ]);
                }
            });

            fclose($handle);
        }, $fileName, ['Content-Type' => 'text/csv']);
    }

    /**
     * Search patients by query for autocomplete.
     */
    public function search(Request $request): \Illuminate\Http\JsonResponse
    {
        $q = trim((string) $request->input('q', ''));
        if ($q === '') {
            return response()->json([]);
        }

        $patients = Patient::query()
            ->where('medical_record_no', 'like', "%{$q}%")
            ->orWhere('nik', 'like', "%{$q}%")
            ->orWhere('name', 'like', "%{$q}%")
            ->orWhere('phone', 'like', "%{$q}%")
            ->limit(10)
            ->get(['id', 'medical_record_no', 'nik', 'name', 'gender', 'birth_date', 'phone', 'address', 'default_department', 'default_company_id']);

        return response()->json($patients);
    }

    /**
     * Quickly create a new patient from registration inline modal.
     */
    public function quickStore(Request $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'nik' => ['nullable', 'string', 'max:20'],
            'gender' => ['required', 'in:L,P'],
            'birth_date' => ['required', 'date'],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:500'],
            'default_department' => ['nullable', 'string', 'max:100'],
        ]);

        $patient = Patient::create([
            'name' => $validated['name'],
            'nik' => $validated['nik'] ?? null,
            'gender' => $validated['gender'],
            'birth_date' => $validated['birth_date'],
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
            'default_department' => $validated['default_department'] ?? null,
            'created_by' => $request->user()->id,
            'updated_by' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'patient' => $patient,
        ]);
    }
}
