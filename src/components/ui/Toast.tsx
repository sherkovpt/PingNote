'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { clsx } from 'clsx';

// Icons
const CheckIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const InfoIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const WarningIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

const ErrorIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const CloseIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (type: ToastType, message: string, duration?: number) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((type: ToastType, message: string, duration = 3000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, type, message, duration }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <ToastContainer />
        </ToastContext.Provider>
    );
}

function ToastContainer() {
    const { toasts } = useToast();

    return (
        <div
            className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
            role="region"
            aria-label="Notificações"
        >
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} />
            ))}
        </div>
    );
}

function ToastItem({ toast }: { toast: Toast }) {
    const { removeToast } = useToast();
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (toast.duration) {
            const timer = setTimeout(() => {
                setIsExiting(true);
                setTimeout(() => removeToast(toast.id), 200);
            }, toast.duration);

            return () => clearTimeout(timer);
        }
    }, [toast, removeToast]);

    const icons = {
        success: <CheckIcon />,
        error: <ErrorIcon />,
        warning: <WarningIcon />,
        info: <InfoIcon />,
    };

    const styles = {
        success: 'bg-success/10 border-success/30 text-success',
        error: 'bg-error/10 border-error/30 text-error',
        warning: 'bg-warning/10 border-warning/30 text-warning',
        info: 'bg-accent/10 border-accent/30 text-accent',
    };

    return (
        <div
            className={clsx(
                'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm shadow-lg min-w-[280px] max-w-[400px]',
                styles[toast.type],
                isExiting ? 'toast-exit' : 'toast-enter'
            )}
            role="alert"
        >
            {icons[toast.type]}
            <span className="flex-1 text-sm font-medium">{toast.message}</span>
            <button
                onClick={() => {
                    setIsExiting(true);
                    setTimeout(() => removeToast(toast.id), 200);
                }}
                className="p-1 hover:opacity-70 transition-opacity"
                aria-label="Fechar notificação"
            >
                <CloseIcon />
            </button>
        </div>
    );
}

// Convenience hooks for specific toast types
export function useSuccessToast() {
    const { addToast } = useToast();
    return (message: string, duration?: number) => addToast('success', message, duration);
}

export function useErrorToast() {
    const { addToast } = useToast();
    return (message: string, duration?: number) => addToast('error', message, duration);
}
