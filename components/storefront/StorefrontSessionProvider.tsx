'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { StorefrontSession } from '@/lib/storefront-session';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/utils/api-error-handler';

interface StorefrontSessionContextValue {
    session: StorefrontSession | null;
    refreshSession: () => Promise<StorefrontSession>;
    isRefreshing: boolean;
}

const StorefrontSessionContext = createContext<StorefrontSessionContextValue | undefined>(undefined);

interface StorefrontSessionProviderProps {
    initialSession?: StorefrontSession | null;
    children: React.ReactNode;
}

export function StorefrontSessionProvider({ initialSession = null, children }: StorefrontSessionProviderProps) {
    const [session, setSession] = useState<StorefrontSession | null>(initialSession);

    // Sync state with prop when server re-renders (e.g. after router.refresh())
    useEffect(() => {
        setSession(initialSession);
    }, [initialSession]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { showToast } = useToast();

    const refreshSession = useCallback(async () => {
        setIsRefreshing(true);
        const url = '/api/storefront/session';
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({}),
            });
            if (!response.ok) {
                await handleApiError(response, showToast);
            }
            const data: StorefrontSession = await response.json();
            setSession(data);
            return data;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to refresh session';
            showToast(message, 'error', { url, method: 'POST' });
            throw error;
        } finally {
            setIsRefreshing(false);
        }
    }, [showToast]);

    useEffect(() => {
        if (initialSession) {
            return;
        }

        refreshSession().catch(() => {
            // Error has already been surfaced through the toast system.
        });
    }, [initialSession, refreshSession]);

    const value = useMemo<StorefrontSessionContextValue>(
        () => ({
            session,
            refreshSession,
            isRefreshing,
        }),
        [session, refreshSession, isRefreshing]
    );

    return <StorefrontSessionContext.Provider value={value}>{children}</StorefrontSessionContext.Provider>;
}

export function useStorefrontSession() {
    const context = useContext(StorefrontSessionContext);
    if (!context) {
        throw new Error('useStorefrontSession must be used within StorefrontSessionProvider');
    }
    return context;
}
