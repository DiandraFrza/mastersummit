# Development Progress & Micro-Task Tracker

> **Last Updated:** 2026-11-23 (Task 1D Completed — Phase 1 100% Done)
> **Current Phase:** Fase 2 — Data Master & Dynamic Parameter Engine
> **Next Active Task:** `2A`

---

## Phase 1: Foundation, Auth, RBAC Checklist & Core Layout
- [x] **1A — Project Bootstrap & Core Packages:** Setup Laravel 11/12 + Inertia React TS + Tailwind, install `spatie/laravel-permission`, `spatie/laravel-activitylog`, `@tanstack/react-table`, `@tanstack/react-virtual`, `framer-motion`, `lucide-react`. Create migrations & models for Domain A & B (`employees`, `users`, `user_sample_scopes`, `clinic_settings`), `HasAuditColumns` trait, and initial `DatabaseSeeder`.
- [x] **1B — Minimalist Shell & Reusable `<DataTable />`:** Build collapsible Sidebar (dynamic menu filtered by RBAC, toggle next to brand), Topbar, Toast/Modal primitives, and reusable server-side `<DataTable />` (10/20/50/100/300/500 entries, TanStack Virtual >= 100, Smart URL sync, sticky header, `tabular-nums`, unified `Aksi` dropdown), Auth Login/Logout (username/email, `is_active` check, `last_login_at`), and `Dashboard.tsx`.
- [x] **1C — Master Pegawai, Pengguna & RBAC Matrix:** CRUD `Master Pegawai` (with PNG signature/stamp upload), CRUD `Master Pengguna`, and **Multi-Role + Granular Permission Checklist + `user_sample_scopes` UI**. Borderless subtle badge design applied across tables.
- [x] **1D — Pengaturan Klinik & Kop Surat:** Build `clinic_settings` page (logo, watermark + opacity preview slider 1%-50%, header layout, Control Card paper size `A5/A6/A4_2IN1`, default 30-day online expiry, live HVS Kop Surat preview).

## Phase 2: Data Master & Dynamic Parameter Engine
- [ ] **2A — Core Master Tables:** Migrations, Models, FormRequests, and CRUD with `is_active` toggle (no hard delete) for `units`, `companies`, `referrer_types`, `referrers`, `banks`, `vendors`, and `samples`.
- [ ] **2B — Master Pemeriksaan & Tarif Paket:** CRUD `services` (Lab, Radiologi, Elektromedis, Fisik with `print_template` & `sample_id`) and `packages` + `package_items` (auto-sum `total_price` minus `discount_amount` = `final_price`).
- [ ] **2C — Dynamic Parameter, Reference Range & Auto-Rule Builder:** CRUD UI inside each service to manage `service_parameters` (number/text/select/formula/audiogram_grid + normal presets), `parameter_reference_ranges` (gender/age), and `parameter_auto_rules` (flag + auto-conclusion + auto-suggestion + abnormality recap toggle).
- [ ] **2D — Realistic Clinic Seeders:** Seed sample stations (Darah EDTA, Darah CA/Plain, 2 Jam PP, Audiometri, Rontgen, EKG, Dokter Gigi, etc.), Hematologi/Kimia Darah/Urin/EKG/RO/Fisik parameters + reference ranges + auto-rules, and sample MCU packages.

## Phase 3: Single-Door Registration, MCU Events & Control Card
- [ ] **3A — Master Pasien & Event MCU:** CRUD `patients` (auto NRM, Excel export) and `mcu_events` (assign PIC MCU, doctors per unit, QC1/QC2, virtual background upload, bulk participant Excel import).
- [ ] **3B — Pendaftaran 1 Pintu & Split Billing:** `RegisterPatientAction` inside `DB::transaction()` handling Regular, Corporate MCU, APS, and Referrer; auto-unpack packages to `registration_items`; item-level `billed_to` split billing; `payments` recording; Void with mandatory `void_reason`.
- [ ] **3C — Print Kartu Kontrol (HVS + Dynamic Kop):** Browsershot HTML/CSS template for `A5`, `A6`, and `A4_2IN1` featuring dynamic letterhead, subtle watermark, `reg_no` barcode (`JsBarcode`), patient info, and station checklist table.
- [ ] **3D — Modul `Ambil Sampel` (Smart Barcode):** Single sidebar entry with dynamic station tabs filtered by `user_sample_scopes`, 3 KPI summary cards (*Total, Sudah Diambil, Belum Diambil*), USB/Camera barcode scan input (`reg_no` / NRM), and operator + timestamp logging.

