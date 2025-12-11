"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";

interface CheckoutButtonProps {
  hasStockIssues?: boolean;
  availableCount?: number;
}

export default function CheckoutButton({ hasStockIssues = false, availableCount }: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handleCheckout = async () => {
    if (isLoading) return;

    const url = "/api/checkout_sessions";
    const method = "POST";

    if (hasStockIssues) {
      const message =
        typeof availableCount === "number"
          ? `This product has not this much count. There is only ${availableCount} left. Please adjust the count.`
          : "This product has not this much count. There is only this much left. Please adjust the count.";

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

    setIsLoading(true);
    try {
      const response = await fetch(url, {
        method,
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
              ? `This product has not this much count. There is only ${firstAvailable} left. Please adjust the count.`
              : "This product has not this much count. There is only this much left. Please adjust the count.";

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
          showToast("Failed to start checkout", "error", {
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
    <button
      onClick={handleCheckout}
      disabled={isLoading}
      className="w-full bg-black text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? "Processing..." : "Proceed to Checkout"}
    </button>
  );
}
