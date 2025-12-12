import 'server-only';

import { getCollection, ObjectId } from '@/lib/db/mongo-client';
import { AppError } from '@/lib/errors/app-error';
import type { BillingDetails } from '@/lib/billing-details/billing-details.schema';
import { getProduct } from '@/lib/product/product.service';
import { getVariantCombinationKey } from '@/lib/product/product.utils';
import { getStorefrontSessionId, ensureStorefrontSession, getStorefrontSession } from '@/lib/storefront-session';
import { StorefrontSession } from '@/lib/storefront-session/model/storefront-session.model';
import { Cart, CartDocument, CartItemDocument, toCart } from './model/cart.model';

const COLLECTION = 'storefrontCarts';

let indexesEnsured = false;

async function getCartCollection() {
    const collection = await getCollection<CartDocument>(COLLECTION);
    if (!indexesEnsured) {
        await Promise.all([
            collection.createIndex({ sessionId: 1 }, { unique: true }), // Keep this for legacy/guest
            collection.createIndex({ userId: 1 }), // Allow multiple carts per user? No, should be unique.
            collection.createIndex({ 'items.productId': 1 }),
        ]);
        // Unique index on userId but sparse? Users should have only one cart.
        // Existing data might violate this if not careful, but we are new.
        // Let's add unique sparse index for userId.
        // Actually, let's just index simple for now to avoid errors if I duplicate logic.
        // But unique is better.
        // await collection.createIndex({ userId: 1 }, { unique: true, sparse: true });
        indexesEnsured = true;
    }
    return collection;
}

function normalizeVariantItemIds(ids: string[]): string[] {
    return Array.from(new Set(ids)).sort();
}

