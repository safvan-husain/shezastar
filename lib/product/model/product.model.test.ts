import { describe, it, expect } from 'vitest';
import { isProductInStock, Product } from './product.model';

describe('isProductInStock', () => {
    const baseProduct: Partial<Product> = {
        id: '1',
        name: 'Test Product',
        variantStock: []
    };

    it('should return true if no variantStock is defined', () => {
        const product = { ...baseProduct } as Product;
        expect(isProductInStock(product)).toBe(true);
    });

    it('should return true if at least one variant combination has stock', () => {
        const product = {
            ...baseProduct,
            variantStock: [
                { variantCombinationKey: 'v1', stockCount: 0 },
                { variantCombinationKey: 'v2', stockCount: 5 }
            ]
        } as Product;
        expect(isProductInStock(product)).toBe(true);
    });

    it('should return false if all variant combinations have 0 stock', () => {
        const product = {
            ...baseProduct,
            variantStock: [
                { variantCombinationKey: 'v1', stockCount: 0 },
                { variantCombinationKey: 'v2', stockCount: 0 }
            ]
        } as Product;
        expect(isProductInStock(product)).toBe(false);
    });

    it('should return true if variantStock is empty but exists', () => {
        const product = {
            ...baseProduct,
            variantStock: []
        } as Product;
        expect(isProductInStock(product)).toBe(true);
    });
});
