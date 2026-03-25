import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mapBillingToConsigneeAddress } from '@/lib/shipping/shipping.service';
import { AppError } from '@/lib/errors/app-error';

vi.mock('@/lib/app-settings/app-settings.service', () => ({
    getCountryPricings: vi.fn().mockResolvedValue([]),
}));

describe('shipping.service country normalization', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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
        ).rejects.toMatchObject<AppError>({
            status: 400,
            code: 'INVALID_SMSA_COUNTRY_CODE',
        });
    });
});
