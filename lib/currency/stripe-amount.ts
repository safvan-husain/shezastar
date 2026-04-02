import { SUPPORTED_CURRENCIES, type CurrencyCode } from '@/lib/currency/currency.config';

function resolveCurrencyDecimals(currency: CurrencyCode): number {
    return SUPPORTED_CURRENCIES.find((item) => item.code === currency)?.decimals ?? 2;
}

export function toStripeUnitAmount(amount: number, currency: CurrencyCode): number {
    const decimals = resolveCurrencyDecimals(currency);
    const rawUnitAmount = Math.round(amount * (10 ** decimals));

    if (decimals !== 3) {
        return rawUnitAmount;
    }

    // Stripe requires supported three-decimal charges to be divisible by 10.
    return Math.round(rawUnitAmount / 10) * 10;
}
