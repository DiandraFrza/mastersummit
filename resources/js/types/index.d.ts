export interface Employee {
    id: number;
    nik: string;
    nip?: string | null;
    sip?: string | null;
    name: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    job_title?: string | null;
    signature_path?: string | null;
    stamp_path?: string | null;
    is_active: boolean;
    created_by?: number | null;
    updated_by?: number | null;
    created_at?: string;
    updated_at?: string;
}

export interface User {
    id: number;
    employee_id?: number | null;
    name: string;
    username: string;
    email: string;
    avatar_path?: string | null;
    is_active: boolean;
    last_login_at?: string | null;
    roles?: Array<{ id: number; name: string }>;
    permissions?: Array<{ id: number; name: string }>;
    employee?: Employee | null;
    created_at?: string;
    updated_at?: string;
}

export interface ClinicSetting {
    id: number;
    clinic_name: string;
    clinic_subtitle?: string | null;
    izin_klinik_no?: string | null;
    address?: string | null;
    city?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    logo_path?: string | null;
    watermark_path?: string | null;
    watermark_opacity: number;
    header_layout_json?: Record<string, any> | null;
    footer_text?: string | null;
    control_card_paper_size: 'A5' | 'A6' | 'A4_2IN1';
    mcu_cover_template?: Record<string, any> | null;
    default_online_expiry_days: number;
    updated_by?: number | null;
    updated_at?: string;
}

export interface UserSampleScope {
    id: number;
    user_id: number;
    sample_id: number;
    created_at?: string;
    updated_at?: string;
}

export interface Unit {
    id: number;
    code: string;
    name: string;
    address?: string | null;
    phone?: string | null;
    is_active: boolean;
    created_by?: number | null;
    updated_by?: number | null;
    created_at?: string;
    updated_at?: string;
}

export interface Company {
    id: number;
    branch_code?: string | null;
    name: string;
    logo_path?: string | null;
    address?: string | null;
    city?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    director_name?: string | null;
    is_active: boolean;
    referrers_count?: number;
    created_by?: number | null;
    updated_by?: number | null;
    created_at?: string;
    updated_at?: string;
}

