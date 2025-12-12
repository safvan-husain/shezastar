import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clear } from '../test-db';
import { POST, GET, PATCH, DELETE } from '@/app/api/storefront/cart/route';
import { createProduct } from '@/lib/product/product.service';

const cookieJar: Record<string, { name: string; value: string }> = {};

const cookieStore = {
    get: vi.fn((name: string) => cookieJar[name]),
    set: vi.fn((nameOrOptions: any, value?: string) => {
        if (typeof nameOrOptions === 'string') {
            cookieJar[nameOrOptions] = { name: nameOrOptions, value: value ?? '' };
            return;
        }
        cookieJar[nameOrOptions.name] = { name: nameOrOptions.name, value: nameOrOptions.value };
    }),
    delete: vi.fn((name: string) => {
        delete cookieJar[name];
    }),
};

vi.mock('next/headers', () => ({
    cookies: vi.fn(async () => cookieStore),
}));

function resetCookies() {
    Object.keys(cookieJar).forEach(key => delete cookieJar[key]);
    cookieStore.get.mockClear();
    cookieStore.set.mockClear();
    cookieStore.delete.mockClear();
}

const ctx = { params: Promise.resolve({}) };

describe('Cart API route handlers', () => {
    let productId: string;

    beforeEach(async () => {
        process.env.USER_SESSION_SECRET = 'cart-test-session-secret';
        await clear();
        resetCookies();

        const product = await createProduct({
            name: 'Cart API Product',
            basePrice: 50,
            images: [],
            variants: [],
            subCategoryIds: [],
            highlights: [],
            variantStock: [],
        });
        productId = product.id;
    });

    it('returns an empty cart for a fresh session', async () => {
        const res = await GET(new Request('http://localhost/api/storefront/cart'), ctx);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.items).toEqual([]);
        expect(body.totalItems).toBe(0);
    });

    it('adds an item to the cart via POST and reads it via GET', async () => {
        const postReq = new Request('http://localhost/api/storefront/cart', {
            method: 'POST',
            body: JSON.stringify({
                productId,
                selectedVariantItemIds: [],
                quantity: 2,
            }),
            headers: {
                'content-type': 'application/json',
            },
        });

        const postRes = await POST(postReq, ctx);
        expect(postRes.status).toBe(200);
        const postBody = await postRes.json();
        expect(postBody.items).toHaveLength(1);
        expect(postBody.totalItems).toBe(2);

        const getRes = await GET(new Request('http://localhost/api/storefront/cart'), ctx);
        expect(getRes.status).toBe(200);
        const getBody = await getRes.json();
        expect(getBody.items).toHaveLength(1);
        expect(getBody.totalItems).toBe(2);
    });

    it('updates cart item quantity via PATCH', async () => {
        // Seed cart
        await POST(
            new Request('http://localhost/api/storefront/cart', {
                method: 'POST',
                body: JSON.stringify({
                    productId,
                    selectedVariantItemIds: [],
                    quantity: 1,
                }),
                headers: {
                    'content-type': 'application/json',
                },
            }),
            ctx
        );

        const patchReq = new Request('http://localhost/api/storefront/cart', {
            method: 'PATCH',
            body: JSON.stringify({
                productId,
                selectedVariantItemIds: [],
                quantity: 5,
            }),
            headers: {
                'content-type': 'application/json',
            },
        });

        const patchRes = await PATCH(patchReq, ctx);
        expect(patchRes.status).toBe(200);
        const patchBody = await patchRes.json();
        expect(patchBody.totalItems).toBe(5);
        expect(patchBody.items[0].quantity).toBe(5);
    });

    it('removes a cart item via DELETE with payload', async () => {
        // Seed cart
        await POST(
            new Request('http://localhost/api/storefront/cart', {
                method: 'POST',
                body: JSON.stringify({
                    productId,
                    selectedVariantItemIds: [],
                    quantity: 1,
                }),
                headers: {
                    'content-type': 'application/json',
                },
            }),
            ctx
        );

        const deleteReq = new Request('http://localhost/api/storefront/cart', {
            method: 'DELETE',
            body: JSON.stringify({
                productId,
                selectedVariantItemIds: [],
            }),
            headers: {
                'content-type': 'application/json',
            },
        });

        const deleteRes = await DELETE(deleteReq, ctx);
        expect(deleteRes.status).toBe(200);
        const deleteBody = await deleteRes.json();
        expect(deleteBody.items).toHaveLength(0);
        expect(deleteBody.totalItems).toBe(0);
    });

    it('clears the cart via DELETE without payload', async () => {
        // Seed cart
        await POST(
            new Request('http://localhost/api/storefront/cart', {
                method: 'POST',
                body: JSON.stringify({
                    productId,
                    selectedVariantItemIds: [],
                    quantity: 3,
                }),
                headers: {
                    'content-type': 'application/json',
                },
            }),
            ctx
        );

        const deleteReq = new Request('http://localhost/api/storefront/cart', {
            method: 'DELETE',
        });

        const deleteRes = await DELETE(deleteReq, ctx);
        expect(deleteRes.status).toBe(200);
        const deleteBody = await deleteRes.json();
        expect(deleteBody.items).toHaveLength(0);
        expect(deleteBody.totalItems).toBe(0);
    });
});

