'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { SingleImageUploader } from '@/components/ui/SingleImageUploader';
import { nanoid } from 'nanoid';

interface SeoFields {
    metaTitle?: string | null;
    metaDescription?: string | null;
    imagePath?: string | null;
}

interface SubSubCategory {
    id: string;
    name: string;
    metaTitle?: string | null;
    metaDescription?: string | null;
    imagePath?: string | null;
    imageFile?: File | null;
}

interface SubCategory {
    id: string;
    name: string;
    metaTitle?: string | null;
    metaDescription?: string | null;
    imagePath?: string | null;
    imageFile?: File | null;
    subSubCategories: SubSubCategory[];
}

interface CategoryFormProps {
    initialData?: {
        id: string;
        name: string;
        metaTitle?: string | null;
        metaDescription?: string | null;
        imagePath?: string | null;
        subCategories: SubCategory[];
    };
}

function normalizeSeoValue(value?: string | null) {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
}

function getErrorMessage(error: unknown, fallback: string) {
    if (error instanceof Error) {
        return error.message;
    }
    return fallback;
}

function stripImageFileFromSubSub(subSub: SubSubCategory): Omit<SubSubCategory, 'imageFile'> {
    return {
        id: subSub.id,
        name: subSub.name,
        metaTitle: normalizeSeoValue(subSub.metaTitle),
        metaDescription: normalizeSeoValue(subSub.metaDescription),
        imagePath: normalizeSeoValue(subSub.imagePath),
    };
}

function stripImageFileFromSub(sub: SubCategory): Omit<SubCategory, 'imageFile'> {
    return {
        id: sub.id,
        name: sub.name,
        metaTitle: normalizeSeoValue(sub.metaTitle),
        metaDescription: normalizeSeoValue(sub.metaDescription),
        imagePath: normalizeSeoValue(sub.imagePath),
        subSubCategories: sub.subSubCategories.map(stripImageFileFromSubSub),
    };
}

async function uploadCategoryImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch('/api/categories/images', {
        method: 'POST',
        body: formData,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.imagePath) {
        throw new Error(data.error || data.message || 'Failed to upload category image');
    }

    return data.imagePath as string;
}

