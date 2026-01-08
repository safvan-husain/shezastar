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
  const { showToast } = useToast();
  const { currency } = useCurrency();

  const handleCheckout = async (provider: 'stripe' | 'tabby') => {
    if (isLoading) return;

    const url = provider === 'tabby' ? "/api/tabby/checkout_session" : "/api/checkout_sessions";
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
    <div className="flex flex-col gap-3">
      <button
        onClick={() => handleCheckout('stripe')}
        disabled={isLoading}
        className={`w-full bg-black text-white py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${!hasBillingDetails ? 'bg-gray-500 hover:bg-gray-500' : 'hover:bg-gray-800'
          }`}
      >
        {isLoading ? "Processing..." : "Proceed to Checkout"}
      </button>
      {currency === 'AED' && (
        <button
          onClick={() => handleCheckout('tabby')}
          disabled={isLoading}
          className={`w-full bg-[#3EEDBF] text-black py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${!hasBillingDetails ? 'opacity-60' : 'hover:bg-[#35d8ae]'
            }`}
        >
          {isLoading ? "Processing..." : "Proceed with Tabby"}
        </button>
      )}
    </div>
  );
}
