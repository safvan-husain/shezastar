import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn();
global.fetch = fetchMock as typeof fetch;

const BASE_ORDER = {
    id: 'order-1',
    sessionId: 'session-1',
    paymentProvider: 'tabby' as const,
    paymentProviderSessionId: 'tabby-payment-1',
    items: [],
    totalAmount: 100,
    currency: 'aed',
    status: 'paid',
    createdAt: '2026-03-28T09:00:00.000Z',
    updatedAt: '2026-03-28T09:00:00.000Z',
};

describe('refund.service Tabby handling', () => {
    beforeEach(() => {
        vi.resetModules();
        fetchMock.mockReset();
        process.env.TABBY_SECRET_KEY = 'tabby-secret';
        delete process.env.STRIPE_SECRET_KEY;
    });

    it('closes a non-closed Tabby payment before initiating cancellation refund', async () => {
        fetchMock
            .mockResolvedValueOnce({
                ok: true,
                headers: new Headers({ 'content-type': 'application/json' }),
                json: async () => ({
                    id: 'tabby-payment-1',
                    status: 'AUTHORIZED',
                    currency: 'AED',
                    refunds: [],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                headers: new Headers({ 'content-type': 'application/json' }),
                json: async () => ({
                    id: 'tabby-payment-1',
                    status: 'CLOSED',
                    currency: 'AED',
                    refunds: [],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                headers: new Headers({ 'content-type': 'application/json' }),
                json: async () => ({
                    currency: 'AED',
                    refunds: [
                        {
                            id: 'tabby-refund-1',
                            amount: '100.00',
                            reference_id: 'order-1',
                            created_at: '2026-03-28T11:00:00.000Z',
                        },
                    ],
                }),
            });

        const { queueRefundForApprovedCancellation } = await import('@/lib/refund/refund.service');
        const result = await queueRefundForApprovedCancellation(BASE_ORDER as any);

        expect(fetchMock).toHaveBeenNthCalledWith(
            1,
            'https://api.tabby.ai/api/v2/payments/tabby-payment-1',
            expect.objectContaining({ method: 'GET' }),
        );
        expect(fetchMock).toHaveBeenNthCalledWith(
            2,
            'https://api.tabby.ai/api/v2/payments/tabby-payment-1/close',
            expect.objectContaining({ method: 'POST' }),
        );
        expect(fetchMock).toHaveBeenNthCalledWith(
            3,
            'https://api.tabby.ai/api/v2/payments/tabby-payment-1/refunds',
            expect.objectContaining({ method: 'POST' }),
        );
        expect(result.provider).toBe('tabby');
        expect(result.externalRefundId).toBe('tabby-refund-1');
        expect(result.succeeded).toBe(true);
    });

    it('refunds a closed Tabby payment without calling close again', async () => {
        fetchMock
            .mockResolvedValueOnce({
                ok: true,
                headers: new Headers({ 'content-type': 'application/json' }),
                json: async () => ({
                    id: 'tabby-payment-1',
                    status: 'CLOSED',
                    currency: 'AED',
                    refunds: [],
                }),
            })
            .mockResolvedValueOnce({
                ok: true,
                headers: new Headers({ 'content-type': 'application/json' }),
                json: async () => ({
                    currency: 'AED',
                    refunds: [
                        {
                            id: 'tabby-refund-2',
                            amount: '100.00',
                            reference_id: 'order-1',
                            created_at: '2026-03-28T12:00:00.000Z',
                        },
                    ],
                }),
            });

        const { queueRefundForOrder } = await import('@/lib/refund/refund.service');
        const result = await queueRefundForOrder({
            ...BASE_ORDER,
            status: 'return_approved',
        } as any);

        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(fetchMock).toHaveBeenNthCalledWith(
            1,
            'https://api.tabby.ai/api/v2/payments/tabby-payment-1',
            expect.objectContaining({ method: 'GET' }),
        );
        expect(fetchMock).toHaveBeenNthCalledWith(
            2,
            'https://api.tabby.ai/api/v2/payments/tabby-payment-1/refunds',
            expect.objectContaining({ method: 'POST' }),
        );
        expect(result.externalRefundId).toBe('tabby-refund-2');
        expect(result.succeeded).toBe(true);
    });
});
