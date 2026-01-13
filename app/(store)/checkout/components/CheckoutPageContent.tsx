
"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useStorefrontCart } from "@/components/storefront/StorefrontCartProvider";
import { useToast } from "@/components/ui/Toast";
import { useCurrency } from "@/lib/currency/CurrencyContext";
import type { Cart } from "@/lib/cart";
import type { Product } from "@/lib/product/model/product.model";
import {
    BillingDetailsForm,
    EMPTY_BILLING_DETAILS,
    BillingDetailsFormValue,
    BillingDetailsFormErrors,
    mapBillingDetailsToFormValue,
    validateBillingDetailsForm,
    toBillingDetailsPayload
} from "@/components/storefront/BillingDetailsForm";
import { getVariantCombinationKey } from "@/lib/product/product.utils";

interface CheckoutPageContentProps {
    initialCart: Cart | null;
    productsById: Record<string, Product | null>;
    stockIssuesByLineKey?: Record<string, { requested: number; available: number }>;
    isStockValid?: boolean;
    tabbyConfig?: {
        publicKey: string;
        merchantCode: string;
    };
}

export function CheckoutPageContent({
    initialCart,
    productsById,
    stockIssuesByLineKey = {},
    isStockValid = true,
    tabbyConfig,
}: CheckoutPageContentProps) {
    const {
        cart,
        items,
        subtotal,
        billingDetails,
        saveBillingDetails,
        isLoading
    } = useStorefrontCart();

    const { formatPrice, currency } = useCurrency();
    const { showToast } = useToast();
    const router = useRouter();

    const effectiveCart = cart ?? initialCart;
    const effectiveItems = items.length > 0 ? items : effectiveCart?.items ?? [];

    const currentBillingDetails = billingDetails ?? effectiveCart?.billingDetails ?? null;
    const hasBillingDetails = Boolean(currentBillingDetails);

    // Address Form State
    const [isEditingBilling, setIsEditingBilling] = useState(() => !currentBillingDetails);
    const [billingForm, setBillingForm] = useState<BillingDetailsFormValue>(() =>
        mapBillingDetailsToFormValue(currentBillingDetails)
    );
    const [billingErrors, setBillingErrors] = useState<BillingDetailsFormErrors>({});

    // Payment State
    const [selectedProvider, setSelectedProvider] = useState<'stripe' | 'tabby'>('stripe');
    const [tabbyStatus, setTabbyStatus] = useState<'idle' | 'loading' | 'available' | 'rejected'>('idle');
    const [tabbyRejectionReason, setTabbyRejectionReason] = useState<string | null>(null);
    const [isProcessingOrder, setIsProcessingOrder] = useState(false);

    // Check Tabby Availability
    useEffect(() => {
        if (currency === 'AED' && hasBillingDetails && tabbyConfig) {
            checkTabbyAvailability();
        } else {
            setTabbyStatus('idle');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currency, hasBillingDetails, tabbyConfig]); // Re-check if details change? Maybe debounce or only on mount/valid

    const checkTabbyAvailability = async () => {
        setTabbyStatus('loading');
        setTabbyRejectionReason(null);
        try {
            const response = await fetch('/api/tabby/availability', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currency }), // Optional body if needed
            });
            const data = await response.json();
            if (data.available) {
                setTabbyStatus('available');
            } else {
                setTabbyStatus('rejected');
                setTabbyRejectionReason(data.reason || "Sorry, Tabby is unable to approve this purchase. Please use an alternative payment method for your order.");
                if (selectedProvider === 'tabby') {
                    setSelectedProvider('stripe'); // Fallback
                }
            }
        } catch (error) {
            console.error("Tabby check failed", error);
            setTabbyStatus('rejected'); // Default to rejected on error to be safe? Or allow retry?
            setTabbyRejectionReason("Unable to verify Tabby availability using your current details.");
        }
    };

    // Address Handlers
    const handleBillingSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const validationErrors = validateBillingDetailsForm(billingForm);
        if (Object.keys(validationErrors).length > 0) {
            setBillingErrors(validationErrors);
            showToast("Please complete the billing address.", "error");
            return;
        }

        const payload = toBillingDetailsPayload(billingForm);
        const result = await saveBillingDetails(payload);
        if (result) {
            setBillingErrors({});
            setIsEditingBilling(false);
            // Tabby check will trigger via useEffect
        }
    };

    /* Payment Handlers */
    const handlePlaceOrder = async () => {
        if (!hasBillingDetails) {
            showToast("Please complete address details.", "error");
            setIsEditingBilling(true);
            return;
        }

        if (selectedProvider === 'tabby' && tabbyStatus === 'rejected') {
            showToast("Tabby is not available for this order.", "error");
            return;
        }

        setIsProcessingOrder(true);
        const url = selectedProvider === 'tabby' ? "/api/tabby/checkout_session" : "/api/checkout_sessions";

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currency }),
            });
            const body = await response.json();

            if (!response.ok || !body?.url) {
                const msg = body?.error || body?.message || "Failed to start checkout";
                showToast(msg, "error");
                console.error("Checkout failed:", body);

                // If stock issue
                if (response.status === 400 && body?.error === 'Insufficient stock') {
                    // Handle stock error UI if needed (refresh page or show toast)
                    // For now, toast is enough
                }
                setIsProcessingOrder(false);
                return;
            }

            window.location.href = body.url;

        } catch (error) {
            console.error(error);
            showToast("Error processing order.", "error");
            setIsProcessingOrder(false);
        }
    };

    // Render
    if (!effectiveCart || effectiveItems.length === 0) {
        return (
            <div className="p-8 text-center">
                <p>Your cart is empty.</p>
                <button onClick={() => router.push('/')} className="text-blue-600 underline">Return to Shop</button>
            </div>
        );
    }

    // Order Summary Calculation
    const totalOrderValue = subtotal || effectiveItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-10">
            {/* Left Column: Address & Payment */}
            <div className="lg:col-span-8 space-y-8">

                {/* Shipping / Billing Address */}
                <div className="bg-[var(--storefront-bg)] border border-[var(--storefront-border-light)] rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-[var(--storefront-text-primary)]">Shipping & Billing Address</h2>
                        {hasBillingDetails && !isEditingBilling && (
                            <button onClick={() => {
                                setBillingForm(mapBillingDetailsToFormValue(currentBillingDetails));
                                setIsEditingBilling(true);
                            }} className="text-sm text-[var(--storefront-button-primary)] hover:underline">Edit</button>
                        )}
                    </div>

                    {isEditingBilling ? (
                        <form onSubmit={handleBillingSubmit} className="space-y-4">
                            <BillingDetailsForm value={billingForm} errors={billingErrors} onChange={(f, v) => setBillingForm(p => ({ ...p, [f]: v }))} />
                            <div className="flex justify-end gap-2 mt-4">
                                {hasBillingDetails && (
                                    <button type="button" onClick={() => setIsEditingBilling(false)} className="px-4 py-2 border rounded-md">Cancel</button>
                                )}
                                <button type="submit" className="px-4 py-2 bg-black text-white rounded-md">Save Address</button>
                            </div>
                        </form>
                    ) : (
                        <div className="text-sm text-[var(--storefront-text-secondary)]">
                            <p className="font-medium text-[var(--storefront-text-primary)]">{currentBillingDetails?.firstName} {currentBillingDetails?.lastName}</p>
                            <p>{currentBillingDetails?.streetAddress1}</p>
                            <p>{currentBillingDetails?.city}, {currentBillingDetails?.country}</p>
                            <p>{currentBillingDetails?.phone}</p>
                            <p>{currentBillingDetails?.email}</p>
                        </div>
                    )}
                </div>

                {/* Payment Method */}
                {hasBillingDetails && !isEditingBilling && (
                    <div className="bg-[var(--storefront-bg)] border border-[var(--storefront-border-light)] rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-[var(--storefront-text-primary)] mb-6">Payment Method</h2>

                        <div className="space-y-4">
                            {/* Stripe Option */}
                            <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${selectedProvider === 'stripe' ? 'border-black bg-gray-50' : 'border-gray-200'}`}>
                                <input
                                    type="radio"
                                    name="payment_provider"
                                    value="stripe"
                                    checked={selectedProvider === 'stripe'}
                                    onChange={() => setSelectedProvider('stripe')}
                                    className="mt-1"
                                />
                                <div className="flex-1">
                                    <span className="font-medium text-gray-900">Credit / Debit Card</span>
                                    <p className="text-sm text-gray-500">Pay securely with your bank card.</p>
                                </div>
                            </label>

                            {/* Tabby Option */}
                            {currency === 'AED' && (
                                <div className={`border rounded-lg p-4 transition-colors ${selectedProvider === 'tabby' ? 'border-[#3EEDBF] bg-[#3EEDBF]/5' : 'border-gray-200'}`}>
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="payment_provider"
                                            value="tabby"
                                            checked={selectedProvider === 'tabby'}
                                            onChange={() => {
                                                if (tabbyStatus !== 'rejected') setSelectedProvider('tabby');
                                            }}
                                            disabled={tabbyStatus === 'rejected'}
                                            className="mt-1"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <img src="https://cdn.tabby.ai/assets/logo.svg" alt="Tabby" className="h-5 w-auto" />
                                                <span className="font-medium">Pay later with Tabby.</span>
                                            </div>

                                            {/* Status Messages */}
                                            {tabbyStatus === 'loading' && <p className="text-sm text-gray-500">Checking availability...</p>}
                                            {tabbyStatus === 'available' && <p className="text-sm text-[#3EEDBF] font-medium">Available</p>}
                                            {tabbyStatus === 'rejected' && (
                                                <div className="mt-2 text-sm text-red-500 bg-red-50 p-2 rounded">
                                                    {tabbyRejectionReason}
                                                </div>
                                            )}
                                        </div>
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-4">
                <div className="bg-[var(--storefront-bg)] border border-[var(--storefront-border-light)] rounded-lg p-6 sticky top-24">
                    <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                    <div className="space-y-3 mb-6">
                        {effectiveItems.map(item => (
                            <div key={`${item.productId}-${item.selectedVariantItemIds.join('-')}`} className="flex justify-between text-sm">
                                <span className="text-gray-600 truncate max-w-[200px]">{productsById[item.productId]?.name} (x{item.quantity})</span>
                                <span className="font-medium">{formatPrice(item.unitPrice * item.quantity)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t pt-4 flex justify-between font-bold text-lg mb-6">
                        <span>Total</span>
                        <span>{formatPrice(totalOrderValue)}</span>
                    </div>

                    <button
                        onClick={handlePlaceOrder}
                        disabled={isProcessingOrder || (!hasBillingDetails) || (selectedProvider === 'tabby' && tabbyStatus !== 'available')}
                        className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessingOrder ? "Processing..." : "Place Order"}
                    </button>

                    <div className="mt-4 text-xs text-center text-gray-500">
                        By placing your order, you agree to our Terms of Service and Privacy Policy.
                    </div>
                </div>
            </div>
        </div>
    );
}
