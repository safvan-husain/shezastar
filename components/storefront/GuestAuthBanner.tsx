'use client';

import Link from 'next/link';

import { useStorefrontSession } from './StorefrontSessionProvider';

export function GuestAuthBanner() {
    const { session } = useStorefrontSession();

    if (session?.userId) return null;

    return (
        <div className="rounded-lg border border-[var(--storefront-border-light)] bg-[var(--storefront-bg-subtle)] px-4 py-3 text-sm text-[var(--storefront-text-secondary)] flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>
                You’re shopping as a guest. Sign in to sync your cart and wishlist across devices.
            </p>
            <div className="flex gap-3">
                <Link
                    href="/account"
                    className="font-medium text-[var(--storefront-button-primary)] hover:underline"
                >
                    Sign in
                </Link>
                <Link
                    href="/account/register"
                    className="font-medium text-[var(--storefront-button-primary)] hover:underline"
                >
                    Create account
                </Link>
            </div>
        </div>
    );
}

