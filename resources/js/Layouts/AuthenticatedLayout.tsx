import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    Activity,
    ClipboardCheck,
    LayoutDashboard,
    UserPlus,
    TestTubes,
    CalendarDays,
    Stethoscope,
    ShieldCheck,
    FileCheck2,
    FlaskConical,
    ScanLine,
    HeartPulse,
    Contact2,
    Users,
    Building2,
    Briefcase,
    Share2,
    Layers,
    PackageCheck,
    CreditCard,
    Truck,
    BarChart3,
    FileSpreadsheet,
    Settings2,
    ShieldAlert,
    Menu,
    X,
    LogOut,
    PanelLeftClose,
    PanelLeftOpen,
    ChevronDown,
    ChevronRight,
    LucideIcon,
    ArrowRight,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Toast from '@/Components/Toast';
import type { PageProps } from '@/types';

interface NavSubItem {
    name: string;
    href: string;
    permission?: string;
    role?: string;
    exact?: boolean;
}

interface NavItem {
    name: string;
    href?: string;
    icon: LucideIcon;
    permission?: string;
    role?: string;
    exact?: boolean;
    children?: NavSubItem[];
}

interface NavGroup {
    title: string;
    items: NavItem[];
}

interface AuthenticatedLayoutProps {
    children: React.ReactNode;
    title?: string;
    breadcrumb?: Array<{ label: string; href?: string }>;
}

