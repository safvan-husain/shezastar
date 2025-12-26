
'use client';

import { useState, useRef, useEffect } from 'react';
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

interface NavbarProps {
  categories: Category[];
}

export function Navbar({ categories }: NavbarProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { items } = useStorefrontWishlist();
  const wishlistCount = items.length;
  const { totalItems } = useStorefrontCart();
  const { currency } = useCurrency();
  const { session } = useStorefrontSession();
  const isAuthenticated = !!session?.userId;

  const handleMouseEnter = (categoryId: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setActiveDropdown(categoryId);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  const handleLinkClick = () => {
    setActiveDropdown(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    if (!mobileMenuOpen) setIsSearchOpen(false);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) setMobileMenuOpen(false);
  };

  const hasSubSubCategories = (category: Category) => {
    return category.subCategories.some(sub => sub.subSubCategories.length > 0);
  };



  return (
    <nav className="flex flex-col bg-black text-white relative z-[100] w-full">
      {/* Main Header Row: Logo | Search | Icons */}
      {/* <div className="border-b border-gray-800 bg-black flex justify-between"> */}
        <div className="lg:border-b border-gray-800 max-w-8xl md:mx-auto px-4 flex items-center justify-between h-20 lg:h-28 gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              alt="shazstar logo"
              width={200}
              height={200}
              src="/brand-icon.png"
              className="w-auto h-18 lg:h-24 mr-2"
            />
          </Link>

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
      {/* </div> */}
      {/* Mobile Search Bar Expansion (Second Row) */}
      <div
        className={`lg:hidden w-full bg-[#111] transition-all duration-300 ease-in-out border-b border-gray-800 ${isSearchOpen ? 'max-h-20 opacity-100 overflow-visible' : 'max-h-0 opacity-0 pointer-events-none overflow-hidden'
          }`}
      >
        <div className="p-3 max-w-8xl mx-auto">
          <Search />
        </div>
      </div>

      {/* Row 3: Categories (Desktop Only) */}
      <div className="hidden lg:block bg-black shadow-md mx-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-12">
            {categories.map((category) => {
              const multiColumn = hasSubSubCategories(category);
              const columnCount = Math.min(category.subCategories.length, 5);

              return (
                <div
                  key={category.id}
                  className="static"
                  onMouseEnter={() => handleMouseEnter(category.id)}
                  onMouseLeave={handleMouseLeave}
                >
                  <button className="px-4 text-xs font-medium uppercase tracking-wide hover:text-amber-400 transition-colors flex items-center h-12">
                    {category.name}
                    <svg className="ml-1 h-4 w-4 fill-current" viewBox="0 0 20 20">
                      <path d="M10 14l-6-6h12z" />
                    </svg>
                  </button>

                  {activeDropdown === category.id && category.subCategories.length > 0 && (
                    <div
                      className="absolute top-full left-0 w-screen bg-white shadow-2xl border-t border-gray-100 z-[60] overflow-y-auto max-h-[calc(100vh-8rem)] text-black"
                      style={{ height: 'auto', minHeight: multiColumn ? '300px' : '0' }}
                    >
                      <div className="max-w-7xl mx-auto px-8 py-10">
                        {multiColumn ? (
                          <div
                            className="grid gap-x-12 gap-y-10"
                            style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
                          >
                            {category.subCategories.map((subCategory) => (
                              <div key={subCategory.id} className="space-y-4">
                                <Link
                                  href={`/category/${subCategory.slug ?? subCategory.id}`}
                                  className="block"
                                  onClick={handleLinkClick}
                                >
                                  <h3 className="text-black font-bold text-sm uppercase tracking-wider border-b border-gray-100 pb-3 hover:text-amber-600 transition-colors">
                                    {subCategory.name}
                                  </h3>
                                </Link>
                                <div className="flex flex-col space-y-2">
                                  {subCategory.subSubCategories.map((subSubCategory) => (
                                    <Link
                                      key={subSubCategory.id}
                                      href={`/category/${subSubCategory.slug ?? subSubCategory.id}`}
                                      className="text-gray-500 hover:text-black text-sm transition-colors py-0.5"
                                      onClick={handleLinkClick}
                                    >
                                      {subSubCategory.name}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-5">
                            <h2 className="text-xl font-bold text-gray-700">{category.name}</h2>
                            <div
                              className="grid gap-x-12 gap-y-4"
                              style={{
                                gridTemplateColumns: `repeat(${Math.ceil(category.subCategories.length / 5)}, minmax(200px, 1fr))`,
                                maxWidth: 'fit-content'
                              }}
                            >
                              {Array.from({ length: Math.ceil(category.subCategories.length / 5) }).map((_, colIndex) => (
                                <div key={colIndex} className="flex flex-col space-y-4">
                                  {category.subCategories.slice(colIndex * 5, (colIndex + 1) * 5).map((subCategory) => (
                                    <Link
                                      key={subCategory.id}
                                      href={`/category/${subCategory.slug ?? subCategory.id}`}
                                      className="text-gray-500 hover:text-black text-sm transition-colors whitespace-nowrap"
                                      onClick={handleLinkClick}
                                    >
                                      {subCategory.name}
                                    </Link>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-0 right-0 bottom-0 w-80 bg-gray-900 z-50 overflow-y-auto lg:hidden shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Menu</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
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
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3 text-sm text-gray-200 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <span className="font-medium">My Orders</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </Link>
              <Link
                href="/wishlist"
                onClick={() => setMobileMenuOpen(false)}
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
                  onClick={() => setMobileMenuOpen(false)}
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
                                    onClick={() => setMobileMenuOpen(false)}
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
                              onClick={() => setMobileMenuOpen(false)}
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
      )}

     
    </nav>
  );
}
