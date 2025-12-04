import { beforeEach, describe, expect, it } from 'vitest';

import { clear } from '../test-db';
import {
    addItemToCart,
    clearCart,
    ensureCart,
    getCartBySessionId,
    removeItemFromCart,
    updateCartItemQuantity,
} from '@/lib/cart';
import { createProduct } from '@/lib/product/product.service';
import { AppError } from '@/lib/errors/app-error';

describe('Cart service', () => {
    const sessionId = 'cart-service-session';
    let productId: string;
    let variantItemId: string;

    beforeEach(async () => {
        await clear();

        variantItemId = 'variant-color-red';

        const product = await createProduct({
            name: 'Cart Test Product',
            description: 'Test product for cart operations',
            basePrice: 100,
            images: [],
            variants: [
                {
                    variantTypeId: 'color',
                    variantTypeName: 'Color',
                    selectedItems: [
                        {
                            id: variantItemId,
                            name: 'Red',
                        },
                    ],
                    priceModifier: 10,
                },
            ],
            subCategoryIds: [],
        });

        productId = product.id;
    });

    it('ensures a new empty cart for a session', async () => {
        const cart = await ensureCart(sessionId);
        expect(cart.sessionId).toBe(sessionId);
        expect(cart.items).toHaveLength(0);
        expect(cart.totalItems).toBe(0);
        expect(cart.subtotal).toBe(0);

        const fetched = await getCartBySessionId(sessionId);
        expect(fetched).not.toBeNull();
        expect(fetched?.id).toBe(cart.id);
    });

    it('adds items to cart and aggregates duplicates', async () => {
        const first = await addItemToCart({
            sessionId,
            productId,
            selectedVariantItemIds: [variantItemId],
            quantity: 1,
        });

        expect(first.items).toHaveLength(1);
        expect(first.items[0].quantity).toBe(1);
        expect(first.items[0].unitPrice).toBe(110); // base 100 + modifier 10
        expect(first.totalItems).toBe(1);
        expect(first.subtotal).toBe(110);

        const second = await addItemToCart({
            sessionId,
            productId,
            selectedVariantItemIds: [variantItemId],
            quantity: 2,
        });

        expect(second.items).toHaveLength(1);
        expect(second.items[0].quantity).toBe(3);
        expect(second.totalItems).toBe(3);
        expect(second.subtotal).toBe(110 * 3);
    });

    it('updates item quantity and removes item when quantity becomes zero', async () => {
        const created = await addItemToCart({
            sessionId,
            productId,
            selectedVariantItemIds: [variantItemId],
            quantity: 2,
        });

        expect(created.items[0].quantity).toBe(2);

        const updated = await updateCartItemQuantity({
            sessionId,
            productId,
            selectedVariantItemIds: [variantItemId],
            quantity: 5,
        });

        expect(updated.items[0].quantity).toBe(5);
        expect(updated.totalItems).toBe(5);

        const clearedLine = await updateCartItemQuantity({
            sessionId,
            productId,
            selectedVariantItemIds: [variantItemId],
            quantity: 0,
        });

        expect(clearedLine.items).toHaveLength(0);
        expect(clearedLine.totalItems).toBe(0);
        expect(clearedLine.subtotal).toBe(0);
    });

    it('removes an item from cart idempotently', async () => {
        await ensureCart(sessionId);

        const afterRemoveMissing = await removeItemFromCart({
            sessionId,
            productId: 'non-existent-product',
            selectedVariantItemIds: [],
        });

        expect(afterRemoveMissing.items).toHaveLength(0);

        const withItem = await addItemToCart({
            sessionId,
            productId,
            selectedVariantItemIds: [variantItemId],
            quantity: 1,
        });
        expect(withItem.items).toHaveLength(1);

        const afterRemoveExisting = await removeItemFromCart({
            sessionId,
            productId,
            selectedVariantItemIds: [variantItemId],
        });
        expect(afterRemoveExisting.items).toHaveLength(0);
    });

    it('clears all items from the cart', async () => {
        await addItemToCart({
            sessionId,
            productId,
            selectedVariantItemIds: [variantItemId],
            quantity: 2,
        });

        const cleared = await clearCart(sessionId);
        expect(cleared.items).toHaveLength(0);
        expect(cleared.totalItems).toBe(0);
        expect(cleared.subtotal).toBe(0);
    });

    it('throws when adding an item for a non-existent product', async () => {
        await expect(
            addItemToCart({
                sessionId,
                productId: '000000000000000000000000',
                selectedVariantItemIds: [],
                quantity: 1,
            })
        ).rejects.toThrow(AppError);
    });
});

