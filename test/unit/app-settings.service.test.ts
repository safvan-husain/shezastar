import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import {
    getAppSettings,
    getHeroBanners,
    createHeroBanner,
    updateHeroBanner,
    deleteHeroBanner,
    createCustomCard,
    updateCustomCard,
    deleteCustomCard,
    getCustomCard,
    getCustomCards,
} from '@/lib/app-settings/app-settings.service';
import { AppError } from '@/lib/errors/app-error';
import { clear } from '../test-db';

// Mock the mongo client to use the test database
vi.mock('@/lib/db/mongo-client', async () => {
    const testDb = await vi.importActual('../test-db');
    return {
        getCollection: testDb.getCollection,
        connectToDatabase: testDb.connectToDatabase,
    };
});

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

describe('Custom Cards Service Unit Tests', () => {
    beforeEach(async () => {
        await clear();
    });

    it('should return default settings with all custom cards as null', async () => {
        const result = await getAppSettings();
        expect(result.customCards.card1).toBeNull();
        expect(result.customCards.card6).toBeNull();
    });

    it('should create a new custom card in empty slot', async () => {
        const input = {
            title: 'Test Card',
            subtitle: 'Test Subtitle',
            imagePath: '/images/test.jpg',
            offerLabel: 'NEW',
            urlLink: 'https://example.com',
        };

        const result = await createCustomCard('card1', input);
        expect(result.customCards.card1).toMatchObject(input);
        expect(result.customCards.card2).toBeNull();
    });

    it('should throw error when creating card in occupied slot', async () => {
        const input = {
            title: 'Test Card',
            subtitle: 'Test Subtitle',
            imagePath: '/images/test.jpg',
            offerLabel: 'NEW',
            urlLink: 'https://example.com',
        };

        await createCustomCard('card1', input);

        await expect(createCustomCard('card1', input)).rejects.toThrow(AppError);
        await expect(createCustomCard('card1', input)).rejects.toThrow('CARD_ALREADY_EXISTS');
    });

    it('should create multiple cards in different slots', async () => {
        const input2 = {
            title: 'Card 2',
            subtitle: 'Subtitle 2',
            imagePath: '/images/card2.jpg',
            offerLabel: 'HOT',
            urlLink: 'https://example.com/card2',
        };

        const input3 = {
            title: 'Card 3',
            subtitle: 'Subtitle 3',
            imagePath: '/images/card3.jpg',
            offerLabel: 'TRENDING',
            urlLink: 'https://example.com/card3',
        };

        await createCustomCard('card2', input2);
        await createCustomCard('card3', input3);

        const cards = await getCustomCards();
        expect(cards.card2).toMatchObject(input2);
        expect(cards.card3).toMatchObject(input3);
        expect(cards.card4).toBeNull();
    });

    it('should update an existing custom card', async () => {
        const input = {
            title: 'Original Card',
            subtitle: 'Original Subtitle',
            imagePath: '/images/original.jpg',
            offerLabel: 'ORIGINAL',
            urlLink: 'https://example.com/original',
        };
        await createCustomCard('card1', input);

        const updateInput = {
            title: 'Updated Card',
            subtitle: 'Updated Subtitle',
            imagePath: '/images/updated.jpg',
            offerLabel: 'UPDATED',
            urlLink: 'https://example.com/updated',
        };

        const result = await updateCustomCard('card1', updateInput);
        expect(result.customCards.card1).toMatchObject(updateInput);
    });

    it('should throw error when updating non-existent card', async () => {
        const input = {
            title: 'Test',
            subtitle: 'Test',
            imagePath: '/images/test.jpg',
            offerLabel: 'TEST',
            urlLink: 'https://example.com/test',
        };

        await expect(updateCustomCard('card4', input)).rejects.toThrow(AppError);
        await expect(updateCustomCard('card4', input)).rejects.toThrow('CARD_NOT_FOUND');
    });

    it('should delete a custom card (set to null)', async () => {
        const input1 = {
            title: 'Card 1',
            subtitle: 'Subtitle 1',
            imagePath: '/images/card1.jpg',
            offerLabel: 'HOT',
            urlLink: 'https://example.com/card1',
        };
        const input2 = {
            title: 'Card 2',
            subtitle: 'Subtitle 2',
            imagePath: '/images/card2.jpg',
            offerLabel: 'HOT',
            urlLink: 'https://example.com/card2',
        };

        await createCustomCard('card1', input1);
        await createCustomCard('card2', input2);

        await deleteCustomCard('card1');
        const cards = await getCustomCards();
        expect(cards.card1).toBeNull();
        expect(cards.card2).not.toBeNull();
    });

    it('should be idempotent when deleting non-existent card', async () => {
        const result = await deleteCustomCard('card1');
        expect(result.customCards.card1).toBeNull();
    });

    it('should throw error for invalid cardKey on create', async () => {
        const input = {
            title: 'Test',
            subtitle: 'Test',
            imagePath: '/images/test.jpg',
            offerLabel: 'TEST',
            urlLink: 'https://example.com',
        };

        await expect(createCustomCard('card7', input)).rejects.toThrow(AppError);
        await expect(createCustomCard('card7', input)).rejects.toThrow('INVALID_CARD_KEY');
        await expect(createCustomCard('card0', input)).rejects.toThrow('INVALID_CARD_KEY');
        await expect(createCustomCard('invalid', input)).rejects.toThrow('INVALID_CARD_KEY');
    });

    it('should throw error for invalid cardKey on update', async () => {
        const input = {
            title: 'Test',
            subtitle: 'Test',
            imagePath: '/images/test.jpg',
            offerLabel: 'TEST',
            urlLink: 'https://example.com',
        };

        await expect(updateCustomCard('card7', input)).rejects.toThrow('INVALID_CARD_KEY');
    });

    it('should throw error for invalid cardKey on delete', async () => {
        await expect(deleteCustomCard('card7')).rejects.toThrow('INVALID_CARD_KEY');
    });

    it('should throw error for invalid cardKey on get', async () => {
        await expect(getCustomCard('card7')).rejects.toThrow('INVALID_CARD_KEY');
    });

    it('should get specific card when it exists', async () => {
        const input = {
            title: 'Card 2',
            subtitle: 'Subtitle 2',
            imagePath: '/images/card2.jpg',
            offerLabel: 'HOT',
            urlLink: 'https://example.com/card2',
        };
        await createCustomCard('card2', input);

        const card = await getCustomCard('card2');
        expect(card).not.toBeNull();
        expect(card?.title).toBe('Card 2');
    });

    it('should get null when card does not exist', async () => {
        const card = await getCustomCard('card1');
        expect(card).toBeNull();
    });

    it('should get all custom cards', async () => {
        const input = {
            title: 'Card 2',
            subtitle: 'Subtitle 2',
            imagePath: '/images/card2.jpg',
            offerLabel: 'HOT',
            urlLink: 'https://example.com/card2',
        };
        await createCustomCard('card2', input);

        const cards = await getCustomCards();
        expect(cards.card1).toBeNull();
        expect(cards.card2).not.toBeNull();
        expect(cards.card3).toBeNull();
        expect(cards.card4).toBeNull();
        expect(cards.card5).toBeNull();
        expect(cards.card6).toBeNull();
    });
});
