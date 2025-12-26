'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Category } from '@/lib/category/model/category.model';
import { useStorefrontWishlist } from '@/components/storefront/StorefrontWishlistProvider';
import { useStorefrontSession } from '@/components/storefront/StorefrontSessionProvider';
import { useCurrency } from '@/lib/currency/CurrencyContext';
import { CurrencySelector } from './CurrencySelector';
import { UserMenu } from './UserMenu';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    categories: Category[];
}

export function MobileMenu({ isOpen, onClose, categories }: MobileMenuProps) {
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const { items } = useStorefrontWishlist();
    const wishlistCount = items.length;
    const { currency } = useCurrency();
    const { session } = useStorefrontSession();
    const isAuthenticated = !!session?.userId;

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

    const toggleCategory = (categoryId: string) => {
        setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
    };

    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 bg-black/40 z-50 lg:hidden"
                onClick={onClose}
            />
            <div className="fixed top-0 right-0 bottom-0 w-80 bg-gray-900 z-50 overflow-y-auto lg:hidden shadow-xl">
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h2 className="text-lg font-semibold">Menu</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-800 rounded transition-colors"
                        aria-label="Close menu"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-4 border-b border-gray-800 flex justify-center">
                    <CurrencySelector />
                </div>

                <div className="py-2 border-b border-gray-800">
                    <Link
                        href="/orders"
                        onClick={onClose}
                        className="flex items-center justify-between px-4 py-3 text-sm text-gray-200 hover:text-white hover:bg-gray-800 transition-colors"
                    >
                        <span className="font-medium">My Orders</span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </Link>
                    <Link
                        href="/wishlist"
                        onClick={onClose}
                        className="flex items-center justify-between px-4 py-3 text-sm text-gray-200 hover:text-white hover:bg-gray-800 transition-colors"
                    >
                        <span className="font-medium">Wishlist</span>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            {wishlistCount > 0 && <span>{wishlistCount} item{wishlistCount === 1 ? '' : 's'}</span>}
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.8 4.6a5 5 0 0 0-7.1 0l-1.2 1.2-1.2-1.2a5 5 0 1 0-7.1 7.1l1.2 1.2 7.1 7.1 7.1-7.1 1.2-1.2a5 5 0 0 0 0-7.1z" />
                            </svg>
                        </div>
                    </Link>
                </div>

                <div className="py-2 border-b border-gray-800">
                    {isAuthenticated ? (
                        <div className="px-4 py-3"><UserMenu /></div>
                    ) : (
                        <Link
                            href="/account"
                            onClick={onClose}
                            className="flex items-center justify-between px-4 py-3 text-sm text-gray-200 hover:text-white hover:bg-gray-800 transition-colors"
                        >
                            <span className="font-medium">Login / Register</span>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                        </Link>
                    )}
                </div>

                <div className="py-2">
                    {categories.map((category) => (
                        <div key={category.id} className="border-b border-gray-800">
                            <button
                                onClick={() => toggleCategory(category.id)}
                                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-800 transition-colors"
                            >
                                <span className="font-medium uppercase tracking-wide text-sm">{category.name}</span>
                                <svg
                                    className={`w-4 h-4 transition-transform ${expandedCategory === category.id ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {expandedCategory === category.id && category.subCategories.length > 0 && (
                                <div className="bg-gray-950 py-2">
                                    {category.subCategories.map((subCategory) => (
                                        <div key={subCategory.id}>
                                            {subCategory.subSubCategories.length > 0 ? (
                                                <div className="px-4 py-2">
                                                    <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">{subCategory.name}</div>
                                                    <div className="space-y-1 pl-3">
                                                        {subCategory.subSubCategories.map((subSubCategory) => (
                                                            <Link
                                                                key={subSubCategory.id}
                                                                href={`/category/${subSubCategory.slug ?? subSubCategory.id}`}
                                                                onClick={onClose}
                                                                className="block text-gray-300 hover:text-white text-sm py-1.5 transition-colors"
                                                            >
                                                                {subSubCategory.name}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <Link
                                                    href={`/category/${subCategory.slug ?? subCategory.id}`}
                                                    onClick={onClose}
                                                    className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                                                >
                                                    {subCategory.name}
                                                </Link>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
