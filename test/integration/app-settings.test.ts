import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { GET } from '@/app/api/admin/settings/route';
import { PATCH } from '@/app/api/admin/settings/hero-banner/route';
import { clear } from '../test-db';

describe('App Settings API Integration', () => {
    beforeAll(async () => {
        await clear();
    });

    afterAll(async () => {
        await clear();
    });

    it('should get default settings via GET', async () => {
        const req = new Request('http://localhost/api/admin/settings');
        const res = await GET();
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.id).toBeDefined();
        expect(body.homeHeroBanner).toBeUndefined();
    });

    it('should update hero banner via PATCH', async () => {
        const payload = {
            imagePath: '/images/hero-banner.jpg',
            title: 'Mega Sale',
            description: 'Limited time offer',
            price: 500,
            offerPrice: 300,
            offerLabel: '40% OFF',
        };

        const req = new Request('http://localhost/api/admin/settings/hero-banner', {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });

        const res = await PATCH(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.homeHeroBanner).toMatchObject(payload);
    });

    it('should return 400 for invalid offer price', async () => {
        const payload = {
            imagePath: '/images/hero.jpg',
            title: 'Bad Sale',
            description: 'Invalid pricing',
            price: 100,
            offerPrice: 150,
            offerLabel: 'INVALID',
        };

        const req = new Request('http://localhost/api/admin/settings/hero-banner', {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });

        const res = await PATCH(req);
        expect(res.status).toBe(400);
    });

    it('should return 400 for missing required fields', async () => {
        const payload = {
            imagePath: '/images/hero.jpg',
            // Missing other required fields
        };

        const req = new Request('http://localhost/api/admin/settings/hero-banner', {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });

        const res = await PATCH(req);
        expect(res.status).toBe(400);
    });

    it('should persist settings across requests', async () => {
        const payload = {
            imagePath: '/images/persistent.jpg',
            title: 'Persistent Sale',
            description: 'This should persist',
            price: 1000,
            offerPrice: 800,
            offerLabel: '20% OFF',
        };

        // Update
        const patchReq = new Request('http://localhost/api/admin/settings/hero-banner', {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });
        await PATCH(patchReq);

        // Get
        const getReq = new Request('http://localhost/api/admin/settings');
        const res = await GET();
        const body = await res.json();

        expect(body.homeHeroBanner).toMatchObject(payload);
    });
});
