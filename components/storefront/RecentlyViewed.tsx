'use client';

import { useEffect, useState } from 'react';
import { Product } from '@/lib/product/model/product.model';
import { ProductGrid } from '../ProductGrid';

interface RecentlyViewedProps {
    currentProductId?: string;
}

export function RecentlyViewed({ currentProductId }: RecentlyViewedProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function trackAndFetch() {
            try {
                // Track current product view if provided
                if (currentProductId) {
                    await fetch('/api/storefront/products/recently-viewed', {
                        method: 'POST',
                        body: JSON.stringify({ productId: currentProductId }),
                        headers: { 'Content-Type': 'application/json' },
                    });
                }

                const response = await fetch('/api/storefront/products/recently-viewed');
                if (response.ok) {
                    const data = await response.json();
                    // Filter out the current product from the list if provided
                    const filtered = currentProductId
                        ? data.products.filter((p: Product) => p.id !== currentProductId)
                        : data.products;
                    setProducts(filtered);
                }
            } catch (error) {
                console.error('Failed to handle recently viewed products:', error);
            } finally {
                setIsLoading(false);
            }
        }

        trackAndFetch();
    }, [currentProductId]);

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
