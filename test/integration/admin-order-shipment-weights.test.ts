import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET as weightCheckHandler } from '@/app/api/admin/orders/[id]/shipment/weight-check/route';
import { PATCH as updateWeightsHandler } from '@/app/api/admin/orders/[id]/shipment/weights/route';
import { createOrder } from '@/lib/order/order.service';
import { createProduct, getProduct } from '@/lib/product/product.service';
import type { OrderDocument } from '@/lib/order/model/order.model';
import { clear } from '../test-db';

vi.mock('@/lib/auth/admin-auth', () => ({
    requireAdminApiAuth: vi.fn().mockResolvedValue({
        _id: { toString: () => '507f1f77bcf86cd799439011' },
        displayName: 'Safvan',
    }),
}));

const BILLING_DETAILS = {
    email: 'shipping@example.com',
    firstName: 'Shipping',
    lastName: 'Admin',
    country: 'United Arab Emirates',
    streetAddress1: '123 Shipping Street',
    city: 'Dubai',
    phone: '+971500000000',
};

function buildOrderData(items: OrderDocument['items']): Omit<OrderDocument, '_id' | 'createdAt' | 'updatedAt'> {
    return {
        sessionId: 'shipment-session',
        stripeSessionId: `shipment-${Date.now()}-${Math.random()}`,
        items,
        totalAmount: 100,
        currency: 'usd',
        status: 'paid',
        billingDetails: BILLING_DETAILS,
    };
}

describe('Admin shipment weight flow', () => {
    beforeEach(async () => {
        await clear();
    });

    it('returns missing products from weight-check endpoint', async () => {
        const missingWeightProduct = await createProduct({
            name: 'No Weight Product',
            basePrice: 40,
            images: [],
            variants: [],
            subCategoryIds: [],
            variantStock: [],
            specifications: [],
        });

        const weightedProduct = await createProduct({
            name: 'Weighted Product',
            basePrice: 60,
            images: [],
            variants: [],
            subCategoryIds: [],
            variantStock: [],
            specifications: [],
            weight: 1.2,
        });

        const order = await createOrder(
            buildOrderData([
                {
                    productId: missingWeightProduct.id,
                    productName: missingWeightProduct.name,
                    selectedVariantItemIds: [],
                    quantity: 1,
                    unitPrice: 40,
                },
                {
                    productId: weightedProduct.id,
                    productName: weightedProduct.name,
                    selectedVariantItemIds: [],
                    quantity: 1,
                    unitPrice: 60,
                },
            ])
        );

        const req = new Request(`http://localhost/api/admin/orders/${order.id}/shipment/weight-check`, {
            method: 'GET',
        });

        const res = await weightCheckHandler(req, { params: Promise.resolve({ id: order.id }) });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.canProceed).toBe(false);
        expect(body.missingProducts).toHaveLength(1);
        expect(body.missingProducts[0]).toEqual(
            expect.objectContaining({
                productId: missingWeightProduct.id,
                productName: missingWeightProduct.name,
            })
        );
    });

    it('returns canProceed=true when all order products have valid weights', async () => {
        const weightedProduct = await createProduct({
            name: 'Ready Product',
            basePrice: 75,
            images: [],
            variants: [],
            subCategoryIds: [],
            variantStock: [],
            specifications: [],
            weight: 1.5,
        });

        const order = await createOrder(
            buildOrderData([
                {
                    productId: weightedProduct.id,
                    productName: weightedProduct.name,
                    selectedVariantItemIds: [],
                    quantity: 2,
                    unitPrice: 75,
                },
            ])
        );

        const req = new Request(`http://localhost/api/admin/orders/${order.id}/shipment/weight-check`, {
            method: 'GET',
        });

        const res = await weightCheckHandler(req, { params: Promise.resolve({ id: order.id }) });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.canProceed).toBe(true);
        expect(body.missingProducts).toEqual([]);
    });

    it('updates missing product weights through shipment weights endpoint', async () => {
        const product = await createProduct({
            name: 'Needs Weight Update',
            basePrice: 50,
            images: [],
            variants: [],
            subCategoryIds: [],
            variantStock: [],
            specifications: [],
        });

        const order = await createOrder(
            buildOrderData([
                {
                    productId: product.id,
                    productName: product.name,
                    selectedVariantItemIds: [],
                    quantity: 1,
                    unitPrice: 50,
                },
            ])
        );

        const req = new Request(`http://localhost/api/admin/orders/${order.id}/shipment/weights`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                weights: {
                    [product.id]: 2.75,
                },
            }),
        });

        const res = await updateWeightsHandler(req, { params: Promise.resolve({ id: order.id }) });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.updatedProducts).toEqual([
            expect.objectContaining({
                productId: product.id,
                productName: product.name,
                weight: 2.75,
            }),
        ]);

        const updatedProduct = await getProduct(product.id);
        expect(updatedProduct.weight).toBe(2.75);
    });

    it('rejects weight updates for products that are not in the order', async () => {
        const inOrderProduct = await createProduct({
            name: 'In Order Product',
            basePrice: 30,
            images: [],
            variants: [],
            subCategoryIds: [],
            variantStock: [],
            specifications: [],
        });

        const outsiderProduct = await createProduct({
            name: 'Outside Order Product',
            basePrice: 30,
            images: [],
            variants: [],
            subCategoryIds: [],
            variantStock: [],
            specifications: [],
        });

        const order = await createOrder(
            buildOrderData([
                {
                    productId: inOrderProduct.id,
                    productName: inOrderProduct.name,
                    selectedVariantItemIds: [],
                    quantity: 1,
                    unitPrice: 30,
                },
            ])
        );

        const req = new Request(`http://localhost/api/admin/orders/${order.id}/shipment/weights`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                weights: {
                    [outsiderProduct.id]: 1.25,
                },
            }),
        });

        const res = await updateWeightsHandler(req, { params: Promise.resolve({ id: order.id }) });
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.code).toBe('INVALID_ORDER_PRODUCTS');
        expect(body.details?.productIds).toContain(outsiderProduct.id);
    });

    it('shipment POST still returns missing-weight error as fallback guard', async () => {
        const product = await createProduct({
            name: 'Fallback Missing Weight Product',
            basePrice: 80,
            images: [],
            variants: [],
            subCategoryIds: [],
            variantStock: [],
            specifications: [],
        });

        const order = await createOrder(
            buildOrderData([
                {
                    productId: product.id,
                    productName: product.name,
                    selectedVariantItemIds: [],
                    quantity: 1,
                    unitPrice: 80,
                },
            ])
        );

        vi.resetModules();
        process.env.SMSA_BASE_URL = 'https://example.com';
        process.env.SMSA_API_KEY = 'test-api-key';

        const { POST: createShipmentHandler } = await import('@/app/api/admin/orders/[id]/shipment/route');

        const req = new Request(`http://localhost/api/admin/orders/${order.id}/shipment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });

        const res = await createShipmentHandler(req, { params: Promise.resolve({ id: order.id }) });
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.code).toBe('MISSING_PRODUCT_WEIGHTS');
        expect(body.details?.productIds).toContain(product.id);
    });
});
