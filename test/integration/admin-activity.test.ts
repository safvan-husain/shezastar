import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST as createProductRoute } from '@/app/api/products/route';
import { PUT as updateProductRoute } from '@/app/api/products/[id]/route';
import { PATCH as updateOrderRoute } from '@/app/api/admin/orders/[id]/route';
import { PATCH as reviewCancellationRoute } from '@/app/api/admin/orders/[id]/cancellation-request/route';
import { POST as bulkPriceUpdateRoute } from '@/app/api/admin/products/bulk-price-update/route';
import { POST as createShipmentRoute } from '@/app/api/admin/orders/[id]/shipment/route';
import { GET as dashboardAnalyticsRoute } from '@/app/api/admin/dashboard/analytics/route';
import { GET as activityDetailRoute } from '@/app/api/admin/activity/[id]/route';
import { createActivityLog, buildCustomerActivityActor } from '@/lib/activity/activity.service';
import type { ActivityLogDocument } from '@/lib/activity/model/activity.model';
import { ObjectId, getCollection } from '@/lib/db/mongo-client';
import type { OrderDocument } from '@/lib/order/model/order.model';
import { createOrder } from '@/lib/order/order.service';
import { createProduct } from '@/lib/product/product.service';
import { clear } from '../test-db';

vi.mock('@/lib/auth/admin-auth', () => ({
    requireAdminApiAuth: vi.fn().mockResolvedValue({
        _id: { toString: () => '507f1f77bcf86cd799439011' },
        displayName: 'Safvan',
    }),
}));

vi.mock('@/lib/shipping/shipping.service', () => ({
    createB2cShipment: vi.fn().mockResolvedValue({
        sawb: 'AWB-12345',
        waybills: [{ awbFile: 'label-pdf-base64' }],
    }),
    getShipmentLabel: vi.fn(),
    trackShipment: vi.fn(),
    getOrderMissingWeightProducts: vi.fn().mockResolvedValue([]),
    updateOrderProductWeights: vi.fn(),
    processSmsaTrackingWebhook: vi.fn(),
}));

const BILLING_DETAILS = {
    email: 'activity@example.com',
    firstName: 'Order',
    lastName: 'Manager',
    country: 'United Arab Emirates',
    streetAddress1: '123 Activity St',
    city: 'Dubai',
    phone: '+971555111222',
};

async function getActivityDocs() {
    const collection = await getCollection<ActivityLogDocument>('activity_logs');
    return collection.find({}).sort({ createdAt: -1 }).toArray();
}

