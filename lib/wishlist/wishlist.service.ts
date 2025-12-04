// lib/wishlist/wishlist.service.ts
import 'server-only';

import { getCollection } from '@/lib/db/mongo-client';
import { AppError } from '@/lib/errors/app-error';
import { getProduct } from '@/lib/product/product.service';
import { getStorefrontSessionId } from '@/lib/storefront-session';
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
        await collection.createIndex({ sessionId: 1 }, { unique: true });
        indexesEnsured = true;
    }
    return collection;
}

function normalizeVariantItemIds(ids: string[]): string[] {
    const unique = Array.from(new Set(ids.filter(Boolean)));
    unique.sort();
    return unique;
}

async function getOrCreateWishlistDocument(sessionId: string): Promise<WishlistDocument> {
    const collection = await getWishlistCollection();
    const existing = await collection.findOne({ sessionId });
    if (existing) {
        return existing;
    }

    const now = new Date();
    const doc: Omit<WishlistDocument, '_id'> = {
        sessionId,
        items: [],
        createdAt: now,
        updatedAt: now,
    };

    const result = await collection.insertOne(doc as WishlistDocument);
    const created = await collection.findOne({ _id: result.insertedId });
    if (!created) {
        throw new AppError(500, 'WISHLIST_CREATE_FAILED');
    }
    return created;
}

export async function getWishlistBySessionId(sessionId: string): Promise<Wishlist | null> {
    const collection = await getWishlistCollection();
    const doc = await collection.findOne({ sessionId });
    if (!doc) {
        return null;
    }
    return toWishlist(doc);
}

export async function ensureWishlist(sessionId: string): Promise<Wishlist> {
    const doc = await getOrCreateWishlistDocument(sessionId);
    return toWishlist(doc);
}

export async function addItemToWishlist(params: AddToWishlistInput): Promise<Wishlist> {
    const sessionId = params.sessionId;
    const productId = params.productId;
    const selectedVariantItemIds = normalizeVariantItemIds(params.selectedVariantItemIds || []);

    // Ensure product exists; will throw AppError if invalid
    await getProduct(productId);

    const collection = await getWishlistCollection();
    const doc = await getOrCreateWishlistDocument(sessionId);

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

export async function removeItemFromWishlist(params: RemoveFromWishlistInput): Promise<Wishlist> {
    const sessionId = params.sessionId;
    const productId = params.productId;
    const selectedVariantItemIds = normalizeVariantItemIds(params.selectedVariantItemIds || []);

    const collection = await getWishlistCollection();
    const doc = await getOrCreateWishlistDocument(sessionId);

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

export async function clearWishlist(sessionId: string): Promise<Wishlist> {
    const collection = await getWishlistCollection();
    const doc = await getOrCreateWishlistDocument(sessionId);

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
    const sessionId = await getStorefrontSessionId();
    if (!sessionId) {
        return null;
    }
    return getWishlistBySessionId(sessionId);
}

