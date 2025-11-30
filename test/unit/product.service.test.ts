import { describe, it, expect, vi } from 'vitest';
import { createProduct, getProductById, updateProduct, deleteProduct } from '@/lib/services/product.service';
import { AppError } from '@/lib/errors/app-error';

// Mock file upload utils
vi.mock('@/lib/utils/file-upload', () => ({
    deleteImages: vi.fn().mockResolvedValue(undefined),
}));

describe('Product Service Unit Tests', () => {
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
        const created = await createProduct({
            name: 'Fetchable Product',
            description: 'Description',
            basePrice: 150,
            images: [],
            variants: []
        });

        const result = await getProductById(created.id);
        expect(result.id).toBe(created.id);
        expect(result.name).toBe('Fetchable Product');
    });

    it('should throw 404 for non-existent product', async () => {
        const fakeId = '000000000000000000000000';
        await expect(getProductById(fakeId)).rejects.toThrow('PRODUCT_NOT_FOUND');
    });

    it('should update product', async () => {
        const created = await createProduct({
            name: 'Product To Update',
            description: 'Description',
            basePrice: 100,
            images: [],
            variants: []
        });

        const update = {
            name: 'Updated Name',
            basePrice: 200
        };

        const result = await updateProduct(created.id, update);
        expect(result.name).toBe(update.name);
        expect(result.basePrice).toBe(update.basePrice);
    });

    it('should delete product', async () => {
        const created = await createProduct({
            name: 'Product To Delete',
            basePrice: 80,
            images: [],
            variants: []
        });

        const result = await deleteProduct(created.id);
        expect(result.success).toBe(true);
    });
});
