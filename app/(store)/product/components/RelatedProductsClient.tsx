'use client';

import { useEffect, useState } from 'react';
import { Product } from '@/lib/product/model/product.model';
import { handleApiError } from '@/lib/utils/api-error-handler';
import { useToast } from '@/components/ui/Toast';
import { RelatedProducts } from './RelatedProducts';

interface RelatedProductsClientProps {
  productId: string;
}

function RelatedProductsSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading related products">
      <div className="h-8 w-48 animate-pulse rounded bg-[var(--storefront-bg-subtle)]" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <div className="aspect-square animate-pulse rounded-md bg-[var(--storefront-bg-subtle)]" />
            <div className="h-4 animate-pulse rounded bg-[var(--storefront-bg-subtle)]" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--storefront-bg-subtle)]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function RelatedProductsClient({ productId }: RelatedProductsClientProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const controller = new AbortController();
    const url = `/api/storefront/products/${encodeURIComponent(productId)}/related`;

    async function loadRelatedProducts() {
      setIsLoading(true);
      try {
        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
        });

        if (!response.ok) {
          await handleApiError(response, showToast);
        }

        const data: { products?: Product[] } = await response.json();
        setProducts(data.products ?? []);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        const message = error instanceof Error ? error.message : 'Failed to load related products';
        showToast(message, 'error', { url, method: 'GET' });
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadRelatedProducts();

    return () => {
      controller.abort();
    };
  }, [productId, showToast]);

  if (isLoading) {
    return <RelatedProductsSkeleton />;
  }

  return <RelatedProducts products={products} />;
}
