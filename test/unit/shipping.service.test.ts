import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mapBillingToConsigneeAddress, trackShipment } from '@/lib/shipping/shipping.service';
import { AppError } from '@/lib/errors/app-error';

vi.mock('@/lib/app-settings/app-settings.service', () => ({
    getCountryPricings: vi.fn().mockResolvedValue([]),
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
});
