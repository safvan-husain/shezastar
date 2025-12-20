'use client';

import { useMemo, useState } from 'react';
import { Product, isProductInStock } from '@/lib/product/model/product.model';
import { useStorefrontWishlist } from '@/components/storefront/StorefrontWishlistProvider';
import { useStorefrontCart } from '@/components/storefront/StorefrontCartProvider';
import { getVariantCombinationKey } from '@/lib/product/product.utils';
import { useToast } from '@/components/ui/Toast';
import { ProductImageGallery } from './ProductImageGallery';
import { BuyNowButton } from './BuyNowButton';
import { StockStatus } from '@/components/storefront/StockStatus';
import type { InstallationOption } from '@/lib/cart/cart.schema';

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
  const { showToast } = useToast();
  const [quantity, setQuantity] = useState<number>(1);
  const [installationOption, setInstallationOption] = useState<InstallationOption>('none');
  const [selectedVariantItems, setSelectedVariantItems] = useState<Record<string, string | null>>({});

  const addOnPrice =
    installationOption === 'none'
      ? 0
      : installationOption === 'store'
        ? product.installationService?.inStorePrice ?? 0
        : product.installationService?.atHomePrice ?? 0;

  const selectedVariantItemIds = useMemo(
    () => Object.values(selectedVariantItems).filter((id): id is string => Boolean(id)),
    [selectedVariantItems]
  );

  const hasVariantStock = (product.variantStock?.length ?? 0) > 0;

  const stockByKey = useMemo(() => {
    const map = new Map<string, number>();
    for (const stockEntry of product.variantStock ?? []) {
      map.set(stockEntry.variantCombinationKey, stockEntry.stockCount);
    }
    return map;
  }, [product.variantStock]);

  const isCombinationAvailable = (combinationItemIds: string[]): boolean => {
    if (!hasVariantStock) {
      // No per-variant stock tracking; treat as available
      return true;
    }

    const key = getVariantCombinationKey(combinationItemIds);
    const stock = stockByKey.get(key);

    // If there is no explicit stock entry for this combination,
    // mirror backend behavior and treat it as unlimited/available.
    if (stock === undefined) {
      return true;
    }

    return stock > 0;
  };

  const isVariantItemAvailable = (variantTypeId: string, itemId: string): boolean => {
    if (!hasVariantStock || !product.variants || product.variants.length === 0) {
      return true;
    }

    const variants = product.variants;

    const search = (index: number, currentIds: string[]): boolean => {
      if (index === variants.length) {
        return isCombinationAvailable(currentIds);
      }

      const variant = variants[index];
      const selectedForVariant = selectedVariantItems[variant.variantTypeId] ?? null;

      // For the variant we are evaluating, force the candidate item.
      // For other variants, honor current selection if any; otherwise try all options.
      if (variant.variantTypeId === variantTypeId) {
        return search(index + 1, [...currentIds, itemId]);
      }

      if (selectedForVariant) {
        return search(index + 1, [...currentIds, selectedForVariant]);
      }

      for (const option of variant.selectedItems) {
        if (search(index + 1, [...currentIds, option.id])) {
          return true;
        }
      }

      return false;
    };

    return search(0, []);
  };

  const handleVariantClick = (variantTypeId: string, itemId: string, isDisabled: boolean) => {
    if (isDisabled) return;

    setSelectedVariantItems(prev => {
      const current = prev[variantTypeId];
      const next: Record<string, string | null> = { ...prev };

      // Toggle selection: clicking again clears it
      next[variantTypeId] = current === itemId ? null : itemId;
      return next;
    });
  };

  const combinationPriceDelta = useMemo(() => {
    if (!product.variantStock || product.variantStock.length === 0 || selectedVariantItemIds.length === 0) {
      return 0;
    }
    const key = getVariantCombinationKey(selectedVariantItemIds);
    const entry = product.variantStock.find(vs => vs.variantCombinationKey === key);
    return entry?.priceDelta ?? 0;
  }, [product.variantStock, selectedVariantItemIds]);

  const hasVariants = Boolean(product.variants && product.variants.length > 0);
  const allVariantsSelected = useMemo(() => {
    if (!hasVariants || !product.variants) return true;
    return product.variants.every(variant => {
      // Variant types without items don't require a choice
      if (!variant.selectedItems || variant.selectedItems.length === 0) {
        return true;
      }
      return Boolean(selectedVariantItems[variant.variantTypeId]);
    });
  }, [hasVariants, product.variants, selectedVariantItems]);

  const currentStockLimit = useMemo(() => {
    // Prefer per-combination stock when configured
    if (hasVariantStock && product.variantStock && product.variantStock.length > 0) {
      const key = getVariantCombinationKey(selectedVariantItemIds);
      const stock = stockByKey.get(key);
      // Undefined means "unlimited" per backend semantics
      if (typeof stock === 'number') {
        return stock;
      }
    }

    return null;
  }, [hasVariantStock, product.variantStock, stockByKey, selectedVariantItemIds]);

  const displayInStock = useMemo(() => {
    if (allVariantsSelected) {
      if (currentStockLimit === null) return true;
      return currentStockLimit > 0;
    }
    // If not all variants selected, show overall availability
    return isProductInStock(product);
  }, [allVariantsSelected, currentStockLimit, product]);

  return (
    <div className='flex flex-col'>
      <div className="grid gap-8 lg:grid-cols-[2fr_3fr]">
        {/* Image Gallery */}
        {/* <ProductImageGallery product={product} selectedVariantItemIds={selectedVariantItemIds} /> */}

        {/* Product Info */}
        <div className="space-y-6">

          <h1 className="text-3xl font-bold text-[var(--storefront-text-primary)]">{product.name}</h1>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            {product.offerPrice != null ? (
              (() => {
                const effectiveBase = product.basePrice + combinationPriceDelta;
                const effectiveOffer = product.offerPrice + combinationPriceDelta;
                return (
                  <>
                    <span className="text-4xl font-bold text-[var(--storefront-sale)]">
                      {formatPrice(effectiveOffer)}
                    </span>
                    <span className="text-xl text-[var(--storefront-text-muted)] line-through">
                      {formatPrice(effectiveBase)}
                    </span>
                    {effectiveBase > effectiveOffer && (
                      <span className="text-sm font-semibold text-[var(--storefront-sale)]">
                        Save {formatPrice(effectiveBase - effectiveOffer)}
                      </span>
                    )}
                  </>
                );
              })()
            ) : (
              <span className="text-4xl font-bold text-[var(--storefront-text-primary)]">
                {formatPrice(product.basePrice + combinationPriceDelta)}
              </span>
            )}
          </div>

          {product.subtitle && (
            <p className="text-lg font-medium text-[var(--storefront-text-secondary)] -mt-4">{product.subtitle}</p>
          )}

          <StockStatus inStock={displayInStock} />



          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-4">
              {product.variants.map((variant) => (
                <div key={variant.variantTypeId} className="space-y-2">
                  <label className="text-sm font-medium text-[var(--storefront-text-primary)] mb-4 ml-1">
                    {variant.variantTypeName}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {variant.selectedItems.map((item) => {
                      const isSelected = selectedVariantItems[variant.variantTypeId] === item.id;
                      const isAvailable = isVariantItemAvailable(variant.variantTypeId, item.id);
                      const isDisabled = !isAvailable && !isSelected;

                      const baseClasses =
                        'px-4 py-2 rounded-md border transition text-[var(--storefront-text-primary)]';
                      const stateClasses = isSelected
                        ? 'border-[var(--storefront-text-primary)] bg-[var(--storefront-bg-hover)] font-semibold'
                        : 'border-[var(--storefront-border)] bg-[var(--storefront-bg)] hover:border-[var(--storefront-text-primary)]';
                      const disabledClasses = isDisabled
                        ? 'opacity-50 cursor-not-allowed hover:border-[var(--storefront-border)]'
                        : '';

                      return (
                        <button
                          key={item.id}
                          type="button"
                          disabled={isDisabled}
                          aria-pressed={isSelected}
                          className={[baseClasses, stateClasses, disabledClasses].join(' ')}
                          onClick={() => handleVariantClick(variant.variantTypeId, item.id, isDisabled)}
                        >
                          {item.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Installation Service */}
          {product.installationService?.enabled && (
            <div className="border-t border-[var(--storefront-border)] pt-4 space-y-2">
              <h3 className="font-semibold text-[var(--storefront-text-primary)]">Installation Service</h3>
              <div className="space-y-1">
                {[
                  { key: 'none' as InstallationOption, label: 'None', price: 0 },
                  {
                    key: 'store' as InstallationOption,
                    label: 'At Store',
                    price: product.installationService.inStorePrice ?? 0,
                  },
                  {
                    key: 'home' as InstallationOption,
                    label: 'At Home',
                    price: product.installationService.atHomePrice ?? 0,
                  },
                ].map((option) => (
                  <label
                    key={option.key}
                    className="flex items-center gap-3 px-3 py-1"
                  >
                    <input
                      type="radio"
                      name="installation-option"
                      value={option.key}
                      checked={installationOption === option.key}
                      onChange={() => setInstallationOption(option.key)}
                      className="h-4 w-4"
                    />
                    <div className="flex justify-between w-full">
                      <span className="text-[var(--storefront-text-primary)] text-sm">{option.label}</span>
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
          <div className="space-y-4">

            {/* Primary Action Buttons */}
            <div className="grid w-full grid-cols-[1fr_2fr] gap-4 sm:grid-cols-[1fr_2fr_2fr_1fr]">

              <div className="flex w-fit justify-start text-black items-center border border-[var(--storefront-border)] rounded-lg bg-white">
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
                  onClick={() => {
                    if (currentStockLimit !== null && quantity + 1 > currentStockLimit) {
                      showToast('Lack of stock.', 'error');
                      return;
                    }
                    setQuantity(quantity + 1);
                  }}
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
                className="w-full py-3 px-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={isLoading || !allVariantsSelected}
                onClick={async () => {
                  if (currentStockLimit !== null && quantity > currentStockLimit) {
                    showToast('Lack of stock.', 'error');
                    return;
                  }
                  await addToCart(product.id, selectedVariantItemIds, quantity, installationOption);
                }}
                aria-label={`Add ${product.name} to cart`}
              >
                <div
                  className="w-5 h-5 bg-white"
                  style={{
                    maskImage: 'url(/icons/cart-plus-svgrepo-com.svg)',
                    WebkitMaskImage: 'url(/icons/cart-plus-svgrepo-com.svg)',
                    maskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    maskPosition: 'center',
                  }}
                />
                Add to cart
              </button>

              {/* Wishlist Icon Button */}
              <button
                type="button"
                className="sm:order-4 w-full py-3 rounded-lg border border-[var(--storefront-border)] bg-[var(--storefront-button-secondary)] text-[var(--storefront-text-primary)] hover:bg-[var(--storefront-button-secondary-hover)] transition flex items-center justify-center"
                aria-pressed={inWishlist}
                aria-label={inWishlist ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                onClick={() => {
                  void toggleWishlistItem(product.id, []);
                }}
              >
                <svg
                  className="w-5 h-5"
                  fill={inWishlist ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4 8.04 4 9.54 4.81 10.29 6.09 11.04 4.81 12.54 4 14.08 4 16.57 4 18.57 6 18.57 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  />
                </svg>
              </button>

              {/* Buy Now Button */}
              <BuyNowButton
                product={product}
                quantity={quantity}
                selectedVariantItemIds={selectedVariantItemIds}
                installationOption={installationOption}
                disabled={!allVariantsSelected}
              />


            </div>

            {/* Product Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4 pt-8 border-t border-[var(--storefront-border)]">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full border border-[var(--storefront-border)] flex items-center justify-center">
                  <div
                    className="w-7 h-7 bg-[var(--storefront-text-secondary)]"
                    style={{
                      maskImage: 'url(/icons/dollar-sign-svgrepo-com.svg)',
                      WebkitMaskImage: 'url(/icons/dollar-sign-svgrepo-com.svg)',
                      maskSize: 'contain',
                      maskRepeat: 'no-repeat',
                      maskPosition: 'center'
                    }}
                  />
                </div>
                <div>
                  <h4 className="font-bold text-[var(--storefront-text-primary)] text-sm">Low Prices</h4>
                  <p className="text-xs text-[var(--storefront-text-muted)]">Price match guarantee</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full border border-[var(--storefront-border)] flex items-center justify-center">
                  <div
                    className="w-7 h-7 bg-[var(--storefront-text-secondary)]"
                    style={{
                      maskImage: 'url(/icons/done-round-svgrepo-com.svg)',
                      WebkitMaskImage: 'url(/icons/done-round-svgrepo-com.svg)',
                      maskSize: 'contain',
                      maskRepeat: 'no-repeat',
                      maskPosition: 'center'
                    }}
                  />
                </div>
                <div>
                  <h4 className="font-bold text-[var(--storefront-text-primary)]  text-sm">Guaranteed Fitment.</h4>
                  <p className="text-xs text-[var(--storefront-text-muted)]">Always the correct part</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full border border-[var(--storefront-border)] flex items-center justify-center">
                  <div
                    className="w-7 h-7 bg-[var(--storefront-text-secondary)]"
                    style={{
                      maskImage: 'url(/icons/support-svgrepo-com.svg)',
                      WebkitMaskImage: 'url(/icons/support-svgrepo-com.svg)',
                      maskSize: 'contain',
                      maskRepeat: 'no-repeat',
                      maskPosition: 'center'
                    }}
                  />
                </div>
                <div>
                  <h4 className="font-bold text-[var(--storefront-text-primary)] text-sm">In-House Experts.</h4>
                  <p className="text-xs text-[var(--storefront-text-muted)]">We know our products</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full border border-[var(--storefront-border)] flex items-center justify-center">
                  <div
                    className="w-7 h-7 bg-[var(--storefront-text-secondary)]"
                    style={{
                      maskImage: 'url(/icons/return-svgrepo-com.svg)',
                      WebkitMaskImage: 'url(/icons/return-svgrepo-com.svg)',
                      maskSize: 'contain',
                      maskRepeat: 'no-repeat',
                      maskPosition: 'center'
                    }}
                  />
                </div>
                <div>
                  <h4 className="font-bold text-[var(--storefront-text-primary)] text-sm">Easy Returns.</h4>
                  <p className="text-xs text-[var(--storefront-text-muted)]">Quick & Hassle Free</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {product.description && (
        <div className="space-y-2 text-black mt-4">
          <h3 className='border-b border-[var(--storefront-border)] pb-2'>Description</h3>
          <p className="text-[var(--storefront-text-secondary)] leading-relaxed">{product.description}</p>
        </div>
      )}

      {/* Specifications */}
      {product.specifications && product.specifications.length > 0 && (
        <div className="mt-12 pt-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {product.specifications.map((spec, index) => (
              <div key={index} className="space-y-3">
                <h3 className="font-bold text-[var(--storefront-text-primary)] border-b border-[var(--storefront-border)] pb-2">{spec.title}</h3>
                <ul className="space-y-2">
                  {spec.items.map((item, iIndex) => (
                    <li key={iIndex} className="text-sm text-[var(--storefront-text-secondary)] flex gap-2">
                      <span className="text-[var(--storefront-text-muted)]">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
