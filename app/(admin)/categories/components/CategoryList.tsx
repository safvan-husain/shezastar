'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface SubCategory {
    id: string;
    name: string;
}

interface Category {
    id: string;
    name: string;
    subCategories: SubCategory[];
}

export function CategoryList() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

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

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category?')) return;

        try {
            const res = await fetch(`/api/categories/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                fetchCategories();
            }
        } catch (err) {
            console.error('Failed to delete category:', err);
        }
    };

    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedCategories(newExpanded);
    };

    if (loading) {
        return <div className="text-center py-8">Loading...</div>;
    }

    if (categories.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-[var(--muted-foreground)] mb-4">No categories yet</p>
                <Link href="/categories/new">
                    <Button>Create your first category</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="divide-y divide-[var(--border)]">
            {categories.map((category) => (
                <div key={category.id} className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                            <button
                                onClick={() => toggleExpand(category.id)}
                                className="p-1 hover:bg-[var(--muted)] rounded transition-colors"
                            >
                                <svg
                                    className={`w-5 h-5 transition-transform ${
                                        expandedCategories.has(category.id) ? 'rotate-90' : ''
                                    }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                            <div>
                                <h3 className="font-semibold">{category.name}</h3>
                                <p className="text-sm text-[var(--muted-foreground)]">
                                    {category.subCategories.length} subcategories
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Link href={`/categories/${category.id}/edit`}>
                                <Button variant="outline" size="sm">
                                    Edit
                                </Button>
                            </Link>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(category.id)}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>

                    {expandedCategories.has(category.id) && category.subCategories.length > 0 && (
                        <div className="mt-4 ml-8 space-y-2">
                            {category.subCategories.map((sub) => (
                                <div
                                    key={sub.id}
                                    className="flex items-center gap-2 p-2 bg-[var(--muted)] rounded"
                                >
                                    <svg className="w-4 h-4 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    <span className="text-sm">{sub.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
