'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';

interface SubSubCategory {
    id: string;
    name: string;
}

interface SubCategory {
    id: string;
    name: string;
    subSubCategories: SubSubCategory[];
}

interface Category {
    id: string;
    name: string;
    subCategories: SubCategory[];
}

interface CategoryOption {
    id: string;
    path: string[];
}

interface CategoryStepProps {
    selectedSubCategoryIds: string[];
    onSelectionChange: (ids: string[]) => void;
}

export function CategoryStep({ selectedSubCategoryIds, onSelectionChange }: CategoryStepProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const { showToast } = useToast();

    useEffect(() => {
        fetchCategories();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/categories');
            if (!res.ok) {
                let data: any = {};
                try {
                    data = await res.json();
                } catch {
                    // ignore JSON parse errors
                }
                const message = data.message || data.error || 'Failed to load categories';
                showToast(message, 'error', {
                    status: res.status,
                    body: data,
                    url: res.url,
                    method: 'GET',
                });
                return;
            }

            const data = await res.json();
            setCategories(data);
        } catch (err: any) {
            const message = err.message || 'Failed to load categories';
            showToast(message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const { allOptions, optionMap } = useMemo(() => {
        const options: CategoryOption[] = [];
        const map = new Map<string, CategoryOption>();

        categories.forEach(category => {
            category.subCategories.forEach(sub => {
                if (sub.subSubCategories && sub.subSubCategories.length > 0) {
                    sub.subSubCategories.forEach(subSub => {
                        const option: CategoryOption = {
                            id: subSub.id,
                            path: [category.name, sub.name, subSub.name],
                        };
                        options.push(option);
                        map.set(option.id, option);
                    });
                } else {
                    const option: CategoryOption = {
                        id: sub.id,
                        path: [category.name, sub.name],
                    };
                    options.push(option);
                    map.set(option.id, option);
                }
            });
        });

        // Sort options by their full path for consistent display
        options.sort((a, b) => a.path.join(' / ').localeCompare(b.path.join(' / ')));

        return { allOptions: options, optionMap: map };
    }, [categories]);

    const availableOptions = useMemo(
        () => allOptions.filter(option => !selectedSubCategoryIds.includes(option.id)),
        [allOptions, selectedSubCategoryIds]
    );

    const filteredOptions = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return availableOptions;

        return availableOptions.filter(option =>
            option.path.some(part => part.toLowerCase().includes(query))
        );
    }, [availableOptions, searchQuery]);

    useEffect(() => {
        if (filteredOptions.length === 0) {
            setActiveIndex(0);
        } else if (activeIndex >= filteredOptions.length) {
            setActiveIndex(0);
        }
    }, [filteredOptions, activeIndex]);

    const handleSelect = (id: string) => {
        if (selectedSubCategoryIds.includes(id)) return;

        onSelectionChange([...selectedSubCategoryIds, id]);
        setSearchQuery('');
        setActiveIndex(0);

        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const handleRemoveSelection = (id: string) => {
        onSelectionChange(selectedSubCategoryIds.filter(selectedId => selectedId !== id));
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (filteredOptions.length === 0) return;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex(prev => (prev + 1) % filteredOptions.length);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex(prev => (prev - 1 + filteredOptions.length) % filteredOptions.length);
        } else if (event.key === 'Enter') {
            event.preventDefault();
            const option = filteredOptions[activeIndex] ?? filteredOptions[0];
            if (option) {
                handleSelect(option.id);
            }
        }
    };

    const selectedOptions = useMemo(
        () =>
            selectedSubCategoryIds
                .map(id => optionMap.get(id))
                .filter((option): option is CategoryOption => Boolean(option)),
        [selectedSubCategoryIds, optionMap]
    );

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
                            Choose one or more categories (including level 3) for this product
                        </p>
                    </div>

                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Search categories by any level..."
                            className="w-full px-4 py-2 pl-10 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                        />
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>

                    {selectedOptions.length > 0 && (
                        <div className="p-4 bg-[var(--muted)] rounded-lg">
                            <p className="text-sm font-medium mb-2">
                                Selected ({selectedOptions.length}):
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {selectedOptions.map(option => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => handleRemoveSelection(option.id)}
                                        className="flex items-center gap-2 px-3 py-1 bg-[var(--primary)] text-[var(--primary-foreground)] text-sm rounded-full hover:bg-[var(--primary)]/90 transition-colors"
                                    >
                                        <span>{option.path.join(' / ')}</span>
                                        <svg
                                            className="w-3 h-3"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="max-h-96 overflow-y-auto border border-[var(--border)] rounded-lg">
                        {filteredOptions.length === 0 ? (
                            <div className="p-4 text-sm text-[var(--muted-foreground)]">
                                {availableOptions.length === 0
                                    ? 'All categories have been selected.'
                                    : 'No categories match your search.'}
                            </div>
                        ) : (
                            <ul className="divide-y divide-[var(--border)]">
                                {filteredOptions.map((option, index) => {
                                    const isActive = index === activeIndex;
                                    const label = option.path.join(' / ');

                                    return (
                                        <li key={option.id}>
                                            <button
                                                type="button"
                                                onClick={() => handleSelect(option.id)}
                                                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors ${
                                                    isActive
                                                        ? 'bg-[var(--muted)]'
                                                        : 'hover:bg-[var(--muted)]'
                                                }`}
                                            >
                                                <span className="truncate">{label}</span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}
