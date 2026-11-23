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
