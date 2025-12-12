// lib/wishlist/wishlist.service.ts
import 'server-only';

import { getCollection, ObjectId } from '@/lib/db/mongo-client';
import { AppError } from '@/lib/errors/app-error';
import { getProduct } from '@/lib/product/product.service';
import { getStorefrontSessionId, getStorefrontSession, ensureStorefrontSession } from '@/lib/storefront-session';
import { StorefrontSession } from '@/lib/storefront-session/model/storefront-session.model';
import {
    Wishlist,
    WishlistDocument,
    WishlistItemDocument,
    toWishlist,
} from './model/wishlist.model';
import {
    AddToWishlistInput,
    RemoveFromWishlistInput,
} from './wishlist.schema';

const COLLECTION = 'storefrontWishlists';

let indexesEnsured = false;

async function getWishlistCollection() {
    const collection = await getCollection<WishlistDocument>(COLLECTION);
    if (!indexesEnsured) {
        await Promise.all([
            collection.createIndex({ sessionId: 1 }, { unique: true }),
            collection.createIndex({ userId: 1 }),
        ]);
        indexesEnsured = true;
    }
    return collection;
}

function normalizeVariantItemIds(ids: string[]): string[] {
    const unique = Array.from(new Set(ids.filter(Boolean)));
    unique.sort();
    return unique;
}

function buildEmptyWishlistDocument(sessionId: string, userId?: string): Omit<WishlistDocument, '_id'> {
    const now = new Date();
    const doc: any = {
        sessionId,
        items: [],
        createdAt: now,
        updatedAt: now,
    };
    if (userId) {
        doc.userId = new ObjectId(userId);
    }
    return doc;
}

export async function getWishlist(session: StorefrontSession): Promise<Wishlist | null> {
    const collection = await getWishlistCollection();
    if (session.userId) {
        const userList = await collection.findOne({ userId: new ObjectId(session.userId) });
        if (userList) return toWishlist(userList);
    }
    const doc = await collection.findOne({ sessionId: session.sessionId });
    return doc ? toWishlist(doc) : null;
}

/**
 * @deprecated Use getWishlist(session)
 */
export async function getWishlistBySessionId(sessionId: string): Promise<Wishlist | null> {
    const collection = await getWishlistCollection();
    const doc = await collection.findOne({ sessionId });
    return doc ? toWishlist(doc) : null;
}

export async function ensureWishlist(session: StorefrontSession): Promise<Wishlist> {
    const collection = await getWishlistCollection();

    if (session.userId) {
        const userList = await collection.findOne({ userId: new ObjectId(session.userId) });
        if (userList) return toWishlist(userList);
    }

    const existing = await collection.findOne({ sessionId: session.sessionId });
    if (existing) {
        return toWishlist(existing);
    }

    const doc = buildEmptyWishlistDocument(session.sessionId, session.userId);
    const result = await collection.insertOne(doc as WishlistDocument);
    const created = await collection.findOne({ _id: result.insertedId });
    if (!created) {
        throw new AppError(500, 'WISHLIST_CREATE_FAILED');
    }
    return toWishlist(created);
}

// Internal helper using session object
async function getOrCreateWishlistDocument(session: StorefrontSession): Promise<WishlistDocument> {
    const collection = await getWishlistCollection();

    if (session.userId) {
        const userList = await collection.findOne({ userId: new ObjectId(session.userId) });
        if (userList) return userList;
    }

    const existing = await collection.findOne({ sessionId: session.sessionId });
    if (existing) {
        return existing;
    }

    const doc = buildEmptyWishlistDocument(session.sessionId, session.userId);
    const result = await collection.insertOne(doc as WishlistDocument);
    const created = await collection.findOne({ _id: result.insertedId });
    if (!created) {
        throw new AppError(500, 'WISHLIST_CREATE_FAILED');
    }
    return created;
}

export async function addItemToWishlist(params: AddToWishlistInput & { session: StorefrontSession }): Promise<Wishlist> {
    const { session, productId, selectedVariantItemIds: inputVariantIds } = params;
    const selectedVariantItemIds = normalizeVariantItemIds(inputVariantIds || []);

    // Ensure product exists
    await getProduct(productId);

    const collection = await getWishlistCollection();
    const doc = await getOrCreateWishlistDocument(session);

    const now = new Date();
    const items: WishlistItemDocument[] = doc.items.map(item => ({
        ...item,
        selectedVariantItemIds: normalizeVariantItemIds(item.selectedVariantItemIds || []),
    }));

    const existingIndex = items.findIndex(item => {
        if (item.productId !== productId) return false;
        const normalizedExisting = normalizeVariantItemIds(item.selectedVariantItemIds || []);
        if (normalizedExisting.length !== selectedVariantItemIds.length) return false;
        return normalizedExisting.every((id, index) => id === selectedVariantItemIds[index]);
    });

    if (existingIndex === -1) {
        items.push({
            productId,
            selectedVariantItemIds,
            createdAt: now,
        });
    }

    await collection.updateOne(
        { _id: doc._id },
        {
            $set: {
                items,
                updatedAt: now,
            },
        }
    );

    const updated = await collection.findOne({ _id: doc._id });
    if (!updated) {
        throw new AppError(500, 'WISHLIST_UPDATE_FAILED');
    }

    return toWishlist(updated);
}

