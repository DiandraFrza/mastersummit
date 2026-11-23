import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { PageProps } from '@/types';

interface ToastItem {
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
}

export default function Toast() {
    const { flash } = usePage<PageProps>().props;
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    useEffect(() => {
        if (flash?.success) {
            addToast('success', flash.success);
        }
        if (flash?.error) {
            addToast('error', flash.error);
        }
        if (flash?.info) {
            addToast('info', flash.info);
        }
    }, [flash]);

    const addToast = (type: 'success' | 'error' | 'info', message: string) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, type, message }]);

        setTimeout(() => {
            removeToast(id);
        }, 4000);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
            <AnimatePresence>
                {toasts.map((toast) => {
                    const isSuccess = toast.type === 'success';
                    const isError = toast.type === 'error';

                    return (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: 12, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.15 } }}
                            className={`pointer-events-auto flex items-start gap-3 p-3 bg-white border rounded-md shadow-md text-xs ${
                                isSuccess
                                    ? 'border-emerald-200 text-zinc-800'
                                    : isError
                                    ? 'border-rose-200 text-zinc-800'
                                    : 'border-zinc-200 text-zinc-800'
                            }`}
                        >
                            <div className="mt-0.5 shrink-0">
                                {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                                {isError && <AlertCircle className="w-4 h-4 text-rose-600" />}
                                {!isSuccess && !isError && <Info className="w-4 h-4 text-sky-600" />}
                            </div>
                            <div className="flex-1 font-medium leading-relaxed">
                                {toast.message}
                            </div>
                            <button
                                type="button"
                                onClick={() => removeToast(toast.id)}
                                className="text-zinc-400 hover:text-zinc-600 p-0.5 rounded-xs shrink-0 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
