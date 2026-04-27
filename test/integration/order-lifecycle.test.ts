import { beforeEach, describe, expect, it, vi } from 'vitest';

const refundMocks = vi.hoisted(() => ({
    queueRefundForApprovedCancellation: vi.fn().mockResolvedValue({
        queued: true,
        code: 'REFUND_CREATED',
        provider: 'stripe',
        externalRefundId: 're_cancel_1',
        requestedAt: new Date('2026-03-28T10:00:00.000Z'),
        amount: 100,
        currency: 'usd',
    }),
    queueRefundForOrder: vi.fn().mockResolvedValue({
        queued: true,
        code: 'REFUND_CREATED',
        provider: 'stripe',
        externalRefundId: 're_return_1',
        requestedAt: new Date('2026-03-28T11:00:00.000Z'),
        amount: 100,
        currency: 'usd',
    }),
}));

const shippingMocks = vi.hoisted(() => ({
    createB2cShipment: vi.fn().mockResolvedValue({
        sawb: 'SHIP-INT-1',
        waybills: [{ awb: 'SHIP-INT-1', awbFile: 'label-pdf-base64' }],
    }),
    createC2bShipment: vi.fn().mockResolvedValue({
        sawb: 'RET-INT-1',
        waybills: [{ awb: 'RET-INT-1', awbFile: 'return-label-pdf-base64' }],
    }),
}));

vi.mock('@/lib/auth/admin-auth', () => ({
    requireAdminApiAuth: vi.fn().mockResolvedValue({
        _id: { toString: () => '507f1f77bcf86cd799439011' },
        displayName: 'Safvan',
    }),
}));

vi.mock('@/lib/storefront-session', async () => {
    const actual = await vi.importActual<typeof import('@/lib/storefront-session')>('@/lib/storefront-session');
    return {
        ...actual,
        getStorefrontSession: vi.fn().mockResolvedValue({
            sessionId: 'session-lifecycle',
            userId: undefined,
        }),
    };
});

vi.mock('@/lib/shipping/shipping.service', async () => {
    const actual = await vi.importActual<typeof import('@/lib/shipping/shipping.service')>('@/lib/shipping/shipping.service');
    return {
        ...actual,
        createB2cShipment: shippingMocks.createB2cShipment,
        createC2bShipment: shippingMocks.createC2bShipment,
    };
});

vi.mock('@/lib/refund/refund.service', async () => {
    const actual = await vi.importActual<typeof import('@/lib/refund/refund.service')>('@/lib/refund/refund.service');
    return {
        ...actual,
        queueRefundForApprovedCancellation: refundMocks.queueRefundForApprovedCancellation,
        queueRefundForOrder: refundMocks.queueRefundForOrder,
    };
});

import { clear } from '../test-db';
import { POST as requestReturnRoute } from '@/app/api/storefront/orders/[id]/return-request/route';
import { PATCH as reviewReturnRoute } from '@/app/api/admin/orders/[id]/return-request/route';
import { PATCH as reviewCancellationRoute } from '@/app/api/admin/orders/[id]/cancellation-request/route';
import { POST as proceedRefundRoute } from '@/app/api/admin/orders/[id]/refund/route';
import { createOrder, getOrderById } from '@/lib/order/order.service';
import type { OrderDocument } from '@/lib/order/model/order.model';

const BILLING_DETAILS = {
    email: 'lifecycle@example.com',
    firstName: 'Lifecycle',
    lastName: 'Tester',
    country: 'United Arab Emirates',
    streetAddress1: '123 Lifecycle St',
    city: 'Dubai',
    phone: '+971555222333',
};

const BASE_ORDER_DATA: Omit<OrderDocument, '_id' | 'createdAt' | 'updatedAt'> = {
    sessionId: 'session-lifecycle',
    stripeSessionId: 'stripe-lifecycle',
    paymentProvider: 'stripe',
    paymentProviderOrderId: 'pi_lifecycle',
    items: [
        {
            productId: 'prod-1',
            productName: 'Lifecycle Product',
            selectedVariantItemIds: [],
            quantity: 1,
            unitPrice: 100,
        },
    ],
    totalAmount: 100,
    currency: 'usd',
    status: 'pending',
    billingDetails: BILLING_DETAILS,
};

