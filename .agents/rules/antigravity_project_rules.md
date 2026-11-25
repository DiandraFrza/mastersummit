---
trigger: always_on
---

# Antigravity Workspace Rules — Clinic, Lab & MCU Management System

## 1. Mandatory Reading & Agent Workflow
Before creating any migration, model, controller, service, or UI component, you **MUST** read:
1. `docs/ARCHITECTURE_DB.md` — Single source of truth for all 28 tables, relations, enums, indexes, and state machine.
2. `docs/PROGRESS.md` — Current build phase, completed files/routes, and the exact next micro-task.

### Strict Agent Execution Protocol
- **Plan Before Coding:** For every micro-task, present a concise implementation plan (exact files to create/modify) and wait for confirmation unless explicitly told to execute immediately.
- **Micro-Task Discipline:** Never build multiple phases at once. Complete only the requested micro-task cleanly.
- **Zero Schema Hallucination:** Never invent column names, table names, or enum values outside `docs/ARCHITECTURE_DB.md` without explicit user approval.
- **Session Handoff:** When a task is verified working, update `docs/PROGRESS.md` (check off completed items and log created routes/models/components).

---

## 2. Tech Stack (Modern Monolith — Fast & Zero Lag)
- **Backend:** Laravel 11/12 (PHP 8.3+), thin controllers with `app/Services/` & `app/Actions/`.
- **Bridge:** Inertia.js (SPA navigation, Smart URLs, zero separate REST API boilerplate).
- **Frontend:** React 18+ with strict TypeScript (no `any`) + Tailwind CSS.
- **Database:** PostgreSQL (`jsonb` & `pg_trgm`). *Fallback: MySQL 8 (`json`) if running locally on Laragon MySQL.*
- **Tables & Lists:** `@tanstack/react-table` + `@tanstack/react-virtual`.
- **RBAC & Audit:** `spatie/laravel-permission` + `spatie/laravel-activitylog`.
- **Excel Bulk Ops:** `maatwebsite/excel` (pre-filled templates + chunked validated imports).
- **Print, PDF & Barcode:** `spatie/browsershot` (HTML/CSS to PDF), `setasign/fpdi` (auto-merge uploaded tool PDFs), `JsBarcode` / `picqer/php-barcode-generator`.
- **Motion & Animation:**
  - **Internal Dashboard:** Framer Motion ONLY for lightweight micro-interactions (modal, drawer, tab indicator, toast; `150ms–200ms`). **FORBIDDEN:** Do NOT install Lenis or heavy GSAP scroll animations inside internal dashboard/table pages.
  - **Public Pages / Online Result Portal (`/r/{token}`):** Subtle Framer Motion / GSAP and Lenis are allowed.

---

## 3. Non-Negotiable Business & Data Safety Rules
1. **No Hard Delete on Crucial Data:**
   - **Master Data** (`services`, `packages`, `companies`, `referrers`, `employees`, `users`, `samples`, `banks`, `vendors`): ONLY allow `is_active` toggle (Aktif / Non-Aktif). No permanent delete button.
   - **Medical & Financial Transactions** (`registrations`, `patients`, `mcu_events`, `payments`): Must use `SoftDeletes` (`deleted_at`). Cancelling a registration MUST use status `void` + mandatory `void_reason` modal input.
   - **Hard Delete:** Strictly restricted to Super Admin on clean draft records with 0 relations.
   - **Audit Trail:** Enable `LogsActivity` on all transactions, results, MCU reviews, and master tariff/parameter updates.
2. **Historical Data Snapshots:**
   - On registration (`registration_items`), unpack every package item into individual rows and snapshot `service_name_snapshot` and `price_snapshot`.
   - On result entry (`examination_results`), snapshot `unit_snapshot` and `reference_snapshot`. Future master edits must NEVER mutate past patient records.
3. **Single-Door Registration & Split Billing:**
   - All patients (Regular, Corporate MCU, APS, Referrer/Puskesmas) enter via `registrations`.
   - `billed_to` (`corporate`, `personal`, `referrer`) lives on `registration_items` so a corporate MCU patient can add personal (APS) tests under one `reg_no`.
