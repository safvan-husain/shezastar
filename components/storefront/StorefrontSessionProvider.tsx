'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { StorefrontSession } from '@/lib/storefront-session';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/utils/api-error-handler';

interface StorefrontSessionContextValue {
    session: StorefrontSession;
    refreshSession: () => Promise<StorefrontSession>;
    isRefreshing: boolean;
}

const StorefrontSessionContext = createContext<StorefrontSessionContextValue | undefined>(undefined);

interface StorefrontSessionProviderProps {
    initialSession: StorefrontSession;
    children: React.ReactNode;
}

export function StorefrontSessionProvider({ initialSession, children }: StorefrontSessionProviderProps) {
    const [session, setSession] = useState(initialSession);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { showToast } = useToast();

    // Initialize session cookie on mount
    useEffect(() => {
        const initSession = async () => {
            try {
                await fetch('/api/storefront/session', { method: 'GET' });
            } catch (error) {
                console.error('Failed to initialize session:', error);
            }
        };
        initSession();
    }, []);

    const refreshSession = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const response = await fetch('/api/storefront/session', {
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
            console.error('[PROVIDER] Refresh failed:', message);
            showToast(message, 'error');
            throw error;
        } finally {
            setIsRefreshing(false);
        }
    }, [showToast]);

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
