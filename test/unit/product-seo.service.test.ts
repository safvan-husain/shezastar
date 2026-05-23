import { describe, expect, it } from 'vitest';
import { ObjectId } from 'mongodb';
import { updateProductSeo } from '@/lib/product/product.service';
import { updateCategorySeo } from '@/lib/category/category.service';
import { createCategory } from '@/lib/category/category.service';
import { clear, connectToDatabase } from '../test-db';

describe('SEO service updates', () => {
    it('updates only product SEO fields', async () => {
        await clear();

        const { db } = await connectToDatabase();
        const productId = new ObjectId();
        await db.collection('products').insertOne({
            _id: productId,
            name: 'Original Product',
            basePrice: 250,
            images: [],
            variants: [],
            variantStock: [],
            specifications: [],
            subCategoryIds: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await updateProductSeo(productId.toString(), {
            metaTitle: 'Product SEO Title',
            metaDescription: 'Product SEO Description',
        });

        const updated = await db.collection('products').findOne({ _id: productId });
        expect(updated?.metaTitle).toBe('Product SEO Title');
        expect(updated?.metaDescription).toBe('Product SEO Description');
        expect(updated?.name).toBe('Original Product');
        expect(updated?.basePrice).toBe(250);
    });

    it('updates only category SEO fields', async () => {
        await clear();

        const category = await createCategory({
            name: 'Original Category',
            subCategories: [],
        });

        await updateCategorySeo(category.id, {
            metaTitle: 'Category SEO Title',
            metaDescription: 'Category SEO Description',
            imagePath: '/uploads/category-seo.jpg',
        });

        const { db } = await connectToDatabase();
        const updated = await db.collection('categories').findOne({ _id: new ObjectId(category.id) });
        expect(updated?.metaTitle).toBe('Category SEO Title');
        expect(updated?.metaDescription).toBe('Category SEO Description');
        expect(updated?.imagePath).toBe('/uploads/category-seo.jpg');
        expect(updated?.name).toBe('Original Category');
    });
});
