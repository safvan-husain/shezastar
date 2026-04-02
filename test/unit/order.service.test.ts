import { beforeEach, describe, expect, it, vi } from 'vitest';

const emailMocks = vi.hoisted(() => ({
    sendCustomerOrderEmail: vi.fn().mockResolvedValue(undefined),
    sendAdminOrderEmail: vi.fn().mockResolvedValue(undefined),
}));

const refundMocks = vi.hoisted(() => ({
    queueRefundForApprovedCancellation: vi.fn().mockResolvedValue({
        queued: true,
        code: 'REFUND_CREATED',
        provider: 'stripe',
        externalRefundId: 're_test_1',
        requestedAt: new Date('2026-03-28T10:00:00.000Z'),
        amount: 100,
        currency: 'usd',
    }),
    queueRefundForOrder: vi.fn().mockResolvedValue({
        queued: true,
        code: 'REFUND_CREATED',
        provider: 'stripe',
        externalRefundId: 're_test_2',
        requestedAt: new Date('2026-03-28T11:00:00.000Z'),
        amount: 100,
        currency: 'usd',
    }),
}));

const shippingMocks = vi.hoisted(() => ({
    createB2cShipment: vi.fn().mockResolvedValue({
        sawb: 'SHIP-001',
        waybills: [{ awb: 'SHIP-001', awbFile: 'label-data' }],
    }),
}));

vi.mock('@/lib/email/email.service', () => ({
    sendCustomerOrderEmail: emailMocks.sendCustomerOrderEmail,
    sendAdminOrderEmail: emailMocks.sendAdminOrderEmail,
}));

vi.mock('@/lib/refund/refund.service', async () => {
    const actual = await vi.importActual<typeof import('@/lib/refund/refund.service')>('@/lib/refund/refund.service');
    return {
        ...actual,
        queueRefundForApprovedCancellation: refundMocks.queueRefundForApprovedCancellation,
        queueRefundForOrder: refundMocks.queueRefundForOrder,
    };
});

vi.mock('@/lib/shipping/shipping.service', async () => {
    const actual = await vi.importActual<typeof import('@/lib/shipping/shipping.service')>('@/lib/shipping/shipping.service');
    return {
        ...actual,
        createB2cShipment: shippingMocks.createB2cShipment,
    };
});

import { clear } from '../test-db';
import {
    createOrder,
    getOrderById,
    listOrders,
    proceedOrderRefundByAdmin,
    requestOrderCancellationByCustomer,
    requestOrderReturnByCustomer,
    reviewOrderCancellationByAdmin,
    reviewOrderReturnByAdmin,
    updateOrderStatusById,
} from '@/lib/order/order.service';
import type { OrderDocument, OrderStatus } from '@/lib/order/model/order.model';
import { ObjectId } from '@/test/test-db';

const BILLING_DETAILS = {
    email: 'customer@example.com',
    firstName: 'Customer',
    lastName: 'Test',
    country: 'United Arab Emirates',
    streetAddress1: '123 Palm Street',
    city: 'Dubai',
    phone: '+971500000000',
};

