import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    handleAddToWishlist,
    handleClearWishlist,
    handleEnsureWishlist,
    handleGetWishlist,
    handleRemoveFromWishlist,
} from '@/lib/wishlist/wishlist.controller';

const {
    getWishlistMock,
    ensureWishlistMock,
    addItemToWishlistMock,
    removeItemFromWishlistMock,
    clearWishlistMock,
    getStorefrontSessionMock,
    ensureStorefrontSessionMock,
} = vi.hoisted(() => ({
    getWishlistMock: vi.fn(),
    ensureWishlistMock: vi.fn(),
    addItemToWishlistMock: vi.fn(),
    removeItemFromWishlistMock: vi.fn(),
    clearWishlistMock: vi.fn(),
    getStorefrontSessionMock: vi.fn(),
    ensureStorefrontSessionMock: vi.fn(),
}));

vi.mock('@/lib/wishlist/wishlist.service', () => ({
    getWishlist: getWishlistMock,
    ensureWishlist: ensureWishlistMock,
    addItemToWishlist: addItemToWishlistMock,
    removeItemFromWishlist: removeItemFromWishlistMock,
    clearWishlist: clearWishlistMock,
}));

vi.mock('@/lib/storefront-session', () => ({
    getStorefrontSession: getStorefrontSessionMock,
    ensureStorefrontSession: ensureStorefrontSessionMock,
}));

const baseWishlist = {
    id: 'wishlist-1',
    sessionId: 'session-1',
    items: [],
    itemsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

describe('Wishlist controller', () => {
    const session = { sessionId: 'session-1', items: [] } as any;

    beforeEach(() => {
        getWishlistMock.mockReset();
        ensureWishlistMock.mockReset();
        addItemToWishlistMock.mockReset();
        removeItemFromWishlistMock.mockReset();
        clearWishlistMock.mockReset();
        getStorefrontSessionMock.mockReset();
        ensureStorefrontSessionMock.mockReset();

        getStorefrontSessionMock.mockResolvedValue(session);
        ensureStorefrontSessionMock.mockResolvedValue(session);
    });

    it('returns existing wishlist via handleGetWishlist', async () => {
        getWishlistMock.mockResolvedValueOnce(baseWishlist);

        const response = await handleGetWishlist();

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(baseWishlist.id);
        expect(getWishlistMock).toHaveBeenCalledWith(session);
        expect(ensureWishlistMock).not.toHaveBeenCalled();
    });

    it('ensures wishlist when none exists in handleGetWishlist', async () => {
        getWishlistMock.mockResolvedValueOnce(null);
        ensureWishlistMock.mockResolvedValueOnce(baseWishlist);

        const response = await handleGetWishlist();

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(baseWishlist.id);
        expect(ensureWishlistMock).toHaveBeenCalledWith(session);
    });

    it('ensures wishlist explicitly via handleEnsureWishlist', async () => {
        ensureWishlistMock.mockResolvedValueOnce(baseWishlist);

        const response = await handleEnsureWishlist();
        expect(response.status).toBe(200);
        expect(response.body.sessionId).toBe('session-1');
        expect(ensureWishlistMock).toHaveBeenCalledWith(session);
    });

    it('adds item to wishlist and validates payload', async () => {
        addItemToWishlistMock.mockResolvedValueOnce({
            ...baseWishlist,
            items: [
                {
                    productId: 'product-1',
                    selectedVariantItemIds: [],
                    createdAt: new Date().toISOString(),
                },
            ],
            itemsCount: 1,
        });

        const response = await handleAddToWishlist({
            sessionId: 'session-1',
            productId: 'product-1',
            selectedVariantItemIds: [],
        });

        expect(response.status).toBe(200);
        expect(addItemToWishlistMock).toHaveBeenCalledWith({
            sessionId: 'session-1',
            productId: 'product-1',
            selectedVariantItemIds: [],
            session,
        });
        expect(response.body.items).toHaveLength(1);
    });

    it('returns validation error for invalid add payload', async () => {
        const response = await handleAddToWishlist({
            // missing productId and sessionId
            selectedVariantItemIds: [],
        } as any);

        expect(response.status).toBe(400);
        expect(addItemToWishlistMock).not.toHaveBeenCalled();
    });

    it('removes item from wishlist', async () => {
        removeItemFromWishlistMock.mockResolvedValueOnce(baseWishlist);

        const response = await handleRemoveFromWishlist({
            sessionId: 'session-1',
            productId: 'product-1',
            selectedVariantItemIds: [],
        });

        expect(response.status).toBe(200);
        expect(removeItemFromWishlistMock).toHaveBeenCalledWith({
            sessionId: 'session-1',
            productId: 'product-1',
            selectedVariantItemIds: [],
            session,
        });
    });

    it('clears wishlist items', async () => {
        clearWishlistMock.mockResolvedValueOnce(baseWishlist);

        const response = await handleClearWishlist({ sessionId: 'session-1' });

        expect(response.status).toBe(200);
        expect(clearWishlistMock).toHaveBeenCalledWith(session);
    });
});
