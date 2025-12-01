'use client';

import { useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';

export interface CategoryPageError {
    message: string;
    status?: number;
    body?: any;
    url?: string;
    method?: string;
}

interface CategoryErrorHandlerProps {
    error?: CategoryPageError | null;
}

export function CategoryErrorHandler({ error }: CategoryErrorHandlerProps) {
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
