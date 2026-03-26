import { beforeEach, describe, expect, it } from 'vitest';

import { ObjectId, getCollection } from '@/lib/db/mongo-client';
import {
    buildCustomerActivityActor,
    buildProductActivityDiff,
    createActivityLog,
    getDashboardAnalytics,
} from '@/lib/activity/activity.service';
import { createOrder } from '@/lib/order/order.service';
import type { OrderDocument } from '@/lib/order/model/order.model';
import type { ProductDocument } from '@/lib/product/model/product.model';
import { clear } from '../test-db';

describe('Activity service', () => {
    beforeEach(async () => {
        await clear();
    });

    it('builds product diffs for changed fields only', () => {
        const now = new Date('2026-01-01T00:00:00.000Z');
        const previous: ProductDocument = {
            _id: new ObjectId(),
            name: 'Original Product',
            subtitle: 'Original subtitle',
            description: 'Original description',
            basePrice: 100,
            offerPercentage: 10,
            images: [],
            variants: [],
            subCategoryIds: ['cat-a'],
            variantStock: [{
                variantCombinationKey: 'default',
                stockCount: 5,
                price: 100,
            }],
            specifications: [],
            createdAt: now,
            updatedAt: now,
        };

        const next: ProductDocument = {
            ...previous,
            name: 'Updated Product',
            basePrice: 125,
            variantStock: [{
                variantCombinationKey: 'default',
                stockCount: 5,
                price: 125,
            }],
            updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        };

        const diff = buildProductActivityDiff(previous, next);

        expect(diff).toEqual([
            expect.objectContaining({
                field: 'name',
                before: 'Original Product',
                after: 'Updated Product',
            }),
            expect.objectContaining({
                field: 'basePrice',
                before: 100,
                after: 125,
            }),
            expect.objectContaining({
                field: 'variantStock',
            }),
        ]);
        expect(diff.some((entry) => entry.field === 'subtitle')).toBe(false);
    });

    it('builds dashboard analytics with status counts, 90-day trend, and recent activity', async () => {
        const recentPaidCreatedAt = new Date('2026-03-25T10:00:00.000Z');
        const oldPaidCreatedAt = new Date('2025-11-01T10:00:00.000Z');
        const pendingCreatedAt = new Date('2026-03-24T10:00:00.000Z');

        const baseOrder: Omit<OrderDocument, '_id' | 'createdAt' | 'updatedAt'> = {
            sessionId: 'session-1',
            stripeSessionId: 'stripe-1',
            items: [{
                productId: 'prod-1',
                productName: 'Analytics Product',
                selectedVariantItemIds: [],
                quantity: 1,
                unitPrice: 100,
            }],
            totalAmount: 100,
            currency: 'aed',
            status: 'paid',
        };

        const paidRecent = await createOrder({
            ...baseOrder,
            stripeSessionId: 'stripe-recent',
            totalAmount: 220,
            status: 'paid',
        });
        const paidOld = await createOrder({
            ...baseOrder,
            stripeSessionId: 'stripe-old',
            totalAmount: 180,
            status: 'paid',
        });
        const pending = await createOrder({
            ...baseOrder,
            stripeSessionId: 'stripe-pending',
            totalAmount: 140,
            status: 'pending',
        });

        const ordersCollection = await getCollection<OrderDocument>('orders');
        await ordersCollection.updateOne(
            { _id: new ObjectId(paidRecent.id) },
            { $set: { createdAt: recentPaidCreatedAt, updatedAt: recentPaidCreatedAt } },
        );
        await ordersCollection.updateOne(
            { _id: new ObjectId(paidOld.id) },
            { $set: { createdAt: oldPaidCreatedAt, updatedAt: oldPaidCreatedAt } },
        );
        await ordersCollection.updateOne(
            { _id: new ObjectId(pending.id) },
            { $set: { createdAt: pendingCreatedAt, updatedAt: pendingCreatedAt } },
        );

        await createActivityLog({
            actionType: 'order.created',
            actor: buildCustomerActivityActor({
                sessionId: 'customer-session',
                displayName: 'Buyer',
            }),
            primaryEntity: {
                kind: 'order',
                id: paidRecent.id,
                label: `Order #${paidRecent.id.slice(0, 8)}`,
            },
            summary: 'Buyer created order',
        });

        const analytics = await getDashboardAnalytics();

        expect(analytics.ordersByStatus).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ status: 'paid', count: 2 }),
                expect.objectContaining({ status: 'pending', count: 1 }),
            ]),
        );
        expect(analytics.salesTrend).toHaveLength(90);
        const recentBucket = analytics.salesTrend.find((point) => point.date === '2026-03-25');
        expect(recentBucket).toEqual(
            expect.objectContaining({
                totalAmount: 220,
                orderCount: 1,
            }),
        );
        expect(analytics.salesTrend.some((point) => point.date === '2025-11-01')).toBe(false);
        expect(analytics.recentActivity[0]?.summary).toBe('Buyer created order');
    });
});