function buildEmptyCartDocument(sessionId: string, userId?: string): Omit<CartDocument, '_id'> {
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

export async function getCart(session: StorefrontSession): Promise<Cart | null> {
    const collection = await getCartCollection();
    if (session.userId) {
        const userCart = await collection.findOne({ userId: new ObjectId(session.userId) });
        if (userCart) return toCart(userCart);
    }
    // Fallback to sessionId lookup
    const doc = await collection.findOne({ sessionId: session.sessionId });
    return doc ? toCart(doc) : null;
}

/**
 * @deprecated Use getCart(session) instead
 */
export async function getCartBySessionId(sessionId: string): Promise<Cart | null> {
    const collection = await getCartCollection();
    const doc = await collection.findOne({ sessionId });
    return doc ? toCart(doc) : null;
}

export async function ensureCart(session: StorefrontSession): Promise<Cart> {
    const collection = await getCartCollection();

    // Try to find existing
    if (session.userId) {
        const userCart = await collection.findOne({ userId: new ObjectId(session.userId) });
        if (userCart) return toCart(userCart);
    }
    const sessionCart = await collection.findOne({ sessionId: session.sessionId });
    if (sessionCart) {
        // If we have a session cart but now we have a userId (and didn't find a user cart above),
        // we should probably associate this session cart with the user?
        // Or just return it. The merge logic handles the explicit takeover.
        // Here we just return what we found.
        return toCart(sessionCart);
    }

    // Create new
    const insertDoc = buildEmptyCartDocument(session.sessionId, session.userId);
    const result = await collection.insertOne(insertDoc as CartDocument);
    const created = await collection.findOne({ _id: result.insertedId });
    if (!created) {
        throw new AppError(500, 'FAILED_TO_CREATE_CART');
    }
    return toCart(created);
}

// Keep legacy ensureCart for now if used elsewhere, but redirect
export async function ensureCartLegacy(sessionId: string): Promise<Cart> {
    return ensureCart({ sessionId } as StorefrontSession);
}


async function findCartOrThrow(session: StorefrontSession): Promise<CartDocument> {
    const collection = await getCartCollection();
    let doc: CartDocument | null = null;

    if (session.userId) {
        doc = await collection.findOne({ userId: new ObjectId(session.userId) });
    }
    if (!doc) {
        doc = await collection.findOne({ sessionId: session.sessionId });
    }

    if (!doc) {
        throw new AppError(404, 'CART_NOT_FOUND');
    }
    return doc;
}

async function computeUnitPrice(productId: string, selectedVariantItemIds: string[]): Promise<number> {
    const product = await getProduct(productId);
    const normalized = normalizeVariantItemIds(selectedVariantItemIds);
    const base = product.offerPrice ?? product.basePrice;

    if (!product.variantStock || product.variantStock.length === 0) {
        return base;
    }

    const key = getVariantCombinationKey(normalized);
    const stockEntry = product.variantStock.find(vs => vs.variantCombinationKey === key);

    if (!stockEntry || stockEntry.priceDelta === undefined || stockEntry.priceDelta === null) {
        return base;
    }

    return base + stockEntry.priceDelta;
}

function findItemIndex(cart: CartDocument, productId: string, normalizedVariantItemIds: string[]): number {
    return cart.items.findIndex(
        item =>
            item.productId === productId &&
            item.selectedVariantItemIds.length === normalizedVariantItemIds.length &&
            item.selectedVariantItemIds.every((id, index) => id === normalizedVariantItemIds[index])
    );
}

async function updateCartDocument(cart: CartDocument): Promise<Cart> {
    const collection = await getCartCollection();
    const now = new Date();

    await collection.updateOne(
        { _id: cart._id },
        {
            $set: {
                items: cart.items,
                updatedAt: now,
            },
        }
    );

    const updated = await collection.findOne({ _id: cart._id });
    if (!updated) {
        throw new AppError(500, 'FAILED_TO_UPDATE_CART');
    }

    return toCart(updated);
}

interface AddItemParams {
    session: StorefrontSession; // Changed from sessionId
    productId: string;
    selectedVariantItemIds: string[];
    quantity: number;
}

export async function addItemToCart(params: AddItemParams): Promise<Cart> {
    const { session, productId, selectedVariantItemIds, quantity } = params;
    if (quantity <= 0) {
        throw new AppError(400, 'INVALID_QUANTITY', { message: 'Quantity must be positive' });
    }

    const collection = await getCartCollection();
    let cart: CartDocument | null = null;

    // Find existing cart logic same as ensureCart
    if (session.userId) {
        cart = await collection.findOne({ userId: new ObjectId(session.userId) });
    }
    if (!cart) {
        cart = await collection.findOne({ sessionId: session.sessionId });
    }

    if (!cart) {
        const insertDoc = buildEmptyCartDocument(session.sessionId, session.userId);
        const result = await collection.insertOne(insertDoc as CartDocument);
        cart = {
            ...(insertDoc as CartDocument),
            _id: result.insertedId as ObjectId,
        };
    }

    const normalizedVariantItemIds = normalizeVariantItemIds(selectedVariantItemIds);
    const unitPrice = await computeUnitPrice(productId, normalizedVariantItemIds);

    const now = new Date();
    const index = findItemIndex(cart, productId, normalizedVariantItemIds);

    if (index === -1) {
        const newItem: CartItemDocument = {
            productId,
            selectedVariantItemIds: normalizedVariantItemIds,
            quantity,
            unitPrice,
            createdAt: now,
            updatedAt: now,
        };
        cart.items.push(newItem);
    } else {
        const existing = cart.items[index];
        cart.items[index] = {
            ...existing,
            quantity: existing.quantity + quantity,
            unitPrice,
            updatedAt: now,
        };
    }

    return updateCartDocument(cart);
}

interface UpdateItemParams {
    session: StorefrontSession;
    productId: string;
    selectedVariantItemIds: string[];
    quantity: number;
}

export async function updateCartItemQuantity(params: UpdateItemParams): Promise<Cart> {
    const { session, productId, selectedVariantItemIds, quantity } = params;
    const cart = await findCartOrThrow(session);
    const normalizedVariantItemIds = normalizeVariantItemIds(selectedVariantItemIds);
    const index = findItemIndex(cart, productId, normalizedVariantItemIds);

    if (index === -1) {
        throw new AppError(404, 'CART_ITEM_NOT_FOUND');
    }

    if (quantity <= 0) {
        cart.items.splice(index, 1);
    } else {
        const unitPrice = await computeUnitPrice(productId, normalizedVariantItemIds);
        const now = new Date();
        cart.items[index] = {
            ...cart.items[index],
            quantity,
            unitPrice,
            updatedAt: now,
        };
    }

    return updateCartDocument(cart);
}

interface RemoveItemParams {
    session: StorefrontSession;
    productId: string;
    selectedVariantItemIds: string[];
}

export async function removeItemFromCart(params: RemoveItemParams): Promise<Cart> {
    const { session, productId, selectedVariantItemIds } = params;
    const cart = await findCartOrThrow(session);
    const normalizedVariantItemIds = normalizeVariantItemIds(selectedVariantItemIds);
    const index = findItemIndex(cart, productId, normalizedVariantItemIds);

    if (index !== -1) {
        cart.items.splice(index, 1);
    }

    return updateCartDocument(cart);
}

export async function clearCart(session: StorefrontSession): Promise<Cart> {
    const cart = await findCartOrThrow(session);
    cart.items = [];
    return updateCartDocument(cart);
}

export async function getBillingDetailsForCurrentSession(): Promise<BillingDetails | null> {
    const session = await getStorefrontSession();
    if (!session) {
        return null;
    }
    const cart = await getCart(session);
    return cart?.billingDetails ?? null;
}

export async function setBillingDetailsForCurrentSession(billingDetails: BillingDetails): Promise<Cart> {
    const session = await ensureStorefrontSession();
    const ensuredCart = await ensureCart(session);
    const collection = await getCartCollection();
    const cartObjectId = new ObjectId(ensuredCart.id);
    const now = new Date();

    await collection.updateOne(
        { _id: cartObjectId },
        {
            $set: {
                billingDetails,
                updatedAt: now,
            },
        }
    );

    const updated = await collection.findOne({ _id: cartObjectId });
    if (!updated) {
        throw new AppError(500, 'FAILED_TO_UPDATE_CART');
    }
    return toCart(updated);
}

export async function getBillingDetailsBySessionId(sessionId: string): Promise<BillingDetails | null> {
    const cart = await getCartBySessionId(sessionId);
    return cart?.billingDetails ?? null;
}

export async function getCartForCurrentSession(): Promise<Cart | null> {
    const session = await getStorefrontSession();
    if (!session) {
        return null;
    }
    return getCart(session);
}

export async function ensureCartForCurrentSession(): Promise<Cart> {
    const session = await ensureStorefrontSession();
    return ensureCart(session);
}


// --- MERGE LOGIC ---

export async function mergeCarts(sessionId: string, userId: string): Promise<Cart> {
    const collection = await getCartCollection();
    const guestCart = await collection.findOne({ sessionId });
    const userCart = await collection.findOne({ userId: new ObjectId(userId) });

    if (!guestCart) {
        if (userCart) return toCart(userCart);
        // Neither exists, create new user cart
        const insertDoc = buildEmptyCartDocument(sessionId, userId);
        const result = await collection.insertOne(insertDoc as CartDocument);
        const created = await collection.findOne({ _id: result.insertedId });
        return toCart(created!);
    }

    if (!userCart) {
        // Guest cart becomes user cart
        await collection.updateOne(
            { _id: guestCart._id },
            {
                $set: {
                    userId: new ObjectId(userId),
                    updatedAt: new Date()
                }
            }
        );
        return toCart({ ...guestCart, userId: new ObjectId(userId) });
    }

    // Both exist: Merge guest items into user cart
    const mergedItems = [...userCart.items];

    for (const guestItem of guestCart.items) {
        const existingIndex = mergedItems.findIndex(i =>
            i.productId === guestItem.productId &&
            normalizeVariantItemIds(i.selectedVariantItemIds).join(',') === normalizeVariantItemIds(guestItem.selectedVariantItemIds).join(',')
        );

        if (existingIndex !== -1) {
            mergedItems[existingIndex].quantity += guestItem.quantity;
            mergedItems[existingIndex].updatedAt = new Date();
        } else {
            mergedItems.push(guestItem);
        }
    }

    // Update user cart
    await collection.updateOne(
        { _id: userCart._id },
        {
            $set: {
                items: mergedItems,
                updatedAt: new Date()
            }
        }
    );

    // Delete guest cart
    await collection.deleteOne({ _id: guestCart._id });

    // Return updated user cart
    const updatedUserCart = await collection.findOne({ _id: userCart._id });
    return toCart(updatedUserCart!);
}
