// lib/wishlist/wishlist.controller.ts
import { catchError } from '@/lib/errors/app-error';
import { getStorefrontSession, ensureStorefrontSession } from '@/lib/storefront-session';
import {
    AddToWishlistSchema,
    ClearWishlistSchema,
    RemoveFromWishlistSchema,
    WishlistSchema,
} from './wishlist.schema';
import {
    addItemToWishlist,
    clearWishlist,
    getWishlist,
    ensureWishlist,
    removeItemFromWishlist,
} from './wishlist.service';

export async function handleGetWishlist() {
    try {
        const session = await getStorefrontSession();
        if (!session) {
            // No session means empty wishlist effectively, but likely frontend will ensure session first.
            // If we access directly, return empty/404? 
            // Better to return 200 with empty for GET if no session?
            // Existing logic: "ensureWishlist(sessionId)".
            // Let's mimic that behavior: if no session, create one?
            // Actually, getStorefrontSession returns null if no cookie.
            // If we want to return a wishlist, we probably need a session.
            const newSession = await ensureStorefrontSession();
            const empty = await ensureWishlist(newSession);
            return { status: 200, body: WishlistSchema.parse(empty) };
        }

        const wishlist = await getWishlist(session);
        if (!wishlist) {
            const empty = await ensureWishlist(session);
            return { status: 200, body: WishlistSchema.parse(empty) };
        }
        return { status: 200, body: WishlistSchema.parse(wishlist) };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleEnsureWishlist() {
    try {
        const session = await ensureStorefrontSession();
        const wishlist = await ensureWishlist(session);
        return { status: 200, body: WishlistSchema.parse(wishlist) };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleAddToWishlist(input: unknown) {
    try {
        const parsed = AddToWishlistSchema.parse(input);
        const session = await ensureStorefrontSession();
        // AddToWishlistSchema likely has sessionId? verify
        // The service now handles session object.
        // We should ignore sessionId in input if it's there and use the session object.
        // But the Service signature I wrote: `addItemToWishlist(params: AddToWishlistInput & { session: StorefrontSession })`

        const wishlist = await addItemToWishlist({
            ...parsed,
            session,
        });
        return { status: 200, body: WishlistSchema.parse(wishlist) };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleRemoveFromWishlist(input: unknown) {
    try {
        const parsed = RemoveFromWishlistSchema.parse(input);
        const session = await ensureStorefrontSession(); // Ensure or Get? Add/Remove usually implies we have one.

        const wishlist = await removeItemFromWishlist({
            ...parsed,
            session,
        });
        return { status: 200, body: WishlistSchema.parse(wishlist) };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleClearWishlist(input: unknown) {
    try {
        ClearWishlistSchema.parse(input);
        const session = await ensureStorefrontSession();
        const wishlist = await clearWishlist(session);
        return { status: 200, body: WishlistSchema.parse(wishlist) };
    } catch (err) {
        return catchError(err);
    }
}
