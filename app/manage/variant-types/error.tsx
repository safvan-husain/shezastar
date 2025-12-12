// app/(admin)/variant-types/error.tsx
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Variant types error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
            <Card className="max-w-md w-full text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-[var(--danger)]/10 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-[var(--danger)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                    Something went wrong
                </h2>
                <p className="text-[var(--muted-foreground)] mb-6">
                    {error.message || 'Failed to load variant types'}
                </p>
                <div className="flex gap-3 justify-center">
                    <Button onClick={reset}>
                        Try again
                    </Button>
                    <Button variant="outline" onClick={() => window.location.href = '/'}>
                        Go home
                    </Button>
                </div>
            </Card>
        </div>
    );
}
