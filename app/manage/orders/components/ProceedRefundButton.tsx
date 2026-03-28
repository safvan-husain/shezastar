"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";

interface ProceedRefundButtonProps {
  orderId: string;
}

export function ProceedRefundButton({ orderId }: ProceedRefundButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const proceedRefund = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    const url = `/api/admin/orders/${orderId}/refund`;

    try {
      const res = await fetch(url, {
        method: "POST",
      });

      let body: any = null;
      try {
        body = await res.json();
      } catch {
        body = null;
      }

      if (!res.ok) {
        showToast(
          body?.message || body?.error || "Failed to initiate refund",
          "error",
          {
            status: res.status,
            body,
            url: res.url,
            method: "POST",
          },
        );
        return;
      }

      showToast("Refund initiated", "success", {
        status: res.status,
        body,
        url: res.url,
        method: "POST",
      });
      setIsOpen(false);
      router.refresh();
    } catch (error: any) {
      showToast(error?.message || "Failed to initiate refund", "error", {
        body: error instanceof Error ? { stack: error.stack } : { error },
        url,
        method: "POST",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={isSubmitting}
        className="inline-flex items-center rounded-sm bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        Proceed Refund
      </button>

      <ConfirmDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={proceedRefund}
        title="Proceed refund?"
        message="This will trigger the payment gateway refund and move the order to refund approved while waiting for webhook confirmation."
        confirmText="Proceed Refund"
        variant="primary"
        isLoading={isSubmitting}
      />
    </>
  );
}