export interface ReferrerType {
    id: number;
    name: string;
    code: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface Referrer {
    id: number;
    referrer_type_id: number;
    company_id?: number | null;
    name: string;
    pic_name?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    marketing_name?: string | null;
    fee_general_percent: number | string;
    fee_special_note?: string | null;
    marketing_note?: string | null;
    is_active: boolean;
    referrer_type?: ReferrerType | null;
    company?: Company | null;
    created_by?: number | null;
    updated_by?: number | null;
    created_at?: string;
    updated_at?: string;
}

export interface Bank {
    id: number;
    name: string;
    account_number: string;
    account_holder: string;
    is_active: boolean;
    created_by?: number | null;
    updated_by?: number | null;
    created_at?: string;
    updated_at?: string;
}

export interface Vendor {
    id: number;
    code: string;
    name: string;
    npwp?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    contract_number?: string | null;
    contract_type?: string | null;
    pic_name?: string | null;
    pic_phone?: string | null;
    is_active: boolean;
    created_by?: number | null;
    updated_by?: number | null;
    created_at?: string;
    updated_at?: string;
}

export interface Sample {
    id: number;
    code: string;
    name: string;
    category: 'lab' | 'radiology' | 'electromedical' | 'physical';
    sort_order: number;
    is_active: boolean;
    created_by?: number | null;
    updated_by?: number | null;
    created_at?: string;
    updated_at?: string;
}

export interface Service {
    id: number;
    code: string;
    name: string;
    category: 'lab' | 'radiology' | 'electromedical' | 'physical';
    sub_group?: string | null;
    sample_id: number;
    base_price: number | string;
    print_template: 'standard_lab' | 'antigen' | 'pcr' | 'narkoba' | 'radiology' | 'electromedical' | 'physical';
    is_active: boolean;
    sample?: Sample | null;
    parameters_count?: number;
    parameters?: ServiceParameter[];
    created_by?: number | null;
    updated_by?: number | null;
    created_at?: string;
    updated_at?: string;
}

export type ParameterInputType =
    | 'number'
    | 'text'
    | 'textarea'
    | 'select'
    | 'formula'
    | 'audiogram_grid'
    | 'checkbox_group';

export type GenderType = 'ALL' | 'L' | 'P';

export type ConditionOperator =
    | '<'
    | '<='
    | '>'
    | '>='
    | '=='
    | '!='
    | 'between'
    | 'contains';

export type FlagStatus = 'normal' | 'low' | 'high' | 'abnormal' | 'critical';

export interface ParameterReferenceRange {
    id: number;
    parameter_id: number;
    gender: GenderType;
    min_age_years?: number | null;
    max_age_years?: number | null;
    min_value?: number | string | null;
    max_value?: number | string | null;
    normal_text_value?: string | null;
    display_reference?: string | null;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface ParameterAutoRule {
    id: number;
    parameter_id: number;
    condition_operator: ConditionOperator;
    compare_value_1?: string | null;
    compare_value_2?: string | null;
    gender: GenderType;
    flag_status: FlagStatus;
    auto_conclusion?: string | null;
    auto_suggestion?: string | null;
    include_in_abnormality_recap: boolean;
    priority: number;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface ServiceParameter {
    id: number;
    service_id: number;
    code: string;
    label: string;
    group_name?: string | null;
    input_type: ParameterInputType;
    unit?: string | null;
    options_json?: any | null;
    formula_expression?: string | null;
    default_normal_text?: string | null;
    sort_order: number;
    is_required: boolean;
    is_active: boolean;
    service?: Service | null;
    reference_ranges?: ParameterReferenceRange[];
    auto_rules?: ParameterAutoRule[];
    created_at?: string;
    updated_at?: string;
}

export type PatientGender = 'L' | 'P';
export type McuEventStatus = 'draft' | 'ongoing' | 'review' | 'completed' | 'closed';

export interface Patient {
    id: number;
    medical_record_no: string;
    nik?: string | null;
    name: string;
    gender: PatientGender;
    birth_date: string;
    age?: number | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    photo_path?: string | null;
    default_company_id?: number | null;
    default_department?: string | null;
    default_company?: Company | null;
    created_by?: number | null;
    updated_by?: number | null;
    created_at?: string;
    updated_at?: string;
}

export interface McuEvent {
    id: number;
    year: number;
    event_code: string;
    event_name: string;
    referrer_id: number;
    company_id?: number | null;
    target_participants: number;
    city?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    virtual_bg_path?: string | null;
    pic_mcu_id?: number | null;
    doctor_anamnese_id?: number | null;
    doctor_lab_id?: number | null;
    doctor_radiology_id?: number | null;
    doctor_electromedical_id?: number | null;
    doctor_ekg_id?: number | null;
    doctor_audiometry_id?: number | null;
    printed_by_id?: number | null;
    validator_id?: number | null;
    qc1_id?: number | null;
    qc2_id?: number | null;
    status: McuEventStatus;
    notes?: string | null;
    referrer?: Referrer | null;
    company?: Company | null;
    pic_mcu?: Employee | null;
    doctor_anamnese?: Employee | null;
    doctor_lab?: Employee | null;
    doctor_radiology?: Employee | null;
    qc1?: Employee | null;
    qc2?: Employee | null;
    created_by?: number | null;
    updated_by?: number | null;
    created_at?: string;
    updated_at?: string;
}

export interface PackageItem {
    id: number;
    package_id: number;
    service_id: number;
    item_price_override?: number | string | null;
    service?: Service | null;
    created_at?: string;
    updated_at?: string;
}

export interface Package {
    id: number;
    referrer_id?: number | null;
    year: number;
    event_label?: string | null;
    name: string;
    total_price: number | string;
    discount_amount: number | string;
    final_price: number | string;
    is_active: boolean;
    referrer?: Referrer | null;
    package_items?: PackageItem[];
    created_by?: number | null;
    updated_by?: number | null;
    created_at?: string;
    updated_at?: string;
}

export type ServiceType = 'regular' | 'mcu';
export type PayerType = 'aps' | 'corporate' | 'referrer';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'corporate_billed';
export type WorkflowStatus =
    | 'pending'
    | 'registered'
    | 'in_progress'
    | 'result_entered'
    | 'doctor_reviewed'
    | 'manager_approved'
    | 'completed'
    | 'void';
export type SampleStatus = 'pending' | 'taken' | 'rejected';
export type ResultStatus = 'pending' | 'draft' | 'entered' | 'verified';
export type BilledTo = 'corporate' | 'personal' | 'referrer';
export type PaymentMethod = 'cash' | 'transfer' | 'qris' | 'edc' | 'invoice_corporate';
export type InputSource = 'web_single' | 'excel_bulk';
export type AttachmentType = 'ekg_pdf' | 'spiro_pdf' | 'radiology_img' | 'audiometry_pdf' | 'other';

export interface AudiogramChannelData {
    ac: Record<string, number | null>;
    bc: Record<string, number | null>;
}

export interface AudiogramData {
    frequencies?: number[];
    right_ear?: AudiogramChannelData;
    left_ear?: AudiogramChannelData;
    right_pta?: number | null;
    left_pta?: number | null;
    right_classification?: string | null;
    left_classification?: string | null;
    diagnosis?: string | null;
    recommendation?: string | null;
}

export interface ExaminationResult {
    id: number;
    registration_id: number;
    registration_item_id: number;
    parameter_id: number;
    value_numeric?: number | null;
    value_text?: string | null;
    value_json?: AudiogramData | Record<string, any> | null;
    unit_snapshot?: string | null;
    reference_snapshot?: string | null;
    flag_status: FlagStatus;
    auto_conclusion?: string | null;
    auto_suggestion?: string | null;
    is_manually_overridden: boolean;
    input_source: InputSource;
    updated_by?: number | null;
    parameter?: ServiceParameter | null;
    registration?: Registration | null;
    registration_item?: RegistrationItem | null;
    updater?: User | null;
    created_at?: string;
    updated_at?: string;
}

export interface ResultAttachment {
    id: number;
    registration_id: number;
    registration_item_id?: number | null;
    attachment_type: AttachmentType;
    file_path: string;
    file_url?: string;
    original_filename: string;
    mime_type: string;
    file_size: number;
    merge_into_mcu_pdf: boolean;
    sort_order?: number;
    uploaded_by?: number | null;
    uploader?: User | null;
    created_at?: string;
    updated_at?: string;
}

export interface RegistrationItem {
    id: number;
    registration_id: number;
    service_id: number;
    service_name_snapshot: string;
    category: 'lab' | 'radiology' | 'electromedical' | 'physical';
    sample_id: number;
    price_snapshot: number | string;
    discount_amount: number | string;
    final_price: number | string;
    is_from_package: boolean;
    billed_to: BilledTo;
    sample_status: SampleStatus;
    sample_taken_at?: string | null;
    sample_taken_by?: number | null;
    result_status: ResultStatus;
    result_entered_at?: string | null;
    result_entered_by?: number | null;
    group_conclusion?: string | null;
    group_suggestion?: string | null;
    service?: Service | null;
    sample?: Sample | null;
    registration?: Registration | null;
    collector?: User | null;
    examination_results?: ExaminationResult[];
    examinationResults?: ExaminationResult[];
    created_at?: string;
    updated_at?: string;
}

export interface Payment {
    id: number;
    registration_id?: number | null;
    mcu_event_id?: number | null;
    payment_no: string;
    paid_at: string;
    amount: number | string;
    payment_method: PaymentMethod;
    bank_id?: number | null;
    reference_no?: string | null;
    notes?: string | null;
    received_by?: number | null;
    bank?: Bank | null;
    created_at?: string;
    updated_at?: string;
}

export interface Registration {
    id: number;
    reg_no: string | null;
    registered_at: string | null;
    patient_id: number;
    service_type: ServiceType;
    payer_type: PayerType;
    referrer_id?: number | null;
    company_id?: number | null;
    mcu_event_id?: number | null;
    package_id?: number | null;
    department_snapshot?: string | null;
    age_years_snapshot?: number | null;
    total_amount: number | string;
    discount_amount: number | string;
    grand_total: number | string;
    paid_amount: number | string;
    remaining_amount: number | string;
    payment_status: PaymentStatus;
    workflow_status: WorkflowStatus;
    void_reason?: string | null;
    voided_by?: number | null;
    voided_at?: string | null;
    patient?: Patient | null;
    company?: Company | null;
    referrer?: Referrer | null;
    package?: Package | null;
    mcu_event?: McuEvent | null;
    items?: RegistrationItem[];
    payments?: Payment[];
    examination_results?: ExaminationResult[];
    examinationResults?: ExaminationResult[];
    result_attachments?: ResultAttachment[];
    resultAttachments?: ResultAttachment[];
    mcu_review?: McuReview | null;
    mcuReview?: McuReview | null;
    voided_by_user?: User | null;
    created_by?: number | null;
    updated_by?: number | null;
    created_at?: string;
    updated_at?: string;
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface Pagination<T> {
    data: T[];
    current_page: number;
    first_page_url: string;
    from: number | null;
    last_page: number;
    last_page_url: string;
    links: PaginationLink[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
}

export interface ActivityLog {
    id: number;
    log_name: string;
    description: string;
    subject_type?: string | null;
    event?: string | null;
    subject_id?: number | null;
    causer_type?: string | null;
    causer_id?: number | null;
    properties?: Record<string, any> | null;
    batch_uuid?: string | null;
    created_at: string;
    updated_at: string;
    causer?: User | null;
}

export type ImportType = 'participants' | 'lab_results' | 'audiometry' | 'physical';

export type FitStatus = 'fit' | 'fit_with_note' | 'temporary_unfit' | 'unfit' | 'pending';

export interface AbnormalityRecapItem {
    category: string;
    service_id?: number | null;
    service_name: string;
    parameter_id?: number | null;
    parameter_name: string;
    parameter_code?: string;
    value: string | number;
    unit?: string | null;
    reference_range?: string | null;
    flag_status: FlagStatus;
    conclusion?: string | null;
    suggestion?: string | null;
}

export interface CompiledRecap {
    total_abnormalities: number;
    items: AbnormalityRecapItem[];
    by_category: Record<string, AbnormalityRecapItem[]>;
    summary_draft: string;
    advice_draft: string;
    suggested_fit_status: FitStatus;
}

export interface McuReview {
    id: number;
    registration_id: number;
    abnormality_recap?: AbnormalityRecapItem[] | Record<string, any> | null;
    fit_status: FitStatus;
    doctor_summary?: string | null;
    doctor_advice?: string | null;
    doctor_reviewed_by?: number | null;
    doctor_reviewed_at?: string | null;
    doctor_notes?: string | null;
    manager_approved_by?: number | null;
    manager_approved_at?: string | null;
    manager_notes?: string | null;
    is_locked: boolean;
    doctor?: User | null;
    manager?: User | null;
    registration?: Registration | null;
    created_at?: string;
    updated_at?: string;
}

export interface ExcelImportLogError {
    row?: number;
    reg_no?: string;
    error: string;
}

export interface ExcelImportLog {
    id: number;
    mcu_event_id?: number | null;
    import_type: ImportType;
    file_path: string;
    original_filename?: string | null;
    total_rows: number;
    success_rows: number;
    failed_rows: number;
    error_details_json?: ExcelImportLogError[] | string[] | null;
    uploaded_by?: number | null;
    uploader?: User | null;
    mcu_event?: McuEvent | null;
    created_at?: string;
    updated_at?: string;
}

export interface OnlineResultToken {
    id: number;
    registration_id: number;
    token: string;
    expires_at: string;
    is_revoked: boolean;
    revoked_at?: string | null;
    revoked_by?: number | null;
    access_count: number;
    last_accessed_at?: string | null;
    last_accessed_ip?: string | null;
    is_expired?: boolean;
    is_valid?: boolean;
    days_remaining?: number;
    portal_url?: string;
    registration?: Registration | null;
    created_at?: string;
    updated_at?: string;
}

export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = T & {
    auth: {
        user: User | null;
        roles: string[];
        permissions: string[];
    };
    flash?: {
        success?: string | null;
        error?: string | null;
        info?: string | null;
    };
    clinicSetting?: ClinicSetting | null;
};

declare global {
    function route(name?: string, params?: any, absolute?: boolean): any;
}
