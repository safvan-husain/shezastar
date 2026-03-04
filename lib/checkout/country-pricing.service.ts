import type { CurrencyCode } from '@/lib/currency/currency.config';
import { SUPPORTED_CURRENCIES } from '@/lib/currency/currency.config';
import type { CountryPricing } from '@/lib/app-settings/app-settings.schema';
import { getActiveCountryPricings } from '@/lib/app-settings/app-settings.service';
import { AppError } from '@/lib/errors/app-error';

export interface CheckoutPricingBreakdown {
  countryCode: string;
  currency: CurrencyCode;
  subtotal: number;
  shipping: number;
  vat: number;
  vatRatePercent: number;
  vatIncludedInPrice: boolean;
  total: number;
}

function getCurrencyDecimals(currency: CurrencyCode) {
  return SUPPORTED_CURRENCIES.find((c) => c.code === currency)?.decimals ?? 2;
}

function roundForCurrency(value: number, currency: CurrencyCode) {
  const decimals = getCurrencyDecimals(currency);
  return Number(value.toFixed(decimals));
}

export function convertAedToCurrency(
  amountInAed: number,
  currency: CurrencyCode,
  rates: Record<string, number>
) {
  const rate = rates[currency] || 1;
  return amountInAed * rate;
}

export function computeCheckoutPricingBreakdown(params: {
  subtotalAed: number;
  currency: CurrencyCode;
  rates: Record<string, number>;
  countryPricing: CountryPricing;
}): CheckoutPricingBreakdown {
  const { subtotalAed, currency, rates, countryPricing } = params;

  const subtotalConverted = roundForCurrency(
    convertAedToCurrency(subtotalAed, currency, rates),
    currency
  );

  const shippingConverted = roundForCurrency(
    convertAedToCurrency(countryPricing.shippingChargeAed, currency, rates),
    currency
  );

  const vat = countryPricing.vatIncludedInPrice
    ? 0
    : roundForCurrency((subtotalConverted * countryPricing.vatRatePercent) / 100, currency);

  const total = roundForCurrency(subtotalConverted + shippingConverted + vat, currency);

  return {
    countryCode: countryPricing.code,
    currency,
    subtotal: subtotalConverted,
    shipping: shippingConverted,
    vat,
    vatRatePercent: countryPricing.vatRatePercent,
    vatIncludedInPrice: countryPricing.vatIncludedInPrice,
    total,
  };
}

export async function resolveCountryPricingForCheckout(country: string) {
  const normalized = country.trim().toUpperCase();
  const countries = await getActiveCountryPricings();

  const matched = countries.find(
    (entry) => entry.code.toUpperCase() === normalized || entry.name.toUpperCase() === normalized
  );

  if (!matched) {
    throw new AppError(400, 'COUNTRY_PRICING_NOT_FOUND', {
      message: `No active country pricing found for "${country}"`,
      country,
    });
  }

  return matched;
}
