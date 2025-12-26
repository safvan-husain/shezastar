'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Category } from '@/lib/category/model/category.model';

interface DesktopCategoriesProps {
    categories: Category[];
}

export function DesktopCategories({ categories }: DesktopCategoriesProps) {
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

    const hasSubSubCategories = (category: Category) => {
        return category.subCategories.some(sub => sub.subSubCategories.length > 0);
    };

    return (
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
    );
}
