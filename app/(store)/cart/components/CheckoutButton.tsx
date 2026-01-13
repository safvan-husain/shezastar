"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

interface CheckoutButtonProps {
  hasStockIssues?: boolean;
  availableCount?: number;
}

export default function CheckoutButton({
  hasStockIssues = false,
  availableCount,
}: CheckoutButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const handleProceed = () => {
    if (hasStockIssues) {
      const message =
        typeof availableCount === "number"
          ? `There is only ${availableCount} left. Please adjust the count.`
          : "There is only this much left. Please adjust the count.";

      showToast(message, "error");
      return;
    }

    startTransition(() => {
      router.push("/checkout");
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={handleProceed}
        disabled={isPending}
        className="w-full bg-black text-white py-3 px-6 rounded-lg font-medium transition-colors hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Processing..." : "Proceed to Checkout"}
      </button>
    </div>
  );
}
