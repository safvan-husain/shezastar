'use client';

'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Product } from '@/lib/product/model/product.model';
import { useStorefrontWishlist } from '@/components/storefront/StorefrontWishlistProvider';
import { useStorefrontCart } from '@/components/storefront/StorefrontCartProvider';

interface ProductDetailsProps {
  product: Product;
}

function formatPrice(value: number) {
  return `AED ${value.toFixed(2)}`;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const { isInWishlist, toggleWishlistItem } = useStorefrontWishlist();
  const inWishlist = isInWishlist(product.id, []);

  const { addToCart, isLoading } = useStorefrontCart();
  const [quantity] = useState<number>(1);
  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_3fr]">
      {/* Image Gallery */}
      <div className="space-y-4">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-[var(--storefront-bg-subtle)]">
          {product.images?.[0] ? (
            <Image
              src={product.images[0].url}
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

        {/* Thumbnail Gallery */}
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

      {/* Product Info */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-[var(--storefront-text-primary)]">{product.name}</h1>
          {product.description && (
            <p className="text-[var(--storefront-text-secondary)] leading-relaxed">{product.description}</p>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-3">
          {product.offerPrice ? (
            <>
              <span className="text-4xl font-bold text-[var(--storefront-sale)]">{formatPrice(product.offerPrice)}</span>
              <span className="text-xl text-[var(--storefront-text-muted)] line-through">{formatPrice(product.basePrice)}</span>
              <span className="text-sm font-semibold text-[var(--storefront-sale)]">
                Save {formatPrice(product.basePrice - product.offerPrice)}
              </span>
            </>
          ) : (
            <span className="text-4xl font-bold text-[var(--storefront-text-primary)]">{formatPrice(product.basePrice)}</span>
          )}
        </div>

        {/* Variants */}
        {product.variants && product.variants.length > 0 && (
          <div className="space-y-4">
            {product.variants.map((variant) => (
              <div key={variant.variantTypeId} className="space-y-2">
                <label className="text-sm font-medium text-[var(--storefront-text-primary)]">
                  {variant.variantTypeName}
                </label>
                <div className="flex flex-wrap gap-2">
                  {variant.selectedItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="px-4 py-2 rounded-md border border-[var(--storefront-border)] bg-[var(--storefront-bg)] text-[var(--storefront-text-primary)] hover:border-[var(--storefront-text-primary)] transition"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Installation Service */}
        {product.installationService?.enabled && (
          <div className="rounded-lg border border-[var(--storefront-border)] bg-[var(--storefront-bg-subtle)] p-4 space-y-2">
            <h3 className="font-semibold text-[var(--storefront-text-primary)]">Installation Service Available</h3>
            <p className="text-lg font-semibold text-[var(--storefront-text-primary)]">
              {formatPrice(product.installationService.atHomePrice ?? 0)}
            </p>
          </div>
        )}

        {/* Add to Cart Button */}
        <button
          type="button"
          className="w-full py-4 rounded-lg bg-[var(--storefront-button-primary)] text-white font-semibold hover:bg-[var(--storefront-button-primary-hover)] transition disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={isLoading}
          onClick={async () => {
            await addToCart(product.id, [], quantity);
          }}
          aria-label={`Add ${product.name} to cart`}
        >
          Add to Cart
        </button>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            className="py-3 rounded-lg border border-[var(--storefront-border)] bg-[var(--storefront-button-secondary)] text-[var(--storefront-text-primary)] font-medium hover:bg-[var(--storefront-button-secondary-hover)] transition"
            aria-pressed={inWishlist}
            aria-label={inWishlist ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
            onClick={() => {
              void toggleWishlistItem(product.id, []);
            }}
          >
            {inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
          </button>
          <button
            type="button"
            className="py-3 rounded-lg border border-[var(--storefront-border)] bg-[var(--storefront-button-secondary)] text-[var(--storefront-text-primary)] font-medium hover:bg-[var(--storefront-button-secondary-hover)] transition"
          >
            Compare
          </button>
        </div>
      </div>
    </div>
  );
}
