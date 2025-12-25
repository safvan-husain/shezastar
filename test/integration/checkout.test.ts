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

const getCartForCurrentSessionMock = vi.fn().mockResolvedValue({
    items: [{ productId: 'cart-prod-1', quantity: 1, unitPrice: 100, selectedVariantItemIds: [] }],
    isEmpty: false,
    billingDetails: {
        email: 'checkout@example.com',
        firstName: 'Checkout',
        lastName: 'Tester',
        country: 'United Arab Emirates',
        streetAddress1: '123 Checkout Street',
        city: 'Dubai',
        phone: '+971500000000',
    },
});

// Mock Cart Service to avoid DB calls
const computeCartItemPricingMock = vi.fn().mockResolvedValue({
    unitPrice: 50,
    installationAddOnPrice: 0,
    installationOption: 'none'
});

vi.mock('@/lib/cart/cart.service', () => ({
    getCartForCurrentSession: getCartForCurrentSessionMock,
    computeCartItemPricing: computeCartItemPricingMock,
}));

// Mock Stock Service
const validateStockAvailabilityMock = vi.fn().mockResolvedValue({
    available: true,
    insufficientItems: []
});

vi.mock('@/lib/product/product.service-stock', () => ({
    validateStockAvailability: validateStockAvailabilityMock,
}));

// Mock Currency Service
vi.mock('@/lib/currency/currency.service', () => ({
    getExchangeRates: vi.fn().mockResolvedValue({
        AED: 1,
        USD: 1, // Set to 1 for tests to make math simple
        SAR: 1,
        QAR: 1,
        KWD: 1,
        BHD: 1,
        OMR: 1
    }),
    convertPrice: vi.fn((price) => price), // Identity function for tests
}));

describe('Checkout Session API', () => {
    let POST: any;

    beforeEach(async () => {
        vi.resetModules();
        mockCreateSession.mockClear();
        validateStockAvailabilityMock.mockClear();
        getCartForCurrentSessionMock.mockClear();
        computeCartItemPricingMock.mockClear();
        computeCartItemPricingMock.mockResolvedValue({
            unitPrice: 50,
            installationAddOnPrice: 0,
            installationOption: 'none'
        });
        getCartForCurrentSessionMock.mockResolvedValue({
            items: [{ productId: 'cart-prod-1', quantity: 1, unitPrice: 100, selectedVariantItemIds: [] }],
            isEmpty: false,
            billingDetails: {
                email: 'checkout@example.com',
                firstName: 'Checkout',
                lastName: 'Tester',
                country: 'United Arab Emirates',
                streetAddress1: '123 Checkout Street',
                city: 'Dubai',
                phone: '+971500000000',
            },
        });
        validateStockAvailabilityMock.mockResolvedValue({
            available: true,
            insufficientItems: []
        });
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
                sessionId: 'test-session-id',
                billingEmail: 'checkout@example.com',
                billingCountry: 'United Arab Emirates',
                billingName: 'Checkout Tester',
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
            metadata: expect.objectContaining({
                sessionId: 'test-session-id',
                billingEmail: 'checkout@example.com',
                billingCountry: 'United Arab Emirates',
                billingName: 'Checkout Tester',
            }),
            // Should contain cart items specifically
            line_items: expect.arrayContaining([
                expect.objectContaining({
                    quantity: 1,
                    price_data: expect.objectContaining({
                        unit_amount: 5000,
                        product_data: expect.objectContaining({
                            name: 'cart-prod-1'
                        })
                    })
                })
            ])
        }));
    });

    it('returns 400 with insufficient stock details when stock is not available', async () => {
        validateStockAvailabilityMock.mockResolvedValueOnce({
            available: false,
            insufficientItems: [
                {
                    productId: 'cart-prod-1',
                    variantKey: 'default',
                    requested: 5,
                    available: 2,
                },
            ],
        });

        const req = new Request('http://localhost/api/checkout_sessions', {
            method: 'POST',
            body: JSON.stringify({}), // Use cart items
            headers: { 'Content-Type': 'application/json' }
        }) as any;

        const res = await POST(req);
        expect(res.status).toBe(400);

        const body = await res.json();
        expect(body).toEqual({
            error: 'Insufficient stock',
            insufficientItems: [
                expect.objectContaining({
                    productId: 'cart-prod-1',
                    variantKey: 'default',
                    requested: 5,
                    available: 2,
                }),
            ],
        });

        expect(mockCreateSession).not.toHaveBeenCalled();
    });

    it('returns 400 when billing details are missing', async () => {
        getCartForCurrentSessionMock.mockResolvedValueOnce({
            items: [{ productId: 'cart-prod-1', quantity: 1, unitPrice: 100, selectedVariantItemIds: [] }],
        });

        const req = new Request('http://localhost/api/checkout_sessions', {
            method: 'POST',
            body: JSON.stringify({}),
            headers: { 'Content-Type': 'application/json' },
        }) as any;

        const res = await POST(req);
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body).toEqual({
            error: 'Billing details required',
            code: 'BILLING_DETAILS_REQUIRED',
        });
        expect(mockCreateSession).not.toHaveBeenCalled();
    });
});