describe('Admin activity integration', () => {
    beforeEach(async () => {
        await clear();
    });

    it('logs product create and update mutations', async () => {
        const createReq = new Request('http://localhost/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Activity Product',
                description: 'Created from activity test',
                basePrice: 120,
                images: [],
                variants: [],
            }),
        });

        const createRes = await createProductRoute(createReq);
        expect(createRes.status).toBe(201);
        const createdProduct = await createRes.json();

        const updateReq = new Request(`http://localhost/api/products/${createdProduct.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Activity Product Updated',
                basePrice: 160,
            }),
        });

        const updateRes = await updateProductRoute(updateReq, {
            params: Promise.resolve({ id: createdProduct.id }),
        });
        expect(updateRes.status).toBe(200);

        const activityDocs = await getActivityDocs();
        expect(activityDocs).toHaveLength(2);
        expect(activityDocs[0].actionType).toBe('product.updated');
        expect(activityDocs[0].summary).toContain('Safvan updated product Activity Product Updated');
        expect(activityDocs[0].diff).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ field: 'name' }),
                expect.objectContaining({ field: 'basePrice' }),
            ]),
        );
        expect(activityDocs[1].actionType).toBe('product.created');
    });

    it('logs bulk price updates and exposes them through the activity detail endpoint', async () => {
        const productA = await createProduct({
            name: 'Bulk Product A',
            basePrice: 100,
            images: [],
            variants: [],
            subCategoryIds: [],
            variantStock: [{ variantCombinationKey: 'default', stockCount: 5, price: 100 }],
            specifications: [],
        });
        const productB = await createProduct({
            name: 'Bulk Product B',
            basePrice: 200,
            images: [],
            variants: [],
            subCategoryIds: [],
            variantStock: [{ variantCombinationKey: 'default', stockCount: 5, price: 200 }],
            specifications: [],
        });

        const req = new Request('http://localhost/api/admin/products/bulk-price-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mode: 'product',
                ids: [productA.id, productB.id],
                method: 'fixed',
                value: 25,
            }),
        });

        const res = await bulkPriceUpdateRoute(req);
        expect(res.status).toBe(200);

        const activityDocs = await getActivityDocs();
        expect(activityDocs[0].actionType).toBe('product.bulk_price_updated');
        expect(activityDocs[0].details?.products).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    productId: productA.id,
                    basePriceBefore: 100,
                    basePriceAfter: 125,
                }),
                expect.objectContaining({
                    productId: productB.id,
                    basePriceBefore: 200,
                    basePriceAfter: 225,
                }),
            ]),
        );

        const detailRes = await activityDetailRoute(new Request(`http://localhost/api/admin/activity/${activityDocs[0]._id.toHexString()}`), {
            params: Promise.resolve({ id: activityDocs[0]._id.toHexString() }),
        });
        expect(detailRes.status).toBe(200);
        const detailBody = await detailRes.json();
        expect(detailBody.actionType).toBe('product.bulk_price_updated');
        expect(detailBody.details.products).toHaveLength(2);
    });

    it('logs admin order status, shipment creation, and cancellation review actions', async () => {
        const shippableProduct = await createProduct({
            name: 'Shipment Product',
            basePrice: 80,
            images: [],
            variants: [],
            subCategoryIds: [],
            variantStock: [],
            specifications: [],
            weight: 1.8,
        });

        const shippableOrder = await createOrder({
            sessionId: 'ship-session',
            stripeSessionId: 'ship-stripe',
            items: [{
                productId: shippableProduct.id,
                productName: shippableProduct.name,
                selectedVariantItemIds: [],
                quantity: 1,
                unitPrice: 80,
            }],
            totalAmount: 80,
            currency: 'aed',
            status: 'paid',
            billingDetails: BILLING_DETAILS,
        });

        const shipmentRes = await createShipmentRoute(new Request(`http://localhost/api/admin/orders/${shippableOrder.id}/shipment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        }), {
            params: Promise.resolve({ id: shippableOrder.id }),
        });
        expect(shipmentRes.status).toBe(200);

        const orderForStatus = await createOrder({
            sessionId: 'status-session',
            stripeSessionId: 'status-stripe',
            items: [{
                productId: shippableProduct.id,
                productName: shippableProduct.name,
                selectedVariantItemIds: [],
                quantity: 1,
                unitPrice: 80,
            }],
            totalAmount: 80,
            currency: 'aed',
            status: 'pending',
            billingDetails: BILLING_DETAILS,
        });

        const statusRes = await updateOrderRoute(new Request(`http://localhost/api/admin/orders/${orderForStatus.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'paid' }),
        }), {
            params: Promise.resolve({ id: orderForStatus.id }),
        });
        expect(statusRes.status).toBe(200);

        const cancellationOrder = await createOrder({
            sessionId: 'cancel-session',
            stripeSessionId: 'cancel-stripe',
            items: [{
                productId: shippableProduct.id,
                productName: shippableProduct.name,
                selectedVariantItemIds: [],
                quantity: 1,
                unitPrice: 80,
            }],
            totalAmount: 80,
            currency: 'aed',
            status: 'cancellation_requested',
            billingDetails: BILLING_DETAILS,
            cancellation: {
                requestedAt: new Date(),
                requestReason: 'Need to cancel',
                adminDecision: 'pending',
                requestedBySessionId: 'cancel-session',
            },
        });

        const reviewRes = await reviewCancellationRoute(new Request(`http://localhost/api/admin/orders/${cancellationOrder.id}/cancellation-request`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ decision: 'reject', note: 'Already processing' }),
        }), {
            params: Promise.resolve({ id: cancellationOrder.id }),
        });
        expect(reviewRes.status).toBe(200);

        const activityDocs = await getActivityDocs();
        expect(activityDocs.some((doc) => doc.actionType === 'order.shipment_created')).toBe(true);
        expect(activityDocs.some((doc) => doc.actionType === 'order.status_updated')).toBe(true);
        expect(activityDocs.some((doc) => doc.actionType === 'order.cancellation_reviewed')).toBe(true);
    });

    it('returns dashboard analytics with recent activity and sales trend', async () => {
        const order = await createOrder({
            sessionId: 'dashboard-session',
            stripeSessionId: 'dashboard-stripe',
            items: [{
                productId: 'dashboard-product',
                productName: 'Dashboard Product',
                selectedVariantItemIds: [],
                quantity: 1,
                unitPrice: 180,
            }],
            totalAmount: 180,
            currency: 'aed',
            status: 'paid',
            billingDetails: BILLING_DETAILS,
        });

        const ordersCollection = await getCollection<OrderDocument>('orders');
        const createdAt = new Date('2026-03-25T10:00:00.000Z');
        await ordersCollection.updateOne(
            { _id: new ObjectId(order.id) },
            { $set: { createdAt, updatedAt: createdAt } },
        );

        await createActivityLog({
            actionType: 'order.created',
            actor: buildCustomerActivityActor({
                sessionId: 'dashboard-session',
                displayName: 'Buyer',
            }),
            primaryEntity: {
                kind: 'order',
                id: order.id,
                label: `Order #${order.id.slice(0, 8)}`,
            },
            summary: 'Buyer created order',
        });

        const res = await dashboardAnalyticsRoute();
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.ordersByStatus).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ status: 'paid', count: 1 }),
            ]),
        );
        expect(body.salesTrend).toHaveLength(90);
        expect(body.recentActivity[0].summary).toBe('Buyer created order');
    });
});
