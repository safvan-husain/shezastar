'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { CurrencyCode, SUPPORTED_CURRENCIES, BASE_CURRENCY, CURRENCY_COOKIE_NAME } from './currency.config';

interface CurrencyContextType {
    currency: CurrencyCode;
    setCurrency: (code: CurrencyCode) => void;
    rates: Record<string, number>;
    formatPrice: (amountInBase: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children, initialRates }: { children: React.ReactNode, initialRates: Record<string, number> }) {
    const [currency, setCurrencyState] = useState<CurrencyCode>(BASE_CURRENCY);
    const [rates, setRates] = useState<Record<string, number>>(initialRates);

    useEffect(() => {
        // Load preference from cookie
        const saved = Cookies.get(CURRENCY_COOKIE_NAME) as CurrencyCode;
        if (saved && SUPPORTED_CURRENCIES.some(c => c.code === saved)) {
            setCurrencyState(saved);
        }
    }, []);

    const setCurrency = (code: CurrencyCode) => {
        setCurrencyState(code);
        Cookies.set(CURRENCY_COOKIE_NAME, code, { expires: 365 }); // Persist for 1 year
    };

    const formatPrice = (amountInBase: number): string => {
        const rate = rates[currency] || 1;
        const converted = amountInBase * rate;

        const config = SUPPORTED_CURRENCIES.find(c => c.code === currency);
        const decimals = config?.decimals ?? 2;

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(converted);
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, rates, formatPrice }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
}
