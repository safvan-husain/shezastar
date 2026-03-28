"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";

interface OrderReturnReviewProps {
  orderId: string;
}

type ReviewDecision = "approve" | "reject";

export function OrderReturnReview({ orderId }: OrderReturnReviewProps) {
  const [decision, setDecision] = useState<ReviewDecision | null>(null);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const submitDecision = async () => {
    if (!decision || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    const url = `/api/admin/orders/${orderId}/return-request`;

    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
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
          body?.message || body?.error || "Failed to review return request",
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
        decision === "approve"
          ? "Return request approved"
          : "Return request rejected",
        "success",
        {
          status: res.status,
          body,
          url: res.url,
          method: "PATCH",
        },
      );
      setDecision(null);
      router.refresh();
    } catch (error: any) {
      showToast(
        error?.message || "Failed to review return request",
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
        placeholder="Add context for approval or rejection"
        className="w-full min-h-24 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setDecision("approve")}
          className="inline-flex items-center rounded-sm bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] disabled:opacity-60"
          disabled={isSubmitting}
        >
          Approve
        </button>
        <button
          type="button"
          onClick={() => setDecision("reject")}
          className="inline-flex items-center rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] disabled:opacity-60"
          disabled={isSubmitting}
        >
          Reject
        </button>
      </div>

      <ConfirmDialog
        isOpen={Boolean(decision)}
        onClose={() => setDecision(null)}
        onConfirm={submitDecision}
        title={decision === "approve" ? "Approve return request?" : "Reject return request?"}
        message={
          decision === "approve"
            ? "This will create a return shipment and move the order to return approved."
            : "This will reject the request and restore the previous shipment status."
        }
        confirmText={decision === "approve" ? "Approve" : "Reject"}
        variant={decision === "approve" ? "primary" : "danger"}
        isLoading={isSubmitting}
      />
    </div>
  );
}
