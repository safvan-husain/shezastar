'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Category } from '@/lib/category/model/category.model';

interface NavbarProps {
  categories: Category[];
}

export function Navbar({ categories }: NavbarProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
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

  const hasSubSubCategories = (category: Category) => {
    return category.subCategories.some(sub => sub.subSubCategories.length > 0);
  };

  return (
    <nav className="bg-black text-white relative z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-12">
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
                                href={`/categories/${category.id}/${subCategory.id}/${subSubCategory.id}`}
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
                          href={`/categories/${category.id}/${subCategory.id}`}
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
      </div>
    </nav>
  );
}