process.env.TABBY_PUBLIC_KEY = 'test_public_key';
process.env.TABBY_MERCHANT_CODE = 'test_merchant_code';

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// Mock Fetch Global
const fetchMock = vi.fn();
global.fetch = fetchMock;

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
        USD: 1,
        SAR: 1,
        KWD: 1,
        BHD: 1,
        OMR: 1
    }),
    convertPrice: vi.fn((price) => price),
}));

describe('Tabby Checkout Session API', () => {
    let POST: any;

    beforeEach(async () => {
        vi.resetModules();
        fetchMock.mockClear();
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

        process.env.TABBY_PUBLIC_KEY = 'test_public_key';
        process.env.TABBY_MERCHANT_CODE = 'test_merchant_code';

        const mod = await import('@/app/api/tabby/checkout_session/route');
        POST = mod.POST;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('creates a Tabby checkout session for Buy Now items', async () => {
        const buyNowItems = [{
            productId: 'buy-now-prod-1',
            quantity: 2,
            unitPrice: 50,
            selectedVariantItemIds: []
        }];

        // Mock Tabby API Response
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                id: 'tabby-qt-12345',
                configuration: {
                    available_products: {
                        installments: [{ web_url: 'https://checkout.tabby.ai/test-url' }]
                    }
                },
                status: 'created'
            })
        });

        const req = new Request('http://localhost/api/tabby/checkout_session', {
            method: 'POST',
            body: JSON.stringify({ items: buyNowItems }),
            headers: { 'Content-Type': 'application/json' }
        }) as any;

        const res = await POST(req);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.url).toBe('https://checkout.tabby.ai/test-url');

        // Verify Fetch Call to Tabby
        expect(fetchMock).toHaveBeenCalledWith('https://api.tabby.ai/api/v2/checkout', expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
                'Authorization': 'Bearer test_public_key'
            }),
            body: expect.stringContaining('buy-now-prod-1')
        }));
    });

    it('creates a Tabby checkout session for Cart items', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                id: 'tabby-qt-cart-123',
                configuration: {
                    available_products: {
                        installments: [{ web_url: 'https://checkout.tabby.ai/cart-url' }]
                    }
                },
                status: 'created'
            })
        });

        const req = new Request('http://localhost/api/tabby/checkout_session', {
            method: 'POST',
            body: JSON.stringify({}),
            headers: { 'Content-Type': 'application/json' }
        }) as any;

        const res = await POST(req);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.url).toBe('https://checkout.tabby.ai/cart-url');

        expect(fetchMock).toHaveBeenCalledWith('https://api.tabby.ai/api/v2/checkout', expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('cart-prod-1')
        }));
    });

    it('returns error if Tabby API rejects', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true, // API call succeeds but Tabby returns rejection
            json: async () => ({
                status: 'rejected',
                rejection_reason: 'not_eligible'
            })
        });

        const req = new Request('http://localhost/api/tabby/checkout_session', {
            method: 'POST',
            body: JSON.stringify({}),
            headers: { 'Content-Type': 'application/json' }
        }) as any;

        const res = await POST(req);
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).toBe('Tabby session creation failed');
        expect(body.reason).toBe('not_eligible');
    });

    it('returns 400 if stock is insufficient', async () => {
        validateStockAvailabilityMock.mockResolvedValueOnce({
            available: false,
            insufficientItems: [{ productId: 'cart-prod-1', available: 0, requested: 1 }]
        });

        const req = new Request('http://localhost/api/tabby/checkout_session', {
            method: 'POST',
            body: JSON.stringify({}),
            headers: { 'Content-Type': 'application/json' }
        }) as any;

        const res = await POST(req);
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).toBe('Insufficient stock');
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
