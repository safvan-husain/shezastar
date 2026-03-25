import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { clear } from '../test-db';
import { POST as shippingWebhookHandler } from '@/app/api/shipping/webhook/route';
import { createOrder, getOrderById } from '@/lib/order/order.service';
import type { OrderDocument } from '@/lib/order/model/order.model';

const BASE_ORDER_DATA: Omit<OrderDocument, '_id' | 'createdAt' | 'updatedAt'> = {
    sessionId: 'shipping-webhook-session',
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
    currency: 'sar',
    status: 'shipped',
    shipping: {
        provider: 'smsa',
        awb: '231200021000',
        createdAt: new Date('2024-01-10T08:00:00Z'),
        status: 'Shipped',
    },
};

describe('SMSA shipping webhook', () => {
    const originalSecret = process.env.CUSTOM_SECRET;

    beforeEach(async () => {
        await clear();
        process.env.CUSTOM_SECRET = 'test-webhook-secret';
    });

    afterEach(() => {
        process.env.CUSTOM_SECRET = originalSecret;
    });

    it('moves order status to latest SMSA scan type when delivered update is received', async () => {
        const order = await createOrder(BASE_ORDER_DATA);

        const payload = [
            {
                AWB: '231200021000',
                Reference: order.id,
                isDelivered: true,
                Scans: [
                    {
                        ReferenceID: 10611,
                        ReceivedBy: 'Abdulaziz',
                        City: 'Riyadh',
                        ScanType: 'DL',
                        ScanDescription: 'Delivered',
                        ScanDateTime: '2024-01-10T11:00:00',
                        ScanTimeZone: '+03:00',
                    },
                    {
                        ReferenceID: 10541,
                        City: 'Riyadh',
                        ScanType: 'OD',
                        ScanDescription: 'Out for Delivery',
                        ScanDateTime: '2024-01-10T10:00:00',
                        ScanTimeZone: '+03:00',
                    },
                ],
            },
        ];

        const req = new Request('http://localhost/api/shipping/webhook', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'custom-secret': 'test-webhook-secret',
            },
            body: JSON.stringify(payload),
        });

        const res = await shippingWebhookHandler(req as any);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.updatedOrders).toBe(1);
        expect(body.statusTransitionedOrders).toBe(1);
        expect(body.unmatchedAwbs).toEqual([]);

        const updated = await getOrderById(order.id);
        expect(updated.status).toBe('DL');
        expect(updated.shipping?.status).toBe('Delivered');
        expect(updated.shipping?.lastTrackedAt).toBe('2024-01-10T08:00:00.000Z');
    });

    it('updates tracking status and moves order to latest non-delivered scan code', async () => {
        const order = await createOrder(BASE_ORDER_DATA);

        const payload = [
            {
                AWB: '231200021000',
                Reference: order.id,
                Scans: [
                    {
                        ReferenceID: 10545,
                        City: 'Riyadh',
                        ScanType: 'OD',
                        ScanDescription: 'Out for Delivery',
                        ScanDateTime: '2024-01-10T10:00:00',
                        ScanTimeZone: '+03:00',
                    },
                    {
                        ReferenceID: 10360,
                        City: 'Jeddah',
                        ScanType: 'AF',
                        ScanDescription: 'Arrived Delivery Facility',
                        ScanDateTime: '2024-01-10T09:00:00',
                        ScanTimeZone: '+03:00',
                    },
                ],
            },
        ];

        const req = new Request('http://localhost/api/shipping/webhook', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'custom-secret': 'test-webhook-secret',
            },
            body: JSON.stringify(payload),
        });

        const res = await shippingWebhookHandler(req as any);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.updatedOrders).toBe(1);
        expect(body.statusTransitionedOrders).toBe(1);

        const updated = await getOrderById(order.id);
        expect(updated.status).toBe('OD');
        expect(updated.shipping?.status).toBe('Out for Delivery');
        expect(updated.shipping?.lastTrackedAt).toBe('2024-01-10T07:00:00.000Z');
    });

    it('returns unmatched AWBs when no order exists for a shipment update', async () => {
        const req = new Request('http://localhost/api/shipping/webhook', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'custom-secret': 'test-webhook-secret',
            },
            body: JSON.stringify([
                {
                    AWB: '231200099999',
                    Scans: [
                        {
                            City: 'Riyadh',
                            ScanType: 'OD',
                            ScanDescription: 'Out for Delivery',
                            ScanDateTime: '2024-01-10T10:00:00',
                            ScanTimeZone: '+03:00',
                        },
                    ],
                },
            ]),
        });

        const res = await shippingWebhookHandler(req as any);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.updatedOrders).toBe(0);
        expect(body.unmatchedAwbs).toEqual(['231200099999']);
    });
});
