'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Category } from '@/lib/category/model/category.model';
import Image from 'next/image';
import { useStorefrontWishlist } from '@/components/storefront/StorefrontWishlistProvider';
import { useStorefrontCart } from '@/components/storefront/StorefrontCartProvider';
import { useStorefrontSession } from '@/components/storefront/StorefrontSessionProvider';
import { Search } from './navbar/Search';
import { CurrencySelector } from './navbar/CurrencySelector';
import { useCurrency } from '@/lib/currency/CurrencyContext';
import { UserMenu } from './navbar/UserMenu';
import { DesktopCategories } from './navbar/DesktopCategories';
import { MobileMenu } from './navbar/MobileMenu';

interface NavbarProps {
  categories: Category[];
}

export function Navbar({ categories }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { items } = useStorefrontWishlist();
  const wishlistCount = items.length;
  const { totalItems } = useStorefrontCart();
  const { currency } = useCurrency();
  const { session } = useStorefrontSession();
  const isAuthenticated = !!session?.userId;

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    if (!mobileMenuOpen) setIsSearchOpen(false);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) setMobileMenuOpen(false);
  };

  return (
    <nav className="flex bg-black text-white relative z-[100] w-full">
      <div className='flex max-w-8xl w-full sm:w-auto lg:mx-auto items-center justify-between'>
        {/* Logo */}
        <Link href="/" className="flex-shrink-0 ml-2 lg:ml-0">
          <Image
            alt="shazstar logo"
            width={200}
            height={200}
            src="/brand-icon.png"
            className="w-auto h-18 lg:h-33 mr-2"
          />
        </Link>
        <div className="flex flex-col">
          {/* Main Header Row: Logo | Search | Icons */}
          <div className="w-full lg:border-b border-gray-800 max-w-8xl md:mx-auto px-4 flex items-center justify-between h-20 lg:h-24 gap-4">
            {/* Desktop Search - Hidden on mobile, centered on desktop */}
            <div className="hidden lg:block flex-grow max-w-2xl lg:w-94 mx-8">
              <Search />
            </div>

            {/* Icons Context */}
            <div className="flex items-center gap-1.5 sm:gap-3 lg:gap-4 flex-shrink-0">
              {/* Mobile Search Toggle */}
              <button
                onClick={toggleSearch}
                className="lg:hidden p-2 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Toggle search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Currency Selector (Desktop) */}
              <div className="hidden lg:block">
                <CurrencySelector />
              </div>

              {/* Currency Button (Mobile) */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden relative inline-flex items-center justify-center rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors"
                aria-label="Change currency"
              >
                <span className="text-[11px] font-bold text-amber-400">
                  {currency}
                </span>
              </button>

              {/* Orders link (Desktop) */}
              <Link
                href="/orders"
                className="hidden lg:inline-flex items-center justify-center rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors"
                aria-label="View orders"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </Link>

              {/* Wishlist link */}
              <Link
                href="/wishlist"
                className="relative inline-flex items-center justify-center rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors"
                aria-label="View wishlist"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.8 4.6a5 5 0 0 0-7.1 0l-1.2 1.2-1.2-1.2a5 5 0 1 0-7.1 7.1l1.2 1.2 7.1 7.1 7.1-7.1 1.2-1.2a5 5 0 0 0 0-7.1z" />
                </svg>
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] px-1">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart link */}
              <Link
                href="/cart"
                className="relative flex items-center justify-center p-2 hover:bg-gray-800 rounded transition-colors"
                aria-label="View cart"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="9" cy="21" r="1.5" />
                  <circle cx="18" cy="21" r="1.5" />
                  <path d="M2.5 3h2l2.2 12.6a1.5 1.5 0 0 0 1.5 1.2h9.4a1.5 1.5 0 0 0 1.5-1.2l1.2-7.6H6.2" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-500 text-xs font-semibold px-1.5 py-0.5">
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* Auth Link (Desktop) */}
              {isAuthenticated ? (
                <div className="hidden lg:block">
                  <UserMenu />
                </div>
              ) : (
                <Link
                  href="/account"
                  className="hidden lg:inline-flex items-center justify-center p-2 hover:bg-gray-800 rounded transition-colors"
                  aria-label="Login"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden p-2 hover:bg-gray-800 rounded transition-colors"
                aria-label="Open menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Search Bar Expansion (Second Row) */}
          <div
            className={`lg:hidden w-full bg-[#111] transition-all duration-300 ease-in-out border-b border-gray-800 ${isSearchOpen ? 'max-h-20 opacity-100 overflow-visible' : 'max-h-0 opacity-0 pointer-events-none overflow-hidden'
              }`}
          >
            <div className="p-3 max-w-8xl mx-auto">
              <Search />
            </div>
          </div>

          {/* Desktop Categories Row */}
          <DesktopCategories categories={categories} />

          {/* Mobile Menu */}
          <MobileMenu
            isOpen={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            categories={categories}
          />
        </div>
      </div>
    </nav>
  );
}
