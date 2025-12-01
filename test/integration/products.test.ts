import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { GET as getProducts, POST as createProduct } from '@/app/api/products/route';
import { GET as getProduct, PUT as updateProduct, DELETE as deleteProduct } from '@/app/api/products/[id]/route';
import { clear } from '../test-db';
import { addSubCategory, addSubSubCategory, createCategory } from '@/lib/category/category.service';
import { createProduct as createProductService } from '@/lib/product/product.service';

describe('Products API Integration', () => {
    let createdProductId: string;

    beforeAll(async () => {
        await clear();
    });

    it('should create a new product', async () => {
        const productData = {
            name: 'Integration Test Product',
            description: 'A product created during integration tests',
            basePrice: 99.99,
            offerPrice: 89.99,
            images: [],
            variants: []
        };

        const req = new Request('http://localhost/api/products', {
            method: 'POST',
            body: JSON.stringify(productData),
        });

        const res = await createProduct(req);
        const body = await res.json();

        expect(res.status).toBe(201);
        expect(body).toMatchObject({
            name: productData.name,
            basePrice: productData.basePrice,
        });
        expect(body.id).toBeDefined();
        createdProductId = body.id;
    });

    it('should get all products', async () => {
        const req = new Request('http://localhost/api/products?page=1&limit=10');
        const res = await getProducts(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(Array.isArray(body.products)).toBe(true);
        expect(body.products.length).toBeGreaterThan(0);
        const found = body.products.find((p: any) => p.id === createdProductId);
        expect(found).toBeDefined();
    });

    it('should get a single product by id', async () => {
        const req = new Request(`http://localhost/api/products/${createdProductId}`);
        const params = Promise.resolve({ id: createdProductId });
        const res = await getProduct(req, { params });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.id).toBe(createdProductId);
        expect(body.name).toBe('Integration Test Product');
    });

    it('should update a product', async () => {
        const updateData = {
            name: 'Updated Product Name',
            basePrice: 150.00
        };

        const req = new Request(`http://localhost/api/products/${createdProductId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData),
        });
        const params = Promise.resolve({ id: createdProductId });
        const res = await updateProduct(req, { params });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.name).toBe(updateData.name);
        expect(body.basePrice).toBe(updateData.basePrice);
    });

    it('should delete a product', async () => {
        const req = new Request(`http://localhost/api/products/${createdProductId}`, {
            method: 'DELETE',
        });
        const params = Promise.resolve({ id: createdProductId });
        const res = await deleteProduct(req, { params });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
    });

    it('should return 404 for deleted product', async () => {
        const req = new Request(`http://localhost/api/products/${createdProductId}`);
        const params = Promise.resolve({ id: createdProductId });
        const res = await getProduct(req, { params });

        expect(res.status).toBe(404);
    });
});

describe('Products API Integration - Category filtering', () => {
    let categorySlug: string;
    let subCategorySlug: string;
    let subSubCategorySlug: string;

    beforeAll(async () => {
        await clear();
        const category = await createCategory({ name: 'Filter Integration Root', subCategories: [] });
        categorySlug = category.slug;

        const withSub = await addSubCategory(category.id, { name: 'Filter Integration Child' });
        const subCategory = withSub.subCategories[0];
        subCategorySlug = subCategory.slug;

        const withSubSub = await addSubSubCategory(category.id, subCategory.id, { name: 'Filter Integration Leaf' });
        const refreshedSub = withSubSub.subCategories.find(sub => sub.id === subCategory.id);
        if (!refreshedSub || refreshedSub.subSubCategories.length === 0) {
            throw new Error('Failed to create integration sub-subcategory');
        }

        subSubCategorySlug = refreshedSub.subSubCategories[0].slug;

        await createProductService({
            name: 'Integration Parent Product',
            basePrice: 25,
            images: [],
            variants: [],
            subCategoryIds: [subCategory.id],
        });

        await createProductService({
            name: 'Integration Leaf Product',
            basePrice: 30,
            images: [],
            variants: [],
            subCategoryIds: [refreshedSub.subSubCategories[0].id],
        });
    });

    afterAll(async () => {
        await clear();
    });

    it('returns full hierarchy products when filtering by parent slug', async () => {
        const req = new Request(`http://localhost/api/products?categoryId=${categorySlug}&limit=10`);
        const res = await getProducts(req);
        const body = await res.json();

        const names = body.products.map((product: any) => product.name);
        expect(names).toContain('Integration Parent Product');
        expect(names).toContain('Integration Leaf Product');
    });

    it('scopes results to leaf when filtering by sub-subcategory slug', async () => {
        const req = new Request(
            `http://localhost/api/products?categoryId=${subSubCategorySlug}&limit=10`
        );
        const res = await getProducts(req);
        const body = await res.json();

        const names = body.products.map((product: any) => product.name);
        expect(names).toContain('Integration Leaf Product');
        expect(names).not.toContain('Integration Parent Product');
    });
});
