"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface OrderCancellationRequestButtonProps {
  orderId: string;
}

export function OrderCancellationRequestButton({
  orderId,
}: OrderCancellationRequestButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const requestCancellation = async () => {
    const trimmedReason = reason.trim();

    if (isSubmitting || !trimmedReason) {
      return;
    }

    setIsSubmitting(true);
    const url = `/api/storefront/orders/${orderId}/cancellation-request`;

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
          body?.message || body?.error || "Failed to request cancellation",
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

      showToast("Cancellation request submitted", "success", {
        status: res.status,
        body,
        url: res.url,
        method: "POST",
      });
      setReason("");
      setIsDialogOpen(false);
      router.refresh();
    } catch (error: any) {
      showToast(error?.message || "Failed to request cancellation", "error", {
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
        Request cancellation
      </button>

      <Modal
        isOpen={isDialogOpen}
        onClose={() => {
          if (isSubmitting) {
            return;
          }
          setIsDialogOpen(false);
        }}
        title="Request order cancellation"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Your request will be sent to admin for review. Please provide a
            cancellation note.
          </p>

          <div className="space-y-2">
            <label
              htmlFor={`cancel-note-${orderId}`}
              className="block text-sm font-medium text-gray-900"
            >
              Cancellation note <span className="text-red-600">*</span>
            </label>
            <textarea
              id={`cancel-note-${orderId}`}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Tell us why you want to cancel this order"
              className="w-full min-h-28 rounded-sm border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              maxLength={1000}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
              className="inline-flex items-center rounded-sm border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-60"
            >
              Keep order
            </button>
            <button
              type="button"
              onClick={requestCancellation}
              disabled={isSubmitting || reason.trim().length === 0}
              className="inline-flex items-center rounded-sm bg-black px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
            >
              {isSubmitting ? "Submitting..." : "Submit request"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
