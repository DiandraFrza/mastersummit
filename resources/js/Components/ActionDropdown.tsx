import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, LucideIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export interface ActionDropdownItem {
    label: string;
    icon?: LucideIcon;
    onClick?: () => void;
    href?: string;
    variant?: 'default' | 'danger';
    disabled?: boolean;
}

interface ActionDropdownProps {
    items: ActionDropdownItem[];
    label?: string;
    align?: 'left' | 'right';
}

export default function ActionDropdown({
    items,
    label = 'Aksi',
    align = 'right',
}: ActionDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-700 bg-white border border-zinc-200/80 rounded-sm hover:bg-zinc-50 hover:text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors shadow-2xs"
            >
                <span>{label}</span>
                <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -2 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -2 }}
                        transition={{ duration: 0.12 }}
                        className={`absolute z-30 mt-1 min-w-[150px] bg-white border border-zinc-200/90 rounded-md shadow-md py-1 focus:outline-none ${
                            align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'
                        }`}
                    >
                        {items.map((item, index) => {
                            const Icon = item.icon;
                            const isDanger = item.variant === 'danger';

                            if (item.href) {
                                return (
                                    <a
                                        key={index}
                                        href={item.href}
                                        className={`flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
                                            isDanger
                                                ? 'text-rose-600 hover:bg-rose-50'
                                                : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900'
                                        } ${item.disabled ? 'opacity-50 pointer-events-none' : ''}`}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {Icon && <Icon className="w-3.5 h-3.5" />}
                                        <span>{item.label}</span>
                                    </a>
                                );
                            }

                            return (
                                <button
                                    key={index}
                                    type="button"
                                    disabled={item.disabled}
                                    onClick={() => {
                                        setIsOpen(false);
                                        item.onClick?.();
                                    }}
                                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors ${
                                        isDanger
                                            ? 'text-rose-600 hover:bg-rose-50'
                                            : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900'
                                    } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {Icon && <Icon className="w-3.5 h-3.5" />}
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
