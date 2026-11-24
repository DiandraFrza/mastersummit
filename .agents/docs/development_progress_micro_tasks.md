# Development Progress & Micro-Task Tracker

> **Last Updated:** 2026-11-24 (Task 4D Completed — Review Dokter MCU & Review Manajer MCU 100% Done | Fase 4 100% Done)
> **Current Phase:** Fase 5 — PDF Bundling, 30-Day Online Portal & Reports
> **Next Active Task:** `5A` — Specific Print Templates & Auto-Merge MCU Book

---

## Phase 1: Foundation, Auth, RBAC Checklist & Core Layout
- [x] **1A — Project Bootstrap & Core Packages:** Setup Laravel 11/12 + Inertia React TS + Tailwind, install `spatie/laravel-permission`, `spatie/laravel-activitylog`, `@tanstack/react-table`, `@tanstack/react-virtual`, `framer-motion`, `lucide-react`. Create migrations & models for Domain A & B (`employees`, `users`, `user_sample_scopes`, `clinic_settings`), `HasAuditColumns` trait, and initial `DatabaseSeeder`.
- [x] **1B — Minimalist Shell & Reusable `<DataTable />`:** Build collapsible Sidebar (dynamic menu filtered by RBAC, toggle next to brand), Topbar, Toast/Modal primitives, and reusable server-side `<DataTable />` (10/20/50/100/300/500 entries, TanStack Virtual >= 100, Smart URL sync, sticky header, `tabular-nums`, unified `Aksi` dropdown), Auth Login/Logout (username/email, `is_active` check, `last_login_at`), and `Dashboard.tsx`.
- [x] **1C — Master Pegawai, Pengguna & RBAC Matrix:** CRUD `Master Pegawai` (with PNG signature/stamp upload), CRUD `Master Pengguna`, and **Multi-Role + Granular Permission Checklist + `user_sample_scopes` UI**. Borderless subtle badge design applied across tables.
- [x] **1D — Pengaturan Klinik & Kop Surat:** Build `clinic_settings` page (logo, watermark + opacity preview slider 1%-50%, header layout, Control Card paper size `A5/A6/A4_2IN1`, default 30-day online expiry, live HVS Kop Surat preview).

## Phase 2: Data Master & Dynamic Parameter Engine
- [x] **2A — Core Master Tables:** Migrations, Models, FormRequests, and CRUD with `is_active` toggle (no hard delete) for `units`, `companies`, `referrer_types`, `referrers`, `banks`, `vendors`, and `samples`.
- [x] **2B — Master Pemeriksaan & Tarif Paket:** CRUD `services` (Lab, Radiologi, Elektromedis, Fisik with `print_template` & `sample_id`) and `packages` + `package_items` (auto-sum `total_price` minus `discount_amount` = `final_price`).
- [x] **2C — Dynamic Parameter, Reference Range & Auto-Rule Builder:** CRUD UI inside each service to manage `service_parameters` (number/text/select/formula/audiogram_grid + normal presets), `parameter_reference_ranges` (gender/age), and `parameter_auto_rules` (flag + auto-conclusion + auto-suggestion + abnormality recap toggle).
- [x] **2D — Realistic Clinic Seeders:** Seed sample stations (Darah EDTA, Darah CA/Plain, 2 Jam PP, Audiometri, Rontgen, EKG, Dokter Gigi, etc.), Hematologi/Kimia Darah/Urin/EKG/RO/Fisik parameters + reference ranges + auto-rules, and sample MCU packages.

## Phase 3: Single-Door Registration, MCU Events & Control Card
- [x] **3A — Master Pasien & Event MCU:** CRUD `patients` (auto NRM, Excel export) and `mcu_events` (assign PIC MCU, doctors per unit, QC1/QC2, virtual background upload, bulk participant Excel import).
- [x] **3B — Pendaftaran 1 Pintu & Split Billing:** `RegisterPatientAction` inside `DB::transaction()` handling Regular, Corporate MCU, APS, and Referrer; auto-unpack packages to `registration_items`; item-level `billed_to` split billing; `payments` recording; Void with mandatory `void_reason`.
- [x] **3C — Print Kartu Kontrol (HVS + Dynamic Kop):** Browsershot HTML/CSS template for `A5`, `A6`, and `A4_2IN1` featuring dynamic letterhead, subtle watermark, `reg_no` QR Code (`SimpleSoftwareIO/QrCode SVG`), patient info, and station checklist table.
- [x] **3D — Modul `Ambil Sampel` (Smart Barcode):** Single sidebar entry with dynamic station tabs filtered by `user_sample_scopes`, 3 KPI summary cards (*Total, Sudah Diambil, Belum Diambil*), USB/Camera barcode scan input (`reg_no` / NRM), and operator + timestamp logging.

