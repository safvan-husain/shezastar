'use client';

import Image from 'next/image';
import { Product } from '@/lib/product/model/product.model';

interface ProductImageGalleryProps {
  product: Product;
}

export function ProductImageGallery({ product }: ProductImageGalleryProps) {
  const primaryImage = product.images?.[0];

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

        {product.offerPrice && (
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center rounded-md bg-[var(--storefront-sale)] px-3 py-1.5 text-sm font-semibold text-white">
              SALE
            </span>
          </div>
        )}
      </div>

      {product.images && product.images.length > 1 && (
        <div className="grid grid-cols-4 gap-4">
          {product.images.slice(0, 4).map((image, index) => (
            <div
              key={image.id || index}
              className="relative aspect-square overflow-hidden rounded-md bg-[var(--storefront-bg-subtle)] border border-[var(--storefront-border)] cursor-pointer hover:border-[var(--storefront-text-primary)] transition"
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

