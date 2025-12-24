import { unstable_cache } from 'next/cache';
import { BASE_CURRENCY, CurrencyCode, SUPPORTED_CURRENCIES } from './currency.config';

// Open Exchange Rate API (Free, no key required for basic usage)
const API_ENDPOINT = `https://open.er-api.com/v6/latest/${BASE_CURRENCY}`;

interface ExchangeRateResponse {
    rates: Record<string, number>;
    time_last_update_unix: number;
}

// In-memory cache fallback (for when unstable_cache might be bypassed or in dev)
let memoryCache: { rates: Record<string, number>; expiry: number } | null = null;
const CACHE_DURATION_MS = 3600 * 1000; // 1 hour

export async function getExchangeRates(): Promise<Record<string, number>> {
    try {
        // Check memory cache first
        const now = Date.now();
        if (memoryCache && now < memoryCache.expiry) {
            return memoryCache.rates;
        }

        const res = await fetch(API_ENDPOINT, { next: { revalidate: 3600 } });

        if (!res.ok) {
            throw new Error(`Failed to fetch rates: ${res.statusText}`);
        }

        const data: ExchangeRateResponse = await res.json();

        // Filter only supported currencies to keep payload small
        const rates: Record<string, number> = {};
        SUPPORTED_CURRENCIES.forEach(c => {
            // API returns uppercase codes
            if (data.rates[c.code]) {
                rates[c.code] = data.rates[c.code];
            } else {
                rates[c.code] = c.fallbackRate; // Should rarely happen
            }
        });

        // Update memory cache
        memoryCache = {
            rates,
            expiry: now + CACHE_DURATION_MS
        };

        return rates;

    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        // Return fallback rates
        const fallbackRates: Record<string, number> = {};
        SUPPORTED_CURRENCIES.forEach(c => {
            fallbackRates[c.code] = c.fallbackRate;
        });
        return fallbackRates;
    }
}

export function formatPrice(amountInBaseCurrency: number, targetCurrency: CurrencyCode, rates: Record<string, number>): string {
    const rate = rates[targetCurrency] || 1;
    const convertedAmount = amountInBaseCurrency * rate;

    // Find config for decimals
    const config = SUPPORTED_CURRENCIES.find(c => c.code === targetCurrency);
    const decimals = config?.decimals ?? 2;

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: targetCurrency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(convertedAmount);
}

export function convertPrice(amountInBaseCurrency: number, targetCurrency: CurrencyCode, rates: Record<string, number>): number {
    const rate = rates[targetCurrency] || 1;
    return amountInBaseCurrency * rate;
}