## Phase 4: Dual-Mode Result Input & MCU Review Pipeline
- [x] **4A — Single Input Hasil Penunjang (Tab per Kategori):** Dynamic form renderer from `service_parameters` grouped by tabs (filtered by RBAC), live formula calculation (e.g., BMI), 1-click "Isi Normal" preset, real-time `EvaluateLabRulesService`, and `result_attachments` drag-and-drop uploader.
- [x] **4B — Live Audiogram Grid & SVG Chart:** Interactive frequency table (`250–8000 Hz`, Left/Right AC & BC), auto-PTA calculation, and crisp vector SVG Audiogram (Red O / Blue X) ready for print.
- [x] **4C — Bulk Excel Import/Export per Event MCU:** Download pre-filled Excel templates (`No. Reg`, `NIK`, `Nama`) for Lab/Audiometry/Physical per `mcu_event_id`, chunked upload validation, upsert to `examination_results`, and `excel_import_logs` history view.
- [x] **4D — Review Dokter MCU & Review Manajer MCU:** Auto-compiled `REKAPITULASI KELAINAN`, Doctor Review page (`fit_status`, summary, advice), Manager MCU QC & Lock (`is_locked = true`), and state transition to `completed`.

## Phase 5: PDF Bundling, 30-Day Online Portal & Reports
- [ ] **5A — Specific Print Templates & Auto-Merge MCU Book:** Browsershot templates for Lab, Antigen, PCR, Narkoba, Radiology, Electromedical, Physical, plus `GenerateMcuBookPdfService` merging Cover + Resume + Unit Results + uploaded tool PDFs (`FPDI`) and queued bulk ZIP export for corporate events.
- [ ] **5B — Ambil Hasil & Portal Hasil Online (30 Hari):** `Ambil Hasil` index with filters, auto-token creation on `completed`, WA share shortcut, `Perpanjang Akses (+30 Hari)` button, and public `/r/{token}` page with DOB/phone verification & expiry gate.
- [ ] **5C — Laporan Pendapatan & Pemeriksaan:** Daily Revenue, Revenue Recap (separated by APS/Corporate/Referrer/Split Billing), Exam List, and Exam Recap with server-side filters and Excel export.
- [ ] **5D — Final Polish, Audit Log Viewer & Performance Pass:** Super Admin Activity Log viewer, N+1 query check, index verification, and end-to-end UAT across roles.

---

## Completed Artifacts Log
*(Antigravity: updated after Task 3D — Modul Ambil Sampel Complete | Fase 3 100% Done)*
- **Migrations:**
  - `database/migrations/0001_01_00_000000_create_employees_table.php` (Tabel 1: employees)
  - `database/migrations/0001_01_01_000000_create_users_table.php` (Tabel 2: users + FK employee_id)
  - `database/migrations/2026_11_23_062002_create_permission_tables.php` (Tabel 3: spatie roles & permissions)
  - `database/migrations/2026_11_23_062002_create_activity_log_table.php` (spatie activity log)
  - `database/migrations/2026_11_23_062100_create_user_sample_scopes_table.php` (Tabel 4: user_sample_scopes)
  - `database/migrations/2026_11_23_062200_create_clinic_settings_table.php` (Tabel 5: clinic_settings)
  - `database/migrations/2026_11_23_070000_create_units_table.php` (Tabel 6: units)
  - `database/migrations/2026_11_23_070100_create_companies_table.php` (Tabel 7: companies)
  - `database/migrations/2026_11_23_070200_create_referrer_types_table.php` (Tabel 8: referrer_types)
  - `database/migrations/2026_11_23_070300_create_referrers_table.php` (Tabel 9: referrers)
  - `database/migrations/2026_11_23_070400_create_banks_table.php` (Tabel 10: banks)
  - `database/migrations/2026_11_23_070500_create_vendors_table.php` (Tabel 11: vendors)
  - `database/migrations/2026_11_23_070600_create_samples_table.php` (Tabel 12: samples)
  - `database/migrations/2026_11_23_080000_create_services_table.php` (Tabel 13: services)
  - `database/migrations/2026_11_23_080100_create_packages_table.php` (Tabel 14: packages)
  - `database/migrations/2026_11_23_080200_create_package_items_table.php` (Tabel 15: package_items)
  - `database/migrations/2026_11_24_090000_create_service_parameters_table.php` (Tabel 16: service_parameters)
  - `database/migrations/2026_11_24_090100_create_parameter_reference_ranges_table.php` (Tabel 17: parameter_reference_ranges)
  - `database/migrations/2026_11_24_090200_create_parameter_auto_rules_table.php` (Tabel 18: parameter_auto_rules)
  - `database/migrations/2026_11_24_100000_create_mcu_events_table.php` (Tabel 19: mcu_events)
  - `database/migrations/2026_11_24_100100_create_patients_table.php` (Tabel 20: patients)
  - `database/migrations/2026_11_24_110000_create_registrations_table.php` (Tabel 21: registrations)
  - `database/migrations/2026_11_24_110100_create_registration_items_table.php` (Tabel 22: registration_items)
  - `database/migrations/2026_11_24_110200_create_payments_table.php` (Tabel 27: payments)
  - `database/migrations/2026_11_24_120000_create_examination_results_table.php` (Tabel 23: examination_results)
  - `database/migrations/2026_11_24_120100_create_result_attachments_table.php` (Tabel 24: result_attachments)
  - `database/migrations/2026_11_24_130000_create_excel_import_logs_table.php` (Tabel 28: excel_import_logs)
