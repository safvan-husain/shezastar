import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import {
    createProduct,
    getProduct,
    updateProduct,
    deleteProduct,
    getAllProducts,
} from '@/lib/product/product.service';
import { AppError } from '@/lib/errors/app-error';
import { clear } from '../test-db';
import { addSubCategory, addSubSubCategory, createCategory } from '@/lib/category/category.service';

// Mock file upload utils
vi.mock('@/lib/utils/file-upload', () => ({
    deleteImages: vi.fn().mockResolvedValue(undefined),
}));

describe('Product Service Unit Tests', () => {
    let createdProductId: string;

    beforeAll(async () => {
        await clear();
    });

    it('should create a product', async () => {
        const input = {
            name: 'Unit Test Product',
            description: 'Description',
            basePrice: 100,
            images: [],
            variants: [],
            subCategoryIds: []
        };

        const result = await createProduct(input);
        expect(result.name).toBe(input.name);
        expect(result.basePrice).toBe(input.basePrice);
        expect(result.id).toBeDefined();
        createdProductId = result.id;
    });

    it('should throw error if offer price >= base price', async () => {
        const input = {
            name: 'Invalid Price Product',
            basePrice: 100,
            offerPrice: 100,
            images: [],
            variants: [],
            subCategoryIds: []
        };

        await expect(createProduct(input)).rejects.toThrow(AppError);
    });

    it('should get product by id', async () => {
        const result = await getProduct(createdProductId);
        expect(result.id).toBe(createdProductId);
        expect(result.name).toBe('Unit Test Product');
    });

    it('should throw 404 for non-existent product', async () => {
        const fakeId = '000000000000000000000000';
        await expect(getProduct(fakeId)).rejects.toThrow('PRODUCT_NOT_FOUND');
    });

    it('should update product', async () => {
        const update = {
            name: 'Updated Name',
            basePrice: 200
        };

        const result = await updateProduct(createdProductId, update);
        expect(result.name).toBe(update.name);
        expect(result.basePrice).toBe(update.basePrice);
    });

    it('should delete product', async () => {
        const result = await deleteProduct(createdProductId);
        expect(result.success).toBe(true);
    });
});

describe('Product Service - Category filtering', () => {
    let categoryId: string;
    let categorySlug: string;
    let subCategoryId: string;
    let subCategorySlug: string;
    let subSubCategoryId: string;
    let subSubCategorySlug: string;

    beforeAll(async () => {
        await clear();

        const category = await createCategory({ name: 'Filter Parent', subCategories: [] });
        categoryId = category.id;
        categorySlug = category.slug;

        const withSubCategory = await addSubCategory(categoryId, { name: 'Filter Child' });
        subCategoryId = withSubCategory.subCategories[0].id;
        subCategorySlug = withSubCategory.subCategories[0].slug;

        const withSubSubCategory = await addSubSubCategory(categoryId, subCategoryId, { name: 'Filter Leaf' });
        const subCategory = withSubSubCategory.subCategories.find(sub => sub.id === subCategoryId);
        subSubCategoryId = subCategory?.subSubCategories[0]?.id as string;
        subSubCategorySlug = subCategory?.subSubCategories[0]?.slug as string;
        if (!subSubCategoryId) {
            throw new Error('Failed to create sub-subcategory for filtering tests');
        }

        await createProduct({
            name: 'Parent scoped product',
            basePrice: 50,
            images: [],
            variants: [],
            subCategoryIds: [subCategoryId],
        });

        await createProduct({
            name: 'Leaf scoped product',
            basePrice: 60,
            images: [],
            variants: [],
            subCategoryIds: [subSubCategoryId],
        });

        await createProduct({
            name: 'Outside category product',
            basePrice: 70,
            images: [],
            variants: [],
            subCategoryIds: ['other-category'],
        });
    });

    afterAll(async () => {
        await clear();
    });

    it('filters by parent category slug including all descendants', async () => {
        const result = await getAllProducts(1, 20, categorySlug);
        const names = result.products.map(p => p.name);
        expect(names).toContain('Parent scoped product');
        expect(names).toContain('Leaf scoped product');
        expect(names).not.toContain('Outside category product');
    });

    it('filters by subcategory slug including its sub-subcategories', async () => {
        const result = await getAllProducts(1, 20, subCategorySlug);
        const names = result.products.map(p => p.name);
        expect(names).toContain('Parent scoped product');
        expect(names).toContain('Leaf scoped product');
        expect(names).not.toContain('Outside category product');
    });

    it('filters by sub-subcategory slug directly', async () => {
        const result = await getAllProducts(1, 20, subSubCategorySlug);
        const names = result.products.map(p => p.name);
        expect(names).toContain('Leaf scoped product');
        expect(names).not.toContain('Parent scoped product');
        expect(names).not.toContain('Outside category product');
    });
});
