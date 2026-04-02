import { describe, expect, it } from 'vitest';

import { toStripeUnitAmount } from '@/lib/currency/stripe-amount';

describe('toStripeUnitAmount', () => {
    it('keeps two-decimal currencies in standard minor units', () => {
        expect(toStripeUnitAmount(12.34, 'USD')).toBe(1234);
    });

    it('rounds supported three-decimal Stripe charges to amounts divisible by 10', () => {
        expect(toStripeUnitAmount(12.341, 'OMR')).toBe(12340);
        expect(toStripeUnitAmount(12.345, 'OMR')).toBe(12350);
    });
});
