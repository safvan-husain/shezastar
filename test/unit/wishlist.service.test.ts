import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clear, getCollection } from '../test-db';
import {
    addItemToWishlist,
    clearWishlist,
    ensureWishlist,
    getWishlistBySessionId,
    removeItemFromWishlist,
} from '@/lib/wishlist/wishlist.service';
import type { WishlistDocument } from '@/lib/wishlist/model/wishlist.model';
import { AppError } from '@/lib/errors/app-error';

const { getProductMock } = vi.hoisted(() => ({
    getProductMock: vi.fn(),
}));

vi.mock('@/lib/product/product.service', () => ({
    getProduct: getProductMock,
}));

describe('Wishlist service', () => {
    const sessionId = 'test-session';
    const productId = 'product-1';

    beforeEach(async () => {
        await clear();
        getProductMock.mockReset();
        getProductMock.mockResolvedValue({
            id: productId,
            name: 'Test Product',
        } as any);
    });

    it('creates a wishlist and adds an item for a new session', async () => {
        const wishlist = await addItemToWishlist({
            sessionId,
            productId,
            selectedVariantItemIds: [],
        });

        expect(wishlist.sessionId).toBe(sessionId);
        expect(wishlist.items).toHaveLength(1);
        expect(wishlist.items[0].productId).toBe(productId);

        const collection = await getCollection<WishlistDocument>('storefrontWishlists');
        const stored = await collection.findOne({ sessionId });
        expect(stored).not.toBeNull();
        expect(stored?.items).toHaveLength(1);
    });

    it('does not duplicate the same product and variant combination', async () => {
        const variantIds = ['b', 'a', 'b'];

        const first = await addItemToWishlist({
            sessionId,
            productId,
            selectedVariantItemIds: variantIds,
        });
        expect(first.items).toHaveLength(1);

        const second = await addItemToWishlist({
            sessionId,
            productId,
            selectedVariantItemIds: ['a', 'b'],
        });

        expect(second.items).toHaveLength(1);
        expect(second.items[0].selectedVariantItemIds).toEqual(['a', 'b']);
    });

    it('removes an existing item from the wishlist', async () => {
        await addItemToWishlist({
            sessionId,
            productId,
            selectedVariantItemIds: [],
        });

        const afterRemove = await removeItemFromWishlist({
            sessionId,
            productId,
            selectedVariantItemIds: [],
        });

        expect(afterRemove.items).toHaveLength(0);
    });

    it('clearWishlist empties items but keeps the document', async () => {
        await addItemToWishlist({
            sessionId,
            productId,
            selectedVariantItemIds: [],
        });

        const cleared = await clearWishlist(sessionId);
        expect(cleared.items).toHaveLength(0);

        const fromService = await getWishlistBySessionId(sessionId);
        expect(fromService).not.toBeNull();
        expect(fromService?.items).toHaveLength(0);
    });

    it('ensureWishlist returns an existing wishlist or creates a new one', async () => {
        const created = await ensureWishlist(sessionId);
        expect(created.sessionId).toBe(sessionId);
        expect(created.items).toHaveLength(0);

        const again = await ensureWishlist(sessionId);
        expect(again.sessionId).toBe(sessionId);
        expect(again.id).toBe(created.id);
    });

    it('propagates product validation errors from getProduct', async () => {
        getProductMock.mockRejectedValueOnce(new AppError(404, 'PRODUCT_NOT_FOUND'));

        await expect(
            addItemToWishlist({
                sessionId,
                productId,
                selectedVariantItemIds: [],
            })
        ).rejects.toThrow(AppError);
    });
});
