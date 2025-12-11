process.env.STRIPE_SECRET_KEY = 'test_key';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock Stripe
const mockCreateSession = vi.fn().mockResolvedValue({
    url: 'https://checkout.stripe.com/test-session-url',
    id: 'test_session_id'
});

vi.mock('stripe', () => {
    return {
        default: class Stripe {
            constructor() { }
            checkout = {
                sessions: {
                    create: mockCreateSession
                }
            }
            webhooks = {
                constructEvent: vi.fn()
            }
        }
    }
});

// Mock Session to avoid actual DB calls for session management
vi.mock('@/lib/storefront-session', () => ({
    getStorefrontSessionId: vi.fn().mockResolvedValue('test-session-id'),
}));

// Mock Cart Service to avoid DB calls
vi.mock('@/lib/cart/cart.service', () => ({
    getCartForCurrentSession: vi.fn().mockResolvedValue({
        items: [{ productId: 'cart-prod-1', quantity: 1, unitPrice: 100 }],
        isEmpty: false
    }),
}));

const ctx = { params: Promise.resolve({}) };

describe('Checkout Session API', () => {
    let POST: any;

    beforeEach(async () => {
        vi.resetModules();
        mockCreateSession.mockClear();
        // Reset env variable for the test
        process.env.STRIPE_SECRET_KEY = 'test_key';

        // Dynamically import the module AFTER setting env var
        const mod = await import('@/app/api/checkout_sessions/route');
        POST = mod.POST;
    });

    it('creates a "Buy Now" checkout session when items are provided', async () => {
        const buyNowItems = [{
            productId: 'buy-now-prod-1',
            quantity: 2,
            unitPrice: 50,
            selectedVariantItemIds: []
        }];

        const req = new Request('http://localhost/api/checkout_sessions', {
            method: 'POST',
            body: JSON.stringify({ items: buyNowItems }),
            headers: { 'Content-Type': 'application/json' }
        }) as any;

        const res = await POST(req);
        expect(res.status).toBe(200);

        const body = await res.json();
        expect(body.url).toBe('https://checkout.stripe.com/test-session-url');

        // Verify Stripe was called with correct parameters
        expect(mockCreateSession).toHaveBeenCalledWith(expect.objectContaining({
            metadata: expect.objectContaining({
                type: 'buy_now',
                sessionId: 'test-session-id'
            }),
            line_items: expect.arrayContaining([
                expect.objectContaining({
                    quantity: 2,
                    price_data: expect.objectContaining({
                        unit_amount: 5000, // 50 * 100
                        product_data: expect.objectContaining({
                            name: 'buy-now-prod-1'
                        })
                    })
                })
            ])
        }));
    });

    it('falls back to cart items when no items provided in body', async () => {
        const req = new Request('http://localhost/api/checkout_sessions', {
            method: 'POST',
            body: JSON.stringify({}), // Empty body or no items
            headers: { 'Content-Type': 'application/json' }
        }) as any;

        const res = await POST(req);
        expect(res.status).toBe(200);

        expect(mockCreateSession).toHaveBeenCalledWith(expect.objectContaining({
            metadata: {
                sessionId: 'test-session-id'
            },
            // Should contain cart items specifically
            line_items: expect.arrayContaining([
                expect.objectContaining({
                    quantity: 1,
                    price_data: expect.objectContaining({
                        unit_amount: 10000,
                        product_data: expect.objectContaining({
                            name: 'cart-prod-1'
                        })
                    })
                })
            ])
        }));
    });
});
