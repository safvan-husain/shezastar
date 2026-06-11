'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SingleImageUploader } from '@/components/ui/SingleImageUploader';
import { parseCategoriesResponse } from '@/lib/category/category-client';

interface SubSubCategory {
    id: string;
    name: string;
    metaTitle?: string | null;
    metaDescription?: string | null;
    imagePath?: string | null;
}

interface SubCategory {
    id: string;
    name: string;
    metaTitle?: string | null;
    metaDescription?: string | null;
    imagePath?: string | null;
    subSubCategories: SubSubCategory[];
}

interface Category {
    id: string;
    name: string;
    metaTitle?: string | null;
    metaDescription?: string | null;
    imagePath?: string | null;
    subCategories: SubCategory[];
}

type LoadingType = 'category' | 'subcategory' | 'subsubcategory';
type LoadingAction = { type: LoadingType; id: string } | null;
interface SeoDraft {
    metaTitle: string;
    metaDescription: string;
    imagePath: string;
    imageFile: File | null;
}

function createSeoDraft(initial?: { metaTitle?: string | null; metaDescription?: string | null; imagePath?: string | null }): SeoDraft {
    return {
        metaTitle: initial?.metaTitle || '',
        metaDescription: initial?.metaDescription || '',
        imagePath: initial?.imagePath || '',
        imageFile: null,
    };
}

