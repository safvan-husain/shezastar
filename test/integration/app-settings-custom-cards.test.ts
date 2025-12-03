import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { GET as GET_CARDS } from '@/app/api/admin/settings/custom-cards/route';
import { GET as GET_CARD, POST, PUT, DELETE } from '@/app/api/admin/settings/custom-cards/[cardKey]/route';
import { clear } from '../test-db';

describe('App Settings Custom Cards Integration', () => {
    beforeAll(async () => {
        await clear();
    });

    afterAll(async () => {
        await clear();
    });

    it('should get default custom cards (all null) via GET /custom-cards', async () => {
        const res = await GET_CARDS();
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.card1).toBeNull();
        expect(body.card6).toBeNull();
    });

    it('should create a new custom card via POST', async () => {
        const payload = {
            title: 'Test Card',
            subtitle: 'Test Subtitle',
            imagePath: '/images/test.jpg',
            offerLabel: 'NEW',
            urlLink: 'https://example.com',
        };

        const req = new Request('http://localhost/api/admin/settings/custom-cards/card1', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        const res = await POST(req, { params: Promise.resolve({ cardKey: 'card1' }) });
        const body = await res.json();

        expect(res.status).toBe(201);
        expect(body.customCards.card1).toMatchObject(payload);
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

    it('should update a custom card via PUT', async () => {
        const payload = {
            title: 'Updated Card',
            subtitle: 'Updated Subtitle',
            imagePath: '/images/updated.jpg',
            offerLabel: 'UPDATED',
            urlLink: 'https://example.com/updated',
        };

        const req = new Request('http://localhost/api/admin/settings/custom-cards/card1', {
            method: 'PUT',
            body: JSON.stringify(payload),
        });

        const res = await PUT(req, { params: Promise.resolve({ cardKey: 'card1' }) });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.customCards.card1).toMatchObject(payload);
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
        const payload = {
            title: 'Test',
            subtitle: 'Test',
            imagePath: '/images/test.jpg',
            offerLabel: 'TEST',
            urlLink: 'https://example.com',
        };

        const req = new Request('http://localhost/api/admin/settings/custom-cards/card7', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        const res = await POST(req, { params: Promise.resolve({ cardKey: 'card7' }) });
        expect(res.status).toBe(400);
    });

    it('should return 400 for invalid input payload', async () => {
        const payload = {
            title: '', // Invalid
        };

        const req = new Request('http://localhost/api/admin/settings/custom-cards/card1', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        const res = await POST(req, { params: Promise.resolve({ cardKey: 'card1' }) });
        expect(res.status).toBe(400);
    });
});