export default function AuthenticatedLayout({
    children,
    title,
    breadcrumb = [],
}: AuthenticatedLayoutProps) {
    const { auth, clinicSetting } = usePage<PageProps>().props;
    const user = auth?.user;
    const roles = auth?.roles || [];
    const permissions = auth?.permissions || [];
    const isSuperAdmin = roles.includes('Super Admin');

    // Sidebar collapse state with localStorage persistence
    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('sidebar_collapsed') === 'true';
        }
        return false;
    });

    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const toggleSidebar = () => {
        const next = !isCollapsed;
        setIsCollapsed(next);
        localStorage.setItem('sidebar_collapsed', String(next));
    };

    const handleLogout = () => {
        router.post(route('logout'));
    };

    // Close mobile drawer on route navigation
    useEffect(() => {
        setIsMobileOpen(false);
    }, [typeof window !== 'undefined' ? window.location.pathname : '']);

    // Check if URL matches current path/query
    const isUrlActive = (href: string, exact = false): boolean => {
        if (typeof window === 'undefined') return false;
        const currentPath = window.location.pathname;
        const currentSearch = window.location.search;
        const fullCurrent = currentPath + currentSearch;

        if (exact) {
            return fullCurrent === href || currentPath === href;
        }

        if (href.includes('?')) {
            return fullCurrent === href;
        }

        if (href === '/' || href === '/dashboard') {
            return currentPath === href;
        }

        return currentPath === href || currentPath.startsWith(href + '/');
    };

    // RBAC access check
    const canAccessSubItem = (sub: NavSubItem): boolean => {
        if (isSuperAdmin) return true;
        if (sub.role && roles.includes(sub.role)) return true;
        if (sub.permission && permissions.includes(sub.permission)) return true;
        if (!sub.role && !sub.permission) return true;
        return false;
    };

    const canAccessItem = (item: NavItem): boolean => {
        if (isSuperAdmin) return true;
        if (item.children) {
            return item.children.some(canAccessSubItem);
        }
        if (item.role && roles.includes(item.role)) return true;
        if (item.permission && permissions.includes(item.permission)) return true;
        if (!item.role && !item.permission) return true;
        return false;
    };

    // Strict Clinical Navigation Structure (matching Caya structure)
    const navigationGroups: NavGroup[] = [
        {
            title: 'HALAMAN UTAMA',
            items: [
                {
                    name: 'Dashboard',
                    href: '/dashboard',
                    icon: LayoutDashboard,
                    exact: true,
                },
            ],
        },
        {
            title: 'DATA MASTER',
            items: [
                {
                    name: 'Master Pemeriksaan',
                    icon: Layers,
                    children: [
                        { name: 'Sampel', href: '/samples', permission: 'samples.view' },
                        { name: 'Laboratorium', href: '/services?category=lab', permission: 'services.view' },
                        { name: 'Radiologi', href: '/services?category=radiology', permission: 'services.view' },
                        { name: 'Elektromedis', href: '/services?category=electromedical', permission: 'services.view' },
                        { name: 'Pemeriksaan Fisik', href: '/services?category=physical', permission: 'services.view' },
                        { name: 'Tarif Paket', href: '/packages', permission: 'packages.view' },
                    ],
                },
                {
                    name: 'Master Pendaftaran',
                    icon: Share2,
                    children: [
                        { name: 'Master Perujuk', href: '/referrers', permission: 'referrers.view' },
                        { name: 'Perujuk', href: '/referrers', permission: 'referrers.view' },
                        { name: 'Bank', href: '/banks', permission: 'banks.view' },
                    ],
                },
                {
                    name: 'Master Umum',
                    icon: Building2,
                    children: [
                        { name: 'Unit', href: '/units', permission: 'units.view' },
                        { name: 'Perusahaan', href: '/companies', permission: 'companies.view' },
                        { name: 'Pegawai', href: '/employees', permission: 'employees.view' },
                        { name: 'Pengguna', href: '/users', permission: 'users.view' },
                        { name: 'Vendor', href: '/vendors', permission: 'vendors.view' },
                    ],
                },
            ],
        },
        {
            title: 'ADMIN',
            items: [
                {
                    name: 'Pendaftaran',
                    href: '/registrations',
                    icon: ShieldCheck,
                    permission: 'registrations.view',
                },
            ],
        },
        {
            title: 'PENDAFTARAN',
            items: [
                {
                    name: 'Pasien',
                    href: '/patients',
                    icon: Users,
                    permission: 'patients.view',
                },
                {
                    name: 'Pendaftaran',
                    href: '/registrations',
                    icon: UserPlus,
                    permission: 'registrations.view',
                },
                {
                    name: 'Ambil Hasil',
                    href: '/results',
                    icon: FileCheck2,
                    permission: 'results.view',
                },
            ],
        },
        {
            title: 'DATA MCU',
            items: [
                {
                    name: 'MCU',
                    href: '/mcu-events',
                    icon: CalendarDays,
                    permission: 'mcu_events.view',
                },
                {
                    name: 'Hasil MCU',
                    href: '/mcu-events',
                    icon: ClipboardCheck,
                    permission: 'mcu_events.view',
                },
                {
                    name: 'Input Hasil MCU',
                    href: '/examinations',
                    icon: Activity,
                    permission: 'results.lab',
                },
                {
                    name: 'Review Manajer MCU',
                    href: '/mcu/manager-review',
                    icon: ShieldCheck,
                    permission: 'mcu_reviews.manager',
                },
                {
                    name: 'Review Dokter MCU',
                    href: '/mcu/doctor-review',
                    icon: Stethoscope,
                    permission: 'mcu_reviews.doctor',
                },
                {
                    name: 'Ambil Sampel',
                    href: '/samples/collect',
                    icon: TestTubes,
                    permission: 'samples.collect',
                },
            ],
        },
        {
            title: 'DATA HASIL PENUNJANG',
            items: [
                {
                    name: 'Laboratorium',
                    href: '/examinations?category=lab',
                    icon: FlaskConical,
                    permission: 'results.lab',
                },
                {
                    name: 'Radiologi',
                    href: '/examinations?category=radiology',
                    icon: ScanLine,
                    permission: 'results.radiology',
                },
                {
                    name: 'Elektromedis',
                    href: '/examinations?category=electromedical',
                    icon: Activity,
                    permission: 'results.electromedical',
                },
                {
                    name: 'Fisik',
                    href: '/examinations?category=physical',
                    icon: HeartPulse,
                    permission: 'results.physical',
                },
            ],
        },
        {
            title: 'LAPORAN',
            items: [
                {
                    name: 'Pendapatan',
                    icon: BarChart3,
                    children: [
                        { name: 'Pendapatan Harian', href: '/reports/revenue?view=daily', permission: 'reports.revenue' },
                        { name: 'Rekap Pendapatan', href: '/reports/revenue?view=recap', permission: 'reports.revenue' },
                    ],
                },
                {
                    name: 'Pemeriksaan',
                    icon: FileSpreadsheet,
                    children: [
                        { name: 'Pemeriksaan', href: '/reports/examinations?view=items', permission: 'reports.examinations' },
                        { name: 'Rekap Pemeriksaan', href: '/reports/examinations?view=recap', permission: 'reports.examinations' },
                    ],
                },
            ],
        },
        {
            title: 'LAINNYA',
            items: [
                {
                    name: 'Kartu Kontrol',
                    href: '/registrations',
                    icon: CreditCard,
                    permission: 'registrations.view',
                },
                {
                    name: 'Pengaturan',
                    icon: Settings2,
                    children: [
                        { name: 'Pengaturan Klinik', href: '/settings/clinic', permission: 'settings.clinic' },
                        { name: 'Audit Trail', href: '/audit-logs', permission: 'audit_logs.view' },
                    ],
                },
            ],
        },
    ];

    // Accordion state with active route auto-detection
    const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        navigationGroups.forEach((group) => {
            group.items.forEach((item) => {
                if (item.children) {
                    const hasActiveChild = item.children.some((child) => isUrlActive(child.href, child.exact));
                    if (hasActiveChild) {
                        initial[item.name] = true;
                    }
                }
            });
        });
        return initial;
    });

    // Auto expand accordion if current URL matches any sub-item
    useEffect(() => {
        navigationGroups.forEach((group) => {
            group.items.forEach((item) => {
                if (item.children) {
                    const hasActiveChild = item.children.some((child) => isUrlActive(child.href, child.exact));
                    if (hasActiveChild) {
                        setOpenDropdowns((prev) => ({ ...prev, [item.name]: true }));
                    }
                }
            });
        });
    }, [typeof window !== 'undefined' ? window.location.pathname + window.location.search : '']);

    const toggleDropdown = (itemName: string) => {
        setOpenDropdowns((prev) => ({
            ...prev,
            [itemName]: !prev[itemName],
        }));
    };

    const renderNavContent = () => (
        <div className="flex flex-col h-full bg-white select-none">
            {/* Brand Header */}
            <div className="h-16 px-4 border-b border-zinc-200/80 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-9 h-9 rounded-md bg-zinc-900 flex items-center justify-center text-white shrink-0 shadow-xs">
                        <Activity className="w-5 h-5 text-emerald-400" />
                    </div>
                    {!isCollapsed && (
                        <div className="truncate">
                            <span className="text-sm font-bold text-zinc-900 tracking-tight block truncate">
                                {clinicSetting?.clinic_name || 'Master Summit'}
                            </span>
                            <span className="text-xs text-zinc-400 font-medium block truncate">
                                Sistem Manajemen Klinik
                            </span>
                        </div>
                    )}
                </div>

                {/* Sidebar Collapse Toggle */}
                <button
                    type="button"
                    onClick={toggleSidebar}
                    title={isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
                    className="p-1.5 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-md transition-colors hidden lg:flex shrink-0"
                >
                    {isCollapsed ? (
                        <PanelLeftOpen className="w-5 h-5" />
                    ) : (
                        <PanelLeftClose className="w-5 h-5" />
                    )}
                </button>

                {/* Mobile Close Button */}
                <button
                    type="button"
                    onClick={() => setIsMobileOpen(false)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md lg:hidden shrink-0"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Navigation Menu List */}
            <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-4">
                {navigationGroups.map((group, groupIdx) => {
                    const visibleItems = group.items.filter(canAccessItem);
                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={groupIdx} className="space-y-1">
                            {!isCollapsed && (
                                <div className="px-3.5 text-xs font-bold tracking-wider text-zinc-400 uppercase pt-2 pb-1">
                                    {group.title}
                                </div>
                            )}

                            <div className="space-y-1">
                                {visibleItems.map((item, itemIdx) => {
                                    const Icon = item.icon;
                                    const hasChildren = Boolean(item.children && item.children.length > 0);

                                    // If item has children: render Accordion
                                    if (hasChildren && item.children) {
                                        const visibleChildren = item.children.filter(canAccessSubItem);
                                        if (visibleChildren.length === 0) return null;

                                        const isOpen = Boolean(openDropdowns[item.name]);
                                        const hasActiveChild = visibleChildren.some((child) => isUrlActive(child.href, child.exact));

                                        return (
                                            <div key={itemIdx} className="space-y-0.5">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleDropdown(item.name)}
                                                    title={isCollapsed ? item.name : undefined}
                                                    className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-md text-[15px] font-medium transition-colors ${
                                                        hasActiveChild
                                                            ? 'text-zinc-900 font-semibold bg-zinc-50'
                                                            : 'text-zinc-700 hover:bg-zinc-100/70 hover:text-zinc-900'
                                                    } ${isCollapsed ? 'justify-center px-2' : ''}`}
                                                >
                                                    <div className="flex items-center gap-3 truncate">
                                                        <Icon
                                                            className={`w-5 h-5 shrink-0 transition-colors ${
                                                                hasActiveChild ? 'text-emerald-600' : 'text-zinc-400 group-hover:text-zinc-700'
                                                            }`}
                                                        />
                                                        {!isCollapsed && (
                                                            <span className="truncate">{item.name}</span>
                                                        )}
                                                    </div>

                                                    {!isCollapsed && (
                                                        <ChevronDown
                                                            className={`w-4 h-4 text-zinc-400 transition-transform duration-200 shrink-0 ${
                                                                isOpen ? 'rotate-180 text-zinc-700' : ''
                                                            }`}
                                                        />
                                                    )}
                                                </button>

                                                {/* Sub-Items List */}
                                                {!isCollapsed && isOpen && (
                                                    <div className="pl-6 pr-1 py-1 space-y-0.5 border-l border-zinc-200/80 ml-5 my-0.5">
                                                        {visibleChildren.map((sub, subIdx) => {
                                                            const subActive = isUrlActive(sub.href, sub.exact);
                                                            return (
                                                                <Link
                                                                    key={subIdx}
                                                                    href={sub.href}
                                                                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-[14px] transition-colors ${
                                                                        subActive
                                                                            ? 'bg-emerald-50 text-emerald-900 font-semibold'
                                                                            : 'text-zinc-600 hover:bg-zinc-100/70 hover:text-zinc-900'
                                                                    }`}
                                                                >
                                                                    <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${subActive ? 'text-emerald-600' : 'text-zinc-400'}`} />
                                                                    <span className="truncate">{sub.name}</span>
                                                                </Link>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }

                                    // Regular single item
                                    const active = item.href ? isUrlActive(item.href, item.exact) : false;

                                    return (
                                        <Link
                                            key={itemIdx}
                                            href={item.href || '#'}
                                            title={isCollapsed ? item.name : undefined}
                                            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-md text-[15px] font-medium transition-colors group relative ${
                                                active
                                                    ? 'bg-zinc-100 text-zinc-900 font-semibold'
                                                    : 'text-zinc-700 hover:bg-zinc-100/70 hover:text-zinc-900'
                                            } ${isCollapsed ? 'justify-center px-2' : ''}`}
                                        >
                                            <Icon
                                                className={`w-5 h-5 shrink-0 transition-colors ${
                                                    active
                                                        ? 'text-zinc-900'
                                                        : 'text-zinc-400 group-hover:text-zinc-700'
                                                }`}
                                            />
                                            {!isCollapsed && (
                                                <span className="truncate">{item.name}</span>
                                            )}

                                            {active && (
                                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-zinc-900 rounded-r-xs" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* User Profile Footer */}
            <div className="p-3 border-t border-zinc-200/80 bg-zinc-50/70 shrink-0">
                <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                    <div className="w-9 h-9 rounded-full bg-zinc-200 border border-zinc-300 flex items-center justify-center text-zinc-700 text-sm font-semibold shrink-0">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>

                    {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-zinc-800 truncate">
                                {user?.name}
                            </div>
                            <div className="text-xs text-zinc-500 truncate">
                                {roles[0] || 'Staff'}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-zinc-50 flex">
            {/* Desktop Sidebar */}
            <aside
                className={`hidden lg:block border-r border-zinc-200/80 shrink-0 h-screen sticky top-0 transition-all duration-200 ease-in-out ${
                    isCollapsed ? 'w-16' : 'w-64'
                }`}
            >
                {renderNavContent()}
            </aside>

            {/* Mobile Drawer Backdrop & Sidebar */}
            <AnimatePresence>
                {isMobileOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs"
                            onClick={() => setIsMobileOpen(false)}
                        />

                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="fixed inset-y-0 left-0 w-72 bg-white border-r border-zinc-200 shadow-xl z-10"
                        >
                            {renderNavContent()}
                        </motion.aside>
                    </div>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Topbar */}
                <header className="h-16 bg-white border-b border-zinc-200/80 px-5 flex items-center justify-between sticky top-0 z-20">
                    {/* Left: Mobile Toggle & Breadcrumbs */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsMobileOpen(true)}
                            className="p-1.5 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-md lg:hidden"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        {/* Breadcrumbs */}
                        <nav className="flex items-center gap-2 text-sm text-zinc-500 font-medium">
                            <Link href="/dashboard" className="hover:text-zinc-900 transition-colors">
                                Dashboard
                            </Link>

                            {breadcrumb.map((crumb, idx) => (
                                <React.Fragment key={idx}>
                                    <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
                                    {crumb.href ? (
                                        <Link href={crumb.href} className="hover:text-zinc-900 transition-colors">
                                            {crumb.label}
                                        </Link>
                                    ) : (
                                        <span className="text-zinc-800 font-semibold truncate max-w-[260px]">
                                            {crumb.label}
                                        </span>
                                    )}
                                </React.Fragment>
                            ))}

                            {!breadcrumb.length && title && (
                                <>
                                    <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
                                    <span className="text-zinc-800 font-semibold truncate max-w-[260px]">
                                        {title}
                                    </span>
                                </>
                            )}
                        </nav>
                    </div>

                    {/* Right: Active User & Logout */}
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2.5 pr-4 border-r border-zinc-200/80">
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <span className="text-sm text-zinc-700 font-semibold">
                                {user?.name}
                            </span>
                            <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md border border-zinc-200 font-medium">
                                {roles[0] || 'User'}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:text-rose-600 hover:bg-rose-50 rounded-md border border-zinc-200 transition-colors"
                            title="Keluar dari sistem"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Keluar</span>
                        </button>
                    </div>
                </header>

                {/* Page Content Canvas */}
                <main className="flex-1 p-5 lg:p-7 max-w-7xl w-full mx-auto">
                    {children}
                </main>
            </div>

            {/* Global Flash Toast */}
            <Toast />
        </div>
    );
}