4. **Dynamic Parameter & Auto-Rule Engine:**
   - Result forms for Lab, Radiology, Electromedical, and Physical exams MUST render dynamically from `service_parameters`.
   - Flag evaluation (`normal`, `low`, `high`, `abnormal`, `critical`), auto-conclusion, auto-suggestion, and auto-abnormality recap are computed automatically via `parameter_reference_ranges` (gender & age) + `parameter_auto_rules`, while remaining manually editable by authorized staff/doctors.
5. **Dual-Mode Result Input:**
   - **Single Mode (Web):** Category tabs (NEVER one giant horizontal table), 1-click "Isi Normal" preset button for RO/EKG/Physical, live SVG **Audiogram Chart** (Red O / Blue X) for Audiometry, and drag-and-drop PDF/JPG attachment upload.
   - **Bulk Mode (MCU Event Excel):** Download **pre-filled** Excel templates (`No. Reg`, `NIK`, `Nama`) per MCU Event, upload back with row-level validation and logging in `excel_import_logs`.
6. **Multi-Role RBAC Matrix & Smart Barcode:**
   - Users support multiple roles simultaneously + granular checkbox permission overrides.
   - Sidebar menu, result input category tabs, and `Ambil Sampel` stations (1 single sidebar menu with dynamic station pills/dropdown, NOT 20+ sidebar submenus) automatically filter based on user permissions and `user_sample_scopes`.
   - Scanning barcode `reg_no` in `Ambil Sampel` auto-filters items matching the logged-in operator's station scope.
7. **MCU Workflow Lock & 30-Day Online Results:**
   - Strict MCU flow: `registered` -> `in_progress` -> `result_entered` -> `doctor_reviewed` -> `manager_approved` (`is_locked = true`) -> `completed`.
   - Reaching `completed` auto-generates `online_result_tokens` (`expires_at = now() + 30 days`).
   - Public portal `/r/{token}` requires lightweight verification (DOB `DDMMYYYY` or last 4 digits of phone) without account login. Admin has a `Perpanjang Akses (+30 Hari)` action.
8. **Dynamic Print Engine (Plain White HVS + Configurable Letterhead):**
   - Control Card (`A5`, `A6`, `A4_2IN1`), specific lab sheets (`standard_lab`, `antigen`, `pcr`, `narkoba`), and complete MCU Books (Cover + Doctor Resume + Unit Results + auto-merged uploaded tool PDFs) pull letterhead, logo, subtle watermark, footer, and doctor signatures dynamically from `clinic_settings` and `mcu_events`.
   - Bulk MCU PDF/ZIP exports MUST run via Laravel Queue.

---

## 4. UI/UX Design System (Strict Minimalist — Anti AI-Slop)
Target visual benchmark: **Linear / Stripe / Vercel** — crisp, fast, high-clarity medical workspace.

- **Persistent Layout & Navigation Architecture:**
  - Sidebar and top bar live in a persistent layout (`resources/js/app.tsx`). Page navigation MUST NEVER remount or refresh the sidebar or reset scroll position.
  - Active parent dropdowns in the sidebar auto-expand based on the current URL.
  - Strict sidebar hierarchy matching clinical workflow:
    - HALAMAN UTAMA: `Dashboard`
    - DATA MASTER: `Master Pemeriksaan` (accordion), `Master Pendaftaran` (accordion), `Master Umum` (accordion)
    - ADMIN: `Pendaftaran`
    - PENDAFTARAN: `Pasien`, `Pendaftaran`, `Ambil Hasil`
    - DATA MCU: `MCU`, `Hasil MCU`, `Input Hasil MCU`, `Review Manajer MCU`, `Review Dokter MCU`, `Ambil Sampel`
    - DATA HASIL PENUNJANG: `Laboratorium`, `Radiologi`, `Elektromedis`, `Fisik`
    - LAPORAN: `Pendapatan` (accordion), `Pemeriksaan` (accordion)
    - LAINNYA: `Kartu Kontrol`, `Pengaturan` (accordion)
