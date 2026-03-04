import { describe, expect, it } from 'vitest';
import { computeCheckoutPricingBreakdown } from '@/lib/checkout/country-pricing.service';

describe('country pricing checkout breakdown', () => {
  it('calculates VAT add-on and shipping conversion', () => {
    const breakdown = computeCheckoutPricingBreakdown({
      subtotalAed: 100,
      currency: 'SAR',
      rates: { SAR: 1.02 },
      countryPricing: {
        id: 'ksa-1',
        code: 'KSA',
        name: 'Saudi Arabia',
        defaultCurrency: 'SAR',
        vatRatePercent: 10,
        vatIncludedInPrice: false,
        shippingChargeAed: 80,
        isActive: true,
      },
    });

    expect(breakdown.subtotal).toBe(102);
    expect(breakdown.shipping).toBe(81.6);
    expect(breakdown.vat).toBe(10.2);
    expect(breakdown.total).toBe(193.8);
  });

  it('keeps VAT zero when VAT is included in price', () => {
    const breakdown = computeCheckoutPricingBreakdown({
      subtotalAed: 200,
      currency: 'AED',
      rates: { AED: 1 },
      countryPricing: {
        id: 'uae-1',
        code: 'UAE',
        name: 'United Arab Emirates',
        defaultCurrency: 'AED',
        vatRatePercent: 5,
        vatIncludedInPrice: true,
        shippingChargeAed: 0,
        isActive: true,
      },
    });

    expect(breakdown.subtotal).toBe(200);
    expect(breakdown.vat).toBe(0);
    expect(breakdown.total).toBe(200);
  });

  it('respects 3-decimal currency rounding', () => {
    const breakdown = computeCheckoutPricingBreakdown({
      subtotalAed: 1,
      currency: 'KWD',
      rates: { KWD: 0.083 },
      countryPricing: {
        id: 'kwt-1',
        code: 'KUWAIT',
        name: 'Kuwait',
        defaultCurrency: 'KWD',
        vatRatePercent: 0,
        vatIncludedInPrice: false,
        shippingChargeAed: 85,
        isActive: true,
      },
    });

    expect(breakdown.subtotal).toBe(0.083);
    expect(breakdown.shipping).toBe(7.055);
    expect(breakdown.total).toBe(7.138);
  });
});
