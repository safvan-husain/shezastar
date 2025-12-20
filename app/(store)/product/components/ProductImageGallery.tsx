'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Product, filterImagesByVariants } from '@/lib/product/model/product.model';

interface ProductImageGalleryProps {
  product: Product;
  selectedVariantItemIds: string[];
}

export function ProductImageGallery({ product, selectedVariantItemIds }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Organize images: variant-specific first, then general images
  const allImages = product.images || [];

  const organizedImages = (() => {
    if (selectedVariantItemIds.length === 0) {
      // No variants selected, show all images in original order
      return allImages.sort((a, b) => a.order - b.order);
    }

    // Get variant-specific images (matching selected variants)
    const variantImages = filterImagesByVariants(allImages, selectedVariantItemIds);

    // Get general images (no variant mapping)
    const generalImages = allImages.filter(image =>
      !image.mappedVariants || image.mappedVariants.length === 0
    );

    // Get other variant images (mapped to different variants)
    const otherVariantImages = allImages.filter(image =>
      image.mappedVariants &&
      image.mappedVariants.length > 0 &&
      !variantImages.some(vi => vi.id === image.id)
    );

    // Combine: variant-specific first, then general, then other variants
    return [
      ...variantImages.sort((a, b) => a.order - b.order),
      ...generalImages.sort((a, b) => a.order - b.order),
      ...otherVariantImages.sort((a, b) => a.order - b.order)
    ];
  })();

  // Reset selected index when variants change to show the variant-specific image
  useEffect(() => {
    setSelectedIndex(0);
  }, [selectedVariantItemIds]);

  const primaryImage = organizedImages[selectedIndex] || organizedImages[0];

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-[var(--storefront-bg-subtle)]">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={product.name}
            fill
            unoptimized
            sizes="(max-width: 824px) 80vw, 50vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-[var(--storefront-text-muted)]">
            <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h18M3 19h18M5 5v14M19 5v14" />
            </svg>
            <p className="text-sm tracking-wide">No image available</p>
          </div>
        )}
      </div>

      {organizedImages && organizedImages.length > 1 && (
        <div className="grid grid-cols-4 gap-4">
          {organizedImages.slice(0, 4).map((image, index) => (
            <div
              key={image.id || index}
              onClick={() => setSelectedIndex(index)}
              className={`relative aspect-square overflow-hidden rounded-md bg-[var(--storefront-bg-subtle)] border transition cursor-pointer ${selectedIndex === index
                  ? 'border-[var(--storefront-text-primary)] ring-1 ring-[var(--storefront-text-primary)]'
                  : 'border-[var(--storefront-border)] hover:border-[var(--storefront-text-secondary)]'
                }`}
            >
              <Image
                src={image.url}
                alt={`${product.name} - Image ${index + 1}`}
                fill
                unoptimized
                sizes="(max-width: 1024px) 25vw, 12.5vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

