export type CurrencyCode = 'AED' | 'USD' | 'SAR' | 'QAR' | 'KWD' | 'BHD' | 'OMR';

export interface CurrencyConfig {
    code: CurrencyCode;
    name: string;
    symbol: string;
    decimals: number;
    // Fallback rate relative to AED (Base)
    fallbackRate: number;
    countryName: string;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
    { code: 'AED', name: 'UAE Dirham', symbol: 'AED', decimals: 2, fallbackRate: 1, countryName: 'United Arab Emirates' },
    { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2, fallbackRate: 0.2722, countryName: 'United States' },
    { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR', decimals: 2, fallbackRate: 1.02, countryName: 'Saudi Arabia' },
    { code: 'QAR', name: 'Qatari Riyal', symbol: 'QAR', decimals: 2, fallbackRate: 1.00, countryName: 'Qatar' },
    { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KWD', decimals: 3, fallbackRate: 0.083, countryName: 'Kuwait' },
    { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BHD', decimals: 3, fallbackRate: 0.10, countryName: 'Bahrain' },
    { code: 'OMR', name: 'Omani Rial', symbol: 'OMR', decimals: 3, fallbackRate: 0.105, countryName: 'Oman' },
];

export const BASE_CURRENCY: CurrencyCode = 'AED';
export const CURRENCY_COOKIE_NAME = 'NEXT_CURRENCY';
