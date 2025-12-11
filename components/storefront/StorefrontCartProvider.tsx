'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { Cart } from '@/lib/cart';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/utils/api-error-handler';

interface StorefrontCartContextValue {
    cart: Cart | null;
    items: Cart['items'];
    totalItems: number;
    subtotal: number;
    addToCart: (productId: string, selectedVariantItemIds: string[], quantity?: number) => Promise<Cart | void>;
    updateItem: (productId: string, selectedVariantItemIds: string[], quantity: number) => Promise<Cart | void>;
    removeItem: (productId: string, selectedVariantItemIds: string[]) => Promise<Cart | void>;
    clearCart: () => Promise<Cart | void>;
    refreshCart: () => Promise<Cart | void>;
    isLoading: boolean;
}

const StorefrontCartContext = createContext<StorefrontCartContextValue | undefined>(undefined);

interface StorefrontCartProviderProps {
    initialCart: Cart | null;
    children: React.ReactNode;
}

export function StorefrontCartProvider({ initialCart, children }: StorefrontCartProviderProps) {
    const [cart, setCart] = useState<Cart | null>(initialCart);
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();

    const refreshCart = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/storefront/cart', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                await handleApiError(response, showToast);
            }

            const data: Cart = await response.json();
            setCart(data);
            return data;
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Failed to refresh cart';
            console.error('[CART] Refresh failed:', message);
            showToast(message, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

    const mutateCart = useCallback(
        async (
            method: 'POST' | 'PATCH' | 'DELETE',
            body: unknown,
            successMessage?: string
        ) => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/storefront/cart', {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(body ?? {}),
                });

                if (!response.ok) {
                    await handleApiError(response, showToast);
                }

                const data: Cart = await response.json();
                setCart(data);
                if (successMessage) {
                    showToast(successMessage, 'success');
                }
                return data;
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : 'Cart action failed';
                console.error('[CART] Mutation failed:', message);
                // For network errors or unexpected failures, show a generic toast
                showToast(message, 'error');
            } finally {
                setIsLoading(false);
            }
        },
        [showToast]
    );

    const addToCart = useCallback(
        async (productId: string, selectedVariantItemIds: string[], quantity: number = 1) =>
            mutateCart('POST', { productId, selectedVariantItemIds, quantity }, 'Added to cart'),
        [mutateCart]
    );

    const updateItem = useCallback(
        async (productId: string, selectedVariantItemIds: string[], quantity: number) =>
            mutateCart('PATCH', { productId, selectedVariantItemIds, quantity }, 'Cart updated'),
        [mutateCart]
    );

    const removeItem = useCallback(
        async (productId: string, selectedVariantItemIds: string[]) =>
            mutateCart('DELETE', { productId, selectedVariantItemIds }, 'Item removed from cart'),
        [mutateCart]
    );

    const clearCart = useCallback(
        async () => mutateCart('DELETE', {}, 'Cart cleared'),
        [mutateCart]
    );

    const value = useMemo<StorefrontCartContextValue>(
        () => ({
            cart,
            items: cart?.items ?? [],
            totalItems: cart?.totalItems ?? 0,
            subtotal: cart?.subtotal ?? 0,
            addToCart,
            updateItem,
            removeItem,
            clearCart,
            refreshCart,
            isLoading,
        }),
        [cart, addToCart, updateItem, removeItem, clearCart, refreshCart, isLoading]
    );

    return <StorefrontCartContext.Provider value={value}>{children}</StorefrontCartContext.Provider>;
}

export function useStorefrontCart() {
    const context = useContext(StorefrontCartContext);
    if (!context) {
        throw new Error('useStorefrontCart must be used within StorefrontCartProvider');
    }
    return context;
}