function normalizeSeoValue(value: string) {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

type DeleteTarget = {
    type: LoadingType;
    id: string;
    url: string;
    title: string;
    message: string;
    confirmText: string;
    successMessage: string;
    onSuccess: (data: unknown) => void;
    force?: boolean;
};

function getApiPayloadMessage(payload: unknown, fallback: string) {
    if (!payload || typeof payload !== 'object') {
        return fallback;
    }
    const message = 'message' in payload ? payload.message : undefined;
    if (typeof message === 'string' && message.trim().length > 0) {
        return message;
    }
    const error = 'error' in payload ? payload.error : undefined;
    if (typeof error === 'string' && error.trim().length > 0) {
        return error;
    }
    return fallback;
}

function getErrorMessage(error: unknown, fallback: string) {
    if (error instanceof Error && error.message.trim().length > 0) {
        return error.message;
    }
    return fallback;
}

export function CategoryList() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [expandedSubCategories, setExpandedSubCategories] = useState<Set<string>>(new Set());
    const [newSubCategoryNames, setNewSubCategoryNames] = useState<Record<string, string>>({});
    const [newSubCategorySeo, setNewSubCategorySeo] = useState<Record<string, SeoDraft>>({});
    const [newSubSubCategoryNames, setNewSubSubCategoryNames] = useState<Record<string, string>>({});
    const [newSubSubCategorySeo, setNewSubSubCategorySeo] = useState<Record<string, SeoDraft>>({});
    const [editingSubCategoryId, setEditingSubCategoryId] = useState<string | null>(null);
    const [editingSubCategoryName, setEditingSubCategoryName] = useState('');
    const [editingSubCategorySeo, setEditingSubCategorySeo] = useState<SeoDraft>(createSeoDraft());
    const [editingSubSubCategoryId, setEditingSubSubCategoryId] = useState<string | null>(null);
    const [editingSubSubCategoryName, setEditingSubSubCategoryName] = useState('');
    const [editingSubSubCategorySeo, setEditingSubSubCategorySeo] = useState<SeoDraft>(createSeoDraft());
    const [actionLoading, setActionLoading] = useState<LoadingAction>(null);
    const [pendingDelete, setPendingDelete] = useState<DeleteTarget | null>(null);
    const { showToast } = useToast();

    const fetchCategories = useCallback(async () => {
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

            const data = parseCategoriesResponse(await res.json());
            setCategories(data);
        } catch (err: unknown) {
            const message = getErrorMessage(err, 'Failed to load categories');
            showToast(message, 'error', {
                url: '/api/categories',
                method: 'GET',
                body: { error: message },
            });
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        void fetchCategories();
    }, [fetchCategories]);

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

    const uploadCategoryImage = async (file: File) => {
        const formData = new FormData();
        formData.append('image', file);

        const res = await fetch('/api/categories/images', {
            method: 'POST',
            body: formData,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.imagePath) {
            throw new Error(data.message || data.error || 'Failed to upload category image');
        }
        return data.imagePath as string;
    };

    const executeDelete = async (target: DeleteTarget) => {
        const url = target.force ? `${target.url}?force=true` : target.url;
        setActionLoading({ type: target.type, id: target.id });
        try {
            const res = await fetch(url, { method: 'DELETE' });
            const data: unknown = await res.json();

            if (
                res.status === 409 &&
                data &&
                typeof data === 'object' &&
                'code' in data &&
                data.code === 'CATEGORY_IN_USE'
            ) {
                const details =
                    'details' in data && data.details && typeof data.details === 'object'
                        ? data.details
                        : null;
                const productCount =
                    details && 'productCount' in details && typeof details.productCount === 'number'
                        ? details.productCount
                        : 0;
                setPendingDelete({
                    ...target,
                    force: true,
                    title: 'Remove category from products?',
                    message: `This category is used by ${productCount} product${productCount === 1 ? '' : 's'}. Deleting it will remove this category assignment from those products.`,
                    confirmText: 'Delete and clean products',
                });
                return;
            }

            if (!res.ok) {
                const message = getApiPayloadMessage(data, 'Failed to delete category');
                showToast(message, 'error', {
                    status: res.status,
                    body: data,
                    url: res.url,
                    method: 'DELETE',
                });
                return;
            }

            const cleanedProductCount =
                data &&
                typeof data === 'object' &&
                'cleanedProductCount' in data &&
                typeof data.cleanedProductCount === 'number'
                    ? data.cleanedProductCount
                    : 0;
            showToast(
                cleanedProductCount > 0
                    ? `${target.successMessage}. Cleaned ${cleanedProductCount} product${cleanedProductCount === 1 ? '' : 's'}.`
                    : target.successMessage,
                'success'
            );
            target.onSuccess(data);
            setPendingDelete(null);
        } catch (err: unknown) {
            const message = getErrorMessage(err, 'Failed to delete category');
            showToast(message, 'error', {
                url: target.url,
                method: 'DELETE',
                body: { error: message },
            });
        } finally {
            setActionLoading(null);
        }
    };

    const requestDelete = (target: DeleteTarget) => {
        setPendingDelete(target);
    };

    const handleDeleteCategory = (category: Category) => {
        requestDelete({
            type: 'category',
            id: category.id,
            url: `/api/categories/${category.id}`,
            title: 'Delete category',
            message: `Delete ${category.name}? This cannot be undone.`,
            confirmText: 'Delete',
            successMessage: 'Category deleted',
            onSuccess: () => setCategories(prev => prev.filter(item => item.id !== category.id)),
        });
    };

    const handleAddSubCategory = async (categoryId: string) => {
        const name = newSubCategoryNames[categoryId]?.trim();
        if (!name) return;

        setActionLoading({ type: 'subcategory', id: categoryId });
        try {
            const seoDraft = newSubCategorySeo[categoryId] || createSeoDraft();
            const imagePath = seoDraft.imageFile
                ? await uploadCategoryImage(seoDraft.imageFile)
                : normalizeSeoValue(seoDraft.imagePath);
            const res = await fetch(`/api/categories/${categoryId}/subcategories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    metaTitle: normalizeSeoValue(seoDraft.metaTitle),
                    metaDescription: normalizeSeoValue(seoDraft.metaDescription),
                    imagePath,
                }),
            });

            const data: unknown = await res.json();
            if (!res.ok) {
                const message = getApiPayloadMessage(data, 'Failed to add subcategory');
                showToast(message, 'error', {
                    status: res.status,
                    body: data,
                    url: res.url,
                    method: 'POST',
                });
                return;
            }

            showToast('Subcategory added', 'success');
            updateCategoryState(data as Category);
            setNewSubCategoryNames(prev => ({ ...prev, [categoryId]: '' }));
            setNewSubCategorySeo(prev => ({ ...prev, [categoryId]: createSeoDraft() }));
        } catch (err: unknown) {
            const message = getErrorMessage(err, 'Failed to add subcategory');
            showToast(message, 'error', {
                url: `/api/categories/${categoryId}/subcategories`,
                method: 'POST',
                body: { error: message },
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleRemoveSubCategory = (categoryId: string, subCategory: SubCategory) => {
        requestDelete({
            type: 'subcategory',
            id: subCategory.id,
            url: `/api/categories/${categoryId}/subcategories/${subCategory.id}`,
            title: 'Delete subcategory',
            message: `Delete ${subCategory.name} and all nested items? This cannot be undone.`,
            confirmText: 'Delete',
            successMessage: 'Subcategory removed',
            onSuccess: (data) => updateCategoryState(data as Category),
        });
    };

    const handleUpdateSubCategoryName = async (categoryId: string, subCategoryId: string) => {
        if (!editingSubCategoryName.trim()) return;

        setActionLoading({ type: 'subcategory', id: subCategoryId });
        try {
            const imagePath = editingSubCategorySeo.imageFile
                ? await uploadCategoryImage(editingSubCategorySeo.imageFile)
                : normalizeSeoValue(editingSubCategorySeo.imagePath);
            const res = await fetch(`/api/categories/${categoryId}/subcategories/${subCategoryId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editingSubCategoryName.trim(),
                    metaTitle: normalizeSeoValue(editingSubCategorySeo.metaTitle),
                    metaDescription: normalizeSeoValue(editingSubCategorySeo.metaDescription),
                    imagePath,
                }),
            });

            const data: unknown = await res.json();
            if (!res.ok) {
                const message = getApiPayloadMessage(data, 'Failed to update subcategory');
                showToast(message, 'error', {
                    status: res.status,
                    body: data,
                    url: res.url,
                    method: 'PUT',
                });
                return;
            }

            updateCategoryState(data as Category);
            setEditingSubCategoryId(null);
            setEditingSubCategoryName('');
            setEditingSubCategorySeo(createSeoDraft());
            showToast('Subcategory updated', 'success');
        } catch (err: unknown) {
            const message = getErrorMessage(err, 'Failed to update subcategory');
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
            const seoDraft = newSubSubCategorySeo[key] || createSeoDraft();
            const imagePath = seoDraft.imageFile
                ? await uploadCategoryImage(seoDraft.imageFile)
                : normalizeSeoValue(seoDraft.imagePath);
            const res = await fetch(
                `/api/categories/${categoryId}/subcategories/${subCategoryId}/subsubcategories`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name,
                        metaTitle: normalizeSeoValue(seoDraft.metaTitle),
                        metaDescription: normalizeSeoValue(seoDraft.metaDescription),
                        imagePath,
                    }),
                }
            );

            const data: unknown = await res.json();
            if (!res.ok) {
                const message = getApiPayloadMessage(data, 'Failed to add level 3 category');
                showToast(message, 'error', {
                    status: res.status,
                    body: data,
                    url: res.url,
                    method: 'POST',
                });
                return;
            }

            updateCategoryState(data as Category);
            setNewSubSubCategoryNames(prev => ({ ...prev, [key]: '' }));
            setNewSubSubCategorySeo(prev => ({ ...prev, [key]: createSeoDraft() }));
            showToast('Level 3 category added', 'success');
        } catch (err: unknown) {
            const message = getErrorMessage(err, 'Failed to add level 3 category');
            showToast(message, 'error', {
                url: `/api/categories/${categoryId}/subcategories/${subCategoryId}/subsubcategories`,
                method: 'POST',
                body: { error: message },
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdateSubSubCategory = async (
        categoryId: string,
        subCategory: SubCategory,
        subSubCategoryId: string
    ) => {
        if (!editingSubSubCategoryName.trim()) return;

        setActionLoading({ type: 'subsubcategory', id: subSubCategoryId });
        try {
            const imagePath = editingSubSubCategorySeo.imageFile
                ? await uploadCategoryImage(editingSubSubCategorySeo.imageFile)
                : normalizeSeoValue(editingSubSubCategorySeo.imagePath);
            const nextSubSubCategories = subCategory.subSubCategories.map((item) =>
                item.id === subSubCategoryId
                    ? {
                        ...item,
                        name: editingSubSubCategoryName.trim(),
                        metaTitle: normalizeSeoValue(editingSubSubCategorySeo.metaTitle),
                        metaDescription: normalizeSeoValue(editingSubSubCategorySeo.metaDescription),
                        imagePath,
                    }
                    : item
            );

            const res = await fetch(`/api/categories/${categoryId}/subcategories/${subCategory.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subSubCategories: nextSubSubCategories,
                }),
            });

            const data: unknown = await res.json();
            if (!res.ok) {
                const message = getApiPayloadMessage(data, 'Failed to update level 3 category');
                showToast(message, 'error', {
                    status: res.status,
                    body: data,
                    url: res.url,
                    method: 'PUT',
                });
                return;
            }

            updateCategoryState(data as Category);
            setEditingSubSubCategoryId(null);
            setEditingSubSubCategoryName('');
            setEditingSubSubCategorySeo(createSeoDraft());
            showToast('Level 3 category updated', 'success');
        } catch (err: unknown) {
            const message = getErrorMessage(err, 'Failed to update level 3 category');
            showToast(message, 'error', {
                url: `/api/categories/${categoryId}/subcategories/${subCategory.id}`,
                method: 'PUT',
                body: { error: message },
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleRemoveSubSubCategory = (
        categoryId: string,
        subCategoryId: string,
        subSubCategory: SubSubCategory
    ) => {
        const key = `${categoryId}-${subCategoryId}`;
        requestDelete({
            type: 'subsubcategory',
            id: subSubCategory.id,
            url: `/api/categories/${categoryId}/subcategories/${subCategoryId}/subsubcategories/${subSubCategory.id}`,
            title: 'Delete level 3 category',
            message: `Delete ${subSubCategory.name}? This cannot be undone.`,
            confirmText: 'Delete',
            successMessage: 'Level 3 category removed',
            onSuccess: (data) => {
                updateCategoryState(data as Category);
                setNewSubSubCategoryNames(prev => ({ ...prev, [key]: '' }));
            },
        });
    };

    if (loading) {
        return <div className="text-center py-8">Loading...</div>;
    }

    if (categories.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-[var(--muted-foreground)] mb-4">No categories yet</p>
                <Link href="/manage/categories/new">
                    <Button>Create your first category</Button>
                </Link>
            </div>
        );
    }

    const isActionLoading = (type: LoadingType, id: string) => {
        return actionLoading?.type === type && actionLoading.id === id;
    };

    return (
        <>
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
                                    className={`w-5 h-5 transition-transform ${expandedCategories.has(category.id) ? 'rotate-90' : ''
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
                            <Link href={`/manage/categories/${category.id}/edit`}>
                                <Button variant="outline" size="sm">
                                    Edit
                                </Button>
                            </Link>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteCategory(category)}
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
                                <Input
                                    placeholder="Meta title"
                                    value={newSubCategorySeo[category.id]?.metaTitle || ''}
                                    onChange={e =>
                                        setNewSubCategorySeo(prev => ({
                                            ...prev,
                                            [category.id]: {
                                                ...(prev[category.id] || createSeoDraft()),
                                                metaTitle: e.target.value,
                                            },
                                        }))
                                    }
                                />
                                <Input
                                    placeholder="Meta description"
                                    value={newSubCategorySeo[category.id]?.metaDescription || ''}
                                    onChange={e =>
                                        setNewSubCategorySeo(prev => ({
                                            ...prev,
                                            [category.id]: {
                                                ...(prev[category.id] || createSeoDraft()),
                                                metaDescription: e.target.value,
                                            },
                                        }))
                                    }
                                />
                                <div className="md:w-72">
                                    <SingleImageUploader
                                        label="OG image"
                                        value={
                                            newSubCategorySeo[category.id]?.imageFile
                                                ? URL.createObjectURL(newSubCategorySeo[category.id].imageFile!)
                                                : newSubCategorySeo[category.id]?.imagePath || undefined
                                        }
                                        onChange={(file) =>
                                            setNewSubCategorySeo(prev => ({
                                                ...prev,
                                                [category.id]: {
                                                    ...(prev[category.id] || createSeoDraft()),
                                                    imageFile: file,
                                                    imagePath: file ? prev[category.id]?.imagePath || '' : '',
                                                },
                                            }))
                                        }
                                    />
                                </div>
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
                                                                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''
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
                                                            <div className="w-full space-y-2">
                                                                <Input
                                                                    value={editingSubCategoryName}
                                                                    onChange={e => setEditingSubCategoryName(e.target.value)}
                                                                    className="flex-1"
                                                                />
                                                                <Input
                                                                    placeholder="Meta title"
                                                                    value={editingSubCategorySeo.metaTitle}
                                                                    onChange={e =>
                                                                        setEditingSubCategorySeo(prev => ({
                                                                            ...prev,
                                                                            metaTitle: e.target.value,
                                                                        }))
                                                                    }
                                                                />
                                                                <Input
                                                                    placeholder="Meta description"
                                                                    value={editingSubCategorySeo.metaDescription}
                                                                    onChange={e =>
                                                                        setEditingSubCategorySeo(prev => ({
                                                                            ...prev,
                                                                            metaDescription: e.target.value,
                                                                        }))
                                                                    }
                                                                />
                                                                <SingleImageUploader
                                                                    label="OG image"
                                                                    value={
                                                                        editingSubCategorySeo.imageFile
                                                                            ? URL.createObjectURL(editingSubCategorySeo.imageFile)
                                                                            : editingSubCategorySeo.imagePath || undefined
                                                                    }
                                                                    onChange={(file) =>
                                                                        setEditingSubCategorySeo(prev => ({
                                                                            ...prev,
                                                                            imageFile: file,
                                                                            imagePath: file ? prev.imagePath : '',
                                                                        }))
                                                                    }
                                                                />
                                                            </div>
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
                                                                        setEditingSubCategorySeo(createSeoDraft());
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
                                                                        setEditingSubCategorySeo(createSeoDraft(sub));
                                                                    }}
                                                                >
                                                                    Rename
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleRemoveSubCategory(category.id, sub)}
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
                                                                    className="p-2 rounded-lg bg-[var(--card)]"
                                                                >
                                                                    {editingSubSubCategoryId === subSub.id ? (
                                                                        <div className="space-y-2">
                                                                            <Input
                                                                                value={editingSubSubCategoryName}
                                                                                onChange={e => setEditingSubSubCategoryName(e.target.value)}
                                                                            />
                                                                            <Input
                                                                                placeholder="Meta title"
                                                                                value={editingSubSubCategorySeo.metaTitle}
                                                                                onChange={e =>
                                                                                    setEditingSubSubCategorySeo(prev => ({
                                                                                        ...prev,
                                                                                        metaTitle: e.target.value,
                                                                                    }))
                                                                                }
                                                                            />
                                                                            <Input
                                                                                placeholder="Meta description"
                                                                                value={editingSubSubCategorySeo.metaDescription}
                                                                                onChange={e =>
                                                                                    setEditingSubSubCategorySeo(prev => ({
                                                                                        ...prev,
                                                                                        metaDescription: e.target.value,
                                                                                    }))
                                                                                }
                                                                            />
                                                                            <SingleImageUploader
                                                                                label="OG image"
                                                                                value={
                                                                                    editingSubSubCategorySeo.imageFile
                                                                                        ? URL.createObjectURL(editingSubSubCategorySeo.imageFile)
                                                                                        : editingSubSubCategorySeo.imagePath || undefined
                                                                                }
                                                                                onChange={(file) =>
                                                                                    setEditingSubSubCategorySeo(prev => ({
                                                                                        ...prev,
                                                                                        imageFile: file,
                                                                                        imagePath: file ? prev.imagePath : '',
                                                                                    }))
                                                                                }
                                                                            />
                                                                            <div className="flex gap-2">
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    onClick={() =>
                                                                                        handleUpdateSubSubCategory(
                                                                                            category.id,
                                                                                            sub,
                                                                                            subSub.id
                                                                                        )
                                                                                    }
                                                                                    disabled={isActionLoading('subsubcategory', subSub.id)}
                                                                                >
                                                                                    Save
                                                                                </Button>
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    onClick={() => {
                                                                                        setEditingSubSubCategoryId(null);
                                                                                        setEditingSubSubCategoryName('');
                                                                                        setEditingSubSubCategorySeo(createSeoDraft());
                                                                                    }}
                                                                                >
                                                                                    Cancel
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center justify-between gap-2">
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
                                                                            <div className="flex gap-2">
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    onClick={() => {
                                                                                        setEditingSubSubCategoryId(subSub.id);
                                                                                        setEditingSubSubCategoryName(subSub.name);
                                                                                        setEditingSubSubCategorySeo(createSeoDraft(subSub));
                                                                                    }}
                                                                                >
                                                                                    Edit
                                                                                </Button>
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    onClick={() =>
                                                                                        handleRemoveSubSubCategory(
                                                                                            category.id,
                                                                                            sub.id,
                                                                                            subSub
                                                                                        )
                                                                                    }
                                                                                    disabled={isActionLoading('subsubcategory', subSub.id)}
                                                                                >
                                                                                    {isActionLoading('subsubcategory', subSub.id)
                                                                                        ? 'Removing...'
                                                                                        : 'Delete'}
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    )}
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
                                                            <Input
                                                                placeholder="Meta title"
                                                                value={newSubSubCategorySeo[subKey]?.metaTitle || ''}
                                                                onChange={e =>
                                                                    setNewSubSubCategorySeo(prev => ({
                                                                        ...prev,
                                                                        [subKey]: {
                                                                            ...(prev[subKey] || createSeoDraft()),
                                                                            metaTitle: e.target.value,
                                                                        },
                                                                    }))
                                                                }
                                                            />
                                                            <Input
                                                                placeholder="Meta description"
                                                                value={newSubSubCategorySeo[subKey]?.metaDescription || ''}
                                                                onChange={e =>
                                                                    setNewSubSubCategorySeo(prev => ({
                                                                        ...prev,
                                                                        [subKey]: {
                                                                            ...(prev[subKey] || createSeoDraft()),
                                                                            metaDescription: e.target.value,
                                                                        },
                                                                    }))
                                                                }
                                                            />
                                                            <div className="md:w-72">
                                                                <SingleImageUploader
                                                                    label="OG image"
                                                                    value={
                                                                        newSubSubCategorySeo[subKey]?.imageFile
                                                                            ? URL.createObjectURL(newSubSubCategorySeo[subKey].imageFile!)
                                                                            : newSubSubCategorySeo[subKey]?.imagePath || undefined
                                                                    }
                                                                    onChange={(file) =>
                                                                        setNewSubSubCategorySeo(prev => ({
                                                                            ...prev,
                                                                            [subKey]: {
                                                                                ...(prev[subKey] || createSeoDraft()),
                                                                                imageFile: file,
                                                                                imagePath: file ? prev[subKey]?.imagePath || '' : '',
                                                                            },
                                                                        }))
                                                                    }
                                                                />
                                                            </div>
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

            <ConfirmDialog
                isOpen={Boolean(pendingDelete)}
                onClose={() => setPendingDelete(null)}
                onConfirm={() => {
                    if (pendingDelete) {
                        void executeDelete(pendingDelete);
                    }
                }}
                title={pendingDelete?.title ?? 'Delete category'}
                message={pendingDelete?.message ?? ''}
                confirmText={pendingDelete?.confirmText ?? 'Delete'}
                variant="danger"
                isLoading={Boolean(pendingDelete && isActionLoading(pendingDelete.type, pendingDelete.id))}
            />
        </>
    );
}
