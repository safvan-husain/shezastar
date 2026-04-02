import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clear } from '../test-db';
import { createOrder, getOrderById } from '@/lib/order/order.service';
import type { OrderDocument } from '@/lib/order/model/order.model';

const fetchMock = vi.fn();
global.fetch = fetchMock as typeof fetch;

const clearCartMock = vi.fn().mockResolvedValue(undefined);
const reduceVariantStockMock = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/cart/cart.service', () => ({
    clearCart: clearCartMock,
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
    reduceVariantStock: reduceVariantStockMock,
}));

const BILLING_DETAILS = {
    email: 'tabby-webhook@example.com',
    firstName: 'Tabby',
    lastName: 'Webhook',
    country: 'United Arab Emirates',
    streetAddress1: '123 Webhook Street',
    city: 'Dubai',
    phone: '+971500000003',
};

const BASE_ORDER_DATA: Omit<OrderDocument, '_id' | 'createdAt' | 'updatedAt'> = {
    sessionId: 'session-tabby-webhook',
    paymentProvider: 'tabby',
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
    currency: 'aed',
    status: 'pending',
    billingDetails: BILLING_DETAILS,
};

function makeWebhookRequest(body: Record<string, unknown>): Request {
    return new Request('http://localhost/api/tabby/live-webhook', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
}

describe('Tabby live webhook integration', () => {
    beforeEach(async () => {
        await clear();
        vi.resetModules();
        fetchMock.mockReset();
        clearCartMock.mockClear();
        reduceVariantStockMock.mockClear();
        process.env.TABBY_SECRET_KEY = 'test_tabby_secret';
    });

    it('verifies, captures, and marks a pending order as paid when payment is authorized', async () => {
        const created = await createOrder({
            ...BASE_ORDER_DATA,
            status: 'pending',
        });

        fetchMock
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    id: 'tabby-payment-1',
                    status: 'AUTHORIZED',
                    amount: '100.00',
                    currency: 'AED',
                    order: {
                        reference_id: created.id,
                    },
                    refunds: [],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                headers: new Headers({ 'content-type': 'application/json' }),
                json: async () => ({
                    id: 'cap-1',
                    status: 'CLOSED',
                }),
            });

        const { POST } = await import('@/app/api/tabby/live-webhook/route');
        const response = await POST(makeWebhookRequest({ id: 'tabby-payment-1' }) as any);

        expect(response.status).toBe(200);

        const updated = await getOrderById(created.id);
        expect(updated.status).toBe('paid');
        expect(updated.paymentProviderSessionId).toBe('tabby-payment-1');
        expect(fetchMock).toHaveBeenNthCalledWith(
            1,
            'https://api.tabby.ai/api/v2/payments/tabby-payment-1',
            expect.objectContaining({ method: 'GET' }),
        );
        expect(fetchMock).toHaveBeenNthCalledWith(
            2,
            'https://api.tabby.ai/api/v1/payments/tabby-payment-1/captures',
            expect.objectContaining({ method: 'POST' }),
        );
        expect(reduceVariantStockMock).toHaveBeenCalledWith('prod-1', [], 1);
        expect(clearCartMock).toHaveBeenCalled();
    });

    it('reconciles a verified Tabby refund into refunded order state', async () => {
        const created = await createOrder({
            ...BASE_ORDER_DATA,
            paymentProviderSessionId: 'tabby-payment-2',
            status: 'refund_approved',
            refund: {
                status: 'pending',
                provider: 'tabby',
                requestedAt: new Date('2026-03-28T10:00:00.000Z'),
            },
            returnRequest: {
                requestedAt: new Date('2026-03-28T09:00:00.000Z'),
                approvedAt: new Date('2026-03-28T09:30:00.000Z'),
                adminDecision: 'approved',
                requestReason: 'Wrong item',
                requestedBySessionId: 'session-tabby-webhook',
            },
        });

        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                id: 'tabby-payment-2',
                status: 'CLOSED',
                currency: 'AED',
                order: {
                    reference_id: created.id,
                },
                refunds: [
                    {
                        id: 'tabby-refund-1',
                        amount: '100.00',
                        reference_id: created.id,
                        created_at: '2026-03-28T11:00:00.000Z',
                    },
                ],
            }),
        });

        const { POST } = await import('@/app/api/tabby/live-webhook/route');
        const response = await POST(makeWebhookRequest({ id: 'tabby-payment-2' }) as any);

        expect(response.status).toBe(200);

        const updated = await getOrderById(created.id);
        expect(updated.status).toBe('refunded');
        expect(updated.refund?.provider).toBe('tabby');
        expect(updated.refund?.status).toBe('succeeded');
        expect(updated.refund?.externalRefundId).toBe('tabby-refund-1');
        expect(updated.returnRequest?.completedAt).toBeDefined();
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
            'https://api.tabby.ai/api/v2/payments/tabby-payment-2',
            expect.objectContaining({ method: 'GET' }),
        );
    });
});
