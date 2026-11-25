<?php

use App\Http\Controllers\Audit\AuditLogController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Events\BulkMcuPrintController;
use App\Http\Controllers\Events\McuEventController;
use App\Http\Controllers\Events\McuParticipantController;
use App\Http\Controllers\Examinations\BulkExcelController;
use App\Http\Controllers\Examinations\ExaminationResultController;
use App\Http\Controllers\Examinations\McuReviewController;
use App\Http\Controllers\Master\BankController;
use App\Http\Controllers\Master\CompanyController;
use App\Http\Controllers\Master\EmployeeController;
use App\Http\Controllers\Master\PackageController;
use App\Http\Controllers\Master\ReferrerController;
use App\Http\Controllers\Master\SampleController;
use App\Http\Controllers\Master\ServiceController;
use App\Http\Controllers\Master\ServiceParameterController;
use App\Http\Controllers\Master\UnitController;
use App\Http\Controllers\Master\UserController;
use App\Http\Controllers\Master\VendorController;
use App\Http\Controllers\Patients\PatientController;
use App\Http\Controllers\Portal\OnlineResultPortalController;
use App\Http\Controllers\Prints\PrintLabelController;
use App\Http\Controllers\Prints\PrintTemplateController;
use App\Http\Controllers\Registrations\ControlCardController;
use App\Http\Controllers\Registrations\RegistrationController;
use App\Http\Controllers\Reports\ExaminationReportController;
use App\Http\Controllers\Reports\RevenueReportController;
use App\Http\Controllers\Results\ResultHandoverController;
use App\Http\Controllers\Samples\SampleCollectionController;
use App\Http\Controllers\Settings\ClinicSettingController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('dashboard');
});

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store']);
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Master Pegawai (Domain A - Table 1)
    Route::get('/employees', [EmployeeController::class, 'index'])->name('employees.index');
    Route::post('/employees', [EmployeeController::class, 'store'])->name('employees.store');
    Route::post('/employees/{employee}', [EmployeeController::class, 'update'])->name('employees.update');
    Route::patch('/employees/{employee}/toggle-status', [EmployeeController::class, 'toggleStatus'])->name('employees.toggle-status');

    // Master Pengguna & RBAC (Domain A - Table 2 & 4)
    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::patch('/users/{user}/toggle-status', [UserController::class, 'toggleStatus'])->name('users.toggle-status');

    // Pengaturan Klinik & Kop Surat (Domain B - Table 5)
    Route::get('/settings/clinic', [ClinicSettingController::class, 'edit'])->name('settings.clinic.edit');
    Route::post('/settings/clinic', [ClinicSettingController::class, 'update'])->name('settings.clinic.update');

    // Master Unit / Cabang (Domain C - Table 6)
    Route::get('/units', [UnitController::class, 'index'])->name('units.index');
    Route::post('/units', [UnitController::class, 'store'])->name('units.store');
    Route::put('/units/{unit}', [UnitController::class, 'update'])->name('units.update');
    Route::patch('/units/{unit}/toggle-status', [UnitController::class, 'toggleStatus'])->name('units.toggle-status');

    // Master Perusahaan (Domain C - Table 7)
    Route::get('/companies', [CompanyController::class, 'index'])->name('companies.index');
    Route::post('/companies', [CompanyController::class, 'store'])->name('companies.store');
    Route::post('/companies/{company}', [CompanyController::class, 'update'])->name('companies.update');
    Route::patch('/companies/{company}/toggle-status', [CompanyController::class, 'toggleStatus'])->name('companies.toggle-status');

    // Master Perujuk (Domain C - Table 8 & 9)
    Route::get('/referrers', [ReferrerController::class, 'index'])->name('referrers.index');
    Route::post('/referrers', [ReferrerController::class, 'store'])->name('referrers.store');
    Route::put('/referrers/{referrer}', [ReferrerController::class, 'update'])->name('referrers.update');
    Route::patch('/referrers/{referrer}/toggle-status', [ReferrerController::class, 'toggleStatus'])->name('referrers.toggle-status');

    // Master Rekening Bank (Domain C - Table 10)
    Route::get('/banks', [BankController::class, 'index'])->name('banks.index');
    Route::post('/banks', [BankController::class, 'store'])->name('banks.store');
    Route::put('/banks/{bank}', [BankController::class, 'update'])->name('banks.update');
    Route::patch('/banks/{bank}/toggle-status', [BankController::class, 'toggleStatus'])->name('banks.toggle-status');

    // Master Vendor & Rekanan (Domain C - Table 11)
    Route::get('/vendors', [VendorController::class, 'index'])->name('vendors.index');
    Route::post('/vendors', [VendorController::class, 'store'])->name('vendors.store');
    Route::put('/vendors/{vendor}', [VendorController::class, 'update'])->name('vendors.update');
    Route::patch('/vendors/{vendor}/toggle-status', [VendorController::class, 'toggleStatus'])->name('vendors.toggle-status');

    // Master Stasiun & Sampel (Domain C - Table 12)
    Route::get('/samples', [SampleController::class, 'index'])->name('samples.index');
    Route::post('/samples', [SampleController::class, 'store'])->name('samples.store');
    Route::put('/samples/{sample}', [SampleController::class, 'update'])->name('samples.update');
    Route::patch('/samples/{sample}/toggle-status', [SampleController::class, 'toggleStatus'])->name('samples.toggle-status');

    // Master Pemeriksaan & Tarif (Domain C - Table 13)
    Route::get('/services', [ServiceController::class, 'index'])->name('services.index');
    Route::post('/services', [ServiceController::class, 'store'])->name('services.store');
    Route::put('/services/{service}', [ServiceController::class, 'update'])->name('services.update');
    Route::patch('/services/{service}/toggle-status', [ServiceController::class, 'toggleStatus'])->name('services.toggle-status');

    // Master Paket MCU & Tarif Bundling (Domain C - Table 14 & 15)
    Route::get('/packages', [PackageController::class, 'index'])->name('packages.index');
    Route::post('/packages', [PackageController::class, 'store'])->name('packages.store');
    Route::put('/packages/{package}', [PackageController::class, 'update'])->name('packages.update');
    Route::patch('/packages/{package}/toggle-status', [PackageController::class, 'toggleStatus'])->name('packages.toggle-status');

    // Dynamic Parameter & Auto-Rule Engine (Domain D - Tables 16, 17, 18)
    Route::get('/services/{service}/parameters', [ServiceParameterController::class, 'index'])->name('services.parameters.index');
    Route::post('/services/{service}/parameters', [ServiceParameterController::class, 'store'])->name('services.parameters.store');
    Route::put('/services/{service}/parameters/{parameter}', [ServiceParameterController::class, 'update'])->name('services.parameters.update');
    Route::patch('/services/{service}/parameters/{parameter}/toggle-status', [ServiceParameterController::class, 'toggleStatus'])->name('services.parameters.toggle-status');
    Route::delete('/services/{service}/parameters/{parameter}', [ServiceParameterController::class, 'destroy'])->name('services.parameters.destroy');

    // Parameter Reference Ranges (Table 17)
    Route::post('/services/{service}/parameters/{parameter}/reference-ranges', [ServiceParameterController::class, 'storeReferenceRange'])->name('services.parameters.ranges.store');
    Route::put('/services/{service}/parameters/{parameter}/reference-ranges/{range}', [ServiceParameterController::class, 'updateReferenceRange'])->name('services.parameters.ranges.update');
    Route::delete('/services/{service}/parameters/{parameter}/reference-ranges/{range}', [ServiceParameterController::class, 'destroyReferenceRange'])->name('services.parameters.ranges.destroy');

    // Parameter Auto Rules (Table 18)
    Route::post('/services/{service}/parameters/{parameter}/auto-rules', [ServiceParameterController::class, 'storeAutoRule'])->name('services.parameters.rules.store');
    Route::put('/services/{service}/parameters/{parameter}/auto-rules/{rule}', [ServiceParameterController::class, 'updateAutoRule'])->name('services.parameters.rules.update');
    Route::delete('/services/{service}/parameters/{parameter}/auto-rules/{rule}', [ServiceParameterController::class, 'destroyAutoRule'])->name('services.parameters.rules.destroy');

    // Master Pasien (Domain E - Table 20)
    Route::get('/patients', [PatientController::class, 'index'])->name('patients.index');
    Route::get('/patients/export', [PatientController::class, 'export'])->name('patients.export');
    Route::post('/patients', [PatientController::class, 'store'])->name('patients.store');
    Route::put('/patients/{patient}', [PatientController::class, 'update'])->name('patients.update');
    Route::delete('/patients/{patient}', [PatientController::class, 'destroy'])->name('patients.destroy');

    // Event MCU & Corporate Batch (Domain E - Table 19)
    Route::get('/mcu-events', [McuEventController::class, 'index'])->name('events.index');
    Route::post('/mcu-events', [McuEventController::class, 'store'])->name('events.store');
    Route::put('/mcu-events/{mcuEvent}', [McuEventController::class, 'update'])->name('events.update');
    Route::delete('/mcu-events/{mcuEvent}', [McuEventController::class, 'destroy'])->name('events.destroy');
    Route::patch('/mcu-events/{mcuEvent}/update-status', [McuEventController::class, 'updateStatus'])->name('events.update-status');

    // Bulk Excel Import & Export per Event MCU (Domain G - Task 4C)
    Route::get('/mcu-events/{mcuEvent}/bulk-results', [BulkExcelController::class, 'index'])->name('events.bulk-results.index');
    Route::get('/mcu-events/{mcuEvent}/bulk-results/template', [BulkExcelController::class, 'template'])->name('events.bulk-results.template');
    Route::post('/mcu-events/{mcuEvent}/bulk-results/import', [BulkExcelController::class, 'import'])->name('events.bulk-results.import');

    // Peserta Event MCU & Check-In (Tahap R3)
    Route::get('/mcu-events/{mcuEvent}/participants', [McuParticipantController::class, 'index'])->name('events.participants.index');
    Route::post('/mcu-events/{mcuEvent}/participants', [McuParticipantController::class, 'store'])->name('events.participants.store');
    Route::put('/mcu-events/{mcuEvent}/participants/{registration}', [McuParticipantController::class, 'update'])->name('events.participants.update');
    Route::delete('/mcu-events/{mcuEvent}/participants/{registration}', [McuParticipantController::class, 'destroy'])->name('events.participants.destroy');
    Route::get('/mcu-events/{mcuEvent}/participants/template', [McuParticipantController::class, 'template'])->name('events.participants.template');
    Route::post('/mcu-events/{mcuEvent}/participants/import', [McuParticipantController::class, 'importExcel'])->name('events.participants.import');
    Route::post('/mcu-events/{mcuEvent}/participants/{registration}/check-in', [McuParticipantController::class, 'checkIn'])->name('events.participants.check-in');

    // Cetak Stiker Label & Kartu Peserta (Tahap R3)
    Route::get('/registrations/{registration}/label-lab', [PrintLabelController::class, 'labelLab'])->name('registrations.label-lab');
    Route::get('/registrations/{registration}/label-non-lab', [PrintLabelController::class, 'labelNonLab'])->name('registrations.label-non-lab');
    Route::get('/registrations/{registration}/participant-card', [PrintLabelController::class, 'participantCard'])->name('registrations.participant-card');

    // Pendaftaran 1 Pintu & Split Billing (Domain E - Tables 21 & 22)
    Route::get('/registrations', [RegistrationController::class, 'index'])->name('registrations.index');
    Route::post('/registrations', [RegistrationController::class, 'store'])->name('registrations.store');
    Route::post('/registrations/{registration}/void', [RegistrationController::class, 'void'])->name('registrations.void');

    // Print Kartu Kontrol / Routing Slip (Task 3C)
    Route::get('/registrations/{registration}/control-card', [ControlCardController::class, 'show'])->name('registrations.control-card');
    Route::get('/registrations/{registration}/control-card/pdf', [ControlCardController::class, 'pdf'])->name('registrations.control-card.pdf');

    // Modul Ambil Sampel & Smart Barcode Check-In (Task 3D)
    Route::get('/samples/collect', [SampleCollectionController::class, 'index'])->name('samples.collect.index');
    Route::post('/samples/collect/scan', [SampleCollectionController::class, 'scan'])->name('samples.collect.scan');
    Route::post('/samples/collect/{registrationItem}/update-status', [SampleCollectionController::class, 'updateStatus'])->name('samples.collect.update-status');

    // Input Hasil Pemeriksaan Penunjang & Audiogram (Domain F - Task 4A & 4B)
    Route::get('/examinations', [ExaminationResultController::class, 'index'])->name('examinations.index');
    Route::post('/examinations/evaluate', [ExaminationResultController::class, 'evaluate'])->name('examinations.evaluate');
    Route::delete('/examinations/attachments/{attachment}', [ExaminationResultController::class, 'deleteAttachment'])->name('examinations.attachments.destroy');
    Route::get('/examinations/{registration}', [ExaminationResultController::class, 'entry'])->name('examinations.entry');
    Route::post('/examinations/{registration}', [ExaminationResultController::class, 'save'])->name('examinations.save');
    Route::post('/examinations/{registration}/attachments', [ExaminationResultController::class, 'uploadAttachment'])->name('examinations.attachments.upload');

    // Review Dokter MCU & Review Manajer MCU (Domain F - Task 4D)
    Route::get('/mcu/doctor-review', [McuReviewController::class, 'doctorIndex'])->name('mcu.doctor-review.index');
    Route::get('/mcu/doctor-review/{registration}', [McuReviewController::class, 'doctorShow'])->name('mcu.doctor-review.show');
    Route::post('/mcu/doctor-review/{registration}', [McuReviewController::class, 'doctorStore'])->name('mcu.doctor-review.store');

    Route::get('/mcu/manager-review', [McuReviewController::class, 'managerIndex'])->name('mcu.manager-review.index');
    Route::get('/mcu/manager-review/{registration}', [McuReviewController::class, 'managerShow'])->name('mcu.manager-review.show');
    Route::post('/mcu/manager-review/{registration}/approve', [McuReviewController::class, 'managerApprove'])->name('mcu.manager-review.approve');
    Route::post('/mcu/manager-review/{registration}/unlock', [McuReviewController::class, 'managerUnlock'])->name('mcu.manager-review.unlock');

    // Cetak Lembar Hasil Pemeriksaan Spesifik (Task 5A)
    Route::get('/registrations/{registration}/items/{item}/print', [PrintTemplateController::class, 'printSingle'])->name('prints.single');
    Route::get('/registrations/{registration}/items/{item}/pdf', [PrintTemplateController::class, 'printSinglePdf'])->name('prints.single.pdf');

    // Cetak & Bundle Buku Laporan MCU (Task 5A)
    Route::get('/registrations/{registration}/mcu-book', [PrintTemplateController::class, 'mcuBook'])->name('prints.mcu-book');
    Route::get('/registrations/{registration}/mcu-book/pdf', [PrintTemplateController::class, 'mcuBookPdf'])->name('prints.mcu-book.pdf');

    // Ekspor Massal ZIP Buku MCU per Event (Task 5A)
    Route::post('/mcu-events/{mcuEvent}/bulk-zip', [BulkMcuPrintController::class, 'dispatchBulkZip'])->name('events.bulk-zip.dispatch');
    Route::get('/mcu-events/{mcuEvent}/bulk-zip/status', [BulkMcuPrintController::class, 'checkBulkZipStatus'])->name('events.bulk-zip.status');
    Route::get('/mcu-events/{mcuEvent}/bulk-zip/download', [BulkMcuPrintController::class, 'downloadBulkZip'])->name('events.bulk-zip.download');

    // Modul Ambil Hasil & Pengelolaan Akses Hasil Online (Task 5B)
    Route::get('/results', [ResultHandoverController::class, 'index'])->name('results.index');
    Route::post('/results/{registration}/extend', [ResultHandoverController::class, 'extendToken'])->name('results.extend-token');
    Route::post('/results/{registration}/revoke', [ResultHandoverController::class, 'revokeToken'])->name('results.revoke-token');
    Route::post('/results/{registration}/generate-token', [ResultHandoverController::class, 'generateToken'])->name('results.generate-token');
    Route::get('/results/{registration}/whatsapp', [ResultHandoverController::class, 'whatsappInfo'])->name('results.whatsapp-info');

    // Modul Laporan Pendapatan & Rekap Pemeriksaan (Task 5C)
    Route::get('/reports/revenue', [RevenueReportController::class, 'index'])->name('reports.revenue.index');
    Route::get('/reports/revenue/export-excel', [RevenueReportController::class, 'exportExcel'])->name('reports.revenue.export');
    Route::get('/reports/examinations', [ExaminationReportController::class, 'index'])->name('reports.examinations.index');
    Route::get('/reports/examinations/export-excel', [ExaminationReportController::class, 'exportExcel'])->name('reports.examinations.export');

    // Modul Audit Trail & Log Aktivitas Sistem (Task 5D)
    Route::get('/audit-logs', [AuditLogController::class, 'index'])->name('audit-logs.index');
});

// Portal Publik Hasil Rekam Medis Online (Task 5B)
Route::get('/r/{token}', [OnlineResultPortalController::class, 'show'])->name('portal.show');
Route::post('/r/{token}/verify', [OnlineResultPortalController::class, 'verify'])->name('portal.verify');
Route::get('/r/{token}/download-pdf', [OnlineResultPortalController::class, 'downloadPdf'])->name('portal.download-pdf');

