'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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

type LoadingType = 'category' | 'subcategory' | 'subsubcategory';
type LoadingAction = { type: LoadingType; id: string } | null;

export function CategoryList() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [expandedSubCategories, setExpandedSubCategories] = useState<Set<string>>(new Set());
    const [newSubCategoryNames, setNewSubCategoryNames] = useState<Record<string, string>>({});
    const [newSubSubCategoryNames, setNewSubSubCategoryNames] = useState<Record<string, string>>({});
    const [editingSubCategoryId, setEditingSubCategoryId] = useState<string | null>(null);
    const [editingSubCategoryName, setEditingSubCategoryName] = useState('');
    const [actionLoading, setActionLoading] = useState<LoadingAction>(null);
    const { showToast } = useToast();

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/categories');
            if (!res.ok) {
                const data = await res.json();
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
            showToast(message, 'error', {
                url: '/api/categories',
                method: 'GET',
                body: { error: message },
            });
        } finally {
            setLoading(false);
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

    const toggleSubExpand = (id: string) => {
        const newExpanded = new Set(expandedSubCategories);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedSubCategories(newExpanded);
    };

    const updateCategoryState = (updatedCategory: Category) => {
        setCategories(prev =>
            prev.map(category => (category.id === updatedCategory.id ? updatedCategory : category))
        );
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category?')) return;

        setActionLoading({ type: 'category', id });
        try {
            const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json();
                const message = data.message || data.error || 'Failed to delete category';
                showToast(message, 'error', {
                    status: res.status,
                    body: data,
                    url: res.url,
                    method: 'DELETE',
                });
                return;
            }

            showToast('Category deleted', 'success');
            setCategories(prev => prev.filter(category => category.id !== id));
        } catch (err: any) {
            const message = err.message || 'Failed to delete category';
            showToast(message, 'error', {
                url: `/api/categories/${id}`,
                method: 'DELETE',
                body: { error: message },
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleAddSubCategory = async (categoryId: string) => {
        const name = newSubCategoryNames[categoryId]?.trim();
        if (!name) return;

        setActionLoading({ type: 'subcategory', id: categoryId });
        try {
            const res = await fetch(`/api/categories/${categoryId}/subcategories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });

            const data = await res.json();
            if (!res.ok) {
                const message = data.message || data.error || 'Failed to add subcategory';
                showToast(message, 'error', {
                    status: res.status,
                    body: data,
                    url: res.url,
                    method: 'POST',
                });
                return;
            }

            showToast('Subcategory added', 'success');
            updateCategoryState(data);
            setNewSubCategoryNames(prev => ({ ...prev, [categoryId]: '' }));
        } catch (err: any) {
            const message = err.message || 'Failed to add subcategory';
            showToast(message, 'error', {
                url: `/api/categories/${categoryId}/subcategories`,
                method: 'POST',
                body: { error: message },
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleRemoveSubCategory = async (categoryId: string, subCategoryId: string) => {
        if (!confirm('Delete this subcategory and all nested items?')) return;

        setActionLoading({ type: 'subcategory', id: subCategoryId });
        try {
            const res = await fetch(`/api/categories/${categoryId}/subcategories/${subCategoryId}`, {
                method: 'DELETE',
            });

            const data = await res.json();
            if (!res.ok) {
                const message = data.message || data.error || 'Failed to delete subcategory';
                showToast(message, 'error', {
                    status: res.status,
                    body: data,
                    url: res.url,
                    method: 'DELETE',
                });
                return;
            }

            showToast('Subcategory removed', 'success');
            updateCategoryState(data);
        } catch (err: any) {
            const message = err.message || 'Failed to delete subcategory';
            showToast(message, 'error', {
                url: `/api/categories/${categoryId}/subcategories/${subCategoryId}`,
                method: 'DELETE',
                body: { error: message },
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdateSubCategoryName = async (categoryId: string, subCategoryId: string) => {
        if (!editingSubCategoryName.trim()) return;

        setActionLoading({ type: 'subcategory', id: subCategoryId });
        try {
            const res = await fetch(`/api/categories/${categoryId}/subcategories/${subCategoryId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editingSubCategoryName.trim() }),
            });

            const data = await res.json();
            if (!res.ok) {
                const message = data.message || data.error || 'Failed to update subcategory';
                showToast(message, 'error', {
                    status: res.status,
                    body: data,
                    url: res.url,
                    method: 'PUT',
                });
                return;
            }

            updateCategoryState(data);
            setEditingSubCategoryId(null);
            setEditingSubCategoryName('');
            showToast('Subcategory updated', 'success');
        } catch (err: any) {
            const message = err.message || 'Failed to update subcategory';
            showToast(message, 'error', {
                url: `/api/categories/${categoryId}/subcategories/${subCategoryId}`,
                method: 'PUT',
                body: { error: message },
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleAddSubSubCategory = async (categoryId: string, subCategoryId: string) => {
        const key = `${categoryId}-${subCategoryId}`;
        const name = newSubSubCategoryNames[key]?.trim();
        if (!name) return;

        setActionLoading({ type: 'subsubcategory', id: key });
        try {
            const res = await fetch(
                `/api/categories/${categoryId}/subcategories/${subCategoryId}/subsubcategories`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name }),
                }
            );

            const data = await res.json();
            if (!res.ok) {
                const message = data.message || data.error || 'Failed to add level 3 category';
                showToast(message, 'error', {
                    status: res.status,
                    body: data,
                    url: res.url,
                    method: 'POST',
                });
                return;
            }

            updateCategoryState(data);
            setNewSubSubCategoryNames(prev => ({ ...prev, [key]: '' }));
            showToast('Level 3 category added', 'success');
        } catch (err: any) {
            const message = err.message || 'Failed to add level 3 category';
            showToast(message, 'error', {
                url: `/api/categories/${categoryId}/subcategories/${subCategoryId}/subsubcategories`,
                method: 'POST',
                body: { error: message },
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleRemoveSubSubCategory = async (
        categoryId: string,
        subCategoryId: string,
        subSubCategoryId: string
    ) => {
        if (!confirm('Remove this level 3 category?')) return;

        const key = `${categoryId}-${subCategoryId}`;
        setActionLoading({ type: 'subsubcategory', id: subSubCategoryId });
        try {
            const res = await fetch(
                `/api/categories/${categoryId}/subcategories/${subCategoryId}/subsubcategories/${subSubCategoryId}`,
                {
                    method: 'DELETE',
                }
            );

            const data = await res.json();
            if (!res.ok) {
                const message = data.message || data.error || 'Failed to remove level 3 category';
                showToast(message, 'error', {
                    status: res.status,
                    body: data,
                    url: res.url,
                    method: 'DELETE',
                });
                return;
            }

            updateCategoryState(data);
            showToast('Level 3 category removed', 'success');
            setNewSubSubCategoryNames(prev => ({ ...prev, [key]: '' }));
        } catch (err: any) {
            const message = err.message || 'Failed to remove level 3 category';
            showToast(message, 'error', {
                url: `/api/categories/${categoryId}/subcategories/${subCategoryId}/subsubcategories/${subSubCategoryId}`,
                method: 'DELETE',
                body: { error: message },
            });
        } finally {
            setActionLoading(null);
        }
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

    const isActionLoading = (type: LoadingType, id: string) => {
        return actionLoading?.type === type && actionLoading.id === id;
    };

    return (
        <div className="divide-y divide-[var(--border)]">
            {categories.map(category => (
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
                                onClick={() => handleDeleteCategory(category.id)}
                                disabled={isActionLoading('category', category.id)}
                            >
                                {isActionLoading('category', category.id) ? 'Deleting...' : 'Delete'}
                            </Button>
                        </div>
                    </div>

                    {expandedCategories.has(category.id) && (
                        <div className="mt-4 ml-8 space-y-4">
                            <div className="flex flex-col md:flex-row gap-2 md:items-center">
                                <Input
                                    placeholder="Add a subcategory"
                                    value={newSubCategoryNames[category.id] || ''}
                                    onChange={e =>
                                        setNewSubCategoryNames(prev => ({
                                            ...prev,
                                            [category.id]: e.target.value,
                                        }))
                                    }
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddSubCategory(category.id);
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    onClick={() => handleAddSubCategory(category.id)}
                                    disabled={isActionLoading('subcategory', category.id)}
                                    className="md:w-auto"
                                >
                                    {isActionLoading('subcategory', category.id)
                                        ? 'Adding...'
                                        : 'Add subcategory'}
                                </Button>
                            </div>

                            {category.subCategories.length === 0 ? (
                                <p className="text-[var(--muted-foreground)] text-sm">No subcategories yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {category.subCategories.map(sub => {
                                        const subKey = `${category.id}-${sub.id}`;
                                        const isExpanded = expandedSubCategories.has(subKey);
                                        const isEditing = editingSubCategoryId === sub.id;

                                        return (
                                            <div
                                                key={sub.id}
                                                className="border-2 border-[var(--border)] rounded-xl p-3 bg-[var(--muted)]/30"
                                            >
                                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <button
                                                            onClick={() => toggleSubExpand(subKey)}
                                                            className="p-1 hover:bg-[var(--muted)] rounded transition-colors"
                                                        >
                                                            <svg
                                                                className={`w-4 h-4 transition-transform ${
                                                                    isExpanded ? 'rotate-90' : ''
                                                                }`}
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M9 5l7 7-7 7"
                                                                />
                                                            </svg>
                                                        </button>
                                                        {isEditing ? (
                                                            <Input
                                                                value={editingSubCategoryName}
                                                                onChange={e => setEditingSubCategoryName(e.target.value)}
                                                                className="flex-1"
                                                            />
                                                        ) : (
                                                            <div>
                                                                <p className="font-medium">{sub.name}</p>
                                                                <p className="text-xs text-[var(--muted-foreground)]">
                                                                    {sub.subSubCategories.length} level 3 categories
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex gap-2">
                                                        {isEditing ? (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleUpdateSubCategoryName(category.id, sub.id)}
                                                                    disabled={isActionLoading('subcategory', sub.id)}
                                                                >
                                                                    {isActionLoading('subcategory', sub.id)
                                                                        ? 'Saving...'
                                                                        : 'Save'}
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        setEditingSubCategoryId(null);
                                                                        setEditingSubCategoryName('');
                                                                    }}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        setEditingSubCategoryId(sub.id);
                                                                        setEditingSubCategoryName(sub.name);
                                                                    }}
                                                                >
                                                                    Rename
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleRemoveSubCategory(category.id, sub.id)}
                                                                    disabled={isActionLoading('subcategory', sub.id)}
                                                                >
                                                                    {isActionLoading('subcategory', sub.id)
                                                                        ? 'Removing...'
                                                                        : 'Delete'}
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {isExpanded && (
                                                    <div className="mt-3 ml-6 space-y-2">
                                                        {sub.subSubCategories.length === 0 ? (
                                                            <p className="text-xs text-[var(--muted-foreground)]">
                                                                No level 3 categories yet.
                                                            </p>
                                                        ) : (
                                                            sub.subSubCategories.map(subSub => (
                                                                <div
                                                                    key={subSub.id}
                                                                    className="flex items-center justify-between p-2 rounded-lg bg-[var(--card)]"
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <svg
                                                                            className="w-3.5 h-3.5 text-[var(--muted-foreground)]"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth={2}
                                                                                d="M9 5l7 7-7 7"
                                                                            />
                                                                        </svg>
                                                                        <span className="text-sm">{subSub.name}</span>
                                                                    </div>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() =>
                                                                            handleRemoveSubSubCategory(
                                                                                category.id,
                                                                                sub.id,
                                                                                subSub.id
                                                                            )
                                                                        }
                                                                        disabled={isActionLoading('subsubcategory', subSub.id)}
                                                                    >
                                                                        {isActionLoading('subsubcategory', subSub.id)
                                                                            ? 'Removing...'
                                                                            : 'Delete'}
                                                                    </Button>
                                                                </div>
                                                            ))
                                                        )}

                                                        <div className="flex flex-col md:flex-row md:items-center gap-2">
                                                            <Input
                                                                placeholder="Add level 3 category"
                                                                value={newSubSubCategoryNames[subKey] || ''}
                                                                onChange={e =>
                                                                    setNewSubSubCategoryNames(prev => ({
                                                                        ...prev,
                                                                        [subKey]: e.target.value,
                                                                    }))
                                                                }
                                                                onKeyDown={e => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        handleAddSubSubCategory(category.id, sub.id);
                                                                    }
                                                                }}
                                                            />
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleAddSubSubCategory(category.id, sub.id)}
                                                                disabled={isActionLoading('subsubcategory', subKey)}
                                                                className="md:w-auto"
                                                            >
                                                                {isActionLoading('subsubcategory', subKey)
                                                                    ? 'Adding...'
                                                                    : 'Add level 3'}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
