import { describe, it, expect } from 'vitest';
import { getProductStockInfo } from './product.utils';

describe('getProductStockInfo', () => {
    it('should return IN_STOCK with 0 total if no variantStock', () => {
        const result = getProductStockInfo({ variantStock: [] });
        expect(result).toEqual({ totalStock: 0, status: 'IN_STOCK' });
    });

    it('should return OUT_OF_STOCK if total stock is 0', () => {
        const result = getProductStockInfo({
            variantStock: [
                { stockCount: 0 },
                { stockCount: 0 }
            ]
        });
        expect(result).toEqual({ totalStock: 0, status: 'OUT_OF_STOCK' });
    });

    it('should return PARTIAL_STOCK_OUT if some variants have 0 stock', () => {
        const result = getProductStockInfo({
            variantStock: [
                { stockCount: 10 },
                { stockCount: 0 }
            ]
        });
        expect(result).toEqual({ totalStock: 10, status: 'PARTIAL_STOCK_OUT' });
    });

    it('should return IN_STOCK if all variants have stock > 0', () => {
        const result = getProductStockInfo({
            variantStock: [
                { stockCount: 10 },
                { stockCount: 5 }
            ]
        });
        expect(result).toEqual({ totalStock: 15, status: 'IN_STOCK' });
    });
});
