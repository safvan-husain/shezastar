import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
    getAppSettings,
    getHeroBanners,
    createHeroBanner,
    updateHeroBanner,
    deleteHeroBanner,
} from '@/lib/app-settings/app-settings.service';
import { AppError } from '@/lib/errors/app-error';
import { clear } from '../test-db';

describe('App Settings Service Unit Tests', () => {
    beforeAll(async () => {
        await clear();
    });

    afterAll(async () => {
        await clear();
    });

    it('should return default settings with empty hero banners array', async () => {
        const result = await getAppSettings();
        expect(result.homeHeroBanners).toEqual([]);
        expect(result.id).toBeDefined();
    });

    it('should create a new hero banner with nano ID', async () => {
        const input = {
            imagePath: '/images/hero.jpg',
            title: 'Summer Sale',
            description: 'Get 50% off on all items',
            price: 100,
            offerPrice: 50,
            offerLabel: '50% OFF',
        };

        const result = await createHeroBanner(input);
        expect(result.homeHeroBanners).toHaveLength(1);
        expect(result.homeHeroBanners[0]).toMatchObject(input);
        expect(result.homeHeroBanners[0].id).toBeDefined();
        expect(typeof result.homeHeroBanners[0].id).toBe('string');
    });

    it('should get all hero banners', async () => {
        const banners = await getHeroBanners();
        expect(banners).toHaveLength(1);
        expect(banners[0].title).toBe('Summer Sale');
    });

    it('should create multiple hero banners', async () => {
        const input = {
            imagePath: '/images/winter.jpg',
            title: 'Winter Sale',
            description: 'New season deals',
            price: 200,
            offerPrice: 150,
            offerLabel: '25% OFF',
        };

        await createHeroBanner(input);
        const banners = await getHeroBanners();
        expect(banners).toHaveLength(2);
    });

    it('should update a specific hero banner by ID', async () => {
        const banners = await getHeroBanners();
        const bannerId = banners[0].id;

        const updateInput = {
            imagePath: '/images/updated.jpg',
            title: 'Updated Sale',
            description: 'Updated description',
            price: 300,
            offerPrice: 200,
            offerLabel: 'UPDATED',
        };

        const result = await updateHeroBanner(bannerId, updateInput);
        const updatedBanner = result.homeHeroBanners.find(b => b.id === bannerId);
        expect(updatedBanner).toMatchObject(updateInput);
    });

    it('should throw error when updating non-existent banner', async () => {
        const input = {
            imagePath: '/images/test.jpg',
            title: 'Test',
            description: 'Test',
            price: 100,
            offerPrice: 50,
            offerLabel: 'TEST',
        };

        await expect(updateHeroBanner('non-existent-id', input)).rejects.toThrow(AppError);
        await expect(updateHeroBanner('non-existent-id', input)).rejects.toThrow('BANNER_NOT_FOUND');
    });

    it('should delete a hero banner by ID', async () => {
        const banners = await getHeroBanners();
        const bannerId = banners[0].id;

        await deleteHeroBanner(bannerId);
        const updatedBanners = await getHeroBanners();
        expect(updatedBanners).toHaveLength(1);
        expect(updatedBanners.find(b => b.id === bannerId)).toBeUndefined();
    });

    it('should throw error if offerPrice >= price on create', async () => {
        const input = {
            imagePath: '/images/hero.jpg',
            title: 'Invalid Sale',
            description: 'Bad pricing',
            price: 100,
            offerPrice: 100,
            offerLabel: 'NO DISCOUNT',
        };

        await expect(createHeroBanner(input)).rejects.toThrow(AppError);
        await expect(createHeroBanner(input)).rejects.toThrow('INVALID_OFFER_PRICE');
    });

    it('should throw error if offerPrice >= price on update', async () => {
        const banners = await getHeroBanners();
        const bannerId = banners[0].id;

        const input = {
            imagePath: '/images/hero.jpg',
            title: 'Invalid Sale',
            description: 'Bad pricing',
            price: 100,
            offerPrice: 150,
            offerLabel: 'INVALID',
        };

        await expect(updateHeroBanner(bannerId, input)).rejects.toThrow(AppError);
        await expect(updateHeroBanner(bannerId, input)).rejects.toThrow('INVALID_OFFER_PRICE');
    });
});