export async function removeItemFromWishlist(params: RemoveFromWishlistInput & { session: StorefrontSession }): Promise<Wishlist> {
    const { session, productId, selectedVariantItemIds: inputVariantIds } = params;
    const selectedVariantItemIds = normalizeVariantItemIds(inputVariantIds || []);

    const collection = await getWishlistCollection();
    const doc = await getOrCreateWishlistDocument(session);

    const items: WishlistItemDocument[] = doc.items.map(item => ({
        ...item,
        selectedVariantItemIds: normalizeVariantItemIds(item.selectedVariantItemIds || []),
    }));

    const filteredItems = items.filter(item => {
        if (item.productId !== productId) return true;
        const normalizedExisting = normalizeVariantItemIds(item.selectedVariantItemIds || []);
        if (normalizedExisting.length !== selectedVariantItemIds.length) return true;
        const isSame =
            normalizedExisting.length === selectedVariantItemIds.length &&
            normalizedExisting.every((id, index) => id === selectedVariantItemIds[index]);
        return !isSame;
    });

    const now = new Date();

    await collection.updateOne(
        { _id: doc._id },
        {
            $set: {
                items: filteredItems,
                updatedAt: now,
            },
        }
    );

    const updated = await collection.findOne({ _id: doc._id });
    if (!updated) {
        throw new AppError(500, 'WISHLIST_UPDATE_FAILED');
    }

    return toWishlist(updated);
}

export async function clearWishlist(session: StorefrontSession): Promise<Wishlist> {
    const collection = await getWishlistCollection();
    const doc = await getOrCreateWishlistDocument(session);

    const now = new Date();

    await collection.updateOne(
        { _id: doc._id },
        {
            $set: {
                items: [],
                updatedAt: now,
            },
        }
    );

    const updated = await collection.findOne({ _id: doc._id });
    if (!updated) {
        throw new AppError(500, 'WISHLIST_UPDATE_FAILED');
    }

    return toWishlist(updated);
}

export async function getWishlistForCurrentSession(): Promise<Wishlist | null> {
    const session = await getStorefrontSession();
    if (!session) {
        return null;
    }
    return getWishlist(session);
}

// --- MERGE LOGIC ---

export async function mergeWishlists(sessionId: string, userId: string): Promise<Wishlist> {
    const collection = await getWishlistCollection();
    const guestWishlist = await collection.findOne({ sessionId });
    const userWishlist = await collection.findOne({ userId: new ObjectId(userId) });

    if (!guestWishlist) {
        if (userWishlist) return toWishlist(userWishlist);
        const doc = buildEmptyWishlistDocument(sessionId, userId);
        const result = await collection.insertOne(doc as WishlistDocument);
        const created = await collection.findOne({ _id: result.insertedId });
        return toWishlist(created!);
    }

    if (!userWishlist) {
        await collection.updateOne(
            { _id: guestWishlist._id },
            {
                $set: {
                    userId: new ObjectId(userId),
                    updatedAt: new Date()
                }
            }
        );
        return toWishlist({ ...guestWishlist, userId: new ObjectId(userId) });
    }

    const mergedItems = [...userWishlist.items];

    for (const guestItem of guestWishlist.items) {
        const existingIndex = mergedItems.findIndex(i =>
            i.productId === guestItem.productId &&
            normalizeVariantItemIds(i.selectedVariantItemIds).join(',') === normalizeVariantItemIds(guestItem.selectedVariantItemIds).join(',')
        );

        if (existingIndex === -1) {
            mergedItems.push(guestItem);
        }
    }

    await collection.updateOne(
        { _id: userWishlist._id },
        {
            $set: {
                items: mergedItems,
                updatedAt: new Date()
            }
        }
    );

    await collection.deleteOne({ _id: guestWishlist._id });

    const updated = await collection.findOne({ _id: userWishlist._id });
    return toWishlist(updated!);
}
