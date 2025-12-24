'use client';

import { useMemo, useState } from 'react';
import { Product, isProductInStock } from '@/lib/product/model/product.model';
import { useStorefrontWishlist } from '@/components/storefront/StorefrontWishlistProvider';
import { useStorefrontCart } from '@/components/storefront/StorefrontCartProvider';
import { getVariantCombinationKey } from '@/lib/product/product.utils';
import { useToast } from '@/components/ui/Toast';
import { useCurrency } from '@/lib/currency/CurrencyContext';
import { ProductImageGallery } from './ProductImageGallery';
import { BuyNowButton } from './BuyNowButton';
import { StockStatus } from '@/components/storefront/StockStatus';
import type { InstallationOption } from '@/lib/cart/cart.schema';

interface ProductDetailsProps {
  product: Product;
}




export function ProductDetails({ product }: ProductDetailsProps) {
  const { isInWishlist, toggleWishlistItem } = useStorefrontWishlist();
  const inWishlist = isInWishlist(product.id, []);
  const { formatPrice } = useCurrency();

  const { addToCart, isLoading } = useStorefrontCart();
  const { showToast } = useToast();
  const [quantity, setQuantity] = useState<number>(1);
  const [installationOption, setInstallationOption] = useState<InstallationOption>('none');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [selectedVariantItems, setSelectedVariantItems] = useState<Record<string, string | null>>({});

  const installationService = product.installationService;
  const availableLocations = installationService?.availableLocations?.filter(l => l.enabled) ?? [];

  const addOnPrice = useMemo(() => {
    if (installationOption === 'none') return 0;
    if (installationOption === 'store') return installationService?.inStorePrice ?? 0;
    if (installationOption === 'home') {
      const baseAtHome = installationService?.atHomePrice ?? 0;
      const location = availableLocations.find(l => l.locationId === selectedLocationId);
      return baseAtHome + (location?.priceDelta ?? 0);
    }
    return 0;
  }, [installationOption, installationService, availableLocations, selectedLocationId]);

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
      return true;
    }

    const key = getVariantCombinationKey(combinationItemIds);
    const stock = stockByKey.get(key);

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

      next[variantTypeId] = current === itemId ? null : itemId;
      return next;
    });
  };

  const selectedVariantPrice = useMemo(() => {
    if (!product.variantStock || product.variantStock.length === 0 || selectedVariantItemIds.length === 0) {
      return null;
    }
    const key = getVariantCombinationKey(selectedVariantItemIds);
    const entry = product.variantStock.find(vs => vs.variantCombinationKey === key);

    // Treat 0 or negative price as "use base price"
    if (entry?.price && entry.price > 0) {
      return entry.price;
    }
    return null;
  }, [product.variantStock, selectedVariantItemIds]);

  const hasVariants = Boolean(product.variants && product.variants.length > 0);
  const allVariantsSelected = useMemo(() => {
    if (!hasVariants || !product.variants) return true;
    return product.variants.every(variant => {
      if (!variant.selectedItems || variant.selectedItems.length === 0) {
        return true;
      }
      return Boolean(selectedVariantItems[variant.variantTypeId]);
    });
  }, [hasVariants, product.variants, selectedVariantItems]);

  const isLocationValid = installationOption !== 'home' || (installationOption === 'home' && Boolean(selectedLocationId));

  const currentStockLimit = useMemo(() => {
    if (hasVariantStock && product.variantStock && product.variantStock.length > 0) {
      const key = getVariantCombinationKey(selectedVariantItemIds);
      const stock = stockByKey.get(key);
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
    return isProductInStock(product);
  }, [allVariantsSelected, currentStockLimit, product]);

  const finalPrice = useMemo(() => {
    // Determine the base product price (without add-ons) to show in the cart
    const effectiveBase = selectedVariantPrice ?? product.basePrice;

    // Apply offer percentage if present
    let effectiveProductPrice = effectiveBase;
    if (product.offerPercentage && product.offerPercentage > 0) {
      effectiveProductPrice = effectiveBase * (1 - product.offerPercentage / 100);
    }

    return effectiveProductPrice + addOnPrice;
  }, [product.basePrice, product.offerPercentage, selectedVariantPrice, addOnPrice]);

  const selectedVariantDetails = useMemo(() => {
    if (!product.variantStock || product.variantStock.length === 0 || selectedVariantItemIds.length === 0) {
      return null;
    }
    const key = getVariantCombinationKey(selectedVariantItemIds);
    return product.variantStock.find(vs => vs.variantCombinationKey === key);
  }, [product.variantStock, selectedVariantItemIds]);

  const displayTitle = selectedVariantDetails?.variantTitle || product.name;
  const displaySubtitle = selectedVariantDetails?.variantSubtitle || product.subtitle;
  const displayDescription = selectedVariantDetails?.variantDescription || product.description;

  return (
    <div className='flex flex-col'>
      <div className="grid gap-8 lg:grid-cols-[2fr_3fr]">
        <ProductImageGallery product={product} selectedVariantItemIds={selectedVariantItemIds} />

        <div className="space-y-6 min-w-0">

          <h1 className="text-3xl font-bold text-[var(--storefront-text-primary)] break-words">{displayTitle}</h1>

          <div className="flex items-baseline gap-3">
            {(() => {
              const discountPct = product.offerPercentage ?? 0;
              const hasDiscount = discountPct > 0;

              // Base price (variant override OR product base)
              const rawBase = selectedVariantPrice ?? product.basePrice;
              const baseWithAddon = rawBase + addOnPrice;

              if (hasDiscount) {
                const discountedPrice = rawBase * (1 - discountPct / 100);
                const discountedWithAddon = discountedPrice + addOnPrice;

                return (
                  <>
                    <span className="text-4xl font-bold text-[var(--storefront-sale)]">
                      {formatPrice(discountedWithAddon)}
                    </span>
                    <span className="text-xl text-[var(--storefront-text-muted)] line-through">
                      {formatPrice(baseWithAddon)}
                    </span>
                    <span className="text-sm font-semibold text-[var(--storefront-sale)]">
                      Save {Math.round(discountPct)}%
                    </span>
                  </>
                );
              }

              return (
                <span className="text-4xl font-bold text-[var(--storefront-text-primary)]">
                  {formatPrice(finalPrice)}
                </span>
              );
            })()}
          </div>

          {displaySubtitle && (
            <p className="text-lg font-medium text-[var(--storefront-text-secondary)] -mt-4 break-words">{displaySubtitle}</p>
          )}

          <StockStatus inStock={displayInStock} />

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

          {product.installationService?.enabled && (
            <div className="border-t border-[var(--storefront-border)] pt-4 space-y-4">
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
                    className="flex items-center gap-3 px-3 py-1 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="installation-option"
                      value={option.key}
                      checked={installationOption === option.key}
                      onChange={() => {
                        setInstallationOption(option.key);
                        if (option.key !== 'home') {
                          setSelectedLocationId('');
                        }
                      }}
                      className="h-4 w-4 text-[var(--storefront-brand)] border-gray-300 focus:ring-[var(--storefront-brand)]"
                    />
                    <div className="flex justify-between w-full">
                      <span className="text-[var(--storefront-text-primary)] text-sm">{option.label}</span>
                      <span className="text-xs text-[var(--storefront-text-secondary)]">
                        {option.key === 'none' ? 'Free' : formatPrice(option.price)}
                      </span>
                    </div>
                  </label>
                ))}
              </div>

              {installationOption === 'home' && availableLocations.length > 0 && (
                <div className="pl-7 space-y-2">
                  <label className="text-sm font-medium text-[var(--storefront-text-primary)]">
                    Select Installation Location
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    className="w-full p-2 border border-[var(--storefront-border)] rounded-md bg-[var(--storefront-bg)] text-[var(--storefront-text-primary)] text-sm"
                  >
                    <option value="" disabled>Select a location...</option>
                    {availableLocations.map(loc => (
                      <option key={loc.locationId} value={loc.locationId}>
                        {loc.name} {loc.priceDelta > 0 ? `(+${formatPrice(loc.priceDelta)})` : ''}
                      </option>
                    ))}
                  </select>
                  {!selectedLocationId && (
                    <p className="text-xs text-red-500 animate-pulse">
                      Please select a location to continue.
                    </p>
                  )}
                </div>
              )}

              <p className="text-sm text-[var(--storefront-text-secondary)]">
                Selected installation add-on: {formatPrice(addOnPrice)}
              </p>
            </div>
          )}

          <div className="space-y-4">
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

              <button
                type="button"
                className="w-full py-3 px-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={isLoading || !allVariantsSelected || !isLocationValid}
                onClick={async () => {
                  if (currentStockLimit !== null && quantity > currentStockLimit) {
                    showToast('Lack of stock.', 'error');
                    return;
                  }
                  await addToCart(product.id, selectedVariantItemIds, quantity, installationOption, selectedLocationId);
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
              <BuyNowButton
                product={product}
                quantity={quantity}
                selectedVariantItemIds={selectedVariantItemIds}
                installationOption={installationOption}
                installationLocationId={selectedLocationId}
                disabled={!allVariantsSelected || !isLocationValid}
                maxAvailable={currentStockLimit}
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

      {displayDescription && (
        <div className="space-y-2 text-black mt-4">
          <h3 className='border-b border-[var(--storefront-border)] pb-2'>Description</h3>
          <div className="text-[var(--storefront-text-secondary)] leading-relaxed break-words [&_p]:mb-4 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-blue-600 [&_a]:underline [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-bold [&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg [&_h1]:mb-4 [&_h2]:mb-3 [&_h3]:mb-2" dangerouslySetInnerHTML={{ __html: displayDescription }} />
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
                      <span className="break-words">{item}</span>
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
