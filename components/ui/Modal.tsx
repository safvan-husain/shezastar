// components/ui/Modal.tsx
"use client";

import { ReactNode, useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  containerClassName?: string;
  variant?: "default" | "storefront";
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  containerClassName = "",
  variant = "default",
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isStorefront = variant === "storefront";
  const backdropClassName = isStorefront
    ? "absolute inset-0 bg-black/40"
    : "absolute inset-0 bg-[var(--bg-base)]/60";
  const panelClassName = isStorefront
    ? "relative bg-[var(--storefront-bg)] text-[var(--storefront-text-primary)] rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-[var(--storefront-border)]"
    : "relative bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-[var(--border-subtle)]";
  const headerClassName = isStorefront
    ? "sticky top-0 bg-[var(--storefront-bg-subtle)] border-b border-[var(--storefront-border)] px-6 py-4 flex justify-between items-center"
    : "sticky top-0 bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] px-6 py-4 flex justify-between items-center";
  const titleClassName = isStorefront
    ? "text-xl font-semibold text-[var(--storefront-text-primary)]"
    : "text-xl font-semibold text-[var(--text-primary)]";
  const closeButtonClassName = isStorefront
    ? "text-[var(--storefront-text-secondary)] hover:text-[var(--storefront-text-primary)] text-2xl"
    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-2xl";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className={backdropClassName} onClick={onClose} />
      <div className={`${panelClassName} ${containerClassName}`}>
        <div className={headerClassName}>
          <h2 className={titleClassName}>{title}</h2>
          <button onClick={onClose} className={closeButtonClassName}>
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