- **Models & Factories:**
  - `App\Traits\HasAuditColumns`
  - `App\Models\Employee`
  - `App\Models\User`
  - `App\Models\UserSampleScope`
  - `App\Models\ClinicSetting`
  - `App\Models\Unit`
  - `App\Models\Company`
  - `App\Models\ReferrerType`
  - `App\Models\Referrer`
  - `App\Models\Bank`
  - `App\Models\Vendor`
  - `App\Models\Sample`
  - `App\Models\Service`
  - `App\Models\Package`
  - `App\Models\PackageItem`
  - `App\Models\ServiceParameter`
  - `App\Models\ParameterReferenceRange`
  - `App\Models\ParameterAutoRule`
  - `App\Models\McuEvent`
  - `App\Models\Patient`
  - `App\Models\Registration` (`transitionToInProgressIfRegistered()`, `markAsVoid()`, `recalculateFinancials()`)
  - `App\Models\RegistrationItem`
  - `App\Models\Payment`
  - `App\Models\ExaminationResult`
  - `App\Models\ResultAttachment`
  - `App\Models\ExcelImportLog`
- **Actions & Services:**
  - `App\Actions\Registrations\RegisterPatientAction` (Single-door registration with package unpacking, split billing, initial payments & recalculation inside DB transaction)
  - `App\Services\Prints\ControlCardService` (QR Code SVG generation, dynamic stations mapping, dynamic kop letterhead, paper size formatting & Browsershot PDF generation)
  - `App\Services\Examinations\EvaluateLabRulesService` (Reference range matching, priority auto-rule evaluation & live clinical flag resolution)
  - `App\Exports\McuEventResultsTemplateExport` (Pre-filled participant Excel template generator per event & category)
  - `App\Services\Examinations\BulkExcelImportService` (Chunked validated Excel import, live auto-rule evaluation, PTA calculator & audit logging)
- **Seeders:**
  - `Database\Seeders\RolePermissionSeeder`
  - `Database\Seeders\CoreMasterSeeder`
  - `Database\Seeders\ServicePackageSeeder`
  - `Database\Seeders\RealisticClinicSeeder` (12 Sample stations, 16 Services, 58 Parameters, 64 Ranges, 59 Rules, 4 MCU Packages)
  - `Database\Seeders\DatabaseSeeder`
- **FormRequests & Controllers:**
  - `StoreServiceRequest` & `UpdateServiceRequest`
  - `StorePackageRequest` & `UpdatePackageRequest`
  - `StoreServiceParameterRequest` & `UpdateServiceParameterRequest`
  - `StoreReferenceRangeRequest`
  - `StoreAutoRuleRequest`
  - `StorePatientRequest` & `UpdatePatientRequest`
  - `StoreMcuEventRequest` & `UpdateMcuEventRequest`
  - `StoreRegistrationRequest` & `VoidRegistrationRequest`
  - `ScanBarcodeRequest` & `UpdateSampleStatusRequest`
  - `SaveExaminationResultsRequest`
  - `UploadResultAttachmentRequest`
  - `ServiceController`
  - `PackageController`
  - `ServiceParameterController`
  - `PatientController`
  - `McuEventController`
  - `RegistrationController`
  - `ControlCardController`
  - `SampleCollectionController`
  - `ExaminationResultController`
