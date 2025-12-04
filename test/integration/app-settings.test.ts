import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { GET } from '@/app/api/admin/settings/route';
import { GET as GET_BANNERS, POST } from '@/app/api/admin/settings/hero-banners/route';
import { PATCH, DELETE } from '@/app/api/admin/settings/hero-banners/[id]/route';
import { clear } from '../test-db';

// Mock file-upload utility
vi.mock('@/lib/utils/file-upload', () => ({
    saveImage: vi.fn().mockResolvedValue('/uploads/test-banner.jpg'),
    deleteImage: vi.fn().mockResolvedValue(undefined),
}));

describe('App Settings API Integration', () => {
    let createdBannerId: string;

    beforeAll(async () => {
        await clear();
    });

    afterAll(async () => {
        await clear();
        vi.restoreAllMocks();
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

    it('should create a new hero banner via POST with FormData', async () => {
        const formData = new FormData();
        // Simulate file upload
        const file = new File(['test'], 'banner.jpg', { type: 'image/jpeg' });
        formData.append('image', file);
        formData.append('title', 'Mega Sale');
        formData.append('description', 'Limited time offer');
        formData.append('price', '500');
        formData.append('offerPrice', '300');
        formData.append('offerLabel', '40% OFF');

        const req = new Request('http://localhost/api/admin/settings/hero-banners', {
            method: 'POST',
            body: formData,
        });

        const res = await POST(req);
        const body = await res.json();

        expect(res.status).toBe(201);
        expect(body.homeHeroBanners).toHaveLength(1);
        expect(body.homeHeroBanners[0].title).toBe('Mega Sale');
        expect(body.homeHeroBanners[0].imagePath).toBe('/uploads/test-banner.jpg');
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

    it('should update a hero banner via PATCH with FormData', async () => {
        const formData = new FormData();
        // Update image
        const file = new File(['updated'], 'updated-banner.jpg', { type: 'image/jpeg' });
        formData.append('image', file);
        formData.append('title', 'Updated Sale');
        formData.append('description', 'Updated description');
        formData.append('price', '600');
        formData.append('offerPrice', '400');
        formData.append('offerLabel', '33% OFF');

        const req = new Request(`http://localhost/api/admin/settings/hero-banners/${createdBannerId}`, {
            method: 'PATCH',
            body: formData,
        });

        const res = await PATCH(req, { params: Promise.resolve({ id: createdBannerId }) });
        const body = await res.json();

        expect(res.status).toBe(200);
        const updatedBanner = body.homeHeroBanners.find((b: any) => b.id === createdBannerId);
        expect(updatedBanner.title).toBe('Updated Sale');
        expect(updatedBanner.imagePath).toBe('/uploads/test-banner.jpg');
    });

    it('should return 400 for invalid offer price on create', async () => {
        const formData = new FormData();
        formData.append('imagePath', '/images/hero.jpg');
        formData.append('title', 'Bad Sale');
        formData.append('description', 'Invalid pricing');
        formData.append('price', '100');
        formData.append('offerPrice', '150'); // Invalid: offer > price
        formData.append('offerLabel', 'INVALID');

        const req = new Request('http://localhost/api/admin/settings/hero-banners', {
            method: 'POST',
            body: formData,
        });

        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it('should return 400 for invalid offer price on update', async () => {
        const formData = new FormData();
        formData.append('imagePath', '/images/hero.jpg');
        formData.append('title', 'Bad Sale');
        formData.append('description', 'Invalid pricing');
        formData.append('price', '100');
        formData.append('offerPrice', '150'); // Invalid
        formData.append('offerLabel', 'INVALID');

        const req = new Request(`http://localhost/api/admin/settings/hero-banners/${createdBannerId}`, {
            method: 'PATCH',
            body: formData,
        });

        const res = await PATCH(req, { params: Promise.resolve({ id: createdBannerId }) });
        expect(res.status).toBe(400);
    });

    it('should return 400 for missing required fields on create', async () => {
        const formData = new FormData();
        formData.append('imagePath', '/images/hero.jpg');
        // Missing other required fields

        const req = new Request('http://localhost/api/admin/settings/hero-banners', {
            method: 'POST',
            body: formData,
        });

        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it('should return 404 when updating non-existent banner', async () => {
        const formData = new FormData();
        formData.append('imagePath', '/images/test.jpg');
        formData.append('title', 'Test');
        formData.append('description', 'Test');
        formData.append('price', '100');
        formData.append('offerPrice', '50');
        formData.append('offerLabel', 'TEST');

        const req = new Request('http://localhost/api/admin/settings/hero-banners/non-existent-id', {
            method: 'PATCH',
            body: formData,
        });

        const res = await PATCH(req, { params: Promise.resolve({ id: 'non-existent-id' }) });
        expect(res.status).toBe(404);
    });

    it('should delete a hero banner via DELETE', async () => {
        const req = new Request(`http://localhost/api/admin/settings/hero-banners/${createdBannerId}`, {
            method: 'DELETE',
        });

        const res = await DELETE(req, { params: Promise.resolve({ id: createdBannerId }) });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.homeHeroBanners.find((b: any) => b.id === createdBannerId)).toBeUndefined();
    });

    it('should persist settings across requests', async () => {
        // Create a new banner
        const formData = new FormData();
        formData.append('imagePath', '/images/persistent.jpg');
        formData.append('title', 'Persistent Sale');
        formData.append('description', 'This should persist');
        formData.append('price', '1000');
        formData.append('offerPrice', '800');
        formData.append('offerLabel', '20% OFF');

        const createReq = new Request('http://localhost/api/admin/settings/hero-banners', {
            method: 'POST',
            body: formData,
        });
        await POST(createReq);

        // Get settings
        const res = await GET();
        const body = await res.json();

        expect(body.homeHeroBanners).toHaveLength(1);
        expect(body.homeHeroBanners[0].title).toBe('Persistent Sale');
    });
});
