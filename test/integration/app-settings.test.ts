import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { GET } from '@/app/api/admin/settings/route';
import { GET as GET_BANNERS, POST } from '@/app/api/admin/settings/hero-banners/route';
import { PATCH, DELETE } from '@/app/api/admin/settings/hero-banners/[id]/route';
import { clear } from '../test-db';

describe('App Settings API Integration', () => {
    let createdBannerId: string;

    beforeAll(async () => {
        await clear();
    });

    afterAll(async () => {
        await clear();
    });

    it('should get default settings with empty hero banners array via GET', async () => {
        const res = await GET();
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.id).toBeDefined();
        expect(body.homeHeroBanners).toEqual([]);
    });

    it('should get empty hero banners list via GET /hero-banners', async () => {
        const res = await GET_BANNERS();
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toEqual([]);
    });

    it('should create a new hero banner via POST', async () => {
        const payload = {
            imagePath: '/images/hero-banner.jpg',
            title: 'Mega Sale',
            description: 'Limited time offer',
            price: 500,
            offerPrice: 300,
            offerLabel: '40% OFF',
        };

        const req = new Request('http://localhost/api/admin/settings/hero-banners', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        const res = await POST(req);
        const body = await res.json();

        expect(res.status).toBe(201);
        expect(body.homeHeroBanners).toHaveLength(1);
        expect(body.homeHeroBanners[0]).toMatchObject(payload);
        expect(body.homeHeroBanners[0].id).toBeDefined();

        createdBannerId = body.homeHeroBanners[0].id;
    });

    it('should get hero banners list after creation', async () => {
        const res = await GET_BANNERS();
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toHaveLength(1);
        expect(body[0].title).toBe('Mega Sale');
    });

    it('should update a hero banner via PATCH', async () => {
        const payload = {
            imagePath: '/images/updated-banner.jpg',
            title: 'Updated Sale',
            description: 'Updated description',
            price: 600,
            offerPrice: 400,
            offerLabel: '33% OFF',
        };

        const req = new Request(`http://localhost/api/admin/settings/hero-banners/${createdBannerId}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });

        const res = await PATCH(req, { params: { id: createdBannerId } });
        const body = await res.json();

        expect(res.status).toBe(200);
        const updatedBanner = body.homeHeroBanners.find((b: any) => b.id === createdBannerId);
        expect(updatedBanner).toMatchObject(payload);
    });

    it('should return 400 for invalid offer price on create', async () => {
        const payload = {
            imagePath: '/images/hero.jpg',
            title: 'Bad Sale',
            description: 'Invalid pricing',
            price: 100,
            offerPrice: 150,
            offerLabel: 'INVALID',
        };

        const req = new Request('http://localhost/api/admin/settings/hero-banners', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it('should return 400 for invalid offer price on update', async () => {
        const payload = {
            imagePath: '/images/hero.jpg',
            title: 'Bad Sale',
            description: 'Invalid pricing',
            price: 100,
            offerPrice: 150,
            offerLabel: 'INVALID',
        };

        const req = new Request(`http://localhost/api/admin/settings/hero-banners/${createdBannerId}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });

        const res = await PATCH(req, { params: { id: createdBannerId } });
        expect(res.status).toBe(400);
    });

    it('should return 400 for missing required fields on create', async () => {
        const payload = {
            imagePath: '/images/hero.jpg',
            // Missing other required fields
        };

        const req = new Request('http://localhost/api/admin/settings/hero-banners', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it('should return 404 when updating non-existent banner', async () => {
        const payload = {
            imagePath: '/images/test.jpg',
            title: 'Test',
            description: 'Test',
            price: 100,
            offerPrice: 50,
            offerLabel: 'TEST',
        };

        const req = new Request('http://localhost/api/admin/settings/hero-banners/non-existent-id', {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });

        const res = await PATCH(req, { params: { id: 'non-existent-id' } });
        expect(res.status).toBe(404);
    });

    it('should delete a hero banner via DELETE', async () => {
        const req = new Request(`http://localhost/api/admin/settings/hero-banners/${createdBannerId}`, {
            method: 'DELETE',
        });

        const res = await DELETE(req, { params: { id: createdBannerId } });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.homeHeroBanners.find((b: any) => b.id === createdBannerId)).toBeUndefined();
    });

    it('should persist settings across requests', async () => {
        // Create a new banner
        const payload = {
            imagePath: '/images/persistent.jpg',
            title: 'Persistent Sale',
            description: 'This should persist',
            price: 1000,
            offerPrice: 800,
            offerLabel: '20% OFF',
        };

        const createReq = new Request('http://localhost/api/admin/settings/hero-banners', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        await POST(createReq);

        // Get settings
        const res = await GET();
        const body = await res.json();

        expect(body.homeHeroBanners).toHaveLength(1);
        expect(body.homeHeroBanners[0]).toMatchObject(payload);
    });
});
