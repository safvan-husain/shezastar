import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clear } from '../test-db';
import { createOrder, getOrderById } from '@/lib/order/order.service';
import type { OrderDocument } from '@/lib/order/model/order.model';

const { mockConstructEvent } = vi.hoisted(() => ({
    mockConstructEvent: vi.fn(),
}));

vi.mock('stripe', () => {
    return {
        default: class Stripe {
            webhooks = {
                constructEvent: mockConstructEvent,
            };
        },
    };
});

vi.mock('@/lib/cart/cart.service', () => ({
    clearCart: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/email/email.service', () => ({
    sendCustomerOrderEmail: vi.fn().mockResolvedValue(undefined),
    sendAdminOrderEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/storefront-session', async () => {
    const actual = await vi.importActual<typeof import('@/lib/storefront-session')>('@/lib/storefront-session');
    return {
        ...actual,
        getStorefrontSessionBySessionId: vi.fn().mockResolvedValue(null),
    };
});

vi.mock('@/lib/product/product.service-stock', () => ({
    reduceVariantStock: vi.fn().mockResolvedValue(undefined),
}));

const BILLING_DETAILS = {
    email: 'webhook@example.com',
    firstName: 'Webhook',
    lastName: 'Test',
    country: 'United Arab Emirates',
    streetAddress1: '123 Webhook Street',
    city: 'Dubai',
    phone: '+971500000002',
};

const BASE_ORDER_DATA: Omit<OrderDocument, '_id' | 'createdAt' | 'updatedAt'> = {
    sessionId: 'session-webhook',
    stripeSessionId: 'stripe-webhook',
    paymentProvider: 'stripe',
    items: [
        {
            productId: 'prod-1',
            productName: 'Webhook Product',
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

function makeWebhookRequest(): Request {
    return new Request('http://localhost/api/webhooks', {
        method: 'POST',
        headers: {
            'stripe-signature': 'test_signature',
        },
        body: '{}',
    });
}

describe('Stripe webhook integration', () => {
    beforeEach(async () => {
        await clear();
        vi.resetModules();
        mockConstructEvent.mockReset();
        process.env.STRIPE_SECRET_KEY = 'test_key';
        process.env.STRIPE_WEBHOOK_SECRET = 'test_secret';
    });

    it('marks order as refund_failed on refund.failed', async () => {
        const created = await createOrder({
            ...BASE_ORDER_DATA,
            stripeSessionId: 'stripe-webhook-refund-failed-1',
            paymentProviderOrderId: 'pi_refund_failed_1',
            status: 'refund_approved',
            refund: {
                status: 'pending',
                provider: 'stripe',
                requestedAt: new Date('2026-03-28T10:00:00.000Z'),
            },
        });

        mockConstructEvent.mockReturnValueOnce({
            id: 'evt_refund_failed_1',
            type: 'refund.failed',
            data: {
                object: {
                    id: 're_failed_1',
                    payment_intent: 'pi_refund_failed_1',
                    amount: 10000,
                    currency: 'usd',
                    created: 1767225600,
                    status: 'failed',
                    failure_reason: 'insufficient_funds',
                },
            },
        });

        const { POST } = await import('@/app/api/webhooks/route');
        const response = await POST(makeWebhookRequest() as any);

        expect(response.status).toBe(200);

        const updated = await getOrderById(created.id);
        expect(updated.status).toBe('refund_failed');
        expect(updated.refund?.status).toBe('failed');
        expect(updated.refund?.externalRefundId).toBe('re_failed_1');
        expect(updated.refund?.failureCode).toBe('insufficient_funds');
    });

    it('finalizes cancellation flow to refunded on charge.refunded', async () => {
        const created = await createOrder({
            ...BASE_ORDER_DATA,
            stripeSessionId: 'stripe-webhook-charge-full-1',
            paymentProviderOrderId: 'pi_charge_full_1',
            status: 'cancellation_approved',
            cancellation: {
                requestedAt: new Date('2026-03-28T09:00:00.000Z'),
                approvedAt: new Date('2026-03-28T09:10:00.000Z'),
                adminDecision: 'approved',
            },
            refund: {
                status: 'pending',
                provider: 'stripe',
                requestedAt: new Date('2026-03-28T09:11:00.000Z'),
            },
        });

        mockConstructEvent.mockReturnValueOnce({
            id: 'evt_charge_refunded_1',
            type: 'charge.refunded',
            data: {
                object: {
                    id: 'ch_full_1',
                    payment_intent: 'pi_charge_full_1',
                    amount: 10000,
                    amount_refunded: 10000,
                    refunded: true,
                    currency: 'usd',
                    refunds: {
                        data: [{ id: 're_full_1' }],
                    },
                },
            },
        });

        const { POST } = await import('@/app/api/webhooks/route');
        const response = await POST(makeWebhookRequest() as any);

        expect(response.status).toBe(200);

        const updated = await getOrderById(created.id);
        expect(updated.status).toBe('refunded');
        expect(updated.cancellation?.completedAt).toBeDefined();
        expect(updated.refund?.status).toBe('succeeded');
        expect(updated.refund?.externalRefundId).toBe('re_full_1');
    });

    it('finalizes return flow to refunded on charge.refunded', async () => {
        const created = await createOrder({
            ...BASE_ORDER_DATA,
            stripeSessionId: 'stripe-webhook-charge-return-1',
            paymentProviderOrderId: 'pi_charge_return_1',
            status: 'refund_approved',
            shipping: {
                provider: 'smsa',
                awb: 'SHIP-1',
                createdAt: new Date('2026-03-28T08:00:00.000Z'),
                status: 'Delivered',
            },
            returnRequest: {
                requestedAt: new Date('2026-03-28T09:00:00.000Z'),
                approvedAt: new Date('2026-03-28T09:30:00.000Z'),
                adminDecision: 'approved',
                requestReason: 'Wrong item',
                requestedBySessionId: 'session-webhook',
            },
            refund: {
                status: 'pending',
                provider: 'stripe',
                requestedAt: new Date('2026-03-28T09:45:00.000Z'),
            },
        });

        mockConstructEvent.mockReturnValueOnce({
            id: 'evt_charge_refunded_return_1',
            type: 'charge.refunded',
            data: {
                object: {
                    id: 'ch_return_1',
                    payment_intent: 'pi_charge_return_1',
                    amount: 10000,
                    amount_refunded: 10000,
                    refunded: true,
                    currency: 'usd',
                    refunds: {
                        data: [{ id: 're_return_1' }],
                    },
                },
            },
        });

        const { POST } = await import('@/app/api/webhooks/route');
        const response = await POST(makeWebhookRequest() as any);

        expect(response.status).toBe(200);

        const updated = await getOrderById(created.id);
        expect(updated.status).toBe('refunded');
        expect(updated.returnRequest?.completedAt).toBeDefined();
        expect(updated.refund?.status).toBe('succeeded');
        expect(updated.refund?.externalRefundId).toBe('re_return_1');
    });
});
