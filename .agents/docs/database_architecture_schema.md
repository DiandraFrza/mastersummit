# Architecture & Database Schema (28 Tables — 7 Domains)

Target RDBMS: **PostgreSQL** (`jsonb`, `pg_trgm`). *(For MySQL 8 local fallback, substitute `jsonb` with `json`.)*

## Global Database Conventions
- **Master Tables:** Use `is_active` (`boolean`, default `true`) instead of hard delete. Track `created_by`, `updated_by`, `timestamps` via Laravel Model Observer.
- **Transaction Tables:** Use `SoftDeletes` (`deleted_at`) + `spatie/laravel-activitylog` for before/after value auditing.
- **Historical Snapshots:** Copy prices, service names, units, and reference ranges into transaction rows upon creation/save.

---

## Domain A: Auth, Multi-Role RBAC Checklist & Station Scope

| # | Table | Key Columns & Relationships | Purpose |
| :--- | :--- | :--- | :--- |
| 1 | `employees` | `id`, `nik` (unique), `nip`, `sip`, `name`, `address`, `phone`, `email`, `job_title`, `signature_path`, `stamp_path`, `is_active`, `created_by`, `updated_by`, `timestamps` | Master staff, doctors, analysts, QC, and digital PNG signatures/stamps for PDF output. |
| 2 | `users` | `id`, `employee_id` (FK nullable), `name`, `username` (unique), `email` (unique), `password`, `avatar_path`, `is_active`, `last_login_at`, `created_by`, `updated_by`, `timestamps` | Login accounts linked to employees. |
| 3 | `roles` / `permissions` / pivots | Standard `spatie/laravel-permission` tables (`roles`, `permissions`, `model_has_roles`, `model_has_permissions`, `role_has_permissions`) | Supports multi-role assignment (e.g., Lab + Radiology) + individual checkbox overrides (`{module}.{action}`). |
| 4 | `user_sample_scopes` | `id`, `user_id` (FK), `sample_id` (FK -> `samples`) | Controls which `Ambil Sampel` stations appear for an operator and filters Smart Barcode scans automatically. |

---

## Domain B: Clinic & Dynamic HVS Print Settings

| # | Table | Key Columns & Relationships | Purpose |
| :--- | :--- | :--- | :--- |
| 5 | `clinic_settings` | `id`, `clinic_name`, `clinic_subtitle`, `izin_klinik_no`, `address`, `city`, `phone`, `email`, `website`, `logo_path`, `watermark_path`, `watermark_opacity` (default `0.08`), `header_layout_json` (jsonb), `footer_text`, `control_card_paper_size` (`A5`, `A6`, `A4_2IN1`), `mcu_cover_template` (jsonb), `default_online_expiry_days` (default `30`), `updated_by`, `timestamps` | Configurable letterhead, watermark, footer, Control Card size, and MCU cover for printing directly on plain white HVS paper. |

---

## Domain C: Master Data (Clinic, Referrers, Services, Packages)

