import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clear } from '../test-db';
import { GET, POST, DELETE } from '@/app/api/storefront/wishlist/route';
import { PATCH } from '@/app/api/storefront/wishlist/clear/route';
import { createProduct } from '@/lib/product/product.service';

const { getStorefrontSessionIdMock, ensureStorefrontSessionMock, getStorefrontSessionMock } = vi.hoisted(() => ({
    getStorefrontSessionIdMock: vi.fn(),
    ensureStorefrontSessionMock: vi.fn(),
    getStorefrontSessionMock: vi.fn(),
}));

vi.mock('@/lib/storefront-session', () => ({
    getStorefrontSessionId: getStorefrontSessionIdMock,
    ensureStorefrontSession: ensureStorefrontSessionMock,
    getStorefrontSession: getStorefrontSessionMock,
}));

const ctx = { params: Promise.resolve({}) };

describe('Storefront wishlist route handlers', () => {
    beforeEach(async () => {
        await clear();
        getStorefrontSessionIdMock.mockReset();
        ensureStorefrontSessionMock.mockReset();
        getStorefrontSessionMock.mockReset();

        const mockSession = { sessionId: 'session-integration', items: [] };
        getStorefrontSessionIdMock.mockResolvedValue('session-integration');
        ensureStorefrontSessionMock.mockResolvedValue(mockSession);
        getStorefrontSessionMock.mockResolvedValue(mockSession);
    });

    it('adds an item via POST and returns it via GET', async () => {
        const product = await createProduct({
            name: 'Wishlist Product',
            subtitle: 'Product Subtitle',
            basePrice: 100,
            images: [],
            variants: [],
            subCategoryIds: [],
            variantStock: [],
            specifications: [],
        });

        const postResponse = await POST(
            new Request('http://localhost/api/storefront/wishlist', {
                method: 'POST',
                body: JSON.stringify({
                    productId: product.id,
                    selectedVariantItemIds: [],
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
            }),
            ctx
        );

        expect(postResponse.status).toBe(200);
        const postBody = await postResponse.json();
        expect(postBody.items).toHaveLength(1);
        expect(postBody.items[0].productId).toBe(product.id);

        const getResponse = await GET(
            new Request('http://localhost/api/storefront/wishlist'),
            ctx
        );
        expect(getResponse.status).toBe(200);
        const getBody = await getResponse.json();
        expect(getBody.items).toHaveLength(1);
        expect(getBody.items[0].productId).toBe(product.id);
    });

    it('removes an item via DELETE with JSON body', async () => {
        const product = await createProduct({
            name: 'Wishlist Product',
            subtitle: 'Product Subtitle',
            basePrice: 100,
            images: [],
            variants: [],
            subCategoryIds: [],
            variantStock: [],
            specifications: [],
        });

        await POST(
            new Request('http://localhost/api/storefront/wishlist', {
                method: 'POST',
                body: JSON.stringify({
                    productId: product.id,
                    selectedVariantItemIds: [],
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
            }),
            ctx
        );

        const deleteResponse = await DELETE(
            new Request('http://localhost/api/storefront/wishlist', {
                method: 'DELETE',
                body: JSON.stringify({
                    productId: product.id,
                    selectedVariantItemIds: [],
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
            }),
            ctx
        );

        expect(deleteResponse.status).toBe(200);
        const deleteBody = await deleteResponse.json();
        expect(deleteBody.items).toHaveLength(0);
    });

    it('clears wishlist via PATCH', async () => {
        const product = await createProduct({
            name: 'Wishlist Product',
            subtitle: 'Product Subtitle',
            basePrice: 100,
            images: [],
            variants: [],
            subCategoryIds: [],
            variantStock: [],
            specifications: [],
        });

        await POST(
            new Request('http://localhost/api/storefront/wishlist', {
                method: 'POST',
                body: JSON.stringify({
                    productId: product.id,
                    selectedVariantItemIds: [],
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
            }),
            ctx
        );

        const patchResponse = await PATCH(
            new Request('http://localhost/api/storefront/wishlist/clear', {
                method: 'PATCH',
            }),
            ctx
        );

        expect(patchResponse.status).toBe(200);
        const patchBody = await patchResponse.json();
        expect(patchBody.items).toHaveLength(0);
    });

    it('creates a session when missing (200 OK)', async () => {
        getStorefrontSessionIdMock.mockResolvedValueOnce(null);
        getStorefrontSessionMock.mockResolvedValueOnce(null);
        ensureStorefrontSessionMock.mockResolvedValueOnce({ sessionId: 'new-session', items: [] });

        const response = await GET(
            new Request('http://localhost/api/storefront/wishlist'),
            ctx
        );

        expect(response.status).toBe(200);
    });
});
