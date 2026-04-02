"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface OrderReturnRequestButtonProps {
  orderId: string;
}

export function OrderReturnRequestButton({
  orderId,
}: OrderReturnRequestButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const requestReturn = async () => {
    const trimmedReason = reason.trim();

    if (isSubmitting || !trimmedReason) {
      return;
    }

    setIsSubmitting(true);
    const url = `/api/storefront/orders/${orderId}/return-request`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: trimmedReason }),
      });

      let body: any = null;
      try {
        body = await res.json();
      } catch {
        body = null;
      }

      if (!res.ok) {
        showToast(
          body?.message || body?.error || "Failed to request return",
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

      showToast("Return request submitted", "success", {
        status: res.status,
        body,
        url: res.url,
        method: "POST",
      });
      setReason("");
      setIsDialogOpen(false);
      router.refresh();
    } catch (error: any) {
      showToast(error?.message || "Failed to request return", "error", {
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
        onClick={() => setIsDialogOpen(true)}
        disabled={isSubmitting}
        className="inline-flex items-center rounded-sm border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-60"
      >
        Request return
      </button>

      <Modal
        isOpen={isDialogOpen}
        onClose={() => {
          if (isSubmitting) {
            return;
          }
          setIsDialogOpen(false);
        }}
        title="Request return"
        variant="storefront"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--storefront-text-secondary)]">
            Your return request will be sent to admin for review.
          </p>

          <div className="space-y-2">
            <label
              htmlFor={`return-note-${orderId}`}
              className="block text-sm font-medium text-[var(--storefront-text-primary)]"
            >
              Return note <span className="text-red-600">*</span>
            </label>
            <textarea
              id={`return-note-${orderId}`}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Tell us why you want to return this order"
              className="min-h-28 w-full rounded-sm border border-[var(--storefront-border)] bg-[var(--storefront-bg)] px-3 py-2 text-sm text-[var(--storefront-text-primary)] placeholder:text-[var(--storefront-text-muted)] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--storefront-text-primary)]"
              maxLength={1000}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
              className="inline-flex items-center rounded-sm border border-[var(--storefront-border)] bg-[var(--storefront-button-secondary)] px-3 py-2 text-sm font-medium text-[var(--storefront-text-primary)] hover:bg-[var(--storefront-button-secondary-hover)] disabled:opacity-60"
            >
              Keep order
            </button>
            <button
              type="button"
              onClick={requestReturn}
              disabled={isSubmitting || reason.trim().length === 0}
              className="inline-flex items-center rounded-sm bg-[var(--storefront-button-primary)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--storefront-button-primary-hover)] disabled:opacity-60"
            >
              {isSubmitting ? "Submitting..." : "Submit request"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
