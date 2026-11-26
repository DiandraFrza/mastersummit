# Development Progress & Micro-Task Tracker

> **Last Updated:** 2026-11-25 (Refactor R1 Selesai — Persistent Layout & Skala UI Operator Klinik)
> **Current Phase:** Seluruh Fase 1 - 5 + Evaluasi UI/UX R1 Selesai (100% Complete)
> **Status:** Siap Produksi & UAT Handover (Sidebar Anti-Refresh, Skala Baca Nyaman, Zero AI Slop)

---

## Refactor R1: Clinical Operator Usability, Fluid 2K Multi-Screen & Persistent Layout
- [x] **R1.1 — Persistent Layout (Anti-Refresh Sidebar):** Moved `<AuthenticatedLayout>` resolution to a stable global reference function in `resources/js/app.tsx`. Sidebar never re-mounts or refreshes during SPA route transitions, scroll position stays intact, and active parent dropdown accordions remain open automatically.
- [x] **R1.2 — Full-Width Fluid Canvas & Multi-Resolution Responsive (2K 2560x1440, FHD, Mobile):**
  - Removed `max-w-7xl` constraint; updated `<main>` wrapper to `w-full max-w-none` with responsive padding `p-4 md:p-6 2xl:p-8`.
  - Desktop sidebar width set to `w-[264px] 2xl:w-[272px]` (fixed/sticky full-height with its own internal scroll), collapsible to `w-16`, and mobile slide-over drawer `w-72` on `< lg`.
  - Modal and narrow form surfaces protected with `max-w-md` to `max-w-3xl` so inputs do not overstretch on ultra-wide 2K screens.
  - Table scroll isolation: `<DataTable />` horizontal scroll `overflow-x-auto min-w-0` strictly isolated inside the table container; filter bars use `flex flex-wrap items-end gap-3`.
- [x] **R1.3 — Strict Clinical Sidebar Hierarchy:** Restructured sidebar into 8 clinical groups:
  - HALAMAN UTAMA: `Dashboard`
  - DATA MASTER: `Master Pemeriksaan` (accordion: Sampel, Laboratorium, Radiologi, Elektromedis, Pemeriksaan Fisik, Tarif Paket), `Master Pendaftaran` (accordion: Master Perujuk, Perujuk, Bank), `Master Umum` (accordion: Unit, Perusahaan, Pegawai, Pengguna, Vendor)
  - ADMIN: `Pendaftaran` (manajemen/void/edit admin)
  - PENDAFTARAN: `Pasien`, `Pendaftaran`, `Ambil Hasil`
  - DATA MCU: `MCU`, `Hasil MCU`, `Input Hasil MCU`, `Review Manajer MCU`, `Review Dokter MCU`, `Ambil Sampel`
  - DATA HASIL PENUNJANG: `Laboratorium`, `Radiologi`, `Elektromedis`, `Fisik`
  - LAPORAN: `Pendapatan` (accordion: `Pendapatan Harian`, `Rekap Pendapatan`), `Pemeriksaan` (accordion: `Pemeriksaan`, `Rekap Pemeriksaan`)
  - LAINNYA: `Kartu Kontrol`, `Pengaturan` (accordion: `Pengaturan Klinik`, `Audit Trail`)
- [x] **R1.4 — Scaled UI (Readable & Anti-Salah Klik):**
  - Sidebar: `text-[15px]`, padding `py-2.5 px-3.5`, icon `w-5 h-5`.
  - DataTable: header `text-xs font-semibold uppercase tracking-wider py-3.5 px-4`, rows `text-sm py-3.5 px-4` with subtle zebra striping (`even:bg-zinc-50/70`) and clear hover.
  - Controls & Buttons: `h-10` (`40px`), `text-sm font-medium`, primary button `h-10 px-4 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-sm`.
  - Action dropdown items: `px-3.5 py-2.5 text-sm` with `w-4 h-4` icons.
