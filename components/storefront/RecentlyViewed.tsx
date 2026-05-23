'use client';

import { useEffect, useState } from 'react';
import { Product } from '@/lib/product/model/product.model';
import { ProductGrid } from '../ProductGrid';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/utils/api-error-handler';

interface RecentlyViewedProps {
    currentProductId?: string;
}

export function RecentlyViewed({ currentProductId }: RecentlyViewedProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        async function trackAndFetch() {
            const url = '/api/storefront/products/recently-viewed';
            try {
                // Track current product view if provided
                if (currentProductId) {
                    const trackResponse = await fetch(url, {
                        method: 'POST',
                        body: JSON.stringify({ productId: currentProductId }),
                        headers: { 'Content-Type': 'application/json' },
                    });

                    if (!trackResponse.ok) {
                        await handleApiError(trackResponse, showToast);
                    }
                }

                const response = await fetch(url);
                if (!response.ok) {
                    await handleApiError(response, showToast);
                }

                const data = await response.json();
                // Filter out the current product from the list if provided
                const filtered = currentProductId
                    ? data.products.filter((p: Product) => p.id !== currentProductId)
                    : data.products;
                setProducts(filtered);
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to load recently viewed products';
                showToast(message, 'error', { url, method: 'GET' });
            } finally {
                setIsLoading(false);
            }
        }

        trackAndFetch();
    }, [currentProductId, showToast]);

    if (isLoading || products.length === 0) {
        return null;
    }

    return (
        <div className="mt-16 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[var(--storefront-text-primary)]">
                    Recently Viewed
                </h2>
            </div>
            <ProductGrid products={products} />
        </div>
    );
}
