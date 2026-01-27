'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastEvent extends CustomEvent {
    detail: {
        message: string;
        type: ToastType;
    };
}

export const toast = {
    success: (message: string) => dispatchToast(message, 'success'),
    error: (message: string) => dispatchToast(message, 'error'),
    info: (message: string) => dispatchToast(message, 'info'),
};

function dispatchToast(message: string, type: ToastType) {
    const event = new CustomEvent('admin-toast', { detail: { message, type } });
    window.dispatchEvent(event);
}

export default function ToastContainer() {
    const [toasts, setToasts] = useState<{ id: number; message: string; type: ToastType }[]>([]);

    useEffect(() => {
        const handleToast = (e: Event) => {
            const detail = (e as ToastEvent).detail;
            const id = Date.now();
            setToasts((prev) => [...prev, { id, ...detail }]);

            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, 3000);
        };

        window.addEventListener('admin-toast', handleToast);
        return () => window.removeEventListener('admin-toast', handleToast);
    }, []);

    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`
            flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border backdrop-blur-md pointer-events-auto transform transition-all animate-in slide-in-from-right-2
            ${t.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : ''}
            ${t.type === 'error' ? 'bg-rose-600 border-rose-500 text-white' : ''}
            ${t.type === 'info' ? 'bg-slate-800 border-slate-700 text-white' : ''}
          `}
                >
                    {t.type === 'success' && <CheckCircle size={18} />}
                    {t.type === 'error' && <AlertCircle size={18} />}
                    {t.type === 'info' && <AlertCircle size={18} />}
                    <p className="text-sm font-bold">{t.message}</p>
                </div>
            ))}
        </div>
    );
}
