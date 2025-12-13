import { catchError } from '@/lib/errors/app-error';
import {
    AddToCartSchema,
    CartSchema,
    ClearCartSchema,
    RemoveFromCartSchema,
    UpdateCartItemSchema,
} from './cart.schema';
import { BillingDetailsSchema } from '@/lib/billing-details/billing-details.schema';
import {
    addItemToCart,
    clearCart,
    getCartForCurrentSession,
    removeItemFromCart,
    updateCartItemQuantity,
    ensureCartForCurrentSession,
    getBillingDetailsForCurrentSession as getBillingDetailsForCurrentSessionService,
    setBillingDetailsForCurrentSession as setBillingDetailsForCurrentSessionService,
} from './cart.service';
import { ensureStorefrontSession, getStorefrontSession } from '@/lib/storefront-session';

export async function handleGetCartForCurrentSession() {
    try {
        const cart = await getCartForCurrentSession();
        if (cart) {
            return { status: 200, body: CartSchema.parse(cart) };
        }

        // If no cart found, should we ensure it? The original code did.
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
            session,
            productId: parsed.productId,
            selectedVariantItemIds: parsed.selectedVariantItemIds,
            quantity: parsed.quantity,
            installationOption: parsed.installationOption,
        });

        return { status: 200, body: CartSchema.parse(cart) };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleUpdateCartItem(input: unknown) {
    try {
        const parsed = UpdateCartItemSchema.parse(input);
        const session = await getStorefrontSession();

        if (!session) {
            return {
                status: 404,
                body: {
                    code: 'CART_NOT_FOUND',
                    error: 'CART_NOT_FOUND',
                },
            };
        }

        const cart = await updateCartItemQuantity({
            session,
            productId: parsed.productId,
            selectedVariantItemIds: parsed.selectedVariantItemIds,
            quantity: parsed.quantity,
            installationOption: parsed.installationOption,
        });

        return { status: 200, body: CartSchema.parse(cart) };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleRemoveCartItem(input: unknown) {
    try {
        const parsed = RemoveFromCartSchema.parse(input);
        const session = await getStorefrontSession();

        if (!session) {
            return {
                status: 404,
                body: {
                    code: 'CART_NOT_FOUND',
                    error: 'CART_NOT_FOUND',
                },
            };
        }

        const cart = await removeItemFromCart({
            session,
            productId: parsed.productId,
            selectedVariantItemIds: parsed.selectedVariantItemIds,
            installationOption: parsed.installationOption,
        });

        return { status: 200, body: CartSchema.parse(cart) };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleClearCart(input: unknown) {
    try {
        ClearCartSchema.parse(input ?? {});
        const session = await getStorefrontSession();

        if (!session) {
            return {
                status: 404,
                body: {
                    code: 'CART_NOT_FOUND',
                    error: 'CART_NOT_FOUND',
                },
            };
        }

        const cart = await clearCart(session);
        return { status: 200, body: CartSchema.parse(cart) };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleGetBillingDetailsForCurrentSession() {
    try {
        const billingDetails = await getBillingDetailsForCurrentSessionService();
        return {
            status: 200,
            body: {
                billingDetails,
            },
        };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleSetBillingDetailsForCurrentSession(input: unknown) {
    try {
        const parsed = BillingDetailsSchema.parse(input);
        const cart = await setBillingDetailsForCurrentSessionService(parsed);
        return {
            status: 200,
            body: CartSchema.parse(cart),
        };
    } catch (err) {
        return catchError(err);
    }
}
