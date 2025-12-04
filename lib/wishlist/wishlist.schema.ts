// lib/wishlist/wishlist.schema.ts
import { z } from 'zod';

export const WishlistItemSchema = z.object({
    productId: z.string().min(1),
    selectedVariantItemIds: z.array(z.string().min(1)).default([]),
    createdAt: z.string().min(1),
});

export const WishlistSchema = z.object({
    id: z.string().min(1),
    sessionId: z.string().min(1),
    items: z.array(WishlistItemSchema),
    itemsCount: z.number().int().nonnegative(),
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
});

export const AddToWishlistSchema = z.object({
    sessionId: z.string().min(1),
    productId: z.string().min(1),
    selectedVariantItemIds: z.array(z.string().min(1)).default([]),
});

export const RemoveFromWishlistSchema = z.object({
    sessionId: z.string().min(1),
    productId: z.string().min(1),
    selectedVariantItemIds: z.array(z.string().min(1)).default([]),
});

export const ClearWishlistSchema = z.object({
    sessionId: z.string().min(1),
});

export type WishlistItemResponse = z.infer<typeof WishlistItemSchema>;
export type WishlistResponse = z.infer<typeof WishlistSchema>;
export type AddToWishlistInput = z.infer<typeof AddToWishlistSchema>;
export type RemoveFromWishlistInput = z.infer<typeof RemoveFromWishlistSchema>;
export type ClearWishlistInput = z.infer<typeof ClearWishlistSchema>;