| # | Table | Key Columns & Relationships | Purpose |
| :--- | :--- | :--- | :--- |
| 6 | `units` | `id`, `code`, `name`, `address`, `phone`, `is_active`, `updated_by`, `timestamps` | Clinic branches / operational units. |
| 7 | `companies` | `id`, `branch_code`, `name`, `logo_path`, `address`, `city`, `phone`, `email`, `website`, `director_name`, `is_active`, `updated_by`, `timestamps` | Client corporations & branch entities (toggle active/inactive only). |
| 8 | `referrer_types` | `id`, `name`, `code`, `is_active`, `updated_by`, `timestamps` | Referrer categories (APS, Perusahaan, Dokter Umum/Spesialis, Bidan, Dokter Gigi, Puskesmas, Komunitas). |
| 9 | `referrers` | `id`, `referrer_type_id` (FK), `company_id` (FK nullable), `name`, `pic_name`, `phone`, `email`, `address`, `marketing_name`, `fee_general_percent`, `fee_special_note`, `marketing_note`, `is_active`, `updated_by`, `timestamps` | Master perujuk including marketing and commission terms. |
| 10 | `banks` | `id`, `name`, `account_number`, `account_holder`, `is_active`, `updated_by`, `timestamps` | Bank accounts for transfer / QRIS / EDC payments. |
| 11 | `vendors` | `id`, `code`, `name`, `npwp`, `address`, `phone`, `email`, `website`, `contract_number`, `contract_type`, `pic_name`, `pic_phone`, `is_active`, `updated_by`, `timestamps` | External lab partners & equipment vendors. *(Note: `jenis_barang` and `barang` modules are intentionally excluded.)* |
| 12 | `samples` | `id`, `code`, `name`, `category` (`lab`, `radiology`, `electromedical`, `physical`), `sort_order`, `is_active`, `updated_by`, `timestamps` | Dynamic specimen & execution stations (Darah EDTA, Darah CA/Plain, 2 Jam PP, Audiometri, Rontgen, EKG, Dokter Gigi, Spirometri, USG, etc.). |
| 13 | `services` | `id`, `code`, `name`, `category` (`lab`, `radiology`, `electromedical`, `physical`), `sub_group`, `sample_id` (FK), `base_price` (decimal 15,2), `print_template` (`standard_lab`, `antigen`, `pcr`, `narkoba`, `radiology`, `electromedical`, `physical`), `is_active`, `updated_by`, `timestamps` | Unified examination catalog with specific print template mapping. |
| 14 | `packages` | `id`, `referrer_id` (FK nullable), `year` (smallint), `event_label`, `name`, `total_price`, `discount_amount`, `final_price`, `is_active`, `updated_by`, `timestamps` | Master Tarif Paket with auto-calculated total minus discount. |
| 15 | `package_items` | `id`, `package_id` (FK), `service_id` (FK), `item_price_override` (decimal nullable) | Many-to-many breakdown of services inside a package. |

---

## Domain D: Dynamic Parameter & Auto-Rule Engine

| # | Table | Key Columns & Relationships | Purpose |
| :--- | :--- | :--- | :--- |
| 16 | `service_parameters` | `id`, `service_id` (FK), `code` (slug), `label`, `group_name`, `input_type` (`number`, `text`, `textarea`, `select`, `formula`, `audiogram_grid`, `checkbox_group`), `unit`, `options_json` (jsonb), `formula_expression`, `default_normal_text`, `sort_order`, `is_required`, `is_active`, `updated_by`, `timestamps` | Admin-configurable fields inside each examination (e.g., Hemoglobin, GDP, BMI formula, RO template, Audiogram grid). |
| 17 | `parameter_reference_ranges` | `id`, `parameter_id` (FK), `gender` (`ALL`, `L`, `P`), `min_age_years`, `max_age_years`, `min_value` (decimal nullable), `max_value` (decimal nullable), `normal_text_value`, `display_reference` | Normal ranges dynamically resolved by patient gender and age. |
| 18 | `parameter_auto_rules` | `id`, `parameter_id` (FK), `condition_operator` (`<`, `<=`, `>`, `>=`, `==`, `!=`, `between`, `contains`), `compare_value_1`, `compare_value_2`, `gender` (`ALL`, `L`, `P`), `flag_status` (`normal`, `low`, `high`, `abnormal`, `critical`), `auto_conclusion`, `auto_suggestion`, `include_in_abnormality_recap` (boolean), `priority`, `is_active` | Evaluates flags, fills default conclusion & advice, and feeds `REKAPITULASI KELAINAN` automatically. |

---

## Domain E: MCU Events, Patients, Single-Door Registration & Split Billing

