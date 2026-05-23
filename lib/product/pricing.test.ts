import { describe, expect, it } from 'vitest';
import {
    applyOfferPercentage,
    getProductDefaultListPrice,
    getProductDefaultOfferPrice,
} from '@/lib/product/pricing';

describe('product pricing helpers', () => {
    it('applies offer percentage to the default variant price', () => {
        const product = {
            basePrice: 500,
            variantStock: [{ variantCombinationKey: 'default', stockCount: 1, price: 1000 }],
            offerPercentage: 10,
        };

        expect(getProductDefaultListPrice(product)).toBe(1000);
        expect(getProductDefaultOfferPrice(product)).toBe(900);
    });

    it('returns the base price when no default variant price exists', () => {
        const product = {
            basePrice: 500,
            variantStock: [],
            offerPercentage: 25,
        };

        expect(getProductDefaultOfferPrice(product)).toBe(375);
    });

    it('leaves price unchanged when offer percentage is missing', () => {
        expect(applyOfferPercentage(120, undefined)).toBe(120);
    });
});
