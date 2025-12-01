'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';

interface SubCategory {
    id: string;
    name: string;
}

interface Category {
    id: string;
    name: string;
    subCategories: SubCategory[];
}

interface CategoryStepProps {
    selectedSubCategoryIds: string[];
    onSelectionChange: (ids: string[]) => void;
}

export function CategoryStep({ selectedSubCategoryIds, onSelectionChange }: CategoryStepProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) return categories;

        const query = searchQuery.toLowerCase();
        return categories
            .map(cat => ({
                ...cat,
                subCategories: cat.subCategories.filter(sub =>
                    sub.name.toLowerCase().includes(query) ||
                    cat.name.toLowerCase().includes(query)
                ),
            }))
            .filter(cat => cat.subCategories.length > 0);
    }, [categories, searchQuery]);

    const toggleSubCategory = (subCategoryId: string) => {
        if (selectedSubCategoryIds.includes(subCategoryId)) {
            onSelectionChange(selectedSubCategoryIds.filter(id => id !== subCategoryId));
        } else {
            onSelectionChange([...selectedSubCategoryIds, subCategoryId]);
        }
    };

    const getSelectedSubCategoryNames = () => {
        const names: string[] = [];
        categories.forEach(cat => {
            cat.subCategories.forEach(sub => {
                if (selectedSubCategoryIds.includes(sub.id)) {
                    names.push(`${cat.name} > ${sub.name}`);
                }
            });
        });
        return names;
    };

    if (loading) {
        return (
            <Card>
                <div className="text-center py-8">Loading categories...</div>
            </Card>
        );
    }

    if (categories.length === 0) {
        return (
            <Card>
                <div className="text-center py-8">
                    <p className="text-[var(--muted-foreground)] mb-4">No categories available</p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                        Create categories first to assign them to products
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <div className="space-y-4">
                    <div>
                        <h2 className="text-xl font-semibold mb-2">Select Categories</h2>
                        <p className="text-sm text-[var(--muted-foreground)]">
                            Choose one or more subcategories for this product
                        </p>
                    </div>

                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search categories..."
                            className="w-full px-4 py-2 pl-10 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                        />
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    {selectedSubCategoryIds.length > 0 && (
                        <div className="p-4 bg-[var(--muted)] rounded-lg">
                            <p className="text-sm font-medium mb-2">
                                Selected ({selectedSubCategoryIds.length}):
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {getSelectedSubCategoryNames().map((name, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-[var(--primary)] text-[var(--primary-foreground)] text-sm rounded-full"
                                    >
                                        {name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {filteredCategories.map((category) => (
                            <div key={category.id} className="border border-[var(--border)] rounded-lg p-4">
                                <h3 className="font-semibold mb-3">{category.name}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {category.subCategories.map((sub) => (
                                        <label
                                            key={sub.id}
                                            className="flex items-center gap-2 p-2 hover:bg-[var(--muted)] rounded cursor-pointer transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedSubCategoryIds.includes(sub.id)}
                                                onChange={() => toggleSubCategory(sub.id)}
                                                className="w-4 h-4 text-[var(--primary)] border-[var(--border)] rounded focus:ring-2 focus:ring-[var(--ring)]"
                                            />
                                            <span className="text-sm">{sub.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    );
}
