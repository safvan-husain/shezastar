import 'server-only';

import { getCollection, ObjectId } from '@/lib/db/mongo-client';
import { AppError } from '@/lib/errors/app-error';
import { calculatePrice } from '@/lib/product/model/product.model';
import { getProduct } from '@/lib/product/product.service';
import { getStorefrontSessionId, ensureStorefrontSession } from '@/lib/storefront-session';
import { Cart, CartDocument, CartItemDocument, toCart } from './model/cart.model';

const COLLECTION = 'storefrontCarts';

let indexesEnsured = false;

async function getCartCollection() {
    const collection = await getCollection<CartDocument>(COLLECTION);
    if (!indexesEnsured) {
        await Promise.all([
            collection.createIndex({ sessionId: 1 }, { unique: true }),
            collection.createIndex({ 'items.productId': 1 }),
        ]);
        indexesEnsured = true;
    }
    return collection;
}

function normalizeVariantItemIds(ids: string[]): string[] {
    return Array.from(new Set(ids)).sort();
}

function buildEmptyCartDocument(sessionId: string): Omit<CartDocument, '_id'> {
    const now = new Date();
    return {
        sessionId,
        items: [],
        createdAt: now,
        updatedAt: now,
    };
}

export async function getCartBySessionId(sessionId: string): Promise<Cart | null> {
    const collection = await getCartCollection();
    const doc = await collection.findOne({ sessionId });
    return doc ? toCart(doc) : null;
}

export async function ensureCart(sessionId: string): Promise<Cart> {
    const collection = await getCartCollection();
    const existing = await collection.findOne({ sessionId });
    if (existing) {
        return toCart(existing);
    }

    const insertDoc = buildEmptyCartDocument(sessionId);
    const result = await collection.insertOne(insertDoc as CartDocument);
    const created = await collection.findOne({ _id: result.insertedId });
    if (!created) {
        throw new AppError(500, 'FAILED_TO_CREATE_CART');
    }
    return toCart(created);
}

async function findCartOrThrow(sessionId: string): Promise<CartDocument> {
    const collection = await getCartCollection();
    const doc = await collection.findOne({ sessionId });
    if (!doc) {
        throw new AppError(404, 'CART_NOT_FOUND');
    }
    return doc;
}

async function computeUnitPrice(productId: string, selectedVariantItemIds: string[]): Promise<number> {
    const product = await getProduct(productId);
    const normalized = normalizeVariantItemIds(selectedVariantItemIds);
    return calculatePrice(product.basePrice, product.offerPrice, product.variants, normalized);
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

    // Recompute totals on the fresh document to keep mapping consistent
    return toCart(updated);
}

interface AddItemParams {
    sessionId: string;
    productId: string;
    selectedVariantItemIds: string[];
    quantity: number;
}

export async function addItemToCart(params: AddItemParams): Promise<Cart> {
    const { sessionId, productId, selectedVariantItemIds, quantity } = params;
    if (quantity <= 0) {
        throw new AppError(400, 'INVALID_QUANTITY', { message: 'Quantity must be positive' });
    }

    const collection = await getCartCollection();
    let cart = await collection.findOne({ sessionId });
    if (!cart) {
        const insertDoc = buildEmptyCartDocument(sessionId);
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
    sessionId: string;
    productId: string;
    selectedVariantItemIds: string[];
    quantity: number;
}

export async function updateCartItemQuantity(params: UpdateItemParams): Promise<Cart> {
    const { sessionId, productId, selectedVariantItemIds, quantity } = params;
    const cart = await findCartOrThrow(sessionId);
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
    sessionId: string;
    productId: string;
    selectedVariantItemIds: string[];
}

export async function removeItemFromCart(params: RemoveItemParams): Promise<Cart> {
    const { sessionId, productId, selectedVariantItemIds } = params;
    const cart = await findCartOrThrow(sessionId);
    const normalizedVariantItemIds = normalizeVariantItemIds(selectedVariantItemIds);
    const index = findItemIndex(cart, productId, normalizedVariantItemIds);

    if (index !== -1) {
        cart.items.splice(index, 1);
    }

    return updateCartDocument(cart);
}

export async function clearCart(sessionId: string): Promise<Cart> {
    const cart = await findCartOrThrow(sessionId);
    cart.items = [];
    return updateCartDocument(cart);
}

export async function getCartForCurrentSession(): Promise<Cart | null> {
    const sessionId = await getStorefrontSessionId();
    if (!sessionId) {
        return null;
    }
    return getCartBySessionId(sessionId);
}

export async function ensureCartForCurrentSession(): Promise<Cart> {
    const session = await ensureStorefrontSession();
    return ensureCart(session.sessionId);
}

