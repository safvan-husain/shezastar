import { beforeAll, afterAll, describe, it, expect, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/admin/settings/featured-products/route';
import { DELETE } from '@/app/api/admin/settings/featured-products/[id]/route';
import { clear } from '../test-db';
import { createProduct } from '@/lib/product/product.service';

describe('Featured Products API Integration', () => {
    let productId1: string;
    let productId2: string;
    let productId3: string;

    beforeAll(async () => {
        await clear();
    });

    afterAll(async () => {
        await clear();
    });

    beforeEach(async () => {
        // Clear database before each test
        await clear();

        // Create test products
        const product1 = await createProduct({
            name: 'Featured Product 1',
            description: 'First featured product',
            basePrice: 100,
            offerPercentage: 20,
            images: [],
            variants: [],
            subCategoryIds: [],
            variantStock: [],
            specifications: [],
        });
        productId1 = product1.id;

        const product2 = await createProduct({
            name: 'Featured Product 2',
            description: 'Second featured product',
            basePrice: 200,
            images: [],
            variants: [],
            subCategoryIds: [],
            variantStock: [],
            specifications: [],
        });
        productId2 = product2.id;

        const product3 = await createProduct({
            name: 'Featured Product 3',
            description: 'Third featured product',
            basePrice: 300,
            offerPercentage: 16.67,
            images: [],
            variants: [],
            subCategoryIds: [],
            variantStock: [],
            specifications: [],
        });
        productId3 = product3.id;
    });

    it('should return empty array initially via GET', async () => {
        const res = await GET();
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toEqual([]);
    });

    it('should add a product to featured list via POST', async () => {
        const payload = { productId: productId1 };

        const req = new Request('http://localhost/api/admin/settings/featured-products', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        const res = await POST(req);
        const body = await res.json();

        expect(res.status).toBe(201);
        expect(body.featuredProductIds).toContain(productId1);
        expect(body.featuredProductIds).toHaveLength(1);
    });

    it('should return error for invalid product ID', async () => {
        const payload = { productId: '507f1f77bcf86cd799439011' }; // Valid ObjectId format but non-existent

        const req = new Request('http://localhost/api/admin/settings/featured-products', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        const res = await POST(req);
        expect(res.status).toBe(404);
    });

    it('should return error for duplicate product', async () => {
        // Add product first time
        const payload = { productId: productId1 };
        const req1 = new Request('http://localhost/api/admin/settings/featured-products', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        await POST(req1);

        // Try to add same product again
        const req2 = new Request('http://localhost/api/admin/settings/featured-products', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        const res = await POST(req2);

        expect(res.status).toBe(400);
        const body = await res.json();
        console.log('----------------')
        console.log(body);
        console.log('----------------')
        expect(body.code).toBe('PRODUCT_ALREADY_FEATURED');
    });

    it('should return populated product objects via GET', async () => {
        // Add two products to featured list
        const req1 = new Request('http://localhost/api/admin/settings/featured-products', {
            method: 'POST',
            body: JSON.stringify({ productId: productId1 }),
        });
        await POST(req1);

        const req2 = new Request('http://localhost/api/admin/settings/featured-products', {
            method: 'POST',
            body: JSON.stringify({ productId: productId2 }),
        });
        await POST(req2);

        // Get featured products
        const res = await GET();
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toHaveLength(2);

        // Verify products are fully populated
        const product1 = body.find((p: any) => p.id === productId1);
        const product2 = body.find((p: any) => p.id === productId2);

        expect(product1).toBeDefined();
        expect(product1.name).toBe('Featured Product 1');
        expect(product1.basePrice).toBe(100);
        expect(product1.offerPercentage).toBe(20);

        expect(product2).toBeDefined();
        expect(product2.name).toBe('Featured Product 2');
        expect(product2.basePrice).toBe(200);
    });

    it('should remove a product from featured list via DELETE', async () => {
        // Add product first
        const addReq = new Request('http://localhost/api/admin/settings/featured-products', {
            method: 'POST',
            body: JSON.stringify({ productId: productId1 }),
        });
        await POST(addReq);

        // Remove product
        const deleteReq = new Request(`http://localhost/api/admin/settings/featured-products/${productId1}`, {
            method: 'DELETE',
        });
        const res = await DELETE(deleteReq, { params: Promise.resolve({ id: productId1 }) });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.featuredProductIds).not.toContain(productId1);
    });

    it('should be idempotent when removing non-existent product', async () => {
        const req = new Request(`http://localhost/api/admin/settings/featured-products/${productId1}`, {
            method: 'DELETE',
        });
        const res = await DELETE(req, { params: Promise.resolve({ id: productId1 }) });

        expect(res.status).toBe(200);
        // Should not throw error
    });

    it('should filter out deleted products from GET response', async () => {
        // Add three products
        const req1 = new Request('http://localhost/api/admin/settings/featured-products', {
            method: 'POST',
            body: JSON.stringify({ productId: productId1 }),
        });
        await POST(req1);

        const req2 = new Request('http://localhost/api/admin/settings/featured-products', {
            method: 'POST',
            body: JSON.stringify({ productId: productId2 }),
        });
        await POST(req2);

        const req3 = new Request('http://localhost/api/admin/settings/featured-products', {
            method: 'POST',
            body: JSON.stringify({ productId: productId3 }),
        });
        await POST(req3);

        // Delete product2 from database (not from featured list)
        const { deleteProduct } = await import('@/lib/product/product.service');
        await deleteProduct(productId2);

        // Get featured products
        const res = await GET();
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toHaveLength(2); // Should only return 2 products

        const ids = body.map((p: any) => p.id);
        expect(ids).toContain(productId1);
        expect(ids).toContain(productId3);
        expect(ids).not.toContain(productId2); // Deleted product filtered out
    });

    it('should maintain order of featured products', async () => {
        // Add products in specific order
        const req1 = new Request('http://localhost/api/admin/settings/featured-products', {
            method: 'POST',
            body: JSON.stringify({ productId: productId1 }),
        });
        await POST(req1);

        const req2 = new Request('http://localhost/api/admin/settings/featured-products', {
            method: 'POST',
            body: JSON.stringify({ productId: productId2 }),
        });
        await POST(req2);

        const req3 = new Request('http://localhost/api/admin/settings/featured-products', {
            method: 'POST',
            body: JSON.stringify({ productId: productId3 }),
        });
        await POST(req3);

        // Get featured products
        const res = await GET();
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toHaveLength(3);

        // Verify order is maintained
        expect(body[0].id).toBe(productId1);
        expect(body[1].id).toBe(productId2);
        expect(body[2].id).toBe(productId3);
    });

    it('should return 400 for missing productId in POST', async () => {
        const req = new Request('http://localhost/api/admin/settings/featured-products', {
            method: 'POST',
            body: JSON.stringify({}),
        });

        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it('should return 400 for invalid productId format', async () => {
        const payload = { productId: 'invalid-id' };

        const req = new Request('http://localhost/api/admin/settings/featured-products', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        const res = await POST(req);
        expect(res.status).toBe(400);
    });
});
