"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface OrderCancellationReviewProps {
  orderId: string;
}

type ReviewAction = "approve" | "reject" | "reject_and_ship";

export function OrderCancellationReview({ orderId }: OrderCancellationReviewProps) {
  const [action, setAction] = useState<ReviewAction | null>(null);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const submitDecision = async () => {
    if (!action || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    const url = `/api/admin/orders/${orderId}/cancellation-request`;

    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: action === "approve" ? "approve" : "reject",
          proceedToShipment: action === "reject_and_ship",
          note: note.trim() || undefined,
        }),
      });

      let body: any = null;
      try {
        body = await res.json();
      } catch {
        body = null;
      }

      if (!res.ok) {
        showToast(
          body?.message || body?.error || "Failed to review cancellation request",
          "error",
          {
            status: res.status,
            body,
            url: res.url,
            method: "PATCH",
          },
        );
        return;
      }

      showToast(
        action === "approve"
          ? "Cancellation request approved"
          : action === "reject_and_ship"
            ? "Cancellation denied and shipment created"
            : "Cancellation request rejected",
        "success",
        {
          status: res.status,
          body,
          url: res.url,
          method: "PATCH",
        },
      );
      setAction(null);
      router.refresh();
    } catch (error: any) {
      showToast(
        error?.message || "Failed to review cancellation request",
        "error",
        {
          body: error instanceof Error ? { stack: error.stack } : { error },
          url,
          method: "PATCH",
        },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm text-[var(--text-secondary)]">
        Admin note (optional)
      </label>
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Add context for approval, denial, or shipment decision"
        className="w-full min-h-24 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setAction("approve")}
          className="inline-flex items-center rounded-sm bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-60"
          disabled={isSubmitting}
        >
          Approve cancellation
        </button>
        <button
          type="button"
          onClick={() => setAction("reject")}
          className="inline-flex items-center rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] disabled:opacity-60"
          disabled={isSubmitting}
        >
          Deny only
        </button>
        <button
          type="button"
          onClick={() => setAction("reject_and_ship")}
          className="inline-flex items-center rounded-sm bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={isSubmitting}
        >
          Deny and ship
        </button>
      </div>

      <Modal
        isOpen={Boolean(action)}
        onClose={() => setAction(null)}
        title={
          action === "approve"
            ? "Approve cancellation request?"
            : action === "reject_and_ship"
              ? "Deny cancellation and proceed to shipment?"
              : "Deny cancellation request?"
        }
      >
        <div className="space-y-4">
          <p className="text-[var(--text-secondary)]">
            {action === "approve"
              ? "This will move the order to cancellation approved and start refund processing."
              : action === "reject_and_ship"
                ? "This will deny the cancellation request and immediately try to create the shipment."
                : "This will deny the cancellation request and move the order back to paid."}
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAction(null)}
              disabled={isSubmitting}
              className="inline-flex items-center rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitDecision}
              disabled={isSubmitting}
              className="inline-flex items-center rounded-sm bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-60"
            >
              {isSubmitting ? "Processing..." : "Confirm"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
