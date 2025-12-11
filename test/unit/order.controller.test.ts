import { describe, expect, it, vi } from 'vitest';

import {
    handleAdminGetOrder,
    handleAdminListOrders,
    handleAdminUpdateOrderStatus,
} from '@/lib/order/order.controller';
import * as orderService from '@/lib/order/order.service';
import type { Order } from '@/lib/order/model/order.model';
import { AppError } from '@/lib/errors/app-error';

vi.mock('@/lib/order/order.service');

const mockOrder: Order = {
    id: 'order-1',
    sessionId: 'session-1',
    stripeSessionId: 'stripe-1',
    items: [],
    totalAmount: 100,
    currency: 'usd',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

describe('Order controller (admin)', () => {
    it('lists orders with normalized parameters', async () => {
        vi.mocked(orderService.listOrders).mockResolvedValueOnce({
            orders: [mockOrder],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        });

        const response = await handleAdminListOrders(1, 20, 'pending');

        expect(orderService.listOrders).toHaveBeenCalledWith({
            page: 1,
            limit: 20,
            status: 'pending',
        });
        expect(response.status).toBe(200);
        expect((response.body as any).orders).toHaveLength(1);
    });

    it('returns 400 for invalid status filter', async () => {
        const response = await handleAdminListOrders(1, 20, 'unknown');
        expect(response.status).toBe(400);
        expect((response.body as any).code).toBe('INVALID_STATUS');
    });

    it('gets an order by id', async () => {
        vi.mocked(orderService.getOrderById).mockResolvedValueOnce(mockOrder);

        const response = await handleAdminGetOrder('order-1');

        expect(orderService.getOrderById).toHaveBeenCalledWith('order-1');
        expect(response.status).toBe(200);
        expect((response.body as any).id).toBe('order-1');
    });

    it('maps AppError for get order', async () => {
        vi.mocked(orderService.getOrderById).mockRejectedValueOnce(
            new AppError(404, 'ORDER_NOT_FOUND')
        );

        const response = await handleAdminGetOrder('missing');
        expect(response.status).toBe(404);
        expect((response.body as any).code).toBe('ORDER_NOT_FOUND');
    });

    it('updates order status via controller', async () => {
        vi.mocked(orderService.updateOrderStatusById).mockResolvedValueOnce({
            ...mockOrder,
            status: 'paid',
        });

        const response = await handleAdminUpdateOrderStatus('order-1', {
            status: 'paid',
        });

        expect(orderService.updateOrderStatusById).toHaveBeenCalledWith(
            'order-1',
            'paid'
        );
        expect(response.status).toBe(200);
        expect((response.body as any).status).toBe('paid');
    });

    it('rejects invalid status payloads', async () => {
        const response = await handleAdminUpdateOrderStatus('order-1', {
            status: 'unknown',
        });

        expect(response.status).toBe(400);
        expect((response.body as any).code).toBe('VALIDATION_ERROR');
    });
});