- [x] **R1.5 — Zero AI-Slop Cleanup:** Removed all descriptive subtitle paragraphs under headers across all 28 pages; eliminated confusing buzzwords (`advice`, `workflow`, `snapshot`, `atau`, `untuk`, excessive `/` and `\`); standardized concise 1–3 word Indonesian terms (`Master Sampel`, `Tambah Data`, `Cari`, `Terapkan`, `Reset`, `Simpan`, `Batal`, `Aksi`); updated `.agents/rules/antigravity_project_rules.md`.

---

## Refactor R2: Integrasi Master Pemeriksaan & Event Tarif Paket
- [x] **R2.1 — Pemisahan Master Pemeriksaan per Kategori:** Halaman individual untuk `Sampel`, `Laboratorium`, `Radiologi`, `Elektromedis`, `Pemeriksaan Fisik`, dan `Tarif Paket` dengan aksi cepat: Parameter, Ubah, dan Toggle Status (Aktif/Nonaktif).
- [x] **R2.2 — Integrasi Event Tarif Paket & Dropdown Bertingkat:** Relasi event pada `packages` (`year`, `event_label`, `referrer_id`), integrasi form tambah event di Master Tarif Paket dengan auto-hitung total, diskon, dan tarif akhir. Form MCU Event terhubung dengan daftar event tarif paket.

---

## Refactor R3: Pendaftaran Peserta MCU Event & Pasien Biasa / APS (2 Pintu Operasional)
- [x] **R3.1 — Database & Seeder Extension:**
  - Migrasi `2026_11_25_160000_update_registrations_allow_pending_and_nullable_reg_no.php`: `reg_no` dan `registered_at` nullable untuk peserta MCU import yang berstatus `pending` (Belum Daftar).
  - Seeder paket APS bertahun di `database/seeders/ServicePackageSeeder.php` (2024: MCU K3 Standar/Plus/Lengkap; 2026: Haji, Emerald, Sekolah, Pra Nikah).
- [x] **R3.2 — BAGIAN A (Jalur MCU Event & Check-In Lapangan):**
  - Dropdown `Aksi` -> `Import Pasien` di `Data MCU -> MCU` membuka tabel peserta per event `Data Pasien MCU`.
  - Header: tombol `Import Excel`, `Unduh Template`, dan `Tambah Data`.
  - Kolom tabel: `No`, `Aksi`, `No. Registrasi`, `NIK`, `Nama`, `Tgl Lahir`, `JK`, `Bagian`, `Paket`, `Status` (`Belum Daftar` / `Terdaftar`).
  - Dropdown 7 Aksi: `Daftar`, `Label Lab`, `Label Non Lab`, `Cetak Kartu`, `Cetak Kartu Kontrol`, `Ubah`, `Hapus`.
  - Modal `Form Daftar`: `Event MCU` (readonly), `Tanggal` (date picker), `Foto` (live webcam capture + file fallback), `Paket` (dropdown paket event), tombol `Daftar`.
  - Atomic transaction saat daftar: simpan foto, generate `reg_no`, unpack paket ke `registration_items`, status `registered`. Modal `QuickPrint` otomatis muncul untuk cetak **Kartu Kontrol** dan **Label Non Lab**.
- [x] **R3.3 — BAGIAN B (Jalur Pasien Biasa & APS MCU 1 Pintu):**
  - Modular komponen di `resources/js/Pages/Registrations/Components/`:
    - `NewPatientModal.tsx`: modal cepat pendaftaran pasien baru sesuai KTP tanpa berpindah halaman.
    - `RegistrationSuccessModal.tsx`: dialog sukses pendaftaran dengan 3 tombol cetak langsung: **Cetak Kwitansi**, **Cetak Label Lab**, dan **Cetak Kartu Kontrol**.
    - `RegistrationWizardModal.tsx`: wizard 4 langkah (Langkah 1: Pasien + Autocomplete, Langkah 2: Perujuk, Langkah 3: Pemeriksaan dengan Tab Satuan & Tab Paket berjenjang Tahun -> Event -> Paket + Keranjang, Langkah 4: Pembayaran & Cek Ulang).
  - Print template kwitansi `resources/views/prints/receipt.blade.php` & controller `PrintLabelController@receipt` lengkap dengan rincian biaya, terbilang rupiah, barcode, metode bayar, dan tanda tangan kasir/pasien.
  - Dropdown aksi tabel pendaftaran dilengkapi `Cetak Kwitansi`, `Cetak Label`, dan `Cetak Kartu Kontrol`.
- [x] **R3.4 — Verifikasi Kualitas:**
  - `npm run build` sukses 100% tanpa error TS.
  - `McuParticipantTest` (5/5 passed, 17 assertions).
  - `RegistrationTest` (8/8 passed, 88 assertions).

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
- [x] **5A — Specific Print Templates & Auto-Merge MCU Book:** Browsershot templates for Lab, Antigen, PCR, Narkoba, Radiology, Electromedical, Physical, plus `GenerateMcuBookPdfService` merging Cover + Resume + Unit Results + uploaded tool PDFs (`FPDI`) and queued bulk ZIP export for corporate events.
- [x] **5B — Ambil Hasil & Portal Hasil Online (30 Hari):** Table 26 (`online_result_tokens`), auto-token generation on `completed`, internal `Ambil Hasil` dashboard with `<DataTable />`, WA direct share modal, extend (+30 Hari) and revoke actions, plus public `/r/{token}` portal with lightweight verification (DOB format `DDMMYYYY` / last 4 digits phone), status views for revoked/expired, and direct official PDF download.
- [x] **5C — Laporan Pendapatan & Pemeriksaan:** Daily Revenue, Revenue Recap (separated by APS/Corporate/Referrer/Split Billing), Exam List, and Exam Recap with server-side filters, 4 KPI cards, and Excel export via Maatwebsite Excel.
- [x] **5D — Final Polish, Audit Log Viewer & Performance Pass:** Super Admin Activity Log viewer (`/audit-logs`) with KPI stats, Smart URL sync, visual Diff Modal (old vs new attributes), N+1 query eager loading verification, and comprehensive End-to-End test suite covering all 10 workflow stages.

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
  - `database/migrations/2026_11_24_140000_create_mcu_reviews_table.php` (Tabel 25: mcu_reviews)
  - `database/migrations/2026_11_25_150000_create_online_result_tokens_table.php` (Tabel 26: online_result_tokens)
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
  - `App\Models\McuReview` (Doctor MCU review, abnormality recap, fit status & Manager QC approval lock)
  - `App\Models\OnlineResultToken` (Tokenized 30-day access, validity checks & days remaining)
- **Actions & Services:**
  - `App\Actions\Registrations\RegisterPatientAction` (Single-door registration with package unpacking, split billing, initial payments & recalculation inside DB transaction)
  - `App\Services\Prints\ControlCardService` (QR Code SVG generation, dynamic stations mapping, dynamic kop letterhead, paper size formatting & Browsershot PDF generation)
  - `App\Services\Examinations\EvaluateLabRulesService` (Reference range matching, priority auto-rule evaluation & live clinical flag resolution)
  - `App\Exports\McuEventResultsTemplateExport` (Pre-filled participant Excel template generator per event & category)
  - `App\Services\Examinations\BulkExcelImportService` (Chunked validated Excel import, live auto-rule evaluation, PTA calculator & audit logging)
  - `App\Services\Examinations\CompileAbnormalityRecapService` (Aggregates clinical abnormalities across all units and auto-generates doctor draft summary)
  - `App\Services\Prints\SinglePrintTemplateService` (Prepares data & renders HTML/Browsershot PDF for 7 specific unit templates)
  - `App\Services\Prints\GenerateMcuBookPdfService` (Compiles complete multi-sheet MCU Book and auto-merges uploaded tool PDFs via FPDI)
  - `App\Services\Portal\OnlineResultTokenService` (Generates 30-day tokens, gatekeeper DOB/phone verification, extend/revoke access, WhatsApp payload builder)
  - `App\Services\Reports\RevenueReportService` (Computes revenue KPIs, payer recap, payment method recap & paginated payments list)
  - `App\Services\Reports\ExaminationReportService` (Computes exam volume KPIs, category distribution, service recap & paginated item list)
  - `App\Exports\Reports\RevenueReportExport` (Multi-sheet Excel export for daily revenue and category/method recap)
  - `App\Exports\Reports\ExaminationReportExport` (Multi-sheet Excel export for examination item list and service volume/revenue recap)
- **Jobs & Queue:**
  - `App\Jobs\GenerateBulkMcuBooksZipJob` (Queued bulk export of all participant MCU Books into single ZIP archive)
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
  - `StoreDoctorReviewRequest` & `StoreManagerApprovalRequest`
  - `VerifyPortalAccessRequest`
  - `ServiceController`
  - `PackageController`
  - `ServiceParameterController`
  - `PatientController`
  - `McuEventController`
  - `RegistrationController`
  - `ControlCardController`
  - `SampleCollectionController`
  - `ExaminationResultController`
  - `BulkExcelController`
  - `McuReviewController` (Doctor review queue, show, store, and Manager QC review, approve & unlock)
  - `PrintTemplateController` (Single unit result HTML/PDF preview & complete MCU Book HTML/PDF download)
  - `BulkMcuPrintController` (Queue dispatch, status check & download for bulk MCU ZIP exports)
  - `ResultHandoverController` (Internal Ambil Hasil queue, 4 KPI cards, token extension, revocation & WhatsApp payload)
  - `OnlineResultPortalController` (Public gatekeeper verification, DOB/Phone validation, result viewer & official PDF download)
  - `RevenueReportController` (Revenue dashboard, 4 KPI cards, payer recap, method recap & Excel export)
  - `ExaminationReportController` (Exam volume dashboard, 4 KPI cards, service volume recap & Excel export)
- **UI Components & Pages:**
  - `resources/js/Components/AudiogramGrid.tsx` (Interactive Audiogram grid table, PTA auto-calculator & SVG vector chart)
  - `resources/js/Pages/Services/Index.tsx`
  - `resources/js/Pages/Services/Parameters.tsx` (Parameter builder with tabs for Reference Ranges & Auto-Rules)
  - `resources/js/Pages/Packages/Index.tsx` (Live calculator total & discount, service picker)
  - `resources/js/Pages/Patients/Index.tsx` (Master Pasien with fast CSV export & auto NRM)
  - `resources/js/Pages/Events/Index.tsx` (Event MCU corporate batch, doctors assignment, virtual background & bulk ZIP export progress modal)
  - `resources/js/Pages/Registrations/Index.tsx` (Pendaftaran 1 Pintu with live patient search, split billing calculator, detail modal, void modal, direct Kartu Kontrol print & Cetak Buku MCU)
  - `resources/js/Pages/Samples/Collect.tsx` (Modul Ambil Sampel with smart barcode scanner, camera barcode scan, 3 KPI cards, dynamic station tabs filtered by `user_sample_scopes`, sample rejection modal & Web Audio API beep)
  - `resources/js/Pages/Examinations/Index.tsx` (Queue antrean input hasil penunjang with category pills, status filter & progress tracking)
  - `resources/js/Pages/Examinations/Entry.tsx` (Dynamic single result entry by category tab, 1-click Isi Normal preset, live flag badges, BMI formula auto-calculator & diagnostic file uploader)
  - `resources/js/Pages/Examinations/Bulk.tsx` (Pusat download template & upload massal Excel hasil Lab/Audiometri/Fisik per Event MCU + riwayat log error)
  - `resources/js/Pages/Mcu/DoctorReview/Index.tsx` & `Show.tsx` (Doctor review queue, auto draft reset, fit status options, abnormality recap & preview buku MCU)
  - `resources/js/Pages/Mcu/ManagerReview/Index.tsx` & `Show.tsx` (Manager QC approval queue, lock mechanism & preview buku MCU)
  - `resources/js/Pages/Results/Index.tsx` (Internal Ambil Hasil queue with 4 KPI summary cards, token status filters, extension/revocation modals & WhatsApp direct share shortcut)
  - `resources/js/Pages/Portal/Verify.tsx` (Public gatekeeper verification form with DOB format DDMMYYYY & phone last 4 digits validation)
  - `resources/js/Pages/Portal/Status.tsx` (Public result status screen for expired or revoked tokens with clinic assistance details)
  - `resources/js/Pages/Portal/Show.tsx` (Verified public online patient portal with fit status banner, categorized results, live SVG audiogram, attachments & official PDF download)
  - `resources/js/Pages/Reports/Revenue.tsx` (Laporan Pendapatan Klinik with 4 KPI cards, tabs for daily payments, payer recap, method recap & Excel export)
  - `resources/js/Pages/Reports/Examinations.tsx` (Laporan Rekapitulasi Pemeriksaan with 4 KPI cards, item list, service volume/revenue recap & Excel export)
- **Blade Print Templates:**
  - `resources/views/prints/layouts/print_document.blade.php` (A4 HVS base print canvas, toolbar, zoom & print styles)
  - `resources/views/prints/control_card.blade.php` (Interactive preview toolbar, responsive A5/A6/A4_2IN1 layouts, print styles)
  - `resources/views/prints/partials/control_card_body.blade.php` (Dynamic Kop Surat, watermark, QR Code SVG, demographics, station checklist)
  - `resources/views/prints/partials/header_letterhead.blade.php` (Dynamic Kop Surat HVS & watermark)
  - `resources/views/prints/partials/patient_info_box.blade.php` (Structured demographic patient box)
  - `resources/views/prints/partials/footer_signatures.blade.php` (Digital doctor & analyst signatures with SIP)
  - `resources/views/prints/templates/standard_lab.blade.php` (Standard Laboratory result sheet with flag badges)
  - `resources/views/prints/templates/antigen.blade.php` (Surat Keterangan Rapid Swab Antigen SARS-CoV-2)
  - `resources/views/prints/templates/pcr.blade.php` (Surat Keterangan RT-PCR SARS-CoV-2 with CT value & target genes)
  - `resources/views/prints/templates/narkoba.blade.php` (Surat Keterangan Bebas Narkoba 6-parameter urine test)
  - `resources/views/prints/templates/radiology.blade.php` (Lembar Ekspertise Radiologi / Rontgen Thorax Sp.Rad)
  - `resources/views/prints/templates/electromedical.blade.php` (Lembar Elektromedis: EKG & Audiometri SVG Chart)
  - `resources/views/prints/templates/physical.blade.php` (Lembar Pemeriksaan Fisik Umum, Tanda Vital, Visus & Gigi)
  - `resources/views/prints/mcu_book/cover.blade.php` (Cover Buku MCU with event logo & participant photo)
  - `resources/views/prints/mcu_book/resume.blade.php` (Resume Medis Dokter MCU & Rekapitulasi Kelainan)
  - `resources/views/prints/mcu_book/book_wrapper.blade.php` (Consolidated multi-sheet MCU Book wrapper)
- **Routes:**
  - `/services` (index, store, update, toggle-status)
  - `/packages` (index, store, update, toggle-status)
  - `/services/{service}/parameters` (index, store, update, toggle-status, destroy)
  - `/services/{service}/parameters/{parameter}/reference-ranges` (store, update, destroy)
  - `/services/{service}/parameters/{parameter}/auto-rules` (store, update, destroy)
  - `/patients` (index, store, update, destroy, export)
  - `/mcu-events` (index, store, update, destroy, update-status)
  - `/mcu-events/{mcuEvent}/bulk-results` (bulk results center UI)
  - `/mcu-events/{mcuEvent}/bulk-results/template` (download pre-filled participant Excel template)
  - `/mcu-events/{mcuEvent}/bulk-results/import` (upload & chunk validate Excel results)
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
  - `/mcu/doctor-review` (queue review dokter MCU)
  - `/mcu/doctor-review/{registration}` (show & store review dokter MCU)
  - `/mcu/manager-review` (queue review manajer MCU)
  - `/mcu/manager-review/{registration}` (show, approve & unlock review manajer MCU)
  - `/registrations/{registration}/items/{item}/print` (HTML view cetak hasil per unit)
  - `/registrations/{registration}/items/{item}/pdf` (download/stream PDF cetak hasil per unit)
  - `/registrations/{registration}/mcu-book` (HTML view buku MCU lengkap)
  - `/registrations/{registration}/mcu-book/pdf` (download/stream PDF buku MCU lengkap + auto-merge FPDI)
  - `/mcu-events/{mcuEvent}/bulk-zip` (dispatch queued job ekspor massal ZIP buku MCU)
  - `/mcu-events/{mcuEvent}/bulk-zip/status` (polling progress status antrean ekspor ZIP)
  - `/mcu-events/{mcuEvent}/bulk-zip/download` (unduh berkas ZIP buku MCU event)
  - `/results` (queue antrean ambil hasil & filter status token)
  - `/results/{registration}/extend` (perpanjang masa aktif token +30 hari)
  - `/results/{registration}/revoke` (cabut akses token hasil online)
  - `/results/{registration}/generate-token` (generate token baru manual)
  - `/results/{registration}/whatsapp` (payload pesan WhatsApp dan direct link)
  - `/r/{token}` (portal publik gatekeeper & hasil pasien online)
  - `/r/{token}/verify` (verifikasi tanggal lahir HHBBMMPP atau 4 digit HP)
  - `/r/{token}/download-pdf` (unduh berkas PDF resmi ber-token)
  - `/reports/revenue` (dashboard laporan pendapatan klinik)
  - `/reports/revenue/export-excel` (ekspor Excel spreadsheet rincian & rekap pendapatan)
  - `/reports/examinations` (dashboard rekapitulasi pemeriksaan penunjang)
  - `/reports/examinations/export-excel` (ekspor Excel spreadsheet rincian item & rekap layanan)
  - `/audit-logs` (dashboard audit trail & log aktivitas perubahan data seluruh sistem)
- **Services & Actions:**
  - `app/Services/Audit/AuditLogService.php` (KPI summary, multi-filter, causer & subject extraction, data diff comparison)
- **Frontend Pages & Components:**
  - `resources/js/Pages/Audit/Index.tsx` (Linear/Stripe minimalist audit log viewer, event badges, dynamic filter bar, diff modal JSON/table toggle)
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
  - `tests/Feature/BulkExcelImportTest.php` (7/7 passed, 34 assertions)
  - `tests/Feature/McuReviewTest.php` (7/7 passed, 42 assertions)
  - `tests/Feature/SpecificPrintTemplateTest.php` (10/10 passed, 43 assertions)
  - `tests/Feature/McuBookPrintTest.php` (4/4 passed, 27 assertions)
  - `tests/Feature/BulkMcuZipExportTest.php` (4/4 passed, 19 assertions)
  - `tests/Feature/OnlineResultTokenTest.php` (14/14 passed, 99 assertions)
  - `tests/Feature/ReportTest.php` (8/8 passed, 84 assertions)
  - `tests/Feature/AuditLogTest.php` (4/4 passed, 26 assertions)
  - `tests/Feature/EndToEndWorkflowTest.php` (1/1 passed, 73 assertions)
  - `tests/Feature/ExampleTest.php` (1/1 passed)
  - Total: **145/145 tests passing (977 assertions)**

---

## 5. Refinement Milestones (Tahap R)

### Tahap R1: Layout, Persistent Sidebar, Skala UI & Anti AI-Slop (Completed)
- **Fluid Layout 2K/FHD/Mobile:** Menghapus seluruh batasan `max-w-7xl` / `container mx-auto` pada wrapper utama, dashboard, dan tabel. Diganti dengan canvas fluid `w-full max-w-none` dan responsive padding `p-4 md:p-6 2xl:p-8`.
- **Inertia Persistent Layout:** Layout `<AuthenticatedLayout>` dibungkus via stable reference di `resources/js/app.tsx`. Navigasi antar halaman tidak lagi me-remount sidebar, scrollbar sidebar stabil, dan parent accordion aktif tetap terbuka.
- **Sidebar & Responsivitas:** Lebar sidebar desktop `w-[264px] 2xl:w-[272px]`, collapsible ke icon-only `w-16`, dan drawer `w-72` pada layar `< lg`.
- **Struktur Menu Klinik:** Menata 8 kelompok menu operasional klinik dengan 3 accordion parent di DATA MASTER (`Master Pemeriksaan`, `Master Pendaftaran`, `Master Umum`), accordion di LAPORAN (`Pendapatan`, `Pemeriksaan`), dan LAINNYA.
- **Skala UI Operator:** Font sidebar `text-[15px]`, padding `py-2.5 px-3.5`, ikon `w-5 h-5`. Input, select & button minimal `h-10` (`40px`), tabel dengan zebra stripe halus, dan `tabular-nums` pada seluruh kolom numerik.
- **Anti AI-Slop:** Audit dan pembersihan seluruh subtitle panjang di bawah header halaman dan modal. Istilah direct Bahasa Indonesia 1–3 kata (`Tambah Data`, `Ubah`, `Hapus`, `Aktifkan`, `Nonaktifkan`, `Simpan`, `Batal`).

### Tahap R2: Alur Master Pemeriksaan & Integrasi Event Paket MCU (Completed)
- **Pemisahan Kategori Master Pemeriksaan:**
  - Halaman `Sampel`: 4 kolom bersih (`No`, `Nama Sampel`, `Status`, `Aksi`) dengan tombol aksi langsung `Ubah` dan `Nonaktifkan / Aktifkan`.
  - 4 Kategori Layanan (`Laboratorium`, `Radiologi`, `Elektromedis`, `Pemeriksaan Fisik`): 7 kolom baku (`Nama Layanan`, `Sampel`, `Tarif`, `Status`, `User Update`, `Waktu Update`, `Aksi`).
  - Kolom `Aksi` menyediakan 3 akses langsung: **Parameter** (membuka manajemen parameter, nilai rujukan, dan aturan kesimpulan), **Ubah** (modal edit layanan), dan **Nonaktifkan / Aktifkan** (toggle status).
  - Controller `ServiceController`: eager loading `with(['sample', 'updater'])` mencegah N+1 queries, dan redirect mempertahankan query param `category`.
- **Integrasi Event Master Tarif Paket -> Data MCU:**
  - Tabel `Master Tarif Paket`: 9 kolom operasional (`Nama Perujuk`, `Tahun`, `Event`, `Nama Paket`, `Tarif Total`, `Diskon`, `Tarif Akhir`, `Status`, `Aksi`).
  - Modal Form Tambah/Ubah Tarif Paket: urutan field terstruktur (`Perujuk`, `Tahun`, `Nama Event` dengan datalist pilihan event yang sudah ada, `Nama Paket`, pemilih layanan dengan auto-sum tarif total, dan `Diskon (Rp)` dengan auto-hitung tarif akhir).
  - Hubungan Form Tambah MCU (`Events/Index.tsx`): `McuEventController` menyediakan daftar event dari paket pemeriksaan (`packageEvents`). Saat Admin memilih `Tahun` dan `Perujuk`, input `Nama Event MCU` otomatis menyarankan daftar event yang cocok via `<datalist>` dan tombol pilih cepat, dengan tetap mendukung input manual bebas.
- **Verifikasi Build:** `npm run build` sukses 100% dengan 0 error TypeScript / Vite bundling.

### Tahap R3: Pendaftaran Peserta MCU, Webcam Check-In & Cetak Stiker/Kartu (Completed)
- **Database & Model:**
  - Migrasi `2026_11_25_160000_update_registrations_allow_pending_and_nullable_reg_no`: kolom `reg_no` dan `registered_at` nullable, menambahkan status enum `'pending'` (Belum Daftar) pada `workflow_status`.
  - Model `Registration`: hook `creating` tidak meng-generate `reg_no` saat status masih `pending`.
- **Aksi Import Pasien di Data MCU -> MCU:**
  - Menambahkan menu `Import Pasien` di dropdown aksi per baris Event MCU ([Events/Index.tsx](file:///d:/laragon/www/mastersummit/resources/js/Pages/Events/Index.tsx)).
- **Halaman Data Pasien MCU ([Events/Participants/Index.tsx](file:///d:/laragon/www/mastersummit/resources/js/Pages/Events/Participants/Index.tsx)):**
  - Tabel 9 kolom: `No`, `Aksi`, `No. Registrasi`, `Nama`, `Tgl Lahir`, `JK`, `Bagian`, `Paket`, `Status` (`Belum Daftar` / `Terdaftar`).
  - Dropdown 7 Aksi per Baris: `Daftar`, `Label Lab`, `Label Non Lab`, `Cetak Kartu`, `Cetak Kartu Kontrol`, `Ubah`, `Hapus`.
  - Validasi cetak: jika peserta belum klik `Daftar`, sistem memunculkan pemberitahuan untuk mendaftar terlebih dahulu.
- **Modal Form Daftar (Webcam + Opsi Ganti Paket):**
  - 4 field ringkas: `Event MCU` (readonly), `Tanggal` (date picker), `Foto` (live webcam capture `getUserMedia` + retake + fallback upload file), dan `Paket` (dropdown paket yang bisa diubah di lokasi).
  - Backend `checkIn` (dalam `DB::transaction()`): simpan foto ke storage, update paket, generate `reg_no` resmi, ubah status ke `registered`, dan otomatis membongkar seluruh layanan paket ke `registration_items`.
- **Ekspor/Impor Template & Cetak Stiker/Kartu:**
  - `McuParticipantImportService` & `McuParticipantsTemplateExport`: download template & import massal Excel/CSV peserta MCU dengan pencatatan log.
  - `PrintLabelController` & Blade views (`label_lab.blade.php`, `label_non_lab.blade.php`, `participant_card.blade.php`): cetak stiker thermal barcode 50x30mm dan kartu tanda peserta MCU 85x54mm.
- **Verifikasi:** 5/5 unit & feature tests di `McuParticipantTest` lulus 100%, `npm run build` sukses tanpa error.
