import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { GET as GET_CARDS } from '@/app/api/admin/settings/custom-cards/route';
import { GET as GET_CARD, POST, PUT, DELETE } from '@/app/api/admin/settings/custom-cards/[cardKey]/route';
import { clear } from '../test-db';

// Mock file-upload utility
vi.mock('@/lib/utils/file-upload', () => ({
    saveImage: vi.fn().mockResolvedValue('/uploads/test-image.jpg'),
    deleteImage: vi.fn().mockResolvedValue(undefined),
}));

describe('App Settings Custom Cards Integration', () => {
    beforeAll(async () => {
        await clear();
    });

    afterAll(async () => {
        await clear();
        vi.restoreAllMocks();
    });

    it('should get default custom cards (all null) via GET /custom-cards', async () => {
        const res = await GET_CARDS();
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.card1).toBeNull();
        expect(body.card6).toBeNull();
    });

    it('should create a new custom card via POST with FormData', async () => {
        const formData = new FormData();
        formData.append('title', 'Test Card');
        formData.append('subtitle', 'Test Subtitle');
        // Simulate file upload
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        formData.append('image', file);
        formData.append('offerLabel', 'NEW');
        formData.append('urlLink', 'https://example.com');

        const req = new Request('http://localhost/api/admin/settings/custom-cards/card1', {
            method: 'POST',
            body: formData,
        });

        const res = await POST(req, { params: Promise.resolve({ cardKey: 'card1' }) });
        const body = await res.json();

        expect(res.status).toBe(201);
        expect(body.customCards.card1.title).toBe('Test Card');
        expect(body.customCards.card1.imagePath).toBe('/uploads/test-image.jpg');
        expect(body.customCards.card2).toBeNull();
    });

    it('should get specific custom card via GET /custom-cards/[cardKey]', async () => {
        const req = new Request('http://localhost/api/admin/settings/custom-cards/card1', {
            method: 'GET',
        });

        const res = await GET_CARD(req, { params: Promise.resolve({ cardKey: 'card1' }) });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.title).toBe('Test Card');
    });

    it('should update a custom card via PUT with FormData', async () => {
        const formData = new FormData();
        formData.append('title', 'Updated Card');
        formData.append('subtitle', 'Updated Subtitle');
        // Update image
        const file = new File(['updated'], 'updated.jpg', { type: 'image/jpeg' });
        formData.append('image', file);
        formData.append('offerLabel', 'UPDATED');
        formData.append('urlLink', 'https://example.com/updated');

        const req = new Request('http://localhost/api/admin/settings/custom-cards/card1', {
            method: 'PUT',
            body: formData,
        });

        const res = await PUT(req, { params: Promise.resolve({ cardKey: 'card1' }) });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.customCards.card1.title).toBe('Updated Card');
        expect(body.customCards.card1.imagePath).toBe('/uploads/test-image.jpg');
    });

    it('should delete a custom card via DELETE', async () => {
        const req = new Request('http://localhost/api/admin/settings/custom-cards/card1', {
            method: 'DELETE',
        });

        const res = await DELETE(req, { params: Promise.resolve({ cardKey: 'card1' }) });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.customCards.card1).toBeNull();
    });

    it('should return 400 for invalid card key', async () => {
        const formData = new FormData();
        formData.append('title', 'Test');
        formData.append('subtitle', 'Test');
        formData.append('imagePath', '/images/test.jpg');
        formData.append('offerLabel', 'TEST');
        formData.append('urlLink', 'https://example.com');

        const req = new Request('http://localhost/api/admin/settings/custom-cards/card7', {
            method: 'POST',
            body: formData,
        });

        const res = await POST(req, { params: Promise.resolve({ cardKey: 'card7' }) });
        expect(res.status).toBe(400);
    });

    it('should return 400 for invalid input payload', async () => {
        const formData = new FormData();
        formData.append('title', ''); // Invalid

        const req = new Request('http://localhost/api/admin/settings/custom-cards/card1', {
            method: 'POST',
            body: formData,
        });

        const res = await POST(req, { params: Promise.resolve({ cardKey: 'card1' }) });
        expect(res.status).toBe(400);
    });
});
