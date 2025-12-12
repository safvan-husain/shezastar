import { beforeEach, describe, expect, it } from 'vitest';

import { clear } from '../test-db';
import { GET as listOrdersHandler } from '@/app/api/admin/orders/route';
import { GET as getOrderHandler, PATCH as patchOrderHandler } from '@/app/api/admin/orders/[id]/route';
import { createOrder } from '@/lib/order/order.service';
import type { OrderDocument, OrderStatus } from '@/lib/order/model/order.model';

const BILLING_DETAILS = {
    email: 'buyer@example.com',
    firstName: 'Buyer',
    lastName: 'Integration',
    country: 'United Arab Emirates',
    streetAddress1: '123 Integration St',
    city: 'Dubai',
    phone: '+971555000000',
};

const BASE_ORDER_DATA: Omit<OrderDocument, '_id' | 'createdAt' | 'updatedAt'> = {
    sessionId: 'session-integration',
    stripeSessionId: 'stripe-integration',
    items: [
        {
            productId: 'prod-1',
            productName: 'Integration Product',
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

describe('Admin orders API', () => {
    beforeEach(async () => {
        await clear();
    });

    it('lists orders with pagination', async () => {
        const statuses: OrderStatus[] = ['pending', 'paid'];
        for (let i = 0; i < 3; i++) {
            await createOrder({
                ...BASE_ORDER_DATA,
                sessionId: `session-${i}`,
                stripeSessionId: `stripe-${i}`,
                totalAmount: 100 + i,
                status: statuses[i % statuses.length],
            });
        }

        const req = new Request('http://localhost/api/admin/orders?page=1&limit=2', {
            method: 'GET',
        });

        const res = await listOrdersHandler(req);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.orders).toHaveLength(2);
        expect(body.pagination.total).toBe(3);
        expect(body.orders[0].billingDetails).toEqual(expect.objectContaining(BILLING_DETAILS));
    });

    it('filters orders by status', async () => {
        await createOrder({ ...BASE_ORDER_DATA, status: 'pending', stripeSessionId: 's1' });
        await createOrder({ ...BASE_ORDER_DATA, status: 'paid', stripeSessionId: 's2' });

        const req = new Request('http://localhost/api/admin/orders?status=paid', {
            method: 'GET',
        });

        const res = await listOrdersHandler(req);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.orders.every((o: any) => o.status === 'paid')).toBe(true);
    });

    it('gets and updates a single order', async () => {
        const created = await createOrder(BASE_ORDER_DATA);

        const getReq = new Request(`http://localhost/api/admin/orders/${created.id}`, {
            method: 'GET',
        });

        const getRes = await getOrderHandler(getReq, {
            params: Promise.resolve({ id: created.id }),
        } as any);

        expect(getRes.status).toBe(200);
        const getBody = await getRes.json();
        expect(getBody.id).toBe(created.id);
        expect(getBody.billingDetails).toEqual(expect.objectContaining(BILLING_DETAILS));

        const patchReq = new Request(`http://localhost/api/admin/orders/${created.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'paid' }),
            headers: { 'Content-Type': 'application/json' },
        });

        const patchRes = await patchOrderHandler(patchReq, {
            params: Promise.resolve({ id: created.id }),
        } as any);

        expect(patchRes.status).toBe(200);
        const patchBody = await patchRes.json();
        expect(patchBody.status).toBe('paid');
        expect(patchBody.billingDetails).toEqual(expect.objectContaining(BILLING_DETAILS));
    });
});

