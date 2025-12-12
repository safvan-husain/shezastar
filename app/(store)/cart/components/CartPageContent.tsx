'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { Cart } from "@/lib/cart";
import type { Product } from "@/lib/product/model/product.model";
import { useStorefrontCart } from "@/components/storefront/StorefrontCartProvider";
import { GuestAuthBanner } from "@/components/storefront/GuestAuthBanner";
import { getVariantCombinationKey } from "@/lib/product/product.utils";
import CheckoutButton from "./CheckoutButton";
import { useToast } from "@/components/ui/Toast";
import {
  BillingDetailsForm,
  EMPTY_BILLING_DETAILS,
  type BillingDetailsFormErrors,
  type BillingDetailsFormValue,
  mapBillingDetailsToFormValue,
  toBillingDetailsPayload,
  validateBillingDetailsForm,
} from "@/components/storefront/BillingDetailsForm";

interface CartPageContentProps {
  initialCart: Cart | null;
  productsById: Record<string, Product | null>;
  stockIssuesByLineKey?: Record<
    string,
    {
      requested: number;
      available: number;
    }
  >;
  isStockValid?: boolean;
}

function formatPrice(value: number) {
  return `AED ${value.toFixed(2)}`;
}

function computeAvailableStock(product: Product | null, selectedVariantItemIds: string[]): number | null {
  if (!product) return null;

  const hasVariantStock = Array.isArray(product.variantStock) && product.variantStock.length > 0;

  if (hasVariantStock) {
    const key = getVariantCombinationKey(selectedVariantItemIds);
    const entry = product.variantStock.find((vs) => vs.variantCombinationKey === key);
    if (typeof entry?.stockCount === "number") {
      return entry.stockCount;
    }
  }

  return null;
}

