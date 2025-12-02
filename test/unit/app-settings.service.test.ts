import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getAppSettings, updateHeroBanner } from '@/lib/app-settings/app-settings.service';
import { AppError } from '@/lib/errors/app-error';
import { clear } from '../test-db';

describe('App Settings Service Unit Tests', () => {
    beforeAll(async () => {
        await clear();
    });

    afterAll(async () => {
        await clear();
    });

    it('should return default settings when none exist', async () => {
        const result = await getAppSettings();
        expect(result.homeHeroBanner).toBeUndefined();
        expect(result.id).toBeDefined();
    });

    it('should update hero banner settings', async () => {
        const input = {
            imagePath: '/images/hero.jpg',
            title: 'Summer Sale',
            description: 'Get 50% off on all items',
            price: 100,
            offerPrice: 50,
            offerLabel: '50% OFF',
        };

        const result = await updateHeroBanner(input);
        expect(result.homeHeroBanner).toMatchObject(input);
        expect(result.id).toBeDefined();
    });

    it('should throw error if offerPrice >= price', async () => {
        const input = {
            imagePath: '/images/hero.jpg',
            title: 'Invalid Sale',
            description: 'Bad pricing',
            price: 100,
            offerPrice: 100,
            offerLabel: 'NO DISCOUNT',
        };

        await expect(updateHeroBanner(input)).rejects.toThrow(AppError);
        await expect(updateHeroBanner(input)).rejects.toThrow('INVALID_OFFER_PRICE');
    });

    it('should get updated settings after update', async () => {
        const input = {
            imagePath: '/images/new-hero.jpg',
            title: 'Winter Sale',
            description: 'New season deals',
            price: 200,
            offerPrice: 150,
            offerLabel: '25% OFF',
        };

        await updateHeroBanner(input);
        const result = await getAppSettings();
        expect(result.homeHeroBanner).toMatchObject(input);
    });
});
