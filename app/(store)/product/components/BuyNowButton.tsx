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
import { TabbyCheckoutCard } from '@/components/storefront/TabbyCheckoutCard';
import { getVariantCombinationKey } from '@/lib/product/product.utils';

interface BuyNowButtonProps {
  product: Product;
  quantity: number;
  selectedVariantItemIds: string[];
  installationOption: InstallationOption;
  installationLocationId?: string;
  disabled?: boolean;
  maxAvailable: number | null;
  tabbyConfig?: {
    publicKey: string;
    merchantCode: string;
  };
}

export function BuyNowButton({
  product,
  quantity,
  installationOption,
  installationLocationId,
  selectedVariantItemIds,
  disabled,
  maxAvailable,
  tabbyConfig,
}: BuyNowButtonProps) {

  const { showToast } = useToast();
  const { billingDetails, saveBillingDetails } = useStorefrontCart();
  const { currency, formatPrice } = useCurrency();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditingBilling, setIsEditingBilling] = useState(!billingDetails);
  const [billingForm, setBillingForm] = useState<BillingDetailsFormValue>(() => mapBillingDetailsToFormValue(billingDetails));
  const [billingErrors, setBillingErrors] = useState<BillingDetailsFormErrors>({});
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'stripe' | 'tabby'>('stripe');

  // Tabby Check State
  const [tabbyStatus, setTabbyStatus] = useState<'idle' | 'loading' | 'available' | 'rejected'>('idle');
  const [tabbyRejectionReason, setTabbyRejectionReason] = useState<string | null>(null);

  useEffect(() => {
    setBillingForm(mapBillingDetailsToFormValue(billingDetails));
    setIsEditingBilling(!billingDetails);
    setBillingErrors({});
  }, [billingDetails]);

  useEffect(() => {
    if (!isDialogOpen) {
      setSelectedProvider('stripe');
    }
  }, [isDialogOpen]);

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

  // Price Calculation for TabbyCard
  const totalPrice = useMemo(() => {
    // 1. Get Base Product Price (Variant or Base)
    let productPrice = product.basePrice;
    if (product.variantStock && product.variantStock.length > 0 && selectedVariantItemIds.length > 0) {
      const key = getVariantCombinationKey(selectedVariantItemIds);
      const entry = product.variantStock.find(vs => vs.variantCombinationKey === key);
      if (entry?.price && entry.price > 0) {
        productPrice = entry.price;
      }
    }

    // 2. Apply Discount
    if (product.offerPercentage && product.offerPercentage > 0) {
      productPrice = productPrice * (1 - product.offerPercentage / 100);
    }

    // 3. Add Installation Price
    let addOnPrice = 0;
    if (installationOption !== 'none' && product.installationService) {
      if (installationOption === 'store') {
        addOnPrice = product.installationService.inStorePrice ?? 0;
      } else if (installationOption === 'home') {
        const baseAtHome = product.installationService.atHomePrice ?? 0;
        const availableLocations = product.installationService.availableLocations?.filter(l => l.enabled) ?? [];
        const location = availableLocations.find(l => l.locationId === installationLocationId);
        addOnPrice = baseAtHome + (location?.priceDelta ?? 0);
      }
    }

    return (productPrice + addOnPrice) * quantity;
  }, [product, quantity, selectedVariantItemIds, installationOption, installationLocationId]);

  const checkTabbyAvailability = async () => {
    if (currency !== 'AED' || !tabbyConfig) return;

    setTabbyStatus('loading');
    setTabbyRejectionReason(null);
    try {
      const response = await fetch('/api/tabby/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency,
          items: itemPayload
        }),
      });
      const data = await response.json();
      if (data.available) {
        setTabbyStatus('available');
      } else {
        setTabbyStatus('rejected');
        setTabbyRejectionReason(data.reason || "Sorry, Tabby is unable to approve this purchase.");
        if (selectedProvider === 'tabby') {
          setSelectedProvider('stripe');
        }
      }
    } catch (error) {
      console.error("Tabby check failed", error);
      setTabbyStatus('rejected');
      setTabbyRejectionReason("Unable to verify Tabby availability.");
      if (selectedProvider === 'tabby') {
        setSelectedProvider('stripe');
      }
    }
  };

  useEffect(() => {
    if (isDialogOpen && billingDetails && currency === 'AED' && tabbyConfig) {
      checkTabbyAvailability();
    } else {
      setTabbyStatus('idle');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDialogOpen, billingDetails, currency, tabbyConfig]);


  const startCheckout = async () => {
    if (selectedProvider === 'tabby' && tabbyStatus === 'rejected') {
      showToast("Tabby is not available for this purchase.", "error");
      return;
    }

    const url = selectedProvider === 'tabby' ? '/api/tabby/checkout_session' : '/api/checkout_sessions';
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
        let errorMessage = body?.reason || body?.message || body?.error || 'Failed to start checkout';

        if (selectedProvider === 'tabby') {
          if (body?.reason) {
            errorMessage = body.reason;
          } else {
            errorMessage = 'Sorry, Tabby is unable to approve this purchase. Please use an alternative payment method for your order';
          }
        }

        showToast(errorMessage, 'error', {
          status: response.status,
          body,
          url,
          method,
        });
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

  return (
    <>
      <button
        type="button"
        className="w-full py-3 px-2 rounded-lg font-semibold transition flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed bg-black text-white hover:bg-gray-800"
        disabled={disabled}
        onClick={handleBuyNow}
        aria-label={`Buy ${product.name} now`}
      >
        {isProcessingCheckout ? 'Redirecting…' : 'Buy Now'}
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

                <div className="space-y-3 pt-4 border-t border-[var(--storefront-border-light)]">
                  <h4 className="font-semibold text-[var(--storefront-text-primary)]">Select Payment Method</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <label className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition ${selectedProvider === 'stripe' ? 'border-black bg-gray-50' : 'border-gray-200'}`}>
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="paymentProvider"
                          value="stripe"
                          checked={selectedProvider === 'stripe'}
                          onChange={() => setSelectedProvider('stripe')}
                          className="w-4 h-4 text-black focus:ring-black"
                        />
                        <span className="font-medium text-sm text-[var(--storefront-text-primary)]">Standard Checkout (Card, Apple Pay)</span>
                      </div>
                    </label>

                    {currency === 'AED' && tabbyConfig && (
                      <label className={`flex flex-col p-3 border rounded-lg transition ${selectedProvider === 'tabby' ? 'border-[#3EEDBF] bg-[#3EEDBF]/5' : 'border-gray-200'} ${tabbyStatus === 'rejected' ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="paymentProvider"
                              value="tabby"
                              checked={selectedProvider === 'tabby'}
                              onChange={() => setSelectedProvider('tabby')}
                              disabled={tabbyStatus === 'rejected'}
                              className="w-4 h-4 text-[#3EEDBF] focus:ring-[#3EEDBF]"
                            />
                            <div className="flex items-center gap-2">
                              <img src="https://cdn.tabby.ai/assets/logo.svg" alt="Tabby" className="h-6 w-auto" />
                            </div>
                          </div>
                        </div>

                        {/* Tabby Checkout Card */}
                        {tabbyStatus === 'available' && tabbyConfig && (
                          <div className="mt-3 ml-7">
                            <TabbyCheckoutCard
                              price={totalPrice}
                              currency={currency}
                              publicKey={tabbyConfig.publicKey}
                              merchantCode={tabbyConfig.merchantCode}
                              lang="en"
                            />
                          </div>
                        )}

                        {tabbyStatus === 'rejected' && tabbyRejectionReason && (
                          <p className="text-xs text-red-500 mt-2 ml-7">{tabbyRejectionReason?.replaceAll("_", " ")}</p>
                        )}
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--storefront-border-light)] pt-4">
                  <div className="flex gap-2 text-sm">
                    <button
                      type="button"
                      className="text-[var(--storefront-button-primary)] hover:underline"
                      onClick={() => setIsEditingBilling(true)}
                    >
                      Edit Address
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
                      New Address
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={startCheckout}
                    disabled={isProcessingCheckout || (selectedProvider === 'tabby' && tabbyStatus !== 'available')}
                    className={`inline-flex items-center justify-center rounded-md px-6 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 gap-2 ${selectedProvider === 'tabby' ? 'bg-[#3EEDBF] text-black hover:bg-[#35d8ae]' : 'bg-[var(--storefront-button-primary)]'}`}
                  >
                    {isProcessingCheckout ? (
                      'Redirecting…'
                    ) : (
                      <>
                        {selectedProvider === 'tabby' ? (
                          <>
                            <span className='text-black'>Pay with</span>
                            <img src="https://cdn.tabby.ai/assets/logo.svg" alt="Tabby" className="h-5 w-auto brightness-0" />
                          </>
                        ) : (
                          'Proceed to Payment'
                        )}
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <p className="text-sm text-[var(--storefront-text-secondary)]">
                  We need your billing address before we redirect you to payment.
                </p>
                <BillingDetailsForm value={billingForm} errors={billingErrors} onChange={(field, value) => {
                  setBillingForm((prev) => ({ ...prev, [field]: value }));
                  if (billingErrors[field as keyof BillingDetailsFormValue]) {
                    setBillingErrors((prev) => {
                      const next = { ...prev };
                      delete next[field as keyof BillingDetailsFormValue];
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
