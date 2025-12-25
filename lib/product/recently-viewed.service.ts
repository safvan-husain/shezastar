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

/**
 * Merges guest recently viewed products into the user's account.
 * Prioritizes the most recent view if both exist.
 */
export async function mergeRecentlyViewed(sessionId: string, userId: string) {
    const collection = await getCollection<RecentlyViewedDocument>(COLLECTION);
    const userObjectId = new ObjectId(userId);

    // 1. Get all guest views
    const guestViews = await collection.find({ sessionId, userId: { $exists: false } }).toArray();
    if (guestViews.length === 0) return;

    // 2. Get all existing user views (to check for conflicts)
    const userViews = await collection.find({ userId: userObjectId }).toArray();
    const userViewMap = new Map(userViews.map(v => [v.productId.toString(), v]));

    for (const guestView of guestViews) {
        const productIdStr = guestView.productId.toString();
        const existingUserView = userViewMap.get(productIdStr);

        if (existingUserView) {
            // User already viewed this. Keep the one with later viewedAt.
            if (guestView.viewedAt > existingUserView.viewedAt) {
                await collection.updateOne(
                    { _id: existingUserView._id },
                    {
                        $set: {
                            viewedAt: guestView.viewedAt,
                            sessionId // Update session to current
                        }
                    }
                );
            }
            // Delete the duplicate guest view
            await collection.deleteOne({ _id: guestView._id });
        } else {
            // User hasn't viewed this. Transfer guest view to user.
            await collection.updateOne(
                { _id: guestView._id },
                {
                    $set: {
                        userId: userObjectId,
                        sessionId // Update session to current (optional but good consistency)
                    }
                }
            );
        }
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
