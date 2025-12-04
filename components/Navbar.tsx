'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Category } from '@/lib/category/model/category.model';
import Image from 'next/image';
import { useStorefrontWishlist } from '@/components/storefront/StorefrontWishlistProvider';
import { useStorefrontCart } from '@/components/storefront/StorefrontCartProvider';

interface NavbarProps {
  categories: Category[];
}

export function Navbar({ categories }: NavbarProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { items } = useStorefrontWishlist();
  const wishlistCount = items.length;
  const { totalItems } = useStorefrontCart();

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

  const hasSubSubCategories = (category: Category) => {
    return category.subCategories.some(sub => sub.subSubCategories.length > 0);
  };

  return (
    <nav className="bg-black text-white relative z-50 border-b border-white">
      <div className="flex items-center justify-between max-w-7xl mx-auto px-4">
        <Link href={'/'}>
          <Image alt='shazstar logo' width={100} height={100} src={"/brand-icon.png"} />
        </Link>
        
        <div className="flex items-center gap-4">
          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center h-12 pb-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="relative"
              onMouseEnter={() => handleMouseEnter(category.id)}
              onMouseLeave={handleMouseLeave}
            >
              <button className="px-4 py-3 text-xs font-medium uppercase tracking-wide hover:text-amber-400 transition-colors flex items-center">
                {category.name}
                <svg
                  className="ml-1 h-4 w-4 fill-current"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 14l-6-6h12z" />
                </svg>
              </button>

                {activeDropdown === category.id && category.subCategories.length > 0 && (
                  <div className="absolute top-full left-0 bg-neutral-600 rounded-md shadow-lg min-w-max">
                    {hasSubSubCategories(category) ? (
                      // Multi-column layout for categories with sub-subcategories
                      <div className="grid grid-cols-4 gap-4 p-6 w-[800px]">
                        {category.subCategories.map((subCategory) => (
                          <div key={subCategory.id} className="space-y-2">
                            <h3 className="text-white px-2 font-medium text-sm uppercase tracking-wide border-b border-gray-700 pb-2">
                              {subCategory.name}
                            </h3>
                            <div className="space-y-1">
                              {subCategory.subSubCategories.map((subSubCategory) => (
                                <Link
                                  key={subSubCategory.id}
                                  href={`/category/${subSubCategory.slug ?? subSubCategory.id}`}
                                  className="block px-2 text-gray-300 hover:text-white hover:bg-gray-800 text-sm py-1 transition-colors"
                                >
                                  {subSubCategory.name}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      // Simple list for categories with only subcategories
                      <div className="py-2 w-64">
                        {category.subCategories.map((subCategory) => (
                          <Link
                            key={subCategory.id}
                            href={`/category/${subCategory.slug ?? subCategory.id}`}
                            className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                          >
                            {subCategory.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Wishlist link */}
          <Link
            href="/wishlist"
            className="relative inline-flex items-center justify-center rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors"
            aria-label={wishlistCount ? `View wishlist (${wishlistCount} items)` : 'View wishlist'}
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

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-800 rounded transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Slide-in Menu */}
          <div className="fixed top-0 right-0 bottom-0 w-80 bg-gray-900 z-50 overflow-y-auto lg:hidden shadow-xl">
            {/* Header */}
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

            {/* Quick Links */}
            <div className="py-2 border-b border-gray-800">
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

            {/* Categories List */}
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
                            // Has sub-subcategories
                            <div className="px-4 py-2">
                              <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                                {subCategory.name}
                              </div>
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
                            // Direct subcategory link
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
