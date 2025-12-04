// lib/wishlist/model/wishlist.model.ts
import { ObjectId } from '@/lib/db/mongo-client';

export interface WishlistItemDocument {
    productId: string;
    selectedVariantItemIds: string[];
    createdAt: Date;
}

export interface WishlistDocument {
    _id: ObjectId;
    sessionId: string;
    items: WishlistItemDocument[];
    createdAt: Date;
    updatedAt: Date;
}

export interface WishlistItem {
    productId: string;
    selectedVariantItemIds: string[];
    createdAt: string;
}

export interface Wishlist {
    id: string;
    sessionId: string;
    items: WishlistItem[];
    itemsCount: number;
    createdAt: string;
    updatedAt: string;
}

export function toWishlist(doc: WishlistDocument): Wishlist {
    return {
        id: doc._id.toHexString(),
        sessionId: doc.sessionId,
        items: doc.items.map(item => ({
            productId: item.productId,
            selectedVariantItemIds: item.selectedVariantItemIds,
            createdAt: item.createdAt.toISOString(),
        })),
        itemsCount: doc.items.length,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
    };
}

