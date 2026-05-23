import type { ToastErrorPayload } from '@/components/ErrorToastHandler';
import type { Metadata } from 'next';
import { ErrorToastHandler } from '@/components/ErrorToastHandler';
import { buildNoIndexMetadata } from '@/lib/seo/metadata';
import { ProductGrid } from '@/components/ProductGrid';
import { GuestAuthBanner } from '@/components/storefront/GuestAuthBanner';
import { Suspense } from 'react';
import type { Product } from '@/lib/product/model/product.model';
import { getProduct } from '@/lib/product/product.service';
import { getWishlistForCurrentSession } from '@/lib/wishlist/wishlist.service';

async function fetchWishlistProducts(): Promise<{
  products: Product[];
  error: ToastErrorPayload | null;
}> {
  try {
    const wishlist = await getWishlistForCurrentSession();

    if (!wishlist || wishlist.items.length === 0) {
      return { products: [], error: null };
    }

    const productIds = Array.from(
      new Set(wishlist.items.map(item => item.productId))
    );

    const products: Product[] = [];
    let error: ToastErrorPayload | null = null;

    for (const id of productIds) {
      try {
        const product = await getProduct(id);
        products.push(product);
      } catch (err) {
        if (!error) {
          error = {
            message:
              err instanceof Error
                ? err.message
                : 'Failed to load wishlist product',
            body:
              err instanceof Error
                ? { productId: id, stack: err.stack }
                : { productId: id, error: err },
            method: 'GET',
          };
        }
      }
    }

    return { products, error };
  } catch (err) {
    const error: ToastErrorPayload = {
      message:
        err instanceof Error ? err.message : 'Failed to load wishlist',
      body:
        err instanceof Error ? { stack: err.stack } : { error: err },
      method: 'GET',
    };
    return { products: [], error };
  }
}

export const metadata: Metadata = buildNoIndexMetadata({
  title: 'Wishlist | Sheza Star',
});

export default function WishlistPage() {
  return (
    <Suspense fallback={null}>
      <WishlistPageContent />
    </Suspense>
  );
}

async function WishlistPageContent() {
  const { products, error } = await fetchWishlistProducts();

  return (
    <div className="container mx-auto px-4 py-12 mt-24 space-y-6">
      <ErrorToastHandler error={error} />
      <GuestAuthBanner />

      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-[var(--storefront-text-primary)]">
          Wishlist
        </h1>
        <p className="text-[var(--storefront-text-secondary)]">
          Save products you love and quickly access them later.
        </p>
      </div>

      <ProductGrid
        products={products}
        emptyMessage="Your wishlist is currently empty."
      />
    </div>
  );
}
