"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { useCurrency } from "@/lib/currency/CurrencyContext";

interface CheckoutButtonProps {
  hasStockIssues?: boolean;
  availableCount?: number;
  hasBillingDetails?: boolean;
  onMissingBillingDetails?: () => void;
}

export default function CheckoutButton({
  hasStockIssues = false,
  availableCount,
  hasBillingDetails = true,
  onMissingBillingDetails,
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'tabby'>('stripe');
  const { showToast } = useToast();
  const { currency } = useCurrency();

  const handleCheckout = async () => {
    if (isLoading) return;

    const url = paymentMethod === 'tabby' ? "/api/tabby/checkout_session" : "/api/checkout_sessions";
    const method = "POST";

    if (hasStockIssues) {
      const message =
        typeof availableCount === "number"
          ? `There is only ${availableCount} left. Please adjust the count.`
          : "There is only this much left. Please adjust the count.";

      showToast(
        message,
        "error",
        {
          status: 400,
          url,
          method,
        }
      );
      return;
    }

    if (!hasBillingDetails) {
      onMissingBillingDetails?.();
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currency }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok || !body?.url) {
        if (
          response.status === 400 &&
          body &&
          body.error === "Insufficient stock" &&
          Array.isArray(body.insufficientItems) &&
          body.insufficientItems.length > 0
        ) {
          const firstAvailable =
            typeof body.insufficientItems[0]?.available === "number"
              ? body.insufficientItems[0].available
              : undefined;
          const message =
            typeof firstAvailable === "number"
              ? `There is only ${firstAvailable} left. Please adjust the count.`
              : "There is only this much left. Please adjust the count.";

          showToast(
            message,
            "error",
            {
              status: response.status,
              body,
              url,
              method,
            }
          );
        } else {
          // Handle Tabby rejection reason specifically if available
          const errorMessage = body?.reason ? `Tabby rejected: ${body.reason}` : "Failed to start checkout";
          showToast(errorMessage, "error", {
            status: response.status,
            body,
            url,
            method,
          });
        }
        // eslint-disable-next-line no-console
        console.error("Failed to start checkout:", body);
        return;
      }

      window.location.href = body.url as string;
    } catch (error: any) {
      const details =
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : { message: "Unknown error", original: error };

      showToast("Error during checkout", "error", {
        body: details,
        url,
        method,
      });
      // eslint-disable-next-line no-console
      console.error("Error during checkout:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {hasBillingDetails && !hasStockIssues && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--storefront-text-secondary)]">Payment Method</p>
          <div className="flex gap-4">
            <label className={`flex-1 flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${paymentMethod === 'stripe' ? 'border-black bg-black/5 ring-1 ring-black' : 'border-[var(--storefront-border)] hover:bg-[var(--storefront-bg-subtle)]'}`}>
              <input type="radio" name="payment" value="stripe" checked={paymentMethod === 'stripe'} onChange={() => setPaymentMethod('stripe')} className="sr-only" />
              <span className="font-medium text-sm">Pay with Card</span>
            </label>
            <label className={`flex-1 flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${paymentMethod === 'tabby' ? 'border-[#3EEDBF] bg-[#3EEDBF]/10 ring-1 ring-[#3EEDBF]' : 'border-[var(--storefront-border)] hover:bg-[var(--storefront-bg-subtle)]'}`}>
              <input type="radio" name="payment" value="tabby" checked={paymentMethod === 'tabby'} onChange={() => setPaymentMethod('tabby')} className="sr-only" />
              <span className="font-medium text-sm">Tabby</span>
            </label>
          </div>
        </div>
      )}
      <button
        onClick={handleCheckout}
        disabled={isLoading}
        className={`w-full bg-black text-white py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${!hasBillingDetails ? 'bg-gray-500 hover:bg-gray-500' : 'hover:bg-gray-800'
          }`}
      >
        {isLoading ? "Processing..." : paymentMethod === 'tabby' ? "Proceed with Tabby" : "Proceed to Checkout"}
      </button>
    </div>
  );
}