export function CategoryForm({ initialData }: CategoryFormProps) {
    const router = useRouter();
    const { showToast } = useToast();
    const [name, setName] = useState(initialData?.name || '');
    const [metaTitle, setMetaTitle] = useState(initialData?.metaTitle || '');
    const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription || '');
    const [imagePath, setImagePath] = useState(initialData?.imagePath || '');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [subCategories, setSubCategories] = useState<SubCategory[]>(
        initialData?.subCategories?.map(sub => ({
            ...sub,
            metaTitle: sub.metaTitle || '',
            metaDescription: sub.metaDescription || '',
            imagePath: sub.imagePath || '',
            imageFile: null,
            subSubCategories: sub.subSubCategories.map(subSub => ({
                ...subSub,
                metaTitle: subSub.metaTitle || '',
                metaDescription: subSub.metaDescription || '',
                imagePath: subSub.imagePath || '',
                imageFile: null,
            })),
        })) || []
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
            {
                id: nanoid(),
                name: newSubCategoryName.trim(),
                metaTitle: '',
                metaDescription: '',
                imagePath: '',
                imageFile: null,
                subSubCategories: [],
            },
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

    const updateSubCategorySeo = (id: string, seo: Partial<SeoFields>) => {
        setSubCategories(prev =>
            prev.map(sub => (sub.id === id ? { ...sub, ...seo } : sub))
        );
    };

    const updateSubCategoryImage = (id: string, file: File | null) => {
        if (!file) {
            updateSubCategorySeo(id, { imagePath: '' });
        }
        setSubCategories(prev =>
            prev.map(sub => (sub.id === id ? { ...sub, imageFile: file } : sub))
        );
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
                            {
                                id: nanoid(),
                                name: nameToAdd,
                                metaTitle: '',
                                metaDescription: '',
                                imagePath: '',
                                imageFile: null,
                            },
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

    const updateSubSubCategorySeo = (
        subCategoryId: string,
        subSubCategoryId: string,
        seo: Partial<SeoFields>
    ) => {
        setSubCategories(prev =>
            prev.map(sub =>
                sub.id === subCategoryId
                    ? {
                        ...sub,
                        subSubCategories: sub.subSubCategories.map(subSub =>
                            subSub.id === subSubCategoryId ? { ...subSub, ...seo } : subSub
                        ),
                    }
                    : sub
            )
        );
    };

    const updateSubSubCategoryImage = (
        subCategoryId: string,
        subSubCategoryId: string,
        file: File | null
    ) => {
        if (!file) {
            updateSubSubCategorySeo(subCategoryId, subSubCategoryId, { imagePath: '' });
        }
        setSubCategories(prev =>
            prev.map(sub =>
                sub.id === subCategoryId
                    ? {
                        ...sub,
                        subSubCategories: sub.subSubCategories.map(subSub =>
                            subSub.id === subSubCategoryId
                                ? { ...subSub, imageFile: file }
                                : subSub
                        ),
                    }
                    : sub
            )
        );
    };

    const resolveUploadedImages = async () => {
        const resolvedCategoryImagePath = imageFile
            ? await uploadCategoryImage(imageFile)
            : normalizeSeoValue(imagePath);

        const resolvedSubCategories: SubCategory[] = [];
        for (const sub of subCategories) {
            const resolvedSubImagePath = sub.imageFile
                ? await uploadCategoryImage(sub.imageFile)
                : normalizeSeoValue(sub.imagePath);
            const resolvedSubSubCategories: SubSubCategory[] = [];

            for (const subSub of sub.subSubCategories) {
                const resolvedSubSubImagePath = subSub.imageFile
                    ? await uploadCategoryImage(subSub.imageFile)
                    : normalizeSeoValue(subSub.imagePath);
                resolvedSubSubCategories.push({
                    ...subSub,
                    imagePath: resolvedSubSubImagePath,
                    imageFile: null,
                });
            }

            resolvedSubCategories.push({
                ...sub,
                imagePath: resolvedSubImagePath,
                imageFile: null,
                subSubCategories: resolvedSubSubCategories,
            });
        }

        return {
            resolvedCategoryImagePath,
            resolvedSubCategories,
        };
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
            const {
                resolvedCategoryImagePath,
                resolvedSubCategories,
            } = await resolveUploadedImages();

            const payload = {
                name,
                metaTitle: normalizeSeoValue(metaTitle),
                metaDescription: normalizeSeoValue(metaDescription),
                imagePath: resolvedCategoryImagePath,
                subCategories: resolvedSubCategories.map(stripImageFileFromSub),
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
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

            router.push('/manage/categories');
            router.refresh();
        } catch (err: unknown) {
            const message = getErrorMessage(err, 'An unexpected error occurred');
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
                <Input
                    label="Meta Title"
                    placeholder="Optional SEO title for this category page"
                    value={metaTitle}
                    onChange={e => setMetaTitle(e.target.value)}
                />
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-[var(--text-secondary)]">
                        Meta Description
                    </label>
                    <textarea
                        value={metaDescription}
                        onChange={e => setMetaDescription(e.target.value)}
                        rows={3}
                        className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
                        placeholder="Optional SEO description shown in search previews"
                    />
                </div>
                <SingleImageUploader
                    label="OG Image"
                    value={imageFile ? URL.createObjectURL(imageFile) : imagePath || undefined}
                    onChange={(file) => {
                        setImageFile(file);
                        if (!file) {
                            setImagePath('');
                        }
                    }}
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
                                        <div className="flex-1 space-y-3">
                                            <Input
                                                label="Subcategory name"
                                                value={sub.name}
                                                onChange={e => updateSubCategoryName(sub.id, e.target.value)}
                                            />
                                            <Input
                                                label="Meta title"
                                                value={sub.metaTitle || ''}
                                                onChange={e =>
                                                    updateSubCategorySeo(sub.id, { metaTitle: e.target.value })
                                                }
                                                placeholder="Optional SEO title"
                                            />
                                            <div className="space-y-2">
                                                <label className="block text-sm font-medium text-[var(--text-secondary)]">
                                                    Meta description
                                                </label>
                                                <textarea
                                                    rows={2}
                                                    value={sub.metaDescription || ''}
                                                    onChange={e =>
                                                        updateSubCategorySeo(sub.id, { metaDescription: e.target.value })
                                                    }
                                                    className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
                                                    placeholder="Optional SEO description"
                                                />
                                            </div>
                                            <SingleImageUploader
                                                label="OG Image"
                                                value={
                                                    sub.imageFile
                                                        ? URL.createObjectURL(sub.imageFile)
                                                        : sub.imagePath || undefined
                                                }
                                                onChange={(file) => updateSubCategoryImage(sub.id, file)}
                                            />
                                        </div>

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
                                                <Input
                                                    placeholder="Meta title"
                                                    value={subSub.metaTitle || ''}
                                                    onChange={e =>
                                                        updateSubSubCategorySeo(sub.id, subSub.id, {
                                                            metaTitle: e.target.value,
                                                        })
                                                    }
                                                />
                                                <Input
                                                    placeholder="Meta description"
                                                    value={subSub.metaDescription || ''}
                                                    onChange={e =>
                                                        updateSubSubCategorySeo(sub.id, subSub.id, {
                                                            metaDescription: e.target.value,
                                                        })
                                                    }
                                                />
                                                <SingleImageUploader
                                                    label="OG Image"
                                                    value={
                                                        subSub.imageFile
                                                            ? URL.createObjectURL(subSub.imageFile)
                                                            : subSub.imagePath || undefined
                                                    }
                                                    onChange={(file) =>
                                                        updateSubSubCategoryImage(sub.id, subSub.id, file)
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
                    onClick={() => router.push('/manage/categories')}
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
