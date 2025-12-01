'use client';

import { useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';

export interface ToastErrorPayload {
    message: string;
    status?: number;
    body?: unknown;
    url?: string;
    method?: string;
}

interface ErrorToastHandlerProps {
    error?: ToastErrorPayload | null;
}

export function ErrorToastHandler({ error }: ErrorToastHandlerProps) {
    const { showToast } = useToast();

    useEffect(() => {
        if (error) {
            showToast(error.message, 'error', {
                status: error.status,
                body: error.body,
                url: error.url,
                method: error.method ?? 'GET',
            });
        }
    }, [error, showToast]);

    return null;
}
