import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ObjectId } from 'mongodb';
import { createProduct, updateProduct } from './product.service';
import type { ProductDocument } from './model/product.model';

type ProductCollectionMock = {
    insertOne: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    updateOne: ReturnType<typeof vi.fn>;
};

const productState = vi.hoisted(() => ({
    current: null as ProductDocument | null,
    collection: null as ProductCollectionMock | null,
}));

vi.mock('@/lib/db/mongo-client', () => {
    return {
        ObjectId,
        getCollection: vi.fn(async () => {
            if (!productState.collection) {
                throw new Error('Collection mock not initialized');
            }
            return productState.collection;
        }),
    };
});

describe('product.service SEO persistence', () => {
    beforeEach(() => {
        productState.current = null;

        productState.collection = {
            insertOne: vi.fn(async (doc: Omit<ProductDocument, '_id'>) => {
                const _id = new ObjectId();
                productState.current = { ...doc, _id };
                return { insertedId: _id };
            }),
            findOne: vi.fn(async () => productState.current),
            updateOne: vi.fn(async (_filter: unknown, update: { $set: Partial<ProductDocument> }) => {
                if (productState.current) {
                    productState.current = {
                        ...productState.current,
                        ...update.$set,
                    };
                }
                return { matchedCount: 1, modifiedCount: 1 };
            }),
        };
    });

    it('persists metaTitle and metaDescription when creating products', async () => {
        const product = await createProduct({
            name: 'SEO Product',
            subtitle: 'Subtitle',
            description: '<p>Desc</p>',
            metaTitle: 'Custom SEO Title',
            metaDescription: 'Custom SEO Description',
            basePrice: 199,
            images: [{ id: 'img-1', url: '/images/p1.jpg', mappedVariants: [], order: 0 }],
            variants: [],
            subCategoryIds: [],
            variantStock: [],
            specifications: [],
        });

        expect(product.metaTitle).toBe('Custom SEO Title');
        expect(product.metaDescription).toBe('Custom SEO Description');
        expect(productState.current?.metaTitle).toBe('Custom SEO Title');
        expect(productState.current?.metaDescription).toBe('Custom SEO Description');
    });

    it('updates metaTitle and metaDescription fields', async () => {
        const existingId = new ObjectId();
        productState.current = {
            _id: existingId,
            name: 'Existing Product',
            subtitle: 'Old subtitle',
            description: '<p>Old description</p>',
            metaTitle: 'Old meta title',
            metaDescription: 'Old meta description',
            basePrice: 100,
            images: [{ id: 'img-1', url: '/images/p1.jpg', mappedVariants: [], order: 0 }],
            variants: [],
            subCategoryIds: [],
            installationService: undefined,
            variantStock: [],
            specifications: [],
            brandId: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const updated = await updateProduct(existingId.toString(), {
            metaTitle: null,
            metaDescription: 'Updated meta description',
        });

        expect(updated.metaTitle).toBeNull();
        expect(updated.metaDescription).toBe('Updated meta description');
        expect(productState.current?.metaTitle).toBeNull();
        expect(productState.current?.metaDescription).toBe('Updated meta description');
    });
});
