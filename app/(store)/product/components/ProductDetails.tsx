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

type InstallationOption = 'none' | 'store' | 'home';

function formatPrice(value: number) {
  return `AED ${value.toFixed(2)}`;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const { isInWishlist, toggleWishlistItem } = useStorefrontWishlist();
  const inWishlist = isInWishlist(product.id, []);

  const { addToCart, isLoading } = useStorefrontCart();
  const [quantity, setQuantity] = useState<number>(1);
  const [installationOption, setInstallationOption] = useState<InstallationOption>('none');

  const addOnPrice =
    installationOption === 'none'
      ? 0
      : installationOption === 'store'
        ? product.installationService?.inStorePrice ?? 0
        : product.installationService?.atHomePrice ?? 0;

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
          {product.highlights && product.highlights.length > 0 && (
            <div className="mt-3 space-y-1">
              <h2 className="text-sm font-semibold text-[var(--storefront-text-primary)]">Key highlights</h2>
              <ul className="mt-1 space-y-1 text-sm text-[var(--storefront-text-secondary)]">
                {product.highlights.map((item, index) => (
                  <li key={`${item}-${index}`} className="flex gap-2">
                    <span className="mt-[3px] text-[var(--storefront-text-muted)]">•</span>
                    <span className="flex-1">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
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
            <div className="space-y-3">
              {[
                { key: 'none' as InstallationOption, label: 'None', price: 0 },
                {
                  key: 'store' as InstallationOption,
                  label: 'At store',
                  price: product.installationService.inStorePrice ?? 0,
                },
                {
                  key: 'home' as InstallationOption,
                  label: 'At home',
                  price: product.installationService.atHomePrice ?? 0,
                },
              ].map((option) => (
                <label
                  key={option.key}
                  className="flex items-center gap-3 px-3 py-2 rounded-md border border-[var(--storefront-border)] bg-[var(--storefront-bg)]"
                >
                  <input
                    type="radio"
                    name="installation-option"
                    value={option.key}
                    checked={installationOption === option.key}
                    onChange={() => setInstallationOption(option.key)}
                    className="h-4 w-4"
                  />
                  <div className="flex flex-col">
                    <span className="text-[var(--storefront-text-primary)]">{option.label}</span>
                    <span className="text-xs text-[var(--storefront-text-secondary)]">
                      {formatPrice(option.price)}
                    </span>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-sm text-[var(--storefront-text-secondary)]">
              Selected installation add-on: {formatPrice(addOnPrice)}
            </p>
          </div>
        )}

        {/* Quantity Counter and Action Buttons */}
        <div className="flex gap-3 items-center">
          {/* Quantity Counter */}
          <div className="flex text-black items-center border border-[var(--storefront-border)] rounded-lg bg-white">
            <button
              type="button"
              className="p-3 hover:bg-gray-50 transition"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              aria-label="Decrease quantity"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="px-4 py-3 min-w-[3rem] text-center font-medium text-[var(--storefront-text-primary)]">
              {quantity}
            </span>
            <button
              type="button"
              className="p-3 hover:bg-gray-50 transition"
              onClick={() => setQuantity(quantity + 1)}
              aria-label="Increase quantity"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            type="button"
            className="flex-1 py-3 px-6 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={isLoading}
            onClick={async () => {
              await addToCart(product.id, [], quantity);
            }}
            aria-label={`Add ${product.name} to cart`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 11-4 0v-6m4 0V9a2 2 0 10-4 0v4.01" />
            </svg>
            Add to cart
          </button>

          {/* Buy Now Button */}
          <button
            type="button"
            className="py-3 px-6 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition"
            onClick={() => {
              // TODO: Implement buy now functionality
              console.log('Buy now clicked');
            }}
            aria-label={`Buy ${product.name} now`}
          >
            Buy Now
          </button>
        </div>

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
