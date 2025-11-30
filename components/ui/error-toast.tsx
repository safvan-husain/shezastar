// components/ui/error-toast.tsx
'use client';

import { useToast } from '@/components/ui/Toast';
import { AppErrorPayload } from '@/lib/errors/app-error';

export type ErrorToastPayload = Pick<AppErrorPayload, 'message' | 'code' | 'status' | 'details' | 'timestamp'>;

export function useErrorToast() {
    const { showToast } = useToast();

    const showErrorToast = (error: ErrorToastPayload | string) => {
        const payload: ErrorToastPayload = typeof error === 'string'
            ? { message: error, code: 'UNEXPECTED_ERROR', status: 500, timestamp: new Date().toISOString() }
            : error;

        showToast(payload.message, 'error', {
            status: payload.status,
            code: payload.code,
            body: payload.details ?? payload,
            timestamp: payload.timestamp,
        });
    };

    return { showErrorToast };
}