- **Clinical Operator UI Scale (Readable & Anti-Salah Klik):**
  - Sidebar links & accordions: `text-[15px]` with comfortable padding `py-2.5 px-3.5` and clear `w-5 h-5` icons.
  - DataTable headers: `text-xs font-semibold uppercase tracking-wider py-3.5 px-4`.
  - DataTable rows: `text-sm py-3.5 px-4` with subtle zebra striping (`even:bg-zinc-50/70`) and clear hover state (`hover:bg-zinc-100/70`).
  - Inputs, select dropdowns & buttons: minimum height `h-10` (`40px`), `text-sm font-medium`.
  - Primary create buttons: `h-10 px-4 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-sm`.
  - Row action dropdown items: `px-3.5 py-2.5 text-sm` with `w-4 h-4` icons.
- **Zero AI-Slop & Direct Indonesian Terminology (STRICT BAN):**
  - **FORBIDDEN:** Long explanatory subtitle paragraphs beneath page headers. Keep page headers clean: single concise title `<h1>` (e.g. `Master Sampel`, `Data Pasien`, `Pendaftaran Pasien`).
  - **FORBIDDEN:** Confusing mixed-language terms or buzzwords (`advice`, `workflow`, `snapshot`, `atau`, `untuk`, excessive `/` and `\`).
  - **MANDATORY:** Direct, concise 1–3 word Indonesian terms: `Tambah Data`, `Cari`, `Terapkan`, `Reset`, `Ubah`, `Hapus`, `Aktifkan`, `Nonaktifkan`, `Simpan`, `Batal`, `Aksi`, `Semua`.
- **Surfaces & Borders:**
  - App canvas: `#FAFAFA` (`bg-zinc-50`).
  - Content / Table / Modal surface: `#FFFFFF` (`bg-white`).
  - Borders: Clean hairline `1px solid` (`border-zinc-200`) with consistent `rounded-sm` corners.
  - **FORBIDDEN:** Nested cards inside cards, heavy drop shadows, checkered/patterned backgrounds, bright neon/purple AI gradients, or unnecessary decorative borders.
- **Typography & Data Clarity:**
  - Primary font: `Public Sans` or `Inter`.
  - **MANDATORY `tabular-nums`** on all numeric columns (prices, lab values, ages, dates, `reg_no`, totals) so digits align vertically.
- **Status Badges:**
  - Subtle tinted badges with crisp semantic icons (e.g., checkmark, clock, warning icon — not plain dull dots or loud solid neon blocks).
- **Validation:**
  - Dedicated Laravel `FormRequest` for every write endpoint.
  - Inline red error message directly beneath the invalid field + auto-focus on the first invalid input.

---

## 5. Standard Reusable `<DataTable />` & Smart URL Spec
Every index table across the app MUST use a shared `<DataTable />` component with:
- **100% Server-Side:** Debounced search (`300ms`), multi-filters (Date, Year, Referrer, Event, Status), column sorting, and pagination handled by Laravel queries.
- **Entries Selector:** `10, 20, 50, 100, 300, 500`.
- **Row Virtualization:** Automatically engage `@tanstack/react-virtual` when `per_page >= 100` to keep 300–500 rows locked at 60fps.
- **Smart URL Query Sync:** Sync all filters, search, sort, `per_page`, and `page` to URL query parameters via `router.get(..., { preserveState: true, preserveScroll: true, replace: true })`.
- **Sticky Header & Clean Density:** `sticky top-0 bg-zinc-50/95 backdrop-blur`, comfortable row height (`py-2.5 px-3`), and minimalist empty states.

---

## 6. Engineering Quality Standards
- Wrap multi-table mutations (Registration + Package Unpack, Result Save + Auto-Rule Eval, Payments, Bulk Excel Import) in `DB::transaction()`.
- Prevent N+1 queries with explicit `with()` eager loading and column `select()` on index endpoints.
- Keep Inertia TypeScript props strictly typed in `resources/js/types/`.