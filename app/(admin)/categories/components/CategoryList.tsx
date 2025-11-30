'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { deleteCategoryAction } from '@/lib/actions/category.actions';
import { useErrorToast } from '@/components/ui/error-toast';
import { Category } from '@/lib/category';

export function CategoryList({ initialCategories }: { initialCategories: Category[] }) {
    const router = useRouter();
    const [, startTransition] = useTransition();
    const { showErrorToast } = useErrorToast();
    const [categories, setCategories] = useState<Category[]>(initialCategories);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedCategories(newExpanded);
    };

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
                                disabled={deletingId === category.id}
                                onClick={() => {
                                    if (!confirm('Are you sure you want to delete this category?')) return;
                                    setDeletingId(category.id);
                                    startTransition(async () => {
                                        try {
                                            const result = await deleteCategoryAction(category.id);
                                            if (!result.success) {
                                                showErrorToast(result.error);
                                                return;
                                            }
                                            setCategories(prev => prev.filter(c => c.id !== category.id));
                                            router.refresh();
                                        } catch (err: any) {
                                            showErrorToast(err.message || 'Failed to delete category');
                                        } finally {
                                            setDeletingId(null);
                                        }
                                    });
                                }}
                            >
                                {deletingId === category.id ? 'Deleting...' : 'Delete'}
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
