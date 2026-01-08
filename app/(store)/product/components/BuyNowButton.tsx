'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';

import { useStorefrontCart } from '@/components/storefront/StorefrontCartProvider';
import { useToast } from '@/components/ui/Toast';
import { useCurrency } from "@/lib/currency/CurrencyContext";
import type { Product } from '@/lib/product/model/product.model';
import type { InstallationOption } from '@/lib/cart/cart.schema';
import {
  BillingDetailsForm,
  EMPTY_BILLING_DETAILS,
  type BillingDetailsFormErrors,
  type BillingDetailsFormValue,
  mapBillingDetailsToFormValue,
  toBillingDetailsPayload,
  validateBillingDetailsForm,
} from '@/components/storefront/BillingDetailsForm';

interface BuyNowButtonProps {
  product: Product;
  quantity: number;
  selectedVariantItemIds: string[];
  installationOption: InstallationOption;
  installationLocationId?: string;
  disabled?: boolean;
  maxAvailable: number | null;
  paymentProvider?: 'stripe' | 'tabby';
}


export function BuyNowButton({
  product,
  quantity,
  installationOption,
  installationLocationId,
  selectedVariantItemIds,
  disabled,
  maxAvailable,
  paymentProvider = 'stripe',
}: BuyNowButtonProps) {

  const { showToast } = useToast();
  const { billingDetails, saveBillingDetails } = useStorefrontCart();
  const { currency } = useCurrency();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditingBilling, setIsEditingBilling] = useState(!billingDetails);
  const [billingForm, setBillingForm] = useState<BillingDetailsFormValue>(() => mapBillingDetailsToFormValue(billingDetails));
  const [billingErrors, setBillingErrors] = useState<BillingDetailsFormErrors>({});
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  useEffect(() => {
    setBillingForm(mapBillingDetailsToFormValue(billingDetails));
    setIsEditingBilling(!billingDetails);
    setBillingErrors({});
  }, [billingDetails]);

  const itemPayload = useMemo(
    () => [
      {
        productId: product.id,
        quantity,
        selectedVariantItemIds,
        installationOption,
        installationLocationId,
      },
    ],
    [product.id, quantity, selectedVariantItemIds, installationOption, installationLocationId]
  );

  const startCheckout = async () => {
    const url = paymentProvider === 'tabby' ? '/api/tabby/checkout_session' : '/api/checkout_sessions';
    const method = 'POST';
    setIsProcessingCheckout(true);
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: itemPayload, currency }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok || !body?.url) {
        // Handle Tabby rejection reason specifically if available
        const errorMessage = body?.reason ? `Tabby rejected: ${body.reason}` : 'Failed to start checkout';
        showToast(errorMessage, 'error', {
          status: response.status,
          body,
          url,
          method,
        });
        // eslint-disable-next-line no-console
        console.error('Failed to start checkout:', body);
        return;
      }

      window.location.href = body.url as string;
    } catch (error: any) {
      const details =
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : { message: 'Unknown error', original: error };

      showToast('Error during buy now', 'error', {
        body: details,
        url,
        method,
      });
      // eslint-disable-next-line no-console
      console.error('Error during buy now:', error);
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validateBillingDetailsForm(billingForm);
    if (Object.keys(validationErrors).length > 0) {
      setBillingErrors(validationErrors);
      showToast('Please complete the building address.', 'error');
      return;
    }
    setIsSavingAddress(true);
    const payload = toBillingDetailsPayload(billingForm);
    const result = await saveBillingDetails(payload);
    setIsSavingAddress(false);
    if (result) {
      setIsEditingBilling(false);
    }
  };

  const handleBuyNow = () => {
    if (disabled) return;
    if (maxAvailable !== null && quantity > maxAvailable) {
      showToast('Lack of stock.', 'error');
      return;
    }
    setBillingForm(mapBillingDetailsToFormValue(billingDetails));
    setBillingErrors({});
    setIsEditingBilling(!billingDetails);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    if (isProcessingCheckout || isSavingAddress) return;
    setIsDialogOpen(false);
  };

  const isTabby = paymentProvider === 'tabby';

  return (
    <>
      <button
        type="button"
        className={`w-full py-3 px-2 rounded-lg font-semibold transition flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed ${isTabby
          ? 'bg-[#3EEDBF] text-black hover:bg-[#35d8ae]'
          : 'bg-black text-white hover:bg-gray-800'
          }`}
        disabled={disabled}
        onClick={handleBuyNow}
        aria-label={isTabby ? `Buy ${product.name} with Tabby` : `Buy ${product.name} now`}
      >
        {isProcessingCheckout ? (
          'Redirecting…'
        ) : (
          <div className="flex items-center justify-center gap-2">
            <span>{isTabby ? 'Buy with ' : 'Buy Now'}</span>
            {isTabby && (
              <img
                src="https://cdn.tabby.ai/assets/logo.svg"
                alt="Tabby"
                className="h-6 w-auto brightness-0"
              />
            )}
          </div>
        )}
      </button>
      {isDialogOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeDialog} />
          <div className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--storefront-bg)] p-4 sm:p-6 shadow-lg space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--storefront-text-primary)]">Confirm building address</h3>
              <button
                type="button"
                className="text-2xl text-[var(--storefront-text-secondary)] hover:text-[var(--storefront-text-primary)]"
                onClick={closeDialog}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {!isEditingBilling && billingDetails ? (
              <div className="space-y-4">
                <div className="bg-[var(--storefront-bg-subtle)] border border-[var(--storefront-border-light)] rounded-lg p-3 sm:p-4 space-y-4 text-sm text-[var(--storefront-text-secondary)]">
                  <p className="font-medium text-[var(--storefront-text-primary)]">
                    {billingDetails.firstName} {billingDetails.lastName}
                  </p>
                  <p>{billingDetails.email}</p>
                  <p>{billingDetails.phone}</p>
                  <div className="mt-2">
                    <p className="text-[var(--storefront-text-primary)]">{billingDetails.streetAddress1}</p>
                    {billingDetails.streetAddress2 && <p>{billingDetails.streetAddress2}</p>}
                    <p>
                      {billingDetails.city}
                      {billingDetails.stateOrCounty ? `, ${billingDetails.stateOrCounty}` : ''}, {billingDetails.country}
                    </p>
                  </div>
                  {billingDetails.orderNotes && (
                    <p className="mt-2 text-[var(--storefront-text-muted)]">Notes: {billingDetails.orderNotes}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex gap-2 text-sm">
                    <button
                      type="button"
                      className="text-[var(--storefront-button-primary)] hover:underline"
                      onClick={() => setIsEditingBilling(true)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-[var(--storefront-button-primary)] hover:underline"
                      onClick={() => {
                        setBillingForm({ ...EMPTY_BILLING_DETAILS, email: billingDetails.email });
                        setBillingErrors({});
                        setIsEditingBilling(true);
                      }}
                    >
                      Create another
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={startCheckout}
                    disabled={isProcessingCheckout}
                    className="inline-flex items-center justify-center rounded-md bg-[var(--storefront-button-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--storefront-button-primary-hover)] disabled:opacity-50 gap-2"
                  >
                    {isProcessingCheckout ? (
                      'Redirecting…'
                    ) : (
                      <>
                        {paymentProvider === 'tabby' && (
                          <img
                            src="https://cdn.tabby.ai/assets/logo.svg"
                            alt="Tabby"
                            className="h-3 w-auto brightness-0 invert"
                          />
                        )}
                        <span>{paymentProvider === 'tabby' ? 'Proceed with Tabby' : 'Continue to payment'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <p className="text-sm text-[var(--storefront-text-secondary)]">
                  We need your building address before we redirect you to payment.
                </p>
                <BillingDetailsForm value={billingForm} errors={billingErrors} onChange={(field, value) => {
                  setBillingForm((prev) => ({ ...prev, [field]: value }));
                  if (billingErrors[field]) {
                    setBillingErrors((prev) => {
                      const next = { ...prev };
                      delete next[field];
                      return next;
                    });
                  }
                }} />
                <div className="flex justify-end gap-2">
                  {billingDetails && (
                    <button
                      type="button"
                      className="px-4 py-2 rounded-md border border-[var(--storefront-border)] text-sm text-[var(--storefront-text-secondary)] hover:bg-[var(--storefront-bg-subtle)]"
                      onClick={() => {
                        setBillingForm(mapBillingDetailsToFormValue(billingDetails));
                        setBillingErrors({});
                        setIsEditingBilling(false);
                      }}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-md bg-[var(--storefront-button-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--storefront-button-primary-hover)] disabled:opacity-50"
                    disabled={isSavingAddress}
                  >
                    {isSavingAddress ? 'Saving…' : 'Save address'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