- **UI Components & Pages:**
  - `resources/js/Components/AudiogramGrid.tsx` (Interactive Audiogram grid table, PTA auto-calculator & SVG vector chart)
  - `resources/js/Pages/Services/Index.tsx`
  - `resources/js/Pages/Services/Parameters.tsx` (Parameter builder with tabs for Reference Ranges & Auto-Rules)
  - `resources/js/Pages/Packages/Index.tsx` (Live calculator total & discount, service picker)
  - `resources/js/Pages/Patients/Index.tsx` (Master Pasien with fast CSV export & auto NRM)
  - `resources/js/Pages/Events/Index.tsx` (Event MCU corporate batch, doctors assignment & virtual background)
  - `resources/js/Pages/Registrations/Index.tsx` (Pendaftaran 1 Pintu with live patient search, split billing calculator, detail modal, void modal & direct Kartu Kontrol print)
  - `resources/js/Pages/Samples/Collect.tsx` (Modul Ambil Sampel with smart barcode scanner, camera barcode scan, 3 KPI cards, dynamic station tabs filtered by `user_sample_scopes`, sample rejection modal & Web Audio API beep)
  - `resources/js/Pages/Examinations/Index.tsx` (Queue antrean input hasil penunjang with category pills, status filter & progress tracking)
  - `resources/js/Pages/Examinations/Entry.tsx` (Dynamic single result entry by category tab, 1-click Isi Normal preset, live flag badges, BMI formula auto-calculator & diagnostic file uploader)
- **Blade Print Templates:**
  - `resources/views/prints/control_card.blade.php` (Interactive preview toolbar, responsive A5/A6/A4_2IN1 layouts, print styles)
  - `resources/views/prints/partials/control_card_body.blade.php` (Dynamic Kop Surat, watermark, Barcode Code128, demographics, station checklist)
- **Routes:**
  - `/services` (index, store, update, toggle-status)
  - `/packages` (index, store, update, toggle-status)
  - `/services/{service}/parameters` (index, store, update, toggle-status, destroy)
  - `/services/{service}/parameters/{parameter}/reference-ranges` (store, update, destroy)
  - `/services/{service}/parameters/{parameter}/auto-rules` (store, update, destroy)
  - `/patients` (index, store, update, destroy, export)
  - `/mcu-events` (index, store, update, destroy, update-status)
  - `/registrations` (index, store)
  - `/registrations/{registration}/void` (void with reason)
  - `/registrations/{registration}/control-card` (HTML printable view)
  - `/registrations/{registration}/control-card/pdf` (direct Browsershot PDF download/stream)
  - `/samples/collect` (index)
  - `/samples/collect/scan` (smart barcode scan check-in)
  - `/samples/collect/{registrationItem}/update-status` (manual take, reset, reject)
  - `/examinations` (index queue antrean hasil penunjang)
  - `/examinations/evaluate` (AJAX real-time rule & flag evaluation)
  - `/examinations/{registration}` (dynamic entry view)
  - `/examinations/{registration}` (save examination results & item status transition)
  - `/examinations/{registration}/attachments` (upload diagnostic tool PDF/JPG)
  - `/examinations/attachments/{attachment}` (delete attachment)
- **Tests:**
  - `tests/Feature/AuthTest.php` (8/8 passed)
  - `tests/Feature/MasterTest.php` (6/6 passed)
  - `tests/Feature/ClinicSettingTest.php` (5/5 passed)
  - `tests/Feature/ControlCardTest.php` (4/4 passed, 37 assertions)
  - `tests/Feature/CoreMasterTest.php` (18/18 passed)
  - `tests/Feature/ServicePackageTest.php` (7/7 passed)
  - `tests/Feature/ServiceParameterTest.php` (6/6 passed)
  - `tests/Feature/RealisticClinicSeederTest.php` (1/1 passed, 57 assertions)
  - `tests/Feature/PatientEventTest.php` (7/7 passed, 49 assertions)
  - `tests/Feature/RegistrationTest.php` (6/6 passed, 79 assertions)
  - `tests/Feature/SampleCollectionTest.php` (8/8 passed, 63 assertions)
  - `tests/Feature/ExaminationResultTest.php` (8/8 passed, 57 assertions)
  - `tests/Feature/ExampleTest.php` (1/1 passed)
  - Total: 86/86 tests passing (506 assertions)
