import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    handleCreateCustomCard,
    handleUpdateCustomCard,
    handleDeleteCustomCard,
    handleGetCustomCard,
    handleGetCustomCards,
} from '@/lib/app-settings/app-settings.controller';
import * as appSettingsService from '@/lib/app-settings/app-settings.service';
import { AppError } from '@/lib/errors/app-error';

// Mock the service
vi.mock('@/lib/app-settings/app-settings.service');

describe('App Settings Controller Unit Tests', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe('handleCreateCustomCard', () => {
        it('should create a custom card successfully', async () => {
            const input = {
                title: 'Test Card',
                subtitle: 'Test Subtitle',
                imagePath: '/images/test.jpg',
                offerLabel: 'NEW',
                urlLink: 'https://example.com',
            };
            const mockResult = { customCards: { card1: input } };
            vi.mocked(appSettingsService.createCustomCard).mockResolvedValue(mockResult as any);

            const result = await handleCreateCustomCard('card1', input);

            expect(result.status).toBe(201);
            expect(result.body).toEqual(mockResult);
            expect(appSettingsService.createCustomCard).toHaveBeenCalledWith('card1', input);
        });

        it('should return 400 for invalid input', async () => {
            const input = {
                title: '', // Invalid: empty string
            };

            const result = await handleCreateCustomCard('card1', input);

            expect(result.status).toBe(400);
            expect(appSettingsService.createCustomCard).not.toHaveBeenCalled();
        });

        it('should return error status from service', async () => {
            const input = {
                title: 'Test Card',
                subtitle: 'Test Subtitle',
                imagePath: '/images/test.jpg',
                offerLabel: 'NEW',
                urlLink: 'https://example.com',
            };
            vi.mocked(appSettingsService.createCustomCard).mockRejectedValue(new AppError(400, 'CARD_ALREADY_EXISTS'));

            const result = await handleCreateCustomCard('card1', input);

            expect(result.status).toBe(400);
        });
    });

    describe('handleUpdateCustomCard', () => {
        it('should update a custom card successfully', async () => {
            const input = {
                title: 'Updated Card',
                subtitle: 'Updated Subtitle',
                imagePath: '/images/updated.jpg',
                offerLabel: 'UPDATED',
                urlLink: 'https://example.com/updated',
            };
            const mockResult = { customCards: { card1: input } };
            vi.mocked(appSettingsService.updateCustomCard).mockResolvedValue(mockResult as any);

            const result = await handleUpdateCustomCard('card1', input);

            expect(result.status).toBe(200);
            expect(result.body).toEqual(mockResult);
            expect(appSettingsService.updateCustomCard).toHaveBeenCalledWith('card1', input);
        });

        it('should return 404 when card not found', async () => {
            const input = {
                title: 'Updated Card',
                subtitle: 'Updated Subtitle',
                imagePath: '/images/updated.jpg',
                offerLabel: 'UPDATED',
                urlLink: 'https://example.com/updated',
            };
            vi.mocked(appSettingsService.updateCustomCard).mockRejectedValue(new AppError(404, 'CARD_NOT_FOUND'));

            const result = await handleUpdateCustomCard('card1', input);

            expect(result.status).toBe(404);
        });
    });

    describe('handleDeleteCustomCard', () => {
        it('should delete a custom card successfully', async () => {
            const mockResult = { customCards: { card1: null } };
            vi.mocked(appSettingsService.deleteCustomCard).mockResolvedValue(mockResult as any);

            const result = await handleDeleteCustomCard('card1');

            expect(result.status).toBe(200);
            expect(result.body).toEqual(mockResult);
            expect(appSettingsService.deleteCustomCard).toHaveBeenCalledWith('card1');
        });
    });

    describe('handleGetCustomCard', () => {
        it('should get a custom card successfully', async () => {
            const mockCard = { title: 'Test Card' };
            vi.mocked(appSettingsService.getCustomCard).mockResolvedValue(mockCard as any);

            const result = await handleGetCustomCard('card1');

            expect(result.status).toBe(200);
            expect(result.body).toEqual(mockCard);
            expect(appSettingsService.getCustomCard).toHaveBeenCalledWith('card1');
        });

        it('should return null body when card is null', async () => {
            vi.mocked(appSettingsService.getCustomCard).mockResolvedValue(null);

            const result = await handleGetCustomCard('card1');

            expect(result.status).toBe(200);
            expect(result.body).toBeNull();
        });
    });

    describe('handleGetCustomCards', () => {
        it('should get all custom cards successfully', async () => {
            const mockCards = { card1: null, card2: null };
            vi.mocked(appSettingsService.getCustomCards).mockResolvedValue(mockCards as any);

            const result = await handleGetCustomCards();

            expect(result.status).toBe(200);
            expect(result.body).toEqual(mockCards);
            expect(appSettingsService.getCustomCards).toHaveBeenCalled();
        });
    });
});
