import { catchError } from '@/lib/errors/app-error';
import {
    AddToCartSchema,
    CartSchema,
    ClearCartSchema,
    RemoveFromCartSchema,
    UpdateCartItemSchema,
} from './cart.schema';
import {
    addItemToCart,
    clearCart,
    getCartForCurrentSession,
    removeItemFromCart,
    updateCartItemQuantity,
    ensureCartForCurrentSession,
} from './cart.service';
import { getStorefrontSessionId, ensureStorefrontSession } from '@/lib/storefront-session';

export async function handleGetCartForCurrentSession() {
    try {
        const cart = await getCartForCurrentSession();
        if (cart) {
            return { status: 200, body: CartSchema.parse(cart) };
        }

        const ensuredCart = await ensureCartForCurrentSession();
        return { status: 200, body: CartSchema.parse(ensuredCart) };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleEnsureCartForCurrentSession() {
    try {
        const cart = await ensureCartForCurrentSession();
        return { status: 200, body: CartSchema.parse(cart) };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleAddToCart(input: unknown) {
    try {
        const parsed = AddToCartSchema.parse(input);
        const session = await ensureStorefrontSession();

        const cart = await addItemToCart({
            sessionId: session.sessionId,
            productId: parsed.productId,
            selectedVariantItemIds: parsed.selectedVariantItemIds,
            quantity: parsed.quantity,
        });

        return { status: 200, body: CartSchema.parse(cart) };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleUpdateCartItem(input: unknown) {
    try {
        const parsed = UpdateCartItemSchema.parse(input);
        const sessionId = await getStorefrontSessionId();
        if (!sessionId) {
            return {
                status: 404,
                body: {
                    code: 'CART_NOT_FOUND',
                    error: 'CART_NOT_FOUND',
                },
            };
        }

        const cart = await updateCartItemQuantity({
            sessionId,
            productId: parsed.productId,
            selectedVariantItemIds: parsed.selectedVariantItemIds,
            quantity: parsed.quantity,
        });

        return { status: 200, body: CartSchema.parse(cart) };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleRemoveCartItem(input: unknown) {
    try {
        const parsed = RemoveFromCartSchema.parse(input);
        const sessionId = await getStorefrontSessionId();
        if (!sessionId) {
            return {
                status: 404,
                body: {
                    code: 'CART_NOT_FOUND',
                    error: 'CART_NOT_FOUND',
                },
            };
        }

        const cart = await removeItemFromCart({
            sessionId,
            productId: parsed.productId,
            selectedVariantItemIds: parsed.selectedVariantItemIds,
        });

        return { status: 200, body: CartSchema.parse(cart) };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleClearCart(input: unknown) {
    try {
        ClearCartSchema.parse(input ?? {});
        const sessionId = await getStorefrontSessionId();
        if (!sessionId) {
            return {
                status: 404,
                body: {
                    code: 'CART_NOT_FOUND',
                    error: 'CART_NOT_FOUND',
                },
            };
        }

        const cart = await clearCart(sessionId);
        return { status: 200, body: CartSchema.parse(cart) };
    } catch (err) {
        return catchError(err);
    }
}
