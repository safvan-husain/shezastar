import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createC2bShipment, mapBillingToConsigneeAddress, trackShipment } from '@/lib/shipping/shipping.service';
import { AppError } from '@/lib/errors/app-error';

vi.mock('@/lib/app-settings/app-settings.service', () => ({
    getCountryPricings: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/product/product.service', () => ({
    getProduct: vi.fn().mockResolvedValue({
        name: 'Test Product',
        subtitle: 'Test Product',
        weight: 1,
    }),
    updateProductWeight: vi.fn(),
}));

describe('shipping.service country normalization', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.SMSA_BASE_URL = 'https://example.com';
        process.env.SMSA_API_KEY = 'test-api-key';
    });

    it('maps storefront country alias to SMSA ISO-2 code', async () => {
        const address = await mapBillingToConsigneeAddress({
            email: 'buyer@example.com',
            firstName: 'John',
            lastName: 'Doe',
            country: 'UAE',
            streetAddress1: '123 Test Street',
            city: 'Dubai',
            phone: '+971500000000',
            zip: '00000',
        });

        expect(address.Country).toBe('AE');
    });

    it('throws a 400 error when country cannot be mapped to SMSA ISO-2 code', async () => {
        await expect(
            mapBillingToConsigneeAddress({
                email: 'buyer@example.com',
                firstName: 'John',
                lastName: 'Doe',
                country: 'UNKNOWN_COUNTRY',
                streetAddress1: '123 Test Street',
                city: 'Dubai',
                phone: '+971500000000',
                zip: '00000',
            })
        ).rejects.toMatchObject({
            status: 400,
            code: 'INVALID_SMSA_COUNTRY_CODE',
        } as Partial<AppError>);
    });

    it('falls back to tracking by order reference when stored awb returns 404', async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.4',
                        title: 'Not Found',
                        status: 404,
                    }),
                    {
                        status: 404,
                        headers: { 'content-type': 'application/json' },
                    }
                )
            )
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        AWB: '231200021000',
                        Reference: '69c52306916c84a6eb9d7971',
                        Scans: [],
                    }),
                    {
                        status: 200,
                        headers: { 'content-type': 'application/json' },
                    }
                )
            );

        vi.stubGlobal('fetch', fetchMock);

        const tracking = await trackShipment('legacy-sawb', '69c52306916c84a6eb9d7971');

        expect(tracking.AWB).toBe('231200021000');
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(fetchMock.mock.calls[0][0]).toBe('https://example.com/api/track/single/legacy-sawb');
        expect(fetchMock.mock.calls[1][0]).toBe('https://example.com/api/track/reference/69c52306916c84a6eb9d7971');
    });

    it('creates return shipments via the C2B endpoint with pickup and return addresses', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(
                JSON.stringify({
                    sawb: 'RET-123',
                    createDate: '2026-04-02T10:00:00.000Z',
                    shipmentParcelsCount: 1,
                    waybills: [{ awb: 'RET-123', awbFile: 'label' }],
                }),
                {
                    status: 200,
                    headers: { 'content-type': 'application/json' },
                }
            )
        );

        vi.stubGlobal('fetch', fetchMock);

        await createC2bShipment({
            id: 'order-1',
            sessionId: 'session-1',
            items: [
                {
                    productId: 'prod-1',
                    productName: 'Test Product',
                    selectedVariantItemIds: [],
                    quantity: 1,
                    unitPrice: 100,
                },
            ],
            totalAmount: 100,
            currency: 'usd',
            status: 'DL',
            billingDetails: {
                email: 'buyer@example.com',
                firstName: 'John',
                lastName: 'Doe',
                country: 'UAE',
                streetAddress1: '123 Test Street',
                city: 'Dubai',
                phone: '+971500000000',
                zip: '00000',
            },
            createdAt: '2026-04-02T09:00:00.000Z',
            updatedAt: '2026-04-02T09:00:00.000Z',
        }, {});

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toBe('https://example.com/api/c2b/new');
        expect(fetchMock.mock.calls[0][1]).toMatchObject({
            method: 'POST',
            headers: {
                ApiKey: 'test-api-key',
                'Content-Type': 'application/json',
            },
        });

        const payload = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
        expect(payload.OrderNumber).toBe('order-1');
        expect(payload.ShipmentCurrency).toBe('USD');
        expect(payload.Weight).toBe(1);
        expect(payload.WeightUnit).toBe('KG');
        expect(payload.ShipDate).toEqual(expect.any(String));
        expect(payload.PickupAddress).toEqual(expect.objectContaining({
            City: 'Dubai',
            Country: 'AE',
        }));
        expect(payload.ReturnToAddress).toEqual(expect.objectContaining({
            Country: 'AE',
        }));
        expect(payload).not.toHaveProperty('ShipperAddress');
        expect(payload).not.toHaveProperty('ConsigneeAddress');
    });
});
