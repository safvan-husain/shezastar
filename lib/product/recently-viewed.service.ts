import { getCollection, ObjectId } from '@/lib/db/mongo-client';
import { RecentlyViewedDocument, RecentlyViewedInsert } from './model/recently-viewed.model';
import { ProductDocument, toProducts } from './model/product.model';

const COLLECTION = 'recentlyViewedProducts';
const LIMIT = 15;

export async function trackProductView(sessionId: string, productId: string, userId?: string) {
    const collection = await getCollection<RecentlyViewedDocument>(COLLECTION);
    const now = new Date();

    let prodId: ObjectId;
    try {
        prodId = new ObjectId(productId);
    } catch {
        return; // Don't track if invalid ID
    }

    // If userId is present, we identify the record by userId and productId (ignoring sessionId)
    // to avoid duplicates when user session changes but userId remains same.
    // If userId is not present, we identify by sessionId and productId.
    const query: any = { productId: prodId };
    if (userId) {
        query.userId = new ObjectId(userId);
    } else {
        query.sessionId = sessionId;
    }

    // Update viewedAt, sessionId, and ensure userId is set if logged in
    await collection.updateOne(
        query,
        {
            $set: {
                viewedAt: now,
                sessionId, // Always update to current session ID
                ...(userId ? { userId: new ObjectId(userId) } : {})
            }
        },
        { upsert: true }
    );

    // Clean up old entries beyond LIMIT
    const userQuery: any = userId ? { userId: new ObjectId(userId) } : { sessionId };
    const allViews = await collection.find(userQuery).sort({ viewedAt: -1 }).toArray();

    if (allViews.length > LIMIT) {
        const idsToDelete = allViews.slice(LIMIT).map(v => v._id);
        await collection.deleteMany({ _id: { $in: idsToDelete } });
    }
}

export async function getRecentlyViewedProducts(sessionId: string, userId?: string) {
    const collection = await getCollection<RecentlyViewedDocument>(COLLECTION);
    const userQuery: any = userId ? { userId: new ObjectId(userId) } : { sessionId };

    const recentViews = await collection
        .find(userQuery)
        .sort({ viewedAt: -1 })
        .limit(LIMIT)
        .toArray();

    if (recentViews.length === 0) {
        return [];
    }

    const productIds = recentViews.map(rv => rv.productId);
    const productCollection = await getCollection<ProductDocument>('products');

    // Fetch products and maintain order of recentViews
    const products = await productCollection
        .find({ _id: { $in: productIds } })
        .toArray();

    // Sort products based on productIds order (which is most recent first)
    const productMap = new Map(products.map(p => [p._id.toString(), p]));
    const orderedProducts = productIds
        .map(id => productMap.get(id.toString()))
        .filter((p): p is ProductDocument => !!p);

    return toProducts(orderedProducts);
}