describe('Order lifecycle routes', () => {
    beforeEach(async () => {
        await clear();
        refundMocks.queueRefundForApprovedCancellation.mockClear();
        refundMocks.queueRefundForOrder.mockClear();
        shippingMocks.createB2cShipment.mockClear();
        shippingMocks.createC2bShipment.mockClear();
    });

    it('submits, reviews, and refunds a return request', async () => {
        vi.useFakeTimers();

        try {
            vi.setSystemTime(new Date('2026-04-01T12:00:00.000Z'));

            const created = await createOrder({
                ...BASE_ORDER_DATA,
                status: 'DL',
                shipping: {
                    provider: 'smsa',
                    awb: 'DL-1',
                    createdAt: new Date('2026-03-28T09:00:00.000Z'),
                    status: 'Delivered',
                    lastTrackedAt: new Date('2026-03-28T10:00:00.000Z'),
                },
            });

            const returnRes = await requestReturnRoute(new Request(`http://localhost/api/storefront/orders/${created.id}/return-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'Need to return this order' }),
            }), {
                params: Promise.resolve({ id: created.id }),
            });
            expect(returnRes.status).toBe(200);

            const reviewRes = await reviewReturnRoute(new Request(`http://localhost/api/admin/orders/${created.id}/return-request`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ decision: 'approve', note: 'Approved' }),
            }), {
                params: Promise.resolve({ id: created.id }),
            });
            expect(reviewRes.status).toBe(200);

            const refundRes = await proceedRefundRoute(new Request(`http://localhost/api/admin/orders/${created.id}/refund`, {
                method: 'POST',
            }), {
                params: Promise.resolve({ id: created.id }),
            });
            expect(refundRes.status).toBe(200);

            const updated = await getOrderById(created.id);
            expect(updated.status).toBe('refund_approved');
            expect(updated.returnRequest?.shipment?.awb).toBe('RET-INT-1');
            expect(shippingMocks.createC2bShipment).toHaveBeenCalled();
            expect(shippingMocks.createB2cShipment).not.toHaveBeenCalled();
            expect(updated.refund?.externalRefundId).toBe('re_return_1');
        } finally {
            vi.useRealTimers();
        }
    });

    it('rejects storefront return requests after the seven day window', async () => {
        vi.useFakeTimers();

        try {
            vi.setSystemTime(new Date('2026-04-08T12:00:00.000Z'));

            const created = await createOrder({
                ...BASE_ORDER_DATA,
                status: 'DL',
                shipping: {
                    provider: 'smsa',
                    awb: 'DL-EXPIRED-1',
                    createdAt: new Date('2026-03-28T09:00:00.000Z'),
                    status: 'Delivered',
                    lastTrackedAt: new Date('2026-03-31T11:59:59.000Z'),
                },
            });

            const response = await requestReturnRoute(new Request(`http://localhost/api/storefront/orders/${created.id}/return-request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'Need to return this order' }),
            }), {
                params: Promise.resolve({ id: created.id }),
            });

            expect(response.status).toBe(409);
            await expect(response.json()).resolves.toMatchObject({
                code: 'ORDER_NOT_RETURNABLE',
                message: 'Return requests are only available within 7 days after delivery.',
            });
        } finally {
            vi.useRealTimers();
        }
    });

    it('can deny cancellation and proceed to shipment via admin review route', async () => {
        const created = await createOrder({
            ...BASE_ORDER_DATA,
            status: 'cancellation_requested',
            cancellation: {
                requestedAt: new Date('2026-03-28T09:30:00.000Z'),
                requestReason: 'Need to cancel',
                adminDecision: 'pending',
                requestedBySessionId: 'session-lifecycle',
            },
        });

        const reviewRes = await reviewCancellationRoute(new Request(`http://localhost/api/admin/orders/${created.id}/cancellation-request`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ decision: 'reject', proceedToShipment: true, note: 'Shipping instead' }),
        }), {
            params: Promise.resolve({ id: created.id }),
        });
        expect(reviewRes.status).toBe(200);

        const updated = await getOrderById(created.id);
        expect(updated.status).toBe('requested_shipment');
        expect(updated.shipping?.awb).toBe('SHIP-INT-1');
    });
});
