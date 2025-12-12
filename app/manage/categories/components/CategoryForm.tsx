'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { nanoid } from 'nanoid';

interface SubSubCategory {
    id: string;
    name: string;
}

interface SubCategory {
    id: string;
    name: string;
    subSubCategories: SubSubCategory[];
}

interface CategoryFormProps {
    initialData?: {
        id: string;
        name: string;
        subCategories: SubCategory[];
    };
}

export function CategoryForm({ initialData }: CategoryFormProps) {
    const router = useRouter();
    const { showToast } = useToast();
    const [name, setName] = useState(initialData?.name || '');
    const [subCategories, setSubCategories] = useState<SubCategory[]>(
        initialData?.subCategories || []
    );
    const [newSubCategoryName, setNewSubCategoryName] = useState('');
    const [newSubSubCategoryNames, setNewSubSubCategoryNames] = useState<
        Record<string, string>
    >({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const hasNestedContent = useMemo(
        () => subCategories.some(sub => sub.subSubCategories.length > 0),
        [subCategories]
    );

    const addSubCategory = () => {
        if (!newSubCategoryName.trim()) return;

        setSubCategories([
            ...subCategories,
            { id: nanoid(), name: newSubCategoryName.trim(), subSubCategories: [] },
        ]);
        setNewSubCategoryName('');
    };

    const updateSubCategoryName = (id: string, value: string) => {
        setSubCategories(prev =>
            prev.map(sub => (sub.id === id ? { ...sub, name: value } : sub))
        );
    };

    const removeSubCategory = (id: string) => {
        setSubCategories(subCategories.filter(sub => sub.id !== id));
    };

    const addSubSubCategory = (subCategoryId: string) => {
        const nameToAdd = newSubSubCategoryNames[subCategoryId]?.trim();
        if (!nameToAdd) return;

        setSubCategories(prev =>
            prev.map(sub =>
                sub.id === subCategoryId
                    ? {
                          ...sub,
                          subSubCategories: [
                              ...sub.subSubCategories,
                              { id: nanoid(), name: nameToAdd },
                          ],
                      }
                    : sub
            )
        );

        setNewSubSubCategoryNames(prev => ({ ...prev, [subCategoryId]: '' }));
    };

    const updateSubSubCategoryName = (
        subCategoryId: string,
        subSubCategoryId: string,
        value: string
    ) => {
        setSubCategories(prev =>
            prev.map(sub =>
                sub.id === subCategoryId
                    ? {
                          ...sub,
                          subSubCategories: sub.subSubCategories.map(subSub =>
                              subSub.id === subSubCategoryId
                                  ? { ...subSub, name: value }
                                  : subSub
                          ),
                      }
                    : sub
            )
        );
    };

    const removeSubSubCategory = (subCategoryId: string, subSubCategoryId: string) => {
        setSubCategories(prev =>
            prev.map(sub =>
                sub.id === subCategoryId
                    ? {
                          ...sub,
                          subSubCategories: sub.subSubCategories.filter(
                              subSub => subSub.id !== subSubCategoryId
                          ),
                      }
                    : sub
            )
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) {
            setError('Category name is required');
            return;
        }

        const url = initialData?.id
            ? `/api/categories/${initialData.id}`
            : '/api/categories';
        const method = initialData?.id ? 'PUT' : 'POST';

        setLoading(true);

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, subCategories }),
            });

            if (!res.ok) {
                const data = await res.json();
                const message = data.message || data.error || 'Failed to save category';

                showToast(message, 'error', {
                    status: res.status,
                    body: data,
                    url: res.url,
                    method,
                });

                setError(message);
                setLoading(false);
                return;
            }

            showToast(
                initialData?.id ? 'Category updated successfully' : 'Category created successfully',
                'success'
            );

            router.push('/categories');
            router.refresh();
        } catch (err: any) {
            const message = err.message || 'An unexpected error occurred';
            showToast(message, 'error', {
                url,
                method,
                body: { error: message },
            });
            setError(message);
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-[var(--danger)]/10 border-2 border-[var(--danger)] text-[var(--danger)] px-5 py-4 rounded-xl flex items-start gap-3">
                    <svg className="w-5 h-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <p className="font-semibold">Error</p>
                        <p className="text-sm">{error}</p>
                    </div>
                </div>
            )}

            <Card>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--ring)] flex items-center justify-center text-[var(--primary-foreground)]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 01-8 0M12 3v4m-7 4h14l-1 9H6l-1-9z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Category Details</h2>
                        <p className="text-sm text-[var(--muted-foreground)]">Name and nested structure</p>
                    </div>
                </div>

                <Input
                    label="Category Name"
                    placeholder="e.g., Electronics, Clothing"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                />
            </Card>

            <Card>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--ring)] flex items-center justify-center text-[var(--primary-foreground)]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-9 4h10m-7 4h4" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Subcategories</h2>
                        <p className="text-sm text-[var(--muted-foreground)]">Organize level 2 and level 3 entries</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-3">
                        <Input
                            placeholder="Add a new subcategory"
                            value={newSubCategoryName}
                            onChange={e => setNewSubCategoryName(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addSubCategory();
                                }
                            }}
                        />
                        <Button
                            type="button"
                            onClick={addSubCategory}
                            disabled={!newSubCategoryName.trim()}
                            className="md:w-auto"
                        >
                            Add Subcategory
                        </Button>
                    </div>

                    {subCategories.length > 0 ? (
                        <div className="space-y-4">
                            {subCategories.map(sub => (
                                <div
                                    key={sub.id}
                                    className="border-2 border-[var(--border)] rounded-xl p-4 bg-[var(--card)]/50 space-y-3"
                                >
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <Input
                                            label="Subcategory name"
                                            value={sub.name}
                                            onChange={e => updateSubCategoryName(sub.id, e.target.value)}
                                        />

                                        <div className="flex gap-2 md:self-start">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => removeSubCategory(sub.id)}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {hasNestedContent && (
                                            <p className="text-sm font-semibold text-[var(--muted-foreground)]">
                                                Sub-subcategories
                                            </p>
                                        )}

                                        {sub.subSubCategories.map(subSub => (
                                            <div
                                                key={subSub.id}
                                                className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3"
                                            >
                                                <Input
                                                    placeholder="Sub-subcategory name"
                                                    value={subSub.name}
                                                    onChange={e =>
                                                        updateSubSubCategoryName(
                                                            sub.id,
                                                            subSub.id,
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() =>
                                                        removeSubSubCategory(sub.id, subSub.id)
                                                    }
                                                    className="md:w-auto"
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        ))}

                                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                                            <Input
                                                placeholder="Add a sub-subcategory"
                                                value={newSubSubCategoryNames[sub.id] || ''}
                                                onChange={e =>
                                                    setNewSubSubCategoryNames(prev => ({
                                                        ...prev,
                                                        [sub.id]: e.target.value,
                                                    }))
                                                }
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        addSubSubCategory(sub.id);
                                                    }
                                                }}
                                            />
                                            <Button
                                                type="button"
                                                onClick={() => addSubSubCategory(sub.id)}
                                                disabled={!newSubSubCategoryNames[sub.id]?.trim()}
                                                className="md:w-auto"
                                            >
                                                Add Level 3
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border-2 border-dashed border-[var(--border)] p-6 text-center text-[var(--muted-foreground)]">
                            No subcategories yet. Add your first one above.
                        </div>
                    )}
                </div>
            </Card>

            <div className="flex gap-3 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/categories')}
                    disabled={loading}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={loading || !name.trim()}>
                    {loading ? 'Saving...' : initialData?.id ? 'Update' : 'Create'}
                </Button>
            </div>
        </form>
    );
}
