'use client';

import { useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';

export interface ProductPageError {
  message: string;
  status?: number;
  body?: any;
  url?: string;
  method: string;
}

interface ProductErrorHandlerProps {
  error: ProductPageError;
}

export function ProductErrorHandler({ error }: ProductErrorHandlerProps) {
  const { showToast } = useToast();

  useEffect(() => {
    showToast('Error Loading Product', 'error', {
      status: error.status,
      body: error.body,
      url: error.url,
      method: error.method,
    });
  }, [error, showToast]);

  return null;
}
