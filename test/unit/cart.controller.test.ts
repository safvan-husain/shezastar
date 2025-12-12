import { describe, expect, it, vi } from 'vitest';

import {
    handleAddToCart,
    handleClearCart,
    handleGetBillingDetailsForCurrentSession,
    handleGetCartForCurrentSession,
    handleRemoveCartItem,
    handleSetBillingDetailsForCurrentSession,
    handleUpdateCartItem,
} from '@/lib/cart/cart.controller';

vi.mock('@/lib/cart/cart.service', () => ({
    getCartForCurrentSession: vi.fn(),
    ensureCartForCurrentSession: vi.fn(),
    addItemToCart: vi.fn(),
    updateCartItemQuantity: vi.fn(),
    removeItemFromCart: vi.fn(),
    clearCart: vi.fn(),
    getBillingDetailsForCurrentSession: vi.fn(),
    setBillingDetailsForCurrentSession: vi.fn(),
}));

vi.mock('@/lib/storefront-session', () => ({
    getStorefrontSessionId: vi.fn(),
    getStorefrontSession: vi.fn(),
    ensureStorefrontSession: vi.fn(),
}));

// Import the mocked modules to get references to the mock functions
const cartService = await import('@/lib/cart/cart.service');
const storefrontSession = await import('@/lib/storefront-session');

describe('Cart controller', () => {
    it('returns an empty cart when no session cart exists', async () => {
        vi.mocked(cartService.getCartForCurrentSession).mockResolvedValueOnce(null);
        vi.mocked(cartService.ensureCartForCurrentSession).mockResolvedValueOnce({
            id: 'cart-1',
            sessionId: 'session-123',
            items: [],
            subtotal: 0,
            totalItems: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        const result = await handleGetCartForCurrentSession();
        expect(result.status).toBe(200);
        expect(result.body.items).toEqual([]);
        expect(result.body.totalItems).toBe(0);
    });

    it('adds an item to cart for the current session', async () => {
        vi.mocked(storefrontSession.ensureStorefrontSession).mockResolvedValueOnce({
            sessionId: 'session-123',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 1000).toISOString(),
            lastActiveAt: new Date().toISOString(),
        });

        vi.mocked(cartService.addItemToCart).mockResolvedValueOnce({
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
        expect(cartService.addItemToCart).toHaveBeenCalledWith({
            session: expect.objectContaining({ sessionId: 'session-123' }),
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

    it('returns 404 when updating without a session', async () => {
        vi.mocked(storefrontSession.getStorefrontSession).mockResolvedValueOnce(null);

        const response = await handleUpdateCartItem({
            productId: 'prod-1',
            selectedVariantItemIds: [],
            quantity: 2,
        });

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('CART_NOT_FOUND');
    });

    it('updates cart item quantity when session is present', async () => {
        vi.mocked(storefrontSession.getStorefrontSession).mockResolvedValueOnce({
            sessionId: 'session-123',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 1000).toISOString(),
            lastActiveAt: new Date().toISOString(),
        });
        vi.mocked(cartService.updateCartItemQuantity).mockResolvedValueOnce({
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
        expect(cartService.updateCartItemQuantity).toHaveBeenCalledWith({
            session: expect.objectContaining({ sessionId: 'session-123' }),
            productId: 'prod-1',
            selectedVariantItemIds: [],
            quantity: 3,
        });
    });

    it('removes a cart item when session is present', async () => {
        vi.mocked(storefrontSession.getStorefrontSession).mockResolvedValueOnce({
            sessionId: 'session-123',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 1000).toISOString(),
            lastActiveAt: new Date().toISOString(),
        });
        vi.mocked(cartService.removeItemFromCart).mockResolvedValueOnce({
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

    it('clears the cart when session is present', async () => {
        vi.mocked(storefrontSession.getStorefrontSession).mockResolvedValueOnce({
            sessionId: 'session-123',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 1000).toISOString(),
            lastActiveAt: new Date().toISOString(),
        });
        vi.mocked(cartService.clearCart).mockResolvedValueOnce({
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
        expect(cartService.clearCart).toHaveBeenCalledWith(expect.objectContaining({ sessionId: 'session-123' }));
        expect(response.body.items).toHaveLength(0);
    });

    it('returns billing details for current session', async () => {
        vi.mocked(cartService.getBillingDetailsForCurrentSession).mockResolvedValueOnce({
            email: 'store@example.com',
            firstName: 'Store',
            lastName: 'User',
            country: 'United Arab Emirates',
            streetAddress1: '123 Billing St',
            city: 'Dubai',
            phone: '+971500000000',
        });

        const response = await handleGetBillingDetailsForCurrentSession();
        expect(response.status).toBe(200);
        expect(response.body.billingDetails?.email).toBe('store@example.com');
    });

    it('saves billing details for current session', async () => {
        vi.mocked(cartService.setBillingDetailsForCurrentSession).mockResolvedValueOnce({
            id: 'cart-1',
            sessionId: 'session-123',
            items: [],
            subtotal: 0,
            totalItems: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            billingDetails: {
                email: 'store@example.com',
                firstName: 'Store',
                lastName: 'User',
                country: 'United Arab Emirates',
                streetAddress1: '123 Billing St',
                city: 'Dubai',
                phone: '+971500000000',
            },
        });

        const payload = {
            email: 'store@example.com',
            firstName: 'Store',
            lastName: 'User',
            country: 'United Arab Emirates',
            streetAddress1: '123 Billing St',
            city: 'Dubai',
            phone: '+971500000000',
        };

        const response = await handleSetBillingDetailsForCurrentSession(payload);
        expect(response.status).toBe(200);
        expect(cartService.setBillingDetailsForCurrentSession).toHaveBeenCalledWith(expect.objectContaining(payload));
        expect(response.body.billingDetails?.email).toBe('store@example.com');
    });
});

