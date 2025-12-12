'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { WishlistResponse, WishlistItemResponse } from '@/lib/wishlist';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/utils/api-error-handler';
import { useStorefrontSession } from './StorefrontSessionProvider';
import { useStorefrontAuthSuggestion } from './StorefrontAuthSuggestionProvider';

interface StorefrontWishlistContextValue {
  items: WishlistItemResponse[];
  isLoading: boolean;
  error: Error | null;
  isInWishlist: (productId: string, selectedVariantItemIds: string[]) => boolean;
  toggleWishlistItem: (productId: string, selectedVariantItemIds: string[]) => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const StorefrontWishlistContext = createContext<StorefrontWishlistContextValue | undefined>(
  undefined
);

interface StorefrontWishlistProviderProps {
  initialWishlist?: WishlistResponse | null;
  children: React.ReactNode;
}

function normalizeVariantItemIds(ids: string[]): string[] {
  const unique = Array.from(new Set((ids || []).filter(Boolean)));
  unique.sort();
  return unique;
}

function areVariantSelectionsEqual(a: string[], b: string[]) {
  const normalizedA = normalizeVariantItemIds(a);
  const normalizedB = normalizeVariantItemIds(b);
  if (normalizedA.length !== normalizedB.length) return false;
  return normalizedA.every((id, index) => id === normalizedB[index]);
}

export function StorefrontWishlistProvider({
  initialWishlist,
  children,
}: StorefrontWishlistProviderProps) {
  const { session } = useStorefrontSession();
  const { showToast } = useToast();
  const { suggestAuthIfGuest } = useStorefrontAuthSuggestion();

  const [items, setItems] = useState<WishlistItemResponse[]>(initialWishlist?.items ?? []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchWishlist = useCallback(async () => {
    if (!session) {
      setItems([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/storefront/wishlist', {
        method: 'GET',
      });

      if (!response.ok) {
        await handleApiError(response, showToast);
      }

      const data: WishlistResponse = await response.json();
      setItems(data.items ?? []);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load wishlist';
      console.error('[WISHLIST] Fetch failed:', message);
      showToast(message, 'error');
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [session, showToast]);

  useEffect(() => {
    if (!initialWishlist) {
      fetchWishlist().catch(() => {
        // Error already handled via toast
      });
    }
  }, [initialWishlist, fetchWishlist]);

  const isInWishlist = useCallback(
    (productId: string, selectedVariantItemIds: string[]) => {
      const normalizedSelected = normalizeVariantItemIds(selectedVariantItemIds);
      return items.some(
        item =>
          item.productId === productId &&
          areVariantSelectionsEqual(item.selectedVariantItemIds, normalizedSelected)
      );
    },
    [items]
  );

  const toggleWishlistItem = useCallback(
    async (productId: string, selectedVariantItemIds: string[]) => {
      if (!session) {
        showToast('Session is not ready yet. Please try again.', 'error');
        return;
      }

      const normalizedSelected = normalizeVariantItemIds(selectedVariantItemIds);
      const alreadyInWishlist = isInWishlist(productId, normalizedSelected);
      const method = alreadyInWishlist ? 'DELETE' : 'POST';

      setIsLoading(true);
      try {
        const response = await fetch('/api/storefront/wishlist', {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId,
            selectedVariantItemIds: normalizedSelected,
          }),
        });

        if (!response.ok) {
          await handleApiError(response, showToast);
        }

        const data: WishlistResponse = await response.json();
        setItems(data.items ?? []);
        setError(null);

        showToast(
          alreadyInWishlist
            ? 'Removed from wishlist'
            : 'Added to wishlist',
          'success'
        );

        if (!alreadyInWishlist) {
          suggestAuthIfGuest('wishlist');
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to update wishlist';
        console.error('[WISHLIST] Toggle failed:', message);
        showToast(message, 'error');
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    },
    [session, isInWishlist, showToast, suggestAuthIfGuest]
  );

  const refreshWishlist = useCallback(async () => {
    await fetchWishlist();
  }, [fetchWishlist]);

  const value = useMemo<StorefrontWishlistContextValue>(
    () => ({
      items,
      isLoading,
      error,
      isInWishlist,
      toggleWishlistItem,
      refreshWishlist,
    }),
    [items, isLoading, error, isInWishlist, toggleWishlistItem, refreshWishlist]
  );

  return (
    <StorefrontWishlistContext.Provider value={value}>
      {children}
    </StorefrontWishlistContext.Provider>
  );
}

export function useStorefrontWishlist() {
  const context = useContext(StorefrontWishlistContext);
  if (!context) {
    throw new Error(
      'useStorefrontWishlist must be used within StorefrontWishlistProvider'
    );
  }
  return context;
}

