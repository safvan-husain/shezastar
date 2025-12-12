'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { AuthSuggestionModal, type AuthSuggestionTrigger } from './AuthSuggestionModal';
import { useStorefrontSession } from './StorefrontSessionProvider';

interface StorefrontAuthSuggestionContextValue {
    suggestAuthIfGuest: (trigger: AuthSuggestionTrigger) => void;
    resetAuthSuggestionShown: () => void;
}

const StorefrontAuthSuggestionContext = createContext<
    StorefrontAuthSuggestionContextValue | undefined
>(undefined);

const STORAGE_KEY = 'authSuggestionShown';

export function StorefrontAuthSuggestionProvider({ children }: { children: React.ReactNode }) {
    const { session } = useStorefrontSession();
    const [isOpen, setIsOpen] = useState(false);
    const [trigger, setTrigger] = useState<AuthSuggestionTrigger | null>(null);

    const suggestAuthIfGuest = useCallback(
        (source: AuthSuggestionTrigger) => {
            if (session?.userId) return;
            if (typeof window === 'undefined') return;
            if (sessionStorage.getItem(STORAGE_KEY) === 'true') return;

            sessionStorage.setItem(STORAGE_KEY, 'true');
            setTrigger(source);
            setIsOpen(true);
        },
        [session?.userId]
    );

    const resetAuthSuggestionShown = useCallback(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem(STORAGE_KEY);
        }
        setIsOpen(false);
        setTrigger(null);
    }, []);

    const value = useMemo(
        () => ({ suggestAuthIfGuest, resetAuthSuggestionShown }),
        [suggestAuthIfGuest, resetAuthSuggestionShown]
    );

    return (
        <StorefrontAuthSuggestionContext.Provider value={value}>
            {children}
            <AuthSuggestionModal
                isOpen={isOpen}
                trigger={trigger}
                onClose={() => setIsOpen(false)}
            />
        </StorefrontAuthSuggestionContext.Provider>
    );
}

export function useStorefrontAuthSuggestion() {
    const context = useContext(StorefrontAuthSuggestionContext);
    if (!context) {
        throw new Error(
            'useStorefrontAuthSuggestion must be used within StorefrontAuthSuggestionProvider'
        );
    }
    return context;
}

