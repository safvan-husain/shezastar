import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ObjectId } from 'mongodb';
import { createProduct, updateProduct } from './product.service';
import type { ProductDocument } from './model/product.model';
import { AppError } from '@/lib/errors/app-error';

type ProductCollectionMock = {
    insertOne: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    updateOne: ReturnType<typeof vi.fn>;
};

const productState = vi.hoisted(() => ({
    current: null as ProductDocument | null,
    docs: [] as ProductDocument[],
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
        productState.docs = [];

        productState.collection = {
            insertOne: vi.fn(async (doc: Omit<ProductDocument, '_id'>) => {
                const _id = new ObjectId();
                productState.current = { ...doc, _id };
                productState.docs = [{ ...doc, _id }, ...productState.docs];
                return { insertedId: _id };
            }),
            findOne: vi.fn(async (filter?: Record<string, unknown>) => {
                if (!filter || Object.keys(filter).length === 0) {
                    return productState.current;
                }

                if (filter._id instanceof ObjectId) {
                    return productState.docs.find((doc) => doc._id.equals(filter._id)) ?? null;
                }

                if (
                    typeof filter.slug === 'string' &&
                    filter._id &&
                    typeof filter._id === 'object' &&
                    '$ne' in filter._id
                ) {
                    const excludedId = (filter._id as { $ne: ObjectId }).$ne;
                    return productState.docs.find((doc) => doc.slug === filter.slug && !doc._id.equals(excludedId)) ?? null;
                }

                if (typeof filter.slug === 'string') {
                    return productState.docs.find((doc) => doc.slug === filter.slug) ?? null;
                }

                return productState.current;
            }),
            updateOne: vi.fn(async (_filter: unknown, update: { $set: Partial<ProductDocument> }) => {
                if (productState.current && '_id' in (_filter as Record<string, unknown>) && (_filter as { _id: ObjectId })._id) {
                    const targetId = (_filter as { _id: ObjectId })._id;
                    productState.docs = productState.docs.map((doc) => (
                        doc._id.equals(targetId)
                            ? { ...doc, ...update.$set }
                            : doc
                    ));
                    productState.current = productState.docs.find((doc) => doc._id.equals(targetId)) ?? productState.current;
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
        expect(product.slug).toBe('seo-product');
        expect(productState.current?.metaTitle).toBe('Custom SEO Title');
        expect(productState.current?.metaDescription).toBe('Custom SEO Description');
        expect(productState.current?.slug).toBe('seo-product');
    });

    it('preserves a manually provided slug on create', async () => {
        const product = await createProduct({
            name: 'Reverse Camera',
            slug: 'custom-camera-slug',
            subtitle: 'Subtitle',
            description: '<p>Desc</p>',
            metaTitle: null,
            metaDescription: null,
            basePrice: 250,
            images: [{ id: 'img-1', url: '/images/p1.jpg', mappedVariants: [], order: 0 }],
            variants: [],
            subCategoryIds: [],
            variantStock: [],
            specifications: [],
        });

        expect(product.slug).toBe('custom-camera-slug');
    });

    it('rejects a duplicate manual slug', async () => {
        productState.docs = [{
            _id: new ObjectId(),
            name: 'Existing',
            slug: 'taken-slug',
            subtitle: null,
            description: null,
            metaTitle: null,
            metaDescription: null,
            basePrice: 100,
            images: [],
            variants: [],
            subCategoryIds: [],
            installationService: undefined,
            variantStock: [],
            specifications: [],
            brandId: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
        }];

        await expect(createProduct({
            name: 'Another Camera',
            slug: 'taken-slug',
            subtitle: 'Subtitle',
            description: '<p>Desc</p>',
            metaTitle: null,
            metaDescription: null,
            basePrice: 250,
            images: [{ id: 'img-1', url: '/images/p1.jpg', mappedVariants: [], order: 0 }],
            variants: [],
            subCategoryIds: [],
            variantStock: [],
            specifications: [],
        })).rejects.toMatchObject({
            code: 'PRODUCT_SLUG_ALREADY_EXISTS',
        } satisfies Partial<AppError>);
    });

    it('rejects manual slugs that look like Mongo object ids', async () => {
        await expect(createProduct({
            name: 'Another Camera',
            slug: '507f1f77bcf86cd799439011',
            subtitle: 'Subtitle',
            description: '<p>Desc</p>',
            metaTitle: null,
            metaDescription: null,
            basePrice: 250,
            images: [{ id: 'img-1', url: '/images/p1.jpg', mappedVariants: [], order: 0 }],
            variants: [],
            subCategoryIds: [],
            variantStock: [],
            specifications: [],
        })).rejects.toMatchObject({
            code: 'INVALID_PRODUCT_SLUG',
        } satisfies Partial<AppError>);
    });

    it('updates metaTitle and metaDescription fields', async () => {
        const existingId = new ObjectId();
        productState.current = {
            _id: existingId,
            name: 'Existing Product',
            slug: 'existing-product',
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
        productState.docs = [productState.current];

        const updated = await updateProduct(existingId.toString(), {
            metaTitle: null,
            metaDescription: 'Updated meta description',
        });

        expect(updated.metaTitle).toBeNull();
        expect(updated.metaDescription).toBe('Updated meta description');
        expect(productState.current?.metaTitle).toBeNull();
        expect(productState.current?.metaDescription).toBe('Updated meta description');
        expect(updated.slug).toBe('existing-product');
    });

    it('keeps the existing slug stable when the name changes and slugUpdateMode is keep', async () => {
        const existingId = new ObjectId();
        productState.current = {
            _id: existingId,
            name: 'Old Name',
            slug: 'old-name',
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
        productState.docs = [productState.current];

        const updated = await updateProduct(existingId.toString(), {
            name: 'New Name',
            slugUpdateMode: 'keep',
        });

        expect(updated.slug).toBe('old-name');
    });

    it('regenerates the slug when requested after a name change', async () => {
        const existingId = new ObjectId();
        productState.current = {
            _id: existingId,
            name: 'Old Name',
            slug: 'old-name',
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
        productState.docs = [productState.current];

        const updated = await updateProduct(existingId.toString(), {
            name: 'Rear Camera Plus',
            slugUpdateMode: 'regenerate',
        });

        expect(updated.slug).toBe('rear-camera-plus');
    });
});
