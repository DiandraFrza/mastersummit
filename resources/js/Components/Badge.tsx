import React from 'react';
import {
    CheckCircle2,
    Clock,
    AlertTriangle,
    Info,
    Minus,
    LucideIcon,
} from 'lucide-react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
    variant?: BadgeVariant;
    label?: string;
    children?: React.ReactNode;
    icon?: LucideIcon | null;
    className?: string;
}

const variantStyles: Record<BadgeVariant, { container: string; icon: LucideIcon; iconColor: string }> = {
    success: {
        container: 'bg-emerald-50/90 text-emerald-700',
        icon: CheckCircle2,
        iconColor: 'text-emerald-600',
    },
    warning: {
        container: 'bg-amber-50/90 text-amber-700',
        icon: Clock,
        iconColor: 'text-amber-600',
    },
    danger: {
        container: 'bg-rose-50/90 text-rose-700',
        icon: AlertTriangle,
        iconColor: 'text-rose-600',
    },
    info: {
        container: 'bg-sky-50/90 text-sky-700',
        icon: Info,
        iconColor: 'text-sky-600',
    },
    neutral: {
        container: 'bg-zinc-100 text-zinc-600',
        icon: Minus,
        iconColor: 'text-zinc-400',
    },
};

export default function Badge({
    variant = 'neutral',
    label,
    children,
    icon,
    className = '',
}: BadgeProps) {
    const config = variantStyles[variant] || variantStyles.neutral;
    const IconComponent = icon === null ? null : (icon || config.icon);

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[11px] font-medium tracking-tight whitespace-nowrap ${config.container} ${className}`}
        >
            {IconComponent && <IconComponent className={`w-3 h-3 shrink-0 ${config.iconColor}`} />}
            <span>{label || children}</span>
        </span>
    );
}
