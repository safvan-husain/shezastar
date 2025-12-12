import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clear } from '../test-db';
import {
    getBillingDetailsBySessionId,
    getBillingDetailsForCurrentSession,
    setBillingDetailsForCurrentSession,
} from '@/lib/cart/cart.service';

vi.mock('@/lib/storefront-session', () => {
    const session = {
        sessionId: 'billing-session',
        status: 'active',
    } as any;

    const ensureStorefrontSession = vi.fn().mockResolvedValue(session);
    const getStorefrontSession = vi.fn().mockResolvedValue(session);
    const getStorefrontSessionId = vi.fn().mockResolvedValue(session.sessionId);

    return {
        ensureStorefrontSession,
        getStorefrontSession,
        getStorefrontSessionId,
    };
});

describe('Cart billing details service helpers', () => {
    beforeEach(async () => {
        await clear();
    });

    it('returns null when no billing details exist for session', async () => {
        const billingDetails = await getBillingDetailsForCurrentSession();
        expect(billingDetails).toBeNull();
    });

    it('saves and retrieves billing details for the current session', async () => {
        const payload = {
            email: 'billing@example.com',
            firstName: 'Jane',
            lastName: 'Doe',
            country: 'United Arab Emirates',
            streetAddress1: '123 Test Street',
            city: 'Dubai',
            phone: '+971500000000',
        };

        const updatedCart = await setBillingDetailsForCurrentSession(payload);
        expect(updatedCart.billingDetails).toEqual(expect.objectContaining(payload));

        const fetched = await getBillingDetailsForCurrentSession();
        expect(fetched).toEqual(expect.objectContaining(payload));

        const bySession = await getBillingDetailsBySessionId('billing-session');
        expect(bySession).toEqual(expect.objectContaining(payload));
    });
});
