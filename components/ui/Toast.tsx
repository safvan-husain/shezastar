// components/ui/Toast.tsx
'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ToastDetails {
    status?: number;
    body?: any;
    url?: string;
    method?: string;
    timestamp?: string;
}

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    details?: ToastDetails;
    pinned?: boolean;
}

interface ToastContextType {
    toasts: Toast[];
    showToast: (message: string, type: Toast['type'], details?: ToastDetails) => void;
    removeToast: (id: string) => void;
    pinToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: Toast['type'], details?: ToastDetails) => {
        const id = Math.random().toString(36).substring(7);
        const newToast: Toast = {
            id,
            message,
            type,
            details: details ? { ...details, timestamp: new Date().toISOString() } : undefined,
            pinned: false,
        };

        setToasts((prev) => [...prev, newToast]);

        // Auto-remove after 5 seconds (unless pinned)
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id || t.pinned));
        }, 5000);
    }, []);

    const pinToast = useCallback((id: string) => {
        setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, pinned: true } : t)));
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, showToast, removeToast, pinToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} pinToast={pinToast} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}

function ToastContainer({ toasts, removeToast, pinToast }: { toasts: Toast[]; removeToast: (id: string) => void; pinToast: (id: string) => void }) {
    return (
        <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-md">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={removeToast} onPin={pinToast} />
            ))}
        </div>
    );
}

function ToastItem({ toast, onRemove, onPin }: { toast: Toast; onRemove: (id: string) => void; onPin: (id: string) => void }) {
    const [showDetails, setShowDetails] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleToggleDetails = () => {
        if (!showDetails && toast.details) {
            onPin(toast.id);
        }
        setShowDetails(!showDetails);
    };

    const copyToClipboard = async () => {
        if (!toast.details) return;

        const errorInfo = {
            message: toast.message,
            status: toast.details.status,
            method: toast.details.method,
            url: toast.details.url,
            timestamp: toast.details.timestamp,
            response: toast.details.body,
        };

        try {
            await navigator.clipboard.writeText(JSON.stringify(errorInfo, null, 2));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const typeStyles = {
        success: 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--text-primary)]',
        error: 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--text-primary)]',
        warning: 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--text-primary)]',
        info: 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-primary)]',
    };

    const icons = {
        success: (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        error: (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        warning: (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ),
        info: (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    };

    return (
        <div
            className={`border-2 rounded-xl shadow-lg animate-in slide-in-from-right-full backdrop-blur-sm ${typeStyles[toast.type]} ${toast.details ? 'cursor-pointer' : ''
                }`}
            onClick={toast.details ? handleToggleDetails : undefined}
        >
            <div className="px-4 py-3 flex items-start gap-3">
                {icons[toast.type]}
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{toast.message}</p>
                    {toast.details && !showDetails && (
                        <p className="text-xs opacity-90 mt-1">Click for details</p>
                    )}
                    {toast.pinned && (
                        <p className="text-xs opacity-75 mt-1 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L11 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c-.25.78.409 1.574 1.195 1.574H6.5a1 1 0 01.894.553l.448.894a1 1 0 001.788 0l.448-.894A1 1 0 0111 13.4h1.123c.786 0 1.445-.794 1.195-1.574L12.5 10.274 11 9.051V6a1 1 0 10-2 0v3.051l-1.5 1.223z" />
                            </svg>
                            Pinned
                        </p>
                    )}
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(toast.id);
                    }}
                    className="hover:opacity-70 transition-opacity"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {showDetails && toast.details && (
                <div className="px-4 pb-3 border-t border-[var(--border-subtle)] mt-2 pt-3">
                    <div className="flex justify-between items-center mb-3">
                        <p className="text-xs font-semibold opacity-90">Error Details</p>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard();
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--bg-subtle)] hover:bg-[var(--bg-elevated)] rounded-lg text-xs font-medium transition-colors"
                        >
                            {copied ? (
                                <>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Copy
                                </>
                            )}
                        </button>
                    </div>
                    <div className="text-xs space-y-1.5 font-mono">
                        {toast.details.status && (
                            <div className="flex gap-2">
                                <span className="opacity-75 min-w-[60px]">Status:</span>
                                <span className="font-bold">{toast.details.status}</span>
                            </div>
                        )}
                        {toast.details.method && (
                            <div className="flex gap-2">
                                <span className="opacity-75 min-w-[60px]">Method:</span>
                                <span className="font-bold">{toast.details.method}</span>
                            </div>
                        )}
                        {toast.details.url && (
                            <div className="flex gap-2">
                                <span className="opacity-75 min-w-[60px]">URL:</span>
                                <span className="break-all">{toast.details.url}</span>
                            </div>
                        )}
                        {toast.details.timestamp && (
                            <div className="flex gap-2">
                                <span className="opacity-75 min-w-[60px]">Time:</span>
                                <span>{new Date(toast.details.timestamp).toLocaleString()}</span>
                            </div>
                        )}
                        {toast.details.body && (
                            <div className="mt-3">
                                <div className="opacity-75 mb-1.5 font-semibold">Response:</div>
                                <pre className="bg-[var(--bg-subtle)] p-2.5 rounded-lg overflow-x-auto text-[10px] max-h-40 overflow-y-auto leading-relaxed text-[var(--text-secondary)]">
                                    {JSON.stringify(toast.details.body, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
