'use client';

import Image from "next/image";
import Link from "next/link";
import type { Cart } from "@/lib/cart";
import type { Product } from "@/lib/product/model/product.model";
import { useStorefrontCart } from "@/components/storefront/StorefrontCartProvider";

interface CartPageContentProps {
  initialCart: Cart | null;
  productsById: Record<string, Product | null>;
}

function formatPrice(value: number) {
  return `AED ${value.toFixed(2)}`;
}

export function CartPageContent({ initialCart, productsById }: CartPageContentProps) {
  const {
    cart,
    items,
    subtotal,
    totalItems,
    updateItem,
    removeItem,
    clearCart,
    isLoading,
  } = useStorefrontCart();

  const effectiveCart = cart ?? initialCart;
  const effectiveItems = items.length > 0 ? items : effectiveCart?.items ?? [];

  if (!effectiveCart || effectiveItems.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--storefront-border-light)] bg-[var(--storefront-bg-subtle)] p-8 text-center space-y-4">
        <p className="text-lg text-[var(--storefront-text-secondary)]">
          Your cart is currently empty.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 rounded-md bg-[var(--storefront-button-primary)] text-white text-sm font-medium hover:bg-[var(--storefront-button-primary-hover)] transition"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        {effectiveItems.map((item) => {
          const product = productsById[item.productId] ?? null;
          const imageUrl = product?.images?.[0]?.url;

          const lineTotal = item.unitPrice * item.quantity;

          return (
            <div
              key={`${item.productId}-${item.selectedVariantItemIds.join(",")}`}
              className="flex gap-4 border-b border-[var(--storefront-border-light)] pb-4"
            >
              <div className="w-24 h-24 relative flex-shrink-0 rounded-md overflow-hidden bg-[var(--storefront-bg-subtle)]">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={product?.name ?? "Cart item"}
                    fill
                    sizes="96px"
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[var(--storefront-text-muted)] text-xs">
                    No image
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[var(--storefront-text-primary)]">
                      {product?.name ?? "Product unavailable"}
                    </p>
                    {product ? (
                      <p className="text-sm text-[var(--storefront-text-secondary)]">
                        {product.description}
                      </p>
                    ) : (
                      <p className="text-xs text-[var(--storefront-text-muted)]">
                        This product is no longer available.
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    className="text-xs text-[var(--storefront-text-muted)] hover:text-[var(--storefront-text-primary)]"
                    disabled={isLoading}
                    onClick={async () => {
                      await removeItem(item.productId, item.selectedVariantItemIds);
                    }}
                  >
                    Remove
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-[var(--storefront-text-secondary)]">
                      Quantity
                    </span>
                    <div className="inline-flex items-center gap-2 rounded-md border border-[var(--storefront-border-light)] bg-[var(--storefront-bg-subtle)] px-2 py-1">
                      <button
                        type="button"
                        className="px-2 text-sm text-[var(--storefront-text-primary)] disabled:opacity-50"
                        disabled={isLoading || item.quantity <= 1}
                        onClick={async () => {
                          await updateItem(
                            item.productId,
                            item.selectedVariantItemIds,
                            item.quantity - 1
                          );
                        }}
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="min-w-[2rem] text-center text-sm text-[var(--storefront-text-primary)]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className="px-2 text-sm text-[var(--storefront-text-primary)] disabled:opacity-50"
                        disabled={isLoading}
                        onClick={async () => {
                          await updateItem(
                            item.productId,
                            item.selectedVariantItemIds,
                            item.quantity + 1
                          );
                        }}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <p className="text-sm text-[var(--storefront-text-secondary)]">
                      Unit price
                    </p>
                    <p className="font-semibold text-[var(--storefront-text-primary)]">
                      {formatPrice(item.unitPrice)}
                    </p>
                    <p className="text-xs text-[var(--storefront-text-muted)]">
                      Line total: {formatPrice(lineTotal)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button
          type="button"
          className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-[var(--storefront-border-light)] bg-[var(--storefront-button-secondary)] text-sm font-medium text-[var(--storefront-text-primary)] hover:bg-[var(--storefront-button-secondary-hover)] transition disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={isLoading}
          onClick={async () => {
            await clearCart();
          }}
        >
          Clear cart
        </button>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-4">
            <span className="text-sm text-[var(--storefront-text-secondary)]">
              Items:
            </span>
            <span className="text-base font-semibold text-[var(--storefront-text-primary)]">
              {totalItems || effectiveItems.reduce((acc, item) => acc + item.quantity, 0)}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[var(--storefront-text-secondary)]">
              Subtotal:
            </span>
            <span className="text-xl font-bold text-[var(--storefront-text-primary)]">
              {formatPrice(subtotal || effectiveItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0))}
            </span>
          </div>
          <p className="text-xs text-[var(--storefront-text-muted)]">
            Taxes and shipping calculated at checkout.
          </p>
        </div>
      </div>
    </div>
  );
}