## Phase 4: Dual-Mode Result Input & MCU Review Pipeline
- [ ] **4A — Single Input Hasil Penunjang (Tab per Kategori):** Dynamic form renderer from `service_parameters` grouped by tabs (filtered by RBAC), live formula calculation (e.g., BMI), 1-click "Isi Normal" preset, real-time `EvaluateLabRulesService`, and `result_attachments` drag-and-drop uploader.
- [ ] **4B — Live Audiogram Grid & SVG Chart:** Interactive frequency table (`250–8000 Hz`, Left/Right AC & BC), auto-PTA calculation, and crisp vector SVG Audiogram (Red O / Blue X) ready for print.
- [ ] **4C — Bulk Excel Import/Export per Event MCU:** Download pre-filled Excel templates (`No. Reg`, `NIK`, `Nama`) for Lab/Audiometry/Physical per `mcu_event_id`, chunked upload validation, upsert to `examination_results`, and `excel_import_logs` history view.
- [ ] **4D — Review Dokter MCU & Review Manajer MCU:** Auto-compiled `REKAPITULASI KELAINAN`, Doctor Review page (`fit_status`, summary, advice), Manager MCU QC & Lock (`is_locked = true`), and state transition to `completed`.

## Phase 5: PDF Bundling, 30-Day Online Portal & Reports
- [ ] **5A — Specific Print Templates & Auto-Merge MCU Book:** Browsershot templates for Lab, Antigen, PCR, Narkoba, Radiology, Electromedical, Physical, plus `GenerateMcuBookPdfService` merging Cover + Resume + Unit Results + uploaded tool PDFs (`FPDI`) and queued bulk ZIP export for corporate events.
- [ ] **5B — Ambil Hasil & Portal Hasil Online (30 Hari):** `Ambil Hasil` index with filters, auto-token creation on `completed`, WA share shortcut, `Perpanjang Akses (+30 Hari)` button, and public `/r/{token}` page with DOB/phone verification & expiry gate.
- [ ] **5C — Laporan Pendapatan & Pemeriksaan:** Daily Revenue, Revenue Recap (separated by APS/Corporate/Referrer/Split Billing), Exam List, and Exam Recap with server-side filters and Excel export.
- [ ] **5D — Final Polish, Audit Log Viewer & Performance Pass:** Super Admin Activity Log viewer, N+1 query check, index verification, and end-to-end UAT across roles.

---

## Completed Artifacts Log
*(Antigravity: updated after Task 1D — Phase 1 Complete)*
- **Migrations:**
  - `database/migrations/0001_01_00_000000_create_employees_table.php` (Tabel 1: employees)
  - `database/migrations/0001_01_01_000000_create_users_table.php` (Tabel 2: users + FK employee_id)
  - `database/migrations/2026_11_23_062002_create_permission_tables.php` (Tabel 3: spatie roles & permissions)
  - `database/migrations/2026_11_23_062002_create_activity_log_table.php` (spatie activity log)
  - `database/migrations/2026_11_23_062100_create_user_sample_scopes_table.php` (Tabel 4: user_sample_scopes)
  - `database/migrations/2026_11_23_062200_create_clinic_settings_table.php` (Tabel 5: clinic_settings)
- **Models & Factories:**
  - `App\Traits\HasAuditColumns`
  - `App\Models\Employee`
  - `App\Models\User`
  - `App\Models\UserSampleScope`
  - `App\Models\ClinicSetting`
  - `database/factories/EmployeeFactory.php`
- **Seeders:**
  - `Database\Seeders\RolePermissionSeeder`
  - `Database\Seeders\DatabaseSeeder`
- **FormRequests & Controllers:**
  - `App\Http\Requests\Auth\LoginRequest`
  - `App\Http\Requests\Master\StoreEmployeeRequest`
  - `App\Http\Requests\Master\UpdateEmployeeRequest`
  - `App\Http\Requests\Master\StoreUserRequest`
  - `App\Http\Requests\Master\UpdateUserRequest`
  - `App\Http\Requests\Settings\UpdateClinicSettingRequest` (Clinic settings validation)
  - `App\Http\Controllers\Auth\AuthenticatedSessionController`
  - `App\Http\Controllers\DashboardController`
  - `App\Http\Controllers\Master\EmployeeController`
  - `App\Http\Controllers\Master\UserController`
  - `App\Http\Controllers\Settings\ClinicSettingController` (Settings edit & update with logo/watermark uploads)
- **UI Components & Layouts:**
  - `resources/js/Layouts/AuthenticatedLayout.tsx`
  - `resources/js/Components/DataTable.tsx`
  - `resources/js/Components/Badge.tsx` (100% borderless subtle tinted badges)
  - `resources/js/Components/Modal.tsx`
  - `resources/js/Components/ActionDropdown.tsx`
  - `resources/js/Components/Toast.tsx`
- **Pages & Routes:**
  - `resources/js/Pages/Auth/Login.tsx`
  - `resources/js/Pages/Dashboard.tsx`
  - `resources/js/Pages/Employees/Index.tsx`
  - `resources/js/Pages/Users/Index.tsx`
  - `resources/js/Pages/Settings/Clinic.tsx` (Clinic profile, logo & watermark upload, live HVS Kop Surat preview & watermark opacity slider)
  - `routes/web.php` (Registered `/settings/clinic`)
- **Tests:**
  - `tests/Feature/AuthTest.php` (8/8 passed)
  - `tests/Feature/MasterTest.php` (6/6 passed)
  - `tests/Feature/ClinicSettingTest.php` (5/5 passed)
  - `tests/Feature/ExampleTest.php` (1/1 passed)
  - Total: 21/21 tests passing (60 assertions)
