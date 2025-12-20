'use client';

import { ReactNode, useEffect } from 'react';
import Link from 'next/link';

export type AuthSuggestionTrigger = 'cart' | 'wishlist';

interface AuthSuggestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    trigger?: AuthSuggestionTrigger | null;
    footer?: ReactNode;
}

export function AuthSuggestionModal({ isOpen, onClose, trigger, footer }: AuthSuggestionModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const contextLine =
        trigger === 'wishlist'
            ? 'We can keep this wishlist item on your timeline.'
            : trigger === 'cart'
                ? 'We can keep this cart item on your timeline.'
                : 'We can keep these items on your timeline.';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-[var(--storefront-border)] bg-[var(--storefront-bg)] shadow-lg my-8">
                <div className="flex items-start justify-between gap-4 border-b border-[var(--storefront-border-light)] px-4 py-3 sm:px-6 sm:py-4">
                    <div className="space-y-1">
                        <h2 className="text-lg font-semibold text-[var(--storefront-text-primary)]">
                            Save your cart and wishlist across devices
                        </h2>
                        <p className="text-sm text-[var(--storefront-text-secondary)]">
                            Sign in or create an account to sync your items. {contextLine}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="text-xl leading-none text-[var(--storefront-text-secondary)] hover:text-[var(--storefront-text-primary)]"
                    >
                        ×
                    </button>
                </div>

                <div className="px-4 py-4 sm:px-6 sm:py-5 space-y-3">
                    <Link
                        href="/account"
                        onClick={onClose}
                        className="inline-flex w-full items-center justify-center rounded-md bg-[var(--storefront-button-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--storefront-button-primary-hover)] transition"
                    >
                        Sign in
                    </Link>
                    <Link
                        href="/account/register"
                        onClick={onClose}
                        className="inline-flex w-full items-center justify-center rounded-md border border-[var(--storefront-border)] bg-[var(--storefront-button-secondary)] px-4 py-2 text-sm font-medium text-[var(--storefront-text-primary)] hover:bg-[var(--storefront-button-secondary-hover)] transition"
                    >
                        Create account
                    </Link>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full rounded-md px-4 py-2 text-sm font-medium text-[var(--storefront-text-secondary)] hover:text-[var(--storefront-text-primary)]"
                    >
                        Continue as guest
                    </button>

                    {footer}
                </div>
            </div>
        </div>
    );
}

