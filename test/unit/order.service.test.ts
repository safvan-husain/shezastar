import { beforeEach, describe, expect, it } from 'vitest';

import { clear } from '../test-db';
import {
    createOrder,
    getOrderById,
    listOrders,
    updateOrderStatusById,
} from '@/lib/order/order.service';
import type { OrderDocument, OrderStatus } from '@/lib/order/model/order.model';
import { ObjectId } from '@/test/test-db';

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
};

describe('Order service (admin helpers)', () => {
    beforeEach(async () => {
        await clear();
    });

    it('creates and retrieves an order by id', async () => {
        const created = await createOrder(BASE_ORDER_DATA);

        const fetched = await getOrderById(created.id);
        expect(fetched.id).toBe(created.id);
        expect(fetched.totalAmount).toBe(100);
    });

    it('throws for invalid order id format', async () => {
        await expect(getOrderById('not-an-id')).rejects.toHaveProperty('code', 'INVALID_ORDER_ID');
    });

    it('lists orders with pagination and status filter', async () => {
        // Seed multiple orders with different statuses
        const statuses: OrderStatus[] = ['pending', 'paid', 'cancelled', 'failed', 'completed'];
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
    });
});
