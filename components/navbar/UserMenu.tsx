'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStorefrontSession } from '@/components/storefront/StorefrontSessionProvider';
import { useStorefrontCart } from '@/components/storefront/StorefrontCartProvider';
import { useStorefrontWishlist } from '@/components/storefront/StorefrontWishlistProvider';
import { useStorefrontAuthSuggestion } from '@/components/storefront/StorefrontAuthSuggestionProvider';
import { useToast } from '@/components/ui/Toast';
import { BillingAddressModal } from '@/components/storefront/BillingAddressModal';

export function UserMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { refreshSession } = useStorefrontSession();
    const { refreshCart } = useStorefrontCart();
    const { refreshWishlist } = useStorefrontWishlist();
    const { resetAuthSuggestionShown } = useStorefrontAuthSuggestion();
    const { showToast } = useToast();

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        const url = '/api/auth/logout';
        try {
            const response = await fetch(url, { method: 'POST' });
            if (!response.ok) {
                let body: any = {};
                try {
                    body = await response.json();
                } catch {
                    body = { error: 'Failed to parse error response' };
                }
                const message = body.message || body.error || 'Logout failed';
                showToast(message, 'error', {
                    status: response.status,
                    body,
                    url,
                    method: 'POST',
                });
                return;
            }

            resetAuthSuggestionShown();
            await refreshSession();
            await refreshCart();
            await refreshWishlist();
            router.refresh();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Logout failed';
            showToast(message, 'error', { url, method: 'POST' });
        }
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center p-2 hover:bg-gray-800 rounded-full transition-colors focus:outline-none"
                aria-label="User menu"
            >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-2 z-50 border border-gray-100">
                    <button
                        onClick={() => {
                            setIsOpen(false);
                            setIsBillingModalOpen(true);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                    >
                        <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Manage Building Address
                    </button>

                    <div className="border-t border-gray-100 my-1"></div>

                    <button
                        onClick={() => {
                            setIsOpen(false);
                            handleLogout();
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors"
                    >
                        <svg className="w-5 h-5 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                    </button>
                </div>
            )}

            <BillingAddressModal
                isOpen={isBillingModalOpen}
                onClose={() => setIsBillingModalOpen(false)}
            />
        </div>
    );
}
