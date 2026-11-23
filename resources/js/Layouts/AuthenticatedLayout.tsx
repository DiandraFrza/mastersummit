import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    Activity,
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
    Menu,
    X,
    LogOut,
    PanelLeftClose,
    PanelLeftOpen,
    ChevronRight,
    LucideIcon,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Toast from '@/Components/Toast';
import type { PageProps } from '@/types';

interface NavItem {
    name: string;
    href: string;
    icon: LucideIcon;
    permission?: string;
    role?: string;
    exact?: boolean;
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
    const user = auth.user;
    const roles = auth.roles || [];
    const permissions = auth.permissions || [];
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

    // Close mobile drawer on route navigation
    useEffect(() => {
        setIsMobileOpen(false);
    }, [window.location.pathname]);

    const handleLogout = () => {
        router.post(route('logout'));
    };

    // Navigation grouping matching clinic modules
    const navigationGroups: NavGroup[] = [
        {
            title: 'Menu Utama',
            items: [
                {
                    name: 'Dashboard',
                    href: route('dashboard'),
                    icon: LayoutDashboard,
                    exact: true,
                },
            ],
        },
        {
            title: 'Pendaftaran & Antrean',
            items: [
                {
                    name: 'Pendaftaran 1 Pintu',
                    href: '/registrations',
                    icon: UserPlus,
                    permission: 'registrations.view',
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
            title: 'Data MCU',
            items: [
                {
                    name: 'Event MCU',
                    href: '/mcu-events',
                    icon: CalendarDays,
                    permission: 'mcu_events.view',
                },
                {
                    name: 'Review Dokter MCU',
                    href: '/mcu/doctor-review',
                    icon: Stethoscope,
                    permission: 'mcu_reviews.doctor',
                },
                {
                    name: 'Review Manajer MCU',
                    href: '/mcu/manager-review',
                    icon: ShieldCheck,
                    permission: 'mcu_reviews.manager',
                },
                {
                    name: 'Ambil Hasil & Portal',
                    href: '/results',
                    icon: FileCheck2,
                    permission: 'results.view',
                },
            ],
        },
        {
            title: 'Data Hasil Penunjang',
            items: [
                {
                    name: 'Laboratorium',
                    href: '/services/lab',
                    icon: FlaskConical,
                    permission: 'results.lab',
                },
                {
                    name: 'Radiologi',
                    href: '/services/radiology',
                    icon: ScanLine,
                    permission: 'results.radiology',
                },
                {
                    name: 'Elektromedis (EKG/Spiro)',
                    href: '/services/electromedical',
                    icon: Activity,
                    permission: 'results.electromedical',
                },
                {
                    name: 'Pemeriksaan Fisik',
                    href: '/services/physical',
                    icon: HeartPulse,
                    permission: 'results.physical',
                },
            ],
        },
        {
            title: 'Data Master',
            items: [
                {
                    name: 'Master Pegawai',
                    href: '/employees',
                    icon: Contact2,
                    permission: 'employees.view',
                },
                {
                    name: 'Pengguna & RBAC',
                    href: '/users',
                    icon: Users,
                    permission: 'users.view',
                },
                {
                    name: 'Unit / Cabang',
                    href: '/units',
                    icon: Building2,
                    permission: 'units.view',
                },
                {
                    name: 'Perusahaan',
                    href: '/companies',
                    icon: Briefcase,
                    permission: 'companies.view',
                },
                {
                    name: 'Perujuk',
                    href: '/referrers',
                    icon: Share2,
                    permission: 'referrers.view',
                },
                {
                    name: 'Pemeriksaan & Tarif',
                    href: '/services',
                    icon: Layers,
                    permission: 'services.view',
                },
                {
                    name: 'Paket MCU',
                    href: '/packages',
                    icon: PackageCheck,
                    permission: 'packages.view',
                },
                {
                    name: 'Bank & Rekening',
                    href: '/banks',
                    icon: CreditCard,
                    permission: 'banks.view',
                },
                {
                    name: 'Vendor & Rekanan',
                    href: '/vendors',
                    icon: Truck,
                    permission: 'vendors.view',
                },
            ],
        },
        {
            title: 'Laporan',
            items: [
                {
                    name: 'Pendapatan Klinik',
                    href: '/reports/revenue',
                    icon: BarChart3,
                    permission: 'reports.revenue',
                },
                {
                    name: 'Rekap Pemeriksaan',
                    href: '/reports/examinations',
                    icon: FileSpreadsheet,
                    permission: 'reports.examinations',
                },
            ],
        },
        {
            title: 'Pengaturan',
            items: [
                {
                    name: 'Klinik & Kop Surat',
                    href: '/settings/clinic',
                    icon: Settings2,
                    permission: 'settings.clinic',
                },
            ],
        },
    ];

    // Filter items based on permissions
    const canAccess = (item: NavItem): boolean => {
        if (isSuperAdmin) return true;
        if (item.role && roles.includes(item.role)) return true;
        if (item.permission && permissions.includes(item.permission)) return true;
        if (!item.role && !item.permission) return true;
        return false;
    };

    const isCurrentUrl = (href: string, exact = false): boolean => {
        const currentPath = window.location.pathname;
        if (exact) {
            return currentPath === href;
        }
        return currentPath === href || (href !== '/' && href !== '/dashboard' && currentPath.startsWith(href));
    };

    const renderNavContent = () => (
        <div className="flex flex-col h-full bg-white">
            {/* Brand Header with Collapse Toggle */}
            <div className="h-14 px-3.5 border-b border-zinc-200/80 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-sm bg-zinc-900 flex items-center justify-center text-white shrink-0">
                        <Activity className="w-4 h-4 text-emerald-400" />
                    </div>
                    {!isCollapsed && (
                        <div className="truncate">
                            <span className="text-xs font-semibold text-zinc-900 tracking-tight block truncate">
                                {clinicSetting?.clinic_name || 'Master Summit'}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-medium block truncate">
                                Management System
                            </span>
                        </div>
                    )}
                </div>

                {/* Sidebar Collapse Toggle */}
                <button
                    type="button"
                    onClick={toggleSidebar}
                    title={isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
                    className="p-1 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-sm transition-colors hidden lg:flex shrink-0"
                >
                    {isCollapsed ? (
                        <PanelLeftOpen className="w-4 h-4" />
                    ) : (
                        <PanelLeftClose className="w-4 h-4" />
                    )}
                </button>

                {/* Mobile Close Button */}
                <button
                    type="button"
                    onClick={() => setIsMobileOpen(false)}
                    className="p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-sm lg:hidden shrink-0"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Navigation Menu List */}
            <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
                {navigationGroups.map((group, groupIdx) => {
                    const visibleItems = group.items.filter(canAccess);
                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={groupIdx} className="space-y-1">
                            {!isCollapsed && (
                                <div className="px-2.5 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
                                    {group.title}
                                </div>
                            )}

                            <div className="space-y-0.5">
                                {visibleItems.map((item, itemIdx) => {
                                    const Icon = item.icon;
                                    const active = isCurrentUrl(item.href, item.exact);

                                    return (
                                        <Link
                                            key={itemIdx}
                                            href={item.href}
                                            title={isCollapsed ? item.name : undefined}
                                            className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-sm text-xs font-medium transition-colors group relative ${
                                                active
                                                    ? 'bg-zinc-100 text-zinc-900 font-semibold'
                                                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                                            } ${isCollapsed ? 'justify-center px-2' : ''}`}
                                        >
                                            <Icon
                                                className={`w-4 h-4 shrink-0 transition-colors ${
                                                    active
                                                        ? 'text-zinc-900'
                                                        : 'text-zinc-400 group-hover:text-zinc-700'
                                                }`}
                                            />
                                            {!isCollapsed && (
                                                <span className="truncate">{item.name}</span>
                                            )}

                                            {/* Active Indicator Bar on Left */}
                                            {active && (
                                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-zinc-900 rounded-r-xs" />
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
            <div className="p-2.5 border-t border-zinc-200/80 bg-zinc-50/50 shrink-0">
                <div className={`flex items-center gap-2.5 ${isCollapsed ? 'justify-center' : ''}`}>
                    <div className="w-7 h-7 rounded-full bg-zinc-200 border border-zinc-300 flex items-center justify-center text-zinc-700 text-xs font-semibold shrink-0">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>

                    {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-zinc-800 truncate">
                                {user?.name}
                            </div>
                            <div className="text-[10px] text-zinc-400 truncate">
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
                    isCollapsed ? 'w-14' : 'w-56'
                }`}
            >
                {renderNavContent()}
            </aside>

            {/* Mobile Drawer Backdrop & Sidebar */}
            <AnimatePresence>
                {isMobileOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs"
                            onClick={() => setIsMobileOpen(false)}
                        />

                        {/* Drawer */}
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="fixed inset-y-0 left-0 w-64 bg-white border-r border-zinc-200 shadow-xl z-10"
                        >
                            {renderNavContent()}
                        </motion.aside>
                    </div>
                )}
            </AnimatePresence>

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Topbar */}
                <header className="h-14 bg-white border-b border-zinc-200/80 px-4 flex items-center justify-between sticky top-0 z-20">
                    {/* Left: Mobile Toggle & Breadcrumbs */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsMobileOpen(true)}
                            className="p-1 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-sm lg:hidden"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        {/* Breadcrumbs */}
                        <nav className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                            <Link href="/dashboard" className="hover:text-zinc-900 transition-colors">
                                Dashboard
                            </Link>

                            {breadcrumb.map((crumb, idx) => (
                                <React.Fragment key={idx}>
                                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                    {crumb.href ? (
                                        <Link href={crumb.href} className="hover:text-zinc-900 transition-colors">
                                            {crumb.label}
                                        </Link>
                                    ) : (
                                        <span className="text-zinc-800 font-semibold truncate max-w-[200px]">
                                            {crumb.label}
                                        </span>
                                    )}
                                </React.Fragment>
                            ))}

                            {!breadcrumb.length && title && (
                                <>
                                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                    <span className="text-zinc-800 font-semibold truncate max-w-[200px]">
                                        {title}
                                    </span>
                                </>
                            )}
                        </nav>
                    </div>

                    {/* Right: Active User & Logout */}
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 pr-3 border-r border-zinc-200/80">
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-xs text-zinc-700 font-medium">
                                {user?.name}
                            </span>
                            <span className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded-sm border border-zinc-200">
                                {roles[0] || 'User'}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:text-rose-600 hover:bg-rose-50 rounded-sm border border-zinc-200/80 transition-colors"
                            title="Keluar dari sistem"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Keluar</span>
                        </button>
                    </div>
                </header>

                {/* Page Content Canvas */}
                <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto">
                    {children}
                </main>
            </div>

            {/* Global Flash Toast */}
            <Toast />
        </div>
    );
}