export function CartPageContent({
  initialCart,
  productsById,
  stockIssuesByLineKey = {},
  isStockValid = true,
}: CartPageContentProps) {
  const {
    cart,
    items,
    subtotal,
    totalItems,
    updateItem,
    removeItem,
    clearCart,
    isLoading,
    billingDetails,
    saveBillingDetails,
  } = useStorefrontCart();

  const effectiveCart = cart ?? initialCart;
  const effectiveItems = items.length > 0 ? items : effectiveCart?.items ?? [];
  const { showToast } = useToast();
  const billingSectionRef = useRef<HTMLDivElement>(null);
  const currentBillingDetails = billingDetails ?? effectiveCart?.billingDetails ?? null;
  const [isEditingBilling, setIsEditingBilling] = useState(() => !currentBillingDetails);
  const [billingForm, setBillingForm] = useState<BillingDetailsFormValue>(() =>
    mapBillingDetailsToFormValue(currentBillingDetails)
  );
  const [billingErrors, setBillingErrors] = useState<BillingDetailsFormErrors>({});

  useEffect(() => {
    if (currentBillingDetails) {
      setBillingForm(mapBillingDetailsToFormValue(currentBillingDetails));
      setBillingErrors({});
      setIsEditingBilling(false);
    }
  }, [currentBillingDetails]);

  const handleBillingFieldChange = (field: keyof BillingDetailsFormValue, value: string) => {
    setBillingForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (billingErrors[field]) {
      setBillingErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleBillingSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validateBillingDetailsForm(billingForm);
    if (Object.keys(validationErrors).length > 0) {
      setBillingErrors(validationErrors);
      showToast("Please complete the building address before checkout.", "error");
      billingSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const payload = toBillingDetailsPayload(billingForm);
    const result = await saveBillingDetails(payload);
    if (result) {
      setBillingErrors({});
      setIsEditingBilling(false);
    }
  };

  const handleMissingBillingDetails = () => {
    showToast("Please add your building address before checkout.", "error", {
      status: 400,
      url: "/api/checkout_sessions",
      method: "POST",
    });
    setIsEditingBilling(true);
    billingSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const startNewAddress = () => {
    setBillingErrors({});
    setBillingForm({
      ...EMPTY_BILLING_DETAILS,
      email: currentBillingDetails?.email ?? "",
    });
    setIsEditingBilling(true);
  };

  const cancelBillingEdit = () => {
    setBillingErrors({});
    setBillingForm(mapBillingDetailsToFormValue(currentBillingDetails));
    setIsEditingBilling(false);
  };

  const { hasStockIssues, firstIssueAvailable } = useMemo(() => {
    if (!effectiveItems.length) {
      return { hasStockIssues: false, firstIssueAvailable: null as number | null };
    }

    let hasIssue = false;
    let firstAvailable: number | null = null;

    for (const item of effectiveItems) {
      const product = productsById[item.productId] ?? null;
      const variantKey = getVariantCombinationKey(item.selectedVariantItemIds);
      const lineKey = `${item.productId}|${variantKey}`;
      const stockIssue = stockIssuesByLineKey[lineKey];

      const stockFromProduct = computeAvailableStock(product, item.selectedVariantItemIds);
      const availableForLine =
        stockIssue && typeof stockIssue.available === "number"
          ? stockIssue.available
          : stockFromProduct;

      if (availableForLine != null && item.quantity > availableForLine) {
        hasIssue = true;
        if (firstAvailable == null) {
          firstAvailable = availableForLine;
        }
      }
    }

    return { hasStockIssues: hasIssue, firstIssueAvailable: firstAvailable };
  }, [effectiveItems, productsById, stockIssuesByLineKey]);

  if (!effectiveCart || effectiveItems.length === 0) {
    return (
      <div className="space-y-6">
        <GuestAuthBanner />
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
      </div>
    );
  }

  const hasBillingDetails = Boolean(currentBillingDetails);

  return (
    <div className="space-y-8">
      <GuestAuthBanner />
      <div
        ref={billingSectionRef}
        className="rounded-lg border border-[var(--storefront-border-light)] bg-[var(--storefront-bg)] p-6 space-y-4"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--storefront-text-primary)]">
              Building address
            </h2>
            <p className="text-sm text-[var(--storefront-text-secondary)]">
              We’ll use this information for billing and delivery coordination before payment.
            </p>
          </div>
          {hasBillingDetails && !isEditingBilling ? (
            <div className="flex gap-2">
              <button
                type="button"
                className="text-sm text-[var(--storefront-button-primary)] hover:underline"
                onClick={() => {
                  setBillingForm(mapBillingDetailsToFormValue(currentBillingDetails));
                  setIsEditingBilling(true);
                }}
              >
                Edit
              </button>
              <button
                type="button"
                className="text-sm text-[var(--storefront-button-primary)] hover:underline"
                onClick={startNewAddress}
              >
                Add another
              </button>
            </div>
          ) : !isEditingBilling ? (
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-[var(--storefront-border)] px-4 py-2 text-sm font-medium text-[var(--storefront-text-primary)] hover:bg-[var(--storefront-bg-subtle)]"
              onClick={startNewAddress}
            >
              Create building address
            </button>
          ) : null}
        </div>

        {hasBillingDetails && !isEditingBilling && currentBillingDetails && (
          <div className="grid gap-3 text-sm text-[var(--storefront-text-secondary)]">
            <div>
              <p className="text-[var(--storefront-text-muted)] text-xs uppercase tracking-wide">
                Contact
              </p>
              <p className="font-medium text-[var(--storefront-text-primary)]">
                {currentBillingDetails.firstName} {currentBillingDetails.lastName}
              </p>
              <p>{currentBillingDetails.email}</p>
              <p>{currentBillingDetails.phone}</p>
            </div>
            <div>
              <p className="text-[var(--storefront-text-muted)] text-xs uppercase tracking-wide">
                Address
              </p>
              <p className="text-[var(--storefront-text-primary)] font-medium">
                {currentBillingDetails.streetAddress1}
              </p>
              {currentBillingDetails.streetAddress2 && <p>{currentBillingDetails.streetAddress2}</p>}
              <p>
                {currentBillingDetails.city}
                {currentBillingDetails.stateOrCounty ? `, ${currentBillingDetails.stateOrCounty}` : ""},{" "}
                {currentBillingDetails.country}
              </p>
            </div>
            {currentBillingDetails.orderNotes && (
              <div>
                <p className="text-[var(--storefront-text-muted)] text-xs uppercase tracking-wide">
                  Notes
                </p>
                <p className="text-[var(--storefront-text-primary)]">{currentBillingDetails.orderNotes}</p>
              </div>
            )}
          </div>
        )}

        {!hasBillingDetails && !isEditingBilling && (
          <div className="rounded-md border border-dashed border-[var(--storefront-border-light)] bg-[var(--storefront-bg-subtle)] p-4 text-sm text-[var(--storefront-text-secondary)]">
            Building address is required to continue. Add your email, phone, and location details so we can prepare your order.
          </div>
        )}

        {isEditingBilling && (
          <form onSubmit={handleBillingSubmit} className="space-y-4">
            <BillingDetailsForm value={billingForm} errors={billingErrors} onChange={handleBillingFieldChange} />
            <div className="flex justify-end gap-2">
              {hasBillingDetails && (
                <button
                  type="button"
                  className="px-4 py-2 rounded-md border border-[var(--storefront-border)] text-sm text-[var(--storefront-text-secondary)] hover:bg-[var(--storefront-bg-subtle)]"
                  onClick={cancelBillingEdit}
                  disabled={isLoading}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md bg-[var(--storefront-button-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--storefront-button-primary-hover)] disabled:opacity-50"
                disabled={isLoading}
              >
                Save address
              </button>
            </div>
          </form>
        )}
      </div>
      <div className="space-y-4">
        {effectiveItems.map((item) => {
          const product = productsById[item.productId] ?? null;
          const imageUrl = product?.images?.[0]?.url;

          const lineTotal = item.unitPrice * item.quantity;
          const variantKey = getVariantCombinationKey(item.selectedVariantItemIds);
          const lineKey = `${item.productId}|${variantKey}`;
          const stockIssue = stockIssuesByLineKey[lineKey];
          const stockFromProduct = computeAvailableStock(product, item.selectedVariantItemIds);
          const availableForLine =
            stockIssue && typeof stockIssue.available === "number"
              ? stockIssue.available
              : stockFromProduct;
          const isOutOfStock =
            availableForLine != null && item.quantity > availableForLine;

          return (
            <div
              key={lineKey}
              className={[
                "flex gap-4 border-b pb-4 rounded-md",
                isOutOfStock
                  ? "border-[var(--storefront-sale)] bg-[var(--storefront-sale-bg)]"
                  : "border-[var(--storefront-border-light)]",
              ].join(" ")}
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
                    {isOutOfStock && (
                      <p className="mt-2 text-xs text-[var(--storefront-sale-text)]">
                        This product has not this much count.{" "}
                        {availableForLine != null && (
                          <>
                            There is only {availableForLine} left.{" "}
                          </>
                        )}
                        Please adjust the count.
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
                        disabled={
                          isLoading ||
                          (availableForLine != null && item.quantity >= availableForLine)
                        }
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
          {hasStockIssues && (
            <p className="text-xs text-[var(--storefront-sale-text)] text-right">
              Some items exceed available stock. Please adjust quantities before checkout.
            </p>
          )}
          <div className="mt-4 w-full md:w-auto">
            <CheckoutButton
              hasStockIssues={hasStockIssues}
              availableCount={firstIssueAvailable ?? undefined}
              hasBillingDetails={hasBillingDetails}
              onMissingBillingDetails={handleMissingBillingDetails}
            />
            {!hasBillingDetails && (
              <p className="mt-2 text-xs text-[var(--storefront-sale-text)] text-right">
                Add your building address above to continue to checkout.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