| # | Table | Key Columns & Relationships | Purpose |
| :--- | :--- | :--- | :--- |
| 19 | `mcu_events` | `id`, `year`, `event_code`, `event_name`, `referrer_id` (FK), `company_id` (FK nullable), `target_participants`, `city`, `virtual_bg_path`, `pic_mcu_id`, `doctor_anamnese_id`, `doctor_lab_id`, `doctor_radiology_id`, `doctor_electromedical_id`, `doctor_ekg_id`, `doctor_audiometry_id`, `printed_by_id`, `validator_id`, `qc1_id`, `qc2_id` (all FK -> `employees`), `status` (`draft`, `ongoing`, `review`, `completed`, `closed`), `created_by`, `updated_by`, `deleted_at`, `timestamps` | Corporate MCU event batch configuration, assigned medical team, QC signers, and patient photo virtual background. |
| 20 | `patients` | `id`, `medical_record_no` (NRM unique), `nik` (indexed), `name`, `gender` (`L`/`P`), `birth_date`, `address`, `phone`, `email`, `photo_path`, `default_company_id` (FK nullable), `default_department`, `created_by`, `updated_by`, `deleted_at`, `timestamps` | Master patient registry. |
| 21 | `registrations` | `id`, `reg_no` (unique barcode value), `registered_at`, `patient_id` (FK), `service_type` (`regular`, `mcu`), `payer_type` (`aps`, `corporate`, `referrer`), `referrer_id` (FK nullable), `company_id` (FK nullable), `mcu_event_id` (FK nullable), `package_id` (FK nullable), `department_snapshot`, `age_years_snapshot`, `total_amount`, `discount_amount`, `grand_total`, `paid_amount`, `remaining_amount`, `payment_status` (`unpaid`, `partial`, `paid`, `corporate_billed`), `workflow_status` (`registered`, `in_progress`, `result_entered`, `doctor_reviewed`, `manager_approved`, `completed`, `void`), `void_reason`, `voided_by`, `voided_at`, `created_by`, `updated_by`, `deleted_at`, `timestamps` | Unified registration transaction header for Regular, MCU Corporate, APS, and Referrer patients. |
| 22 | `registration_items` | `id`, `registration_id` (FK), `service_id` (FK), `service_name_snapshot`, `category`, `sample_id` (FK), `price_snapshot`, `discount_amount`, `final_price`, `is_from_package`, `billed_to` (`corporate`, `personal`, `referrer`), `sample_status` (`pending`, `taken`, `rejected`), `sample_taken_at`, `sample_taken_by` (FK), `result_status` (`pending`, `draft`, `entered`, `verified`), `result_entered_at`, `result_entered_by` (FK), `group_conclusion`, `group_suggestion`, `timestamps` | Unpacked package items + add-ons, split billing per item, specimen check-in tracking, and per-item result progress. |

---

## Domain F: Examination Results, Tool Attachments & MCU Review

| # | Table | Key Columns & Relationships | Purpose |
| :--- | :--- | :--- | :--- |
| 23 | `examination_results` | `id`, `registration_id` (FK), `registration_item_id` (FK), `parameter_id` (FK), `value_numeric` (decimal nullable), `value_text`, `value_json` (jsonb — e.g., Audiogram AC/BC frequencies & PTA), `unit_snapshot`, `reference_snapshot`, `flag_status`, `auto_conclusion`, `auto_suggestion`, `is_manually_overridden` (boolean), `input_source` (`web_single`, `excel_bulk`), `updated_by`, `timestamps` | Dynamic parameter values supporting both web single input and bulk Excel imports. |
| 24 | `result_attachments` | `id`, `registration_id` (FK), `registration_item_id` (FK nullable), `attachment_type` (`ekg_pdf`, `spiro_pdf`, `radiology_img`, `audiometry_pdf`, `other`), `file_path`, `original_filename`, `mime_type`, `file_size`, `merge_into_mcu_pdf` (boolean default `true`), `sort_order`, `uploaded_by`, `timestamps` | Uploaded outputs from offline diagnostic machines, auto-merged into the final MCU PDF book. |
| 25 | `mcu_reviews` | `id`, `registration_id` (FK unique), `abnormality_recap`, `fit_status` (`fit`, `fit_with_note`, `temporary_unfit`, `unfit`, `pending`), `doctor_summary`, `doctor_advice`, `doctor_reviewed_by`, `doctor_reviewed_at`, `doctor_notes`, `manager_approved_by`, `manager_approved_at`, `manager_notes`, `is_locked` (boolean default `false`), `timestamps` | Consolidated abnormality recap, Doctor MCU medical review, and Manager MCU final QC + lock. |

