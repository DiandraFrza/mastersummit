import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    subtitle?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

const maxWidthMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
};

export default function Modal({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    footer,
    maxWidth = 'lg',
}: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs"
                        onClick={onClose}
                    />

                    {/* Dialog Surface */}
                    <motion.div
                        ref={modalRef}
                        initial={{ opacity: 0, scale: 0.98, y: 4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 4 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className={`relative w-full ${maxWidthMap[maxWidth]} bg-white border border-zinc-200/80 rounded-md shadow-lg overflow-hidden z-10 flex flex-col max-h-[90vh]`}
                    >
                        {/* Header */}
                        {(title || subtitle) && (
                            <div className="flex items-start justify-between px-5 py-4 border-b border-zinc-100">
                                <div>
                                    {title && (
                                        <h3 className="text-sm font-semibold text-zinc-900 tracking-tight">
                                            {title}
                                        </h3>
                                    )}
                                    {subtitle && (
                                        <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-sm p-1 transition-colors -mr-1 -mt-1"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Body */}
                        <div className="px-5 py-4 overflow-y-auto flex-1 text-sm text-zinc-700">
                            {children}
                        </div>

                        {/* Footer */}
                        {footer && (
                            <div className="px-5 py-3.5 bg-zinc-50/80 border-t border-zinc-100 flex items-center justify-end gap-2">
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
