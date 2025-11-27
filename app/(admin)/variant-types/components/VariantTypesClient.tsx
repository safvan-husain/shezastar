// app/(admin)/variant-types/components/VariantTypesClient.tsx
'use client';

import { useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';

interface VariantTypesClientProps {
    error?: {
        message: string;
        status?: number;
        body?: any;
        url?: string;
    };
}

export function VariantTypesErrorHandler({ error }: VariantTypesClientProps) {
    const { showToast } = useToast();

    useEffect(() => {
        if (error) {
            showToast(error.message, 'error', {
                status: error.status,
                body: error.body,
                url: error.url,
                method: 'GET',
            });
        }
    }, [error, showToast]);

    return null;
}
