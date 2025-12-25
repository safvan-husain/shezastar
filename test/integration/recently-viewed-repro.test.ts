import { describe, it, expect, beforeEach } from 'vitest';
import { trackProductView, getRecentlyViewedProducts } from '@/lib/product/recently-viewed.service';
import { getCollection, ObjectId } from '@/lib/db/mongo-client';

describe('Recently Viewed Service', () => {
    beforeEach(async () => {
        const collection = await getCollection('recentlyViewedProducts');
        await collection.deleteMany({});
        const products = await getCollection('products');
        await products.deleteMany({});
    });

    it('should reproduce duplicates when sessionId changes for logged in user', async () => {
        const userId = new ObjectId().toString();
        const productIdObj = new ObjectId();
        const productId = productIdObj.toString();
        const sessionId1 = 'session-1';
        const sessionId2 = 'session-2';

        // Insert a product so getRecentlyViewedProducts can return it
        const productsCol = await getCollection('products');
        await productsCol.insertOne({
            _id: productIdObj,
            name: 'Test Product',
            basePrice: 100,
            images: [],
            variants: [],
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // 1. User visits product with session 1
        await trackProductView(sessionId1, productId, userId);

        // 2. User visits product with session 2
        await trackProductView(sessionId2, productId, userId);

        // 3. Get recently viewed products
        // Note: getRecentlyViewedProducts converts documents to Products.
        const products = await getRecentlyViewedProducts(sessionId2, userId);

        // If duplicate issue exists, length will be 2
        // We now expect 1
        expect(products.length).toBe(1);
    });
});