const BASE_ORDER_DATA: Omit<OrderDocument, '_id' | 'createdAt' | 'updatedAt'> = {
    sessionId: 'session-1',
    stripeSessionId: 'stripe-1',
    items: [
        {
            productId: 'prod-1',
            productName: 'Product 1',
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

describe('Order service (admin helpers)', () => {
    beforeEach(async () => {
        await clear();
        emailMocks.sendCustomerOrderEmail.mockClear();
        emailMocks.sendAdminOrderEmail.mockClear();
        refundMocks.queueRefundForApprovedCancellation.mockClear();
        refundMocks.queueRefundForOrder.mockClear();
        shippingMocks.createB2cShipment.mockClear();
    });

    it('creates and retrieves an order by id', async () => {
        const created = await createOrder(BASE_ORDER_DATA);

        const fetched = await getOrderById(created.id);
        expect(fetched.id).toBe(created.id);
        expect(fetched.totalAmount).toBe(100);
        expect(fetched.billingDetails).toEqual(expect.objectContaining(BILLING_DETAILS));
    });

    it('throws for invalid order id format', async () => {
        await expect(getOrderById('not-an-id')).rejects.toHaveProperty('code', 'INVALID_ORDER_ID');
    });

    it('lists orders with pagination and status filter', async () => {
        // Seed multiple orders with different statuses
        const statuses: OrderStatus[] = ['pending', 'paid', 'cancelled', 'failed', 'AF'];
        for (let i = 0; i < 10; i++) {
            await createOrder({
                ...BASE_ORDER_DATA,
                sessionId: `session-${i}`,
                stripeSessionId: `stripe-${i}`,
                totalAmount: 100 + i,
                status: statuses[i % statuses.length],
            });
        }

        const firstPage = await listOrders({ page: 1, limit: 5 });
        expect(firstPage.orders).toHaveLength(5);
        expect(firstPage.pagination.total).toBe(10);
        expect(firstPage.pagination.totalPages).toBe(2);

        const pendingOnly = await listOrders({ status: 'pending' });
        expect(pendingOnly.orders.every(o => o.status === 'pending')).toBe(true);
        expect(pendingOnly.pagination.total).toBeGreaterThan(0);
    });

    it('updates order status by id', async () => {
        const created = await createOrder(BASE_ORDER_DATA);

        const updated = await updateOrderStatusById(created.id, 'paid');
        expect(updated.status).toBe('paid');

        const fetched = await getOrderById(created.id);
        expect(fetched.status).toBe('paid');
        expect(fetched.billingDetails).toEqual(expect.objectContaining(BILLING_DETAILS));
        expect(emailMocks.sendCustomerOrderEmail).toHaveBeenCalledWith('order_paid', expect.objectContaining({ id: created.id, status: 'paid' }));
        expect(emailMocks.sendAdminOrderEmail).toHaveBeenCalledWith('admin_new_order', expect.objectContaining({ id: created.id, status: 'paid' }));
    });

    it('notifies admin when a cancellation request is submitted', async () => {
        const created = await createOrder({
            ...BASE_ORDER_DATA,
            status: 'paid',
        });

        const requested = await requestOrderCancellationByCustomer(
            created.id,
            { sessionId: created.sessionId },
            'Need to return this item',
        );

        expect(requested.status).toBe('cancellation_requested');
        expect(emailMocks.sendAdminOrderEmail).toHaveBeenCalledWith(
            'admin_cancellation_requested',
            expect.objectContaining({ id: created.id, status: 'cancellation_requested' }),
        );
    });

    it('notifies the customer when cancellation is approved', async () => {
        const created = await createOrder({
            ...BASE_ORDER_DATA,
            status: 'paid',
        });

        await requestOrderCancellationByCustomer(created.id, { sessionId: created.sessionId }, 'Need to return this item');

        const reviewed = await reviewOrderCancellationByAdmin(created.id, { decision: 'approve' });
        expect(reviewed.status).toBe('cancellation_approved');
        expect(emailMocks.sendCustomerOrderEmail).toHaveBeenCalledWith(
            'cancellation_approved',
            expect.objectContaining({ id: created.id, status: 'cancellation_approved' }),
        );
    });

    it('finalizes a Tabby cancellation immediately when refund succeeds during approval', async () => {
        refundMocks.queueRefundForApprovedCancellation.mockResolvedValueOnce({
            queued: true,
            code: 'REFUND_CREATED',
            provider: 'tabby',
            externalRefundId: 'tabby-refund-cancel-1',
            requestedAt: new Date('2026-03-28T10:00:00.000Z'),
            amount: 100,
            currency: 'aed',
            succeeded: true,
        });

        const created = await createOrder({
            ...BASE_ORDER_DATA,
            paymentProvider: 'tabby',
            paymentProviderSessionId: 'tabby-payment-1',
            currency: 'aed',
            status: 'paid',
        });

        await requestOrderCancellationByCustomer(created.id, { sessionId: created.sessionId }, 'Cancel this Tabby order');

        const reviewed = await reviewOrderCancellationByAdmin(created.id, { decision: 'approve' });
        expect(reviewed.status).toBe('refunded');
        expect(reviewed.refund?.provider).toBe('tabby');
        expect(reviewed.refund?.externalRefundId).toBe('tabby-refund-cancel-1');
        expect(reviewed.cancellation?.completedAt).toBeDefined();
    });

    it('can deny cancellation and proceed to shipment', async () => {
        const created = await createOrder({
            ...BASE_ORDER_DATA,
            paymentProvider: 'stripe',
            paymentProviderOrderId: 'pi_123',
            status: 'paid',
        });

        await requestOrderCancellationByCustomer(created.id, { sessionId: created.sessionId }, 'Changed my mind');

        const reviewed = await reviewOrderCancellationByAdmin(created.id, {
            decision: 'reject',
            proceedToShipment: true,
            note: 'Shipping now',
        });

        expect(reviewed.status).toBe('requested_shipment');
        expect(reviewed.shipping?.awb).toBe('SHIP-001');
        expect(shippingMocks.createB2cShipment).toHaveBeenCalled();
        expect(reviewed.cancellation?.adminDecision).toBe('rejected');
    });

    it('allows return request after shipment starts', async () => {
        const created = await createOrder({
            ...BASE_ORDER_DATA,
            status: 'OD',
            shipping: {
                provider: 'smsa',
                awb: 'OUT-1',
                createdAt: new Date('2026-03-28T09:00:00.000Z'),
                status: 'Out for Delivery',
            },
        });

        const requested = await requestOrderReturnByCustomer(
            created.id,
            { sessionId: created.sessionId },
            'Returning after delivery attempt',
        );

        expect(requested.status).toBe('return_requested');
        expect(requested.returnRequest?.requestedFromStatus).toBe('OD');
        expect(emailMocks.sendAdminOrderEmail).toHaveBeenCalledWith(
            'admin_return_requested',
            expect.objectContaining({ id: created.id, status: 'return_requested' }),
        );
    });

    it('approves return without initiating refund immediately', async () => {
        const created = await createOrder({
            ...BASE_ORDER_DATA,
            status: 'DL',
            shipping: {
                provider: 'smsa',
                awb: 'DEL-1',
                createdAt: new Date('2026-03-28T09:00:00.000Z'),
                status: 'Delivered',
            },
        });

        await requestOrderReturnByCustomer(created.id, { sessionId: created.sessionId }, 'Wrong fit');
        const reviewed = await reviewOrderReturnByAdmin(created.id, { decision: 'approve' });

        expect(reviewed.status).toBe('return_approved');
        expect(reviewed.returnRequest?.shipment?.awb).toBe('SHIP-001');
        expect(refundMocks.queueRefundForOrder).not.toHaveBeenCalled();
        expect(emailMocks.sendCustomerOrderEmail).toHaveBeenCalledWith(
            'return_approved',
            expect.objectContaining({ id: created.id, status: 'return_approved' }),
        );
    });

    it('initiates refund manually for approved returns', async () => {
        const created = await createOrder({
            ...BASE_ORDER_DATA,
            paymentProvider: 'stripe',
            paymentProviderOrderId: 'pi_return_123',
            status: 'return_approved',
            shipping: {
                provider: 'smsa',
                awb: 'DEL-2',
                createdAt: new Date('2026-03-28T09:00:00.000Z'),
                status: 'Delivered',
            },
            returnRequest: {
                requestedAt: new Date('2026-03-28T09:30:00.000Z'),
                approvedAt: new Date('2026-03-28T10:00:00.000Z'),
                adminDecision: 'approved',
                requestReason: 'Damaged on arrival',
                requestedBySessionId: 'session-1',
            },
        });

        const refunded = await proceedOrderRefundByAdmin(created.id);
        expect(refunded.status).toBe('refund_approved');
        expect(refunded.refund?.externalRefundId).toBe('re_test_2');
        expect(refundMocks.queueRefundForOrder).toHaveBeenCalled();
    });

    it('finalizes a Tabby return refund immediately when provider confirms it inline', async () => {
        refundMocks.queueRefundForOrder.mockResolvedValueOnce({
            queued: true,
            code: 'REFUND_CREATED',
            provider: 'tabby',
            externalRefundId: 'tabby-refund-return-1',
            requestedAt: new Date('2026-03-28T11:00:00.000Z'),
            amount: 100,
            currency: 'aed',
            succeeded: true,
        });

        const created = await createOrder({
            ...BASE_ORDER_DATA,
            paymentProvider: 'tabby',
            paymentProviderSessionId: 'tabby-payment-2',
            currency: 'aed',
            status: 'return_approved',
            shipping: {
                provider: 'smsa',
                awb: 'DEL-3',
                createdAt: new Date('2026-03-28T09:00:00.000Z'),
                status: 'Delivered',
            },
            returnRequest: {
                requestedAt: new Date('2026-03-28T09:30:00.000Z'),
                approvedAt: new Date('2026-03-28T10:00:00.000Z'),
                adminDecision: 'approved',
                requestReason: 'Tabby return',
                requestedBySessionId: 'session-1',
            },
        });

        const refunded = await proceedOrderRefundByAdmin(created.id);
        expect(refunded.status).toBe('refunded');
        expect(refunded.refund?.provider).toBe('tabby');
        expect(refunded.refund?.externalRefundId).toBe('tabby-refund-return-1');
        expect(refunded.returnRequest?.completedAt).toBeDefined();
    });
});
