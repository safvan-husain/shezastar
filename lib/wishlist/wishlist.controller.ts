// lib/wishlist/wishlist.controller.ts
import { catchError } from '@/lib/errors/app-error';
import {
    AddToWishlistSchema,
    ClearWishlistSchema,
    RemoveFromWishlistSchema,
    WishlistSchema,
} from './wishlist.schema';
import {
    addItemToWishlist,
    clearWishlist,
    getWishlistBySessionId,
    ensureWishlist,
    removeItemFromWishlist,
} from './wishlist.service';

export async function handleGetWishlist(sessionId: string) {
    try {
        const wishlist = await getWishlistBySessionId(sessionId);
        if (!wishlist) {
            const empty = await ensureWishlist(sessionId);
            return { status: 200, body: WishlistSchema.parse(empty) };
        }
        return { status: 200, body: WishlistSchema.parse(wishlist) };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleEnsureWishlist(sessionId: string) {
    try {
        const wishlist = await ensureWishlist(sessionId);
        return { status: 200, body: WishlistSchema.parse(wishlist) };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleAddToWishlist(input: unknown) {
    try {
        const parsed = AddToWishlistSchema.parse(input);
        const wishlist = await addItemToWishlist(parsed);
        return { status: 200, body: WishlistSchema.parse(wishlist) };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleRemoveFromWishlist(input: unknown) {
    try {
        const parsed = RemoveFromWishlistSchema.parse(input);
        const wishlist = await removeItemFromWishlist(parsed);
        return { status: 200, body: WishlistSchema.parse(wishlist) };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleClearWishlist(input: unknown) {
    try {
        const parsed = ClearWishlistSchema.parse(input);
        const wishlist = await clearWishlist(parsed.sessionId);
        return { status: 200, body: WishlistSchema.parse(wishlist) };
    } catch (err) {
        return catchError(err);
    }
}