---

## Domain G: 30-Day Online Portal, Payments & Bulk Import Logs

| # | Table | Key Columns & Relationships | Purpose |
| :--- | :--- | :--- | :--- |
| 26 | `online_result_tokens` | `id`, `registration_id` (FK), `token` (string 64, unique), `verification_type` (`dob`, `phone_last4`), `expires_at`, `is_revoked` (boolean), `access_count`, `last_accessed_at`, `last_accessed_ip`, `extended_by`, `extended_at`, `timestamps` | Secure tokenized patient result link valid for 30 days with admin extension support. |
| 27 | `payments` | `id`, `registration_id` (FK nullable), `mcu_event_id` (FK nullable), `payment_no` (unique), `paid_at`, `amount`, `payment_method` (`cash`, `transfer`, `qris`, `edc`, `invoice_corporate`), `bank_id` (FK nullable), `reference_no`, `notes`, `received_by`, `deleted_at`, `timestamps` | Supports DP, installments, walk-in APS cashier, and bulk corporate MCU invoices. |
| 28 | `excel_import_logs` | `id`, `mcu_event_id` (FK), `import_type` (`participants`, `lab_results`, `audiometry`, `physical`), `file_path`, `total_rows`, `success_rows`, `failed_rows`, `error_details_json` (jsonb), `uploaded_by`, `timestamps` | Tracks bulk Excel uploads per MCU event with per-row error reporting. |

---

## Workflow State Machine (`registrations.workflow_status`)

1. **`registered`** — Patient registered, package unpacked into `registration_items`, Control Card printable.
2. **`in_progress`** — Triggered when at least 1 station scans barcode in `Ambil Sampel`.
3. **`result_entered`** — Triggered when all `registration_items` reach `result_status = entered/verified`.
   - *If `service_type = regular`* -> jumps directly to **`completed`** upon final verification.
   - *If `service_type = mcu`* -> proceeds to step 4.
4. **`doctor_reviewed`** — Doctor MCU verifies `abnormality_recap`, sets `fit_status`, summary, and advice.
5. **`manager_approved`** — Manager MCU completes QC and locks the record (`is_locked = true`).
6. **`completed`** — Auto-generates `online_result_tokens` (`+30 days`), enables PDF/MCU Book download & WA share in `Ambil Hasil`, and locks figures for Revenue & Exam Reports.
- **Emergency Branch (`void`):** Allowed from steps 1–3 by authorized Admin with mandatory `void_reason` (never hard deleted).

---

## Performance & Indexing Checklist
- `registrations`: Composite indexes on `(registered_at, workflow_status)`, `(mcu_event_id, workflow_status)`, `(referrer_id, registered_at)`, unique on `reg_no`.
- `registration_items`: Composite index on `(sample_id, sample_status)` for sub-20ms `Ambil Sampel` dashboards.
- `patients`: Indexes on `medical_record_no`, `nik`, and `name` (`pg_trgm` GIN index on PostgreSQL for fast `%keyword%` search).
- `examination_results`: Unique composite index on `(registration_item_id, parameter_id)` for fast atomic bulk upserts.
- **Queue Workers:** Bulk MCU PDF/ZIP generation and 500-row Excel imports run asynchronously via Laravel Queue.