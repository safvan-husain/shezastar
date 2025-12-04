import { describe, expect, it, vi } from 'vitest';

import {
    handleAddToCart,
    handleClearCart,
    handleGetCartForCurrentSession,
    handleRemoveCartItem,
    handleUpdateCartItem,
} from '@/lib/cart/cart.controller';

const getCartForCurrentSessionMock = vi.fn();
const ensureCartForCurrentSessionMock = vi.fn();
const addItemToCartMock = vi.fn();
const updateCartItemQuantityMock = vi.fn();
const removeItemFromCartMock = vi.fn();
const clearCartMock = vi.fn();

vi.mock('@/lib/cart/cart.service', () => ({
    getCartForCurrentSession: getCartForCurrentSessionMock,
    ensureCartForCurrentSession: ensureCartForCurrentSessionMock,
    addItemToCart: addItemToCartMock,
    updateCartItemQuantity: updateCartItemQuantityMock,
    removeItemFromCart: removeItemFromCartMock,
    clearCart: clearCartMock,
}));

const getStorefrontSessionIdMock = vi.fn();
const ensureStorefrontSessionMock = vi.fn();

vi.mock('@/lib/storefront-session', () => ({
    getStorefrontSessionId: getStorefrontSessionIdMock,
    ensureStorefrontSession: ensureStorefrontSessionMock,
}));

describe('Cart controller', () => {
    it('returns an empty cart when no session cart exists', async () => {
        getCartForCurrentSessionMock.mockResolvedValueOnce(null);

        const result = await handleGetCartForCurrentSession();
        expect(result.status).toBe(200);
        expect(result.body.items).toEqual([]);
        expect(result.body.totalItems).toBe(0);
    });

    it('adds an item to cart for the current session', async () => {
        ensureStorefrontSessionMock.mockResolvedValueOnce({
            sessionId: 'session-123',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 1000).toISOString(),
            lastActiveAt: new Date().toISOString(),
        });

        addItemToCartMock.mockResolvedValueOnce({
            id: 'cart-1',
            sessionId: 'session-123',
            items: [
                {
                    productId: 'prod-1',
                    selectedVariantItemIds: [],
                    quantity: 1,
                    unitPrice: 100,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
            ],
            subtotal: 100,
            totalItems: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        const response = await handleAddToCart({
            productId: 'prod-1',
            selectedVariantItemIds: [],
            quantity: 1,
        });

        expect(response.status).toBe(200);
        expect(addItemToCartMock).toHaveBeenCalledWith({
            sessionId: 'session-123',
            productId: 'prod-1',
            selectedVariantItemIds: [],
            quantity: 1,
        });
        expect(response.body.totalItems).toBe(1);
    });

    it('rejects invalid add-to-cart payloads', async () => {
        const response = await handleAddToCart({
            productId: '',
            quantity: 0,
            selectedVariantItemIds: [],
        });
        expect(response.status).toBe(400);
    });

    it('returns 404 when updating without a session id', async () => {
        getStorefrontSessionIdMock.mockResolvedValueOnce(null);

        const response = await handleUpdateCartItem({
            productId: 'prod-1',
            selectedVariantItemIds: [],
            quantity: 2,
        });

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('CART_NOT_FOUND');
    });

    it('updates cart item quantity when session id is present', async () => {
        getStorefrontSessionIdMock.mockResolvedValueOnce('session-123');
        updateCartItemQuantityMock.mockResolvedValueOnce({
            id: 'cart-1',
            sessionId: 'session-123',
            items: [
                {
                    productId: 'prod-1',
                    selectedVariantItemIds: [],
                    quantity: 3,
                    unitPrice: 100,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
            ],
            subtotal: 300,
            totalItems: 3,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        const response = await handleUpdateCartItem({
            productId: 'prod-1',
            selectedVariantItemIds: [],
            quantity: 3,
        });

        expect(response.status).toBe(200);
        expect(updateCartItemQuantityMock).toHaveBeenCalledWith({
            sessionId: 'session-123',
            productId: 'prod-1',
            selectedVariantItemIds: [],
            quantity: 3,
        });
    });

    it('removes a cart item when session id is present', async () => {
        getStorefrontSessionIdMock.mockResolvedValueOnce('session-123');
        removeItemFromCartMock.mockResolvedValueOnce({
            id: 'cart-1',
            sessionId: 'session-123',
            items: [],
            subtotal: 0,
            totalItems: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        const response = await handleRemoveCartItem({
            productId: 'prod-1',
            selectedVariantItemIds: [],
        });

        expect(response.status).toBe(200);
        expect(response.body.items).toHaveLength(0);
    });

    it('clears the cart when session id is present', async () => {
        getStorefrontSessionIdMock.mockResolvedValueOnce('session-123');
        clearCartMock.mockResolvedValueOnce({
            id: 'cart-1',
            sessionId: 'session-123',
            items: [],
            subtotal: 0,
            totalItems: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        const response = await handleClearCart({});

        expect(response.status).toBe(200);
        expect(clearCartMock).toHaveBeenCalledWith('session-123');
        expect(response.body.items).toHaveLength(0);
    });
});

