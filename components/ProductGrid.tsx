'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Product, isProductInStock } from '@/lib/product/model/product.model';
import { Card } from './ui/Card';
import { useStorefrontWishlist } from '@/components/storefront/StorefrontWishlistProvider';
import { useStorefrontCart } from './storefront/StorefrontCartProvider';
import { StockStatus } from './storefront/StockStatus';

interface ProductGridProps {
  products: Product[];
  emptyMessage?: string;
}

function formatPrice(value: number) {
  return `AED ${value.toFixed(2)}`;
}

function HeartIcon({ filled }: { filled?: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: 'black' }}
    >
      <path d="M20.8 4.6a5 5 0 0 0-7.1 0l-1.2 1.2-1.2-1.2a5 5 0 1 0-7.1 7.1l1.2 1.2 7.1 7.1 7.1-7.1 1.2-1.2a5 5 0 0 0 0-7.1z" />
    </svg>
  );
}

function CompareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'black' }}>
      <path d="M3 6h13" />
      <path d="M8 6l-4 4 4 4" />
      <path d="M21 18H8" />
      <path d="M16 14l4 4-4 4" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'black' }}>
      <circle cx="9" cy="21" r="1.5" />
      <circle cx="18" cy="21" r="1.5" />
      <path d="M2.5 3h2l2.2 12.6a1.5 1.5 0 0 0 1.5 1.2h9.4a1.5 1.5 0 0 0 1.5-1.2l1.2-7.6H6.2" />
    </svg>
  );
}

export function ProductGrid({ products, emptyMessage = 'No products available yet.' }: ProductGridProps) {
  const { addToCart, isLoading } = useStorefrontCart();

  if (products.length === 0) {
    return (
      <Card className="text-center py-12">
        <p className="text-[var(--muted-foreground)]">{emptyMessage}</p>
      </Card>
    );
  }

  const { isInWishlist, toggleWishlistItem } = useStorefrontWishlist();

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {products.map((product) => {
        const primaryImage = product.images?.[0];
        const imageIndicators = Math.min(product.images?.length ?? 0, 4);
        const inWishlist = isInWishlist(product.id, []);

        return (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="group flex h-full flex-col"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-[var(--storefront-bg-subtle)] border border-[var(--storefront-border)]">
              {primaryImage ? (
                <Image
                  src={primaryImage.url}
                  alt={product.name}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-[var(--storefront-text-muted)]">
                  <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h18M3 19h18M5 5v14M19 5v14" />
                  </svg>
                  <p className="text-xs tracking-wide">Awaiting imagery</p>
                </div>
              )}

              <div className="absolute top-3 right-3 flex flex-col gap-2">
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--storefront-button-secondary)] shadow-[var(--storefront-shadow-md)] transition hover:bg-[var(--storefront-button-secondary-hover)]"
                  aria-label={inWishlist ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                  aria-pressed={inWishlist}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    void toggleWishlistItem(product.id, []);
                  }}
                >
                  <HeartIcon filled={inWishlist} />
                </button>
              </div>

              {imageIndicators > 1 && (
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
                  {Array.from({ length: imageIndicators }).map((_, index) => (
                    <span
                      key={`${product.id}-indicator-${index}`}
                      className={`h-1.5 rounded-full transition-all ${index === 0 ? 'w-6 bg-[var(--storefront-indicator-active)]' : 'w-1.5 bg-[var(--storefront-indicator)]'}`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
              <div className="space-y-1">
                <h3 className="text-base font-medium text-[var(--storefront-text-primary)] line-clamp-2">{product.name}</h3>
                {(product.subtitle || product.description) && (
                  <p className="text-xs text-[var(--storefront-text-muted)] line-clamp-1">
                    {product.subtitle || product.description}
                  </p>
                )}
              </div>
              <div className="mt-auto flex flex-col-reverse gap-1">
                {(() => {
                  const discountPct = product.offerPercentage ?? 0;
                  const hasDiscount = discountPct > 0;

                  if (hasDiscount) {
                    return (
                      <>
                        <span className="text-xl font-semibold text-[var(--storefront-sale)] sm:text-2xl">
                          {formatPrice(product.basePrice * (1 - discountPct / 100))}
                        </span>
                        <span className="text-xs text-[var(--storefront-text-muted)] line-through sm:text-sm">
                          {formatPrice(product.basePrice)}
                        </span>
                      </>
                    );
                  }

                  return (
                    <span className="text-xl font-semibold text-[var(--storefront-sale)] sm:text-2xl">
                      {formatPrice(product.basePrice)}
                    </span>
                  );
                })()}
              </div>

              <div className="flex gap-3 flex-row items-end justify-between">
                <StockStatus inStock={isProductInStock(product)} />
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white disabled:opacity-60 disabled:cursor-not-allowed"
                  aria-label={`Add ${product.name} to cart`}
                  style={{ backgroundColor: '#e5e7eb' }}
                  disabled={isLoading}
                  onClick={async (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    await addToCart(product.id, []);
                  }}
                >
                  <CartIcon />
                </button>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
