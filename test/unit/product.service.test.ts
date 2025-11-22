import { describe, it, expect, vi } from 'vitest';
import { createProduct, getProduct, updateProduct, deleteProduct } from '@/lib/product/product.service';
import { AppError } from '@/lib/errors/app-error';

// Mock file upload utils
vi.mock('@/lib/utils/file-upload', () => ({
    deleteImages: vi.fn().mockResolvedValue(undefined),
}));

describe('Product Service Unit Tests', () => {
    let createdProductId: string;

    it('should create a product', async () => {
        const input = {
            name: 'Unit Test Product',
            description: 'Description',
            basePrice: 100,
            images: [],
            variants: []
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
            variants: []
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
