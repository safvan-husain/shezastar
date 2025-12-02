'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Category } from '@/lib/category/model/category.model';
import Image from 'next/image';

interface NavbarProps {
  categories: Category[];
}

export function Navbar({ categories }: NavbarProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        
        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center h-12 pb-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="relative"
              onMouseEnter={() => handleMouseEnter(category.id)}
              onMouseLeave={handleMouseLeave}
            >
              <button className="px-4 py-3 text-sm font-medium uppercase tracking-wide hover:bg-gray-800 transition-colors flex items-center">
                {category.name}
                <svg
                  className="ml-1 h-3 w-3 fill-current"
                  viewBox="0 0 20 20"
                >
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </button>

              {activeDropdown === category.id && category.subCategories.length > 0 && (
                <div className="absolute top-full left-0 bg-gray-900 shadow-lg min-w-max">
                  {hasSubSubCategories(category) ? (
                    // Multi-column layout for categories with sub-subcategories
                    <div className="grid grid-cols-4 gap-8 p-6 w-[800px]">
                      {category.subCategories.map((subCategory) => (
                        <div key={subCategory.id} className="space-y-2">
                          <h3 className="text-white font-medium text-sm uppercase tracking-wide border-b border-gray-700 pb-2">
                            {subCategory.name}
                          </h3>
                          <div className="space-y-1">
                            {subCategory.subSubCategories.map((subSubCategory) => (
                              <Link
                                key={subSubCategory.id}
                                href={`/category/${subSubCategory.slug ?? subSubCategory.id}`}
                                className="block text-gray-300 hover:text-white text-sm py-1 transition-colors"
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
