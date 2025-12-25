import { describe, it, expect, beforeEach } from 'vitest';
import { trackProductView, getRecentlyViewedProducts, mergeRecentlyViewed } from '@/lib/product/recently-viewed.service';
import { getCollection, ObjectId } from '@/lib/db/mongo-client';

describe('Recently Viewed Service', () => {
    beforeEach(async () => {
        const collection = await getCollection('recentlyViewedProducts');
        await collection.deleteMany({});
        const products = await getCollection('products');
        await products.deleteMany({});
    });

    it('should reproduce duplicates when sessionId changes for logged in user (Fix Verification)', async () => {
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
        // We expect 1
        expect(products.length).toBe(1);
    });

    it('should merge guest views into user views upon login without creating duplicates', async () => {
        const userId = new ObjectId().toString();
        const sessionId = 'session-guest';
        
        const product1IdObj = new ObjectId();
        const product2IdObj = new ObjectId();
        
        const productsCol = await getCollection('products');
        await productsCol.insertMany([
            {
                _id: product1IdObj,
                name: 'Product 1',
                basePrice: 100,
                images: [],
                variants: [],
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                _id: product2IdObj,
                name: 'Product 2',
                basePrice: 200,
                images: [],
                variants: [],
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ]);

        const product1Id = product1IdObj.toString();
        const product2Id = product2IdObj.toString();

        // 1. User visited Product 1 a long time ago (as user)
        // Manually insert old record to simulate past view
        const collection = await getCollection('recentlyViewedProducts');
        await collection.insertOne({
            productId: product1IdObj,
            userId: new ObjectId(userId),
            sessionId: 'old-session',
            viewedAt: new Date(Date.now() - 100000)
        });

        // 2. User visits Product 1 and Product 2 as guest
        await trackProductView(sessionId, product1Id); // No userId
        await trackProductView(sessionId, product2Id); // No userId

        // 3. Merge
        await mergeRecentlyViewed(sessionId, userId);

        // 4. Verify results
        const products = await getRecentlyViewedProducts(sessionId, userId);
        
        // Should have 2 items (P1, P2)
        expect(products.length).toBe(2);
        
        // P1 should be updated to recent time (from guest view)
        // P2 should be assigned to user
        
        // Verify duplicates check by checking raw collection
        const rawDocs = await collection.find({ userId: new ObjectId(userId) }).toArray();
        expect(rawDocs.length).toBe(2);

        // Verify P1 view time is recent (approx now)
        const p1Doc = rawDocs.find(d => d.productId.toString() === product1Id);
        const p2Doc = rawDocs.find(d => d.productId.toString() === product2Id);
        
        expect(p1Doc).toBeDefined();
        expect(p2Doc).toBeDefined();

        // Check if P1 viewedAt is recent (greater than the old date)
        expect(p1Doc!.viewedAt.getTime()).toBeGreaterThan(Date.now() - 50000);
    });
});
