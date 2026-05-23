'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { SingleImageUploader } from '@/components/ui/SingleImageUploader';
import { useToast } from '@/components/ui/Toast';

interface SeoFields {
    metaTitle?: string | null;
    metaDescription?: string | null;
    imagePath?: string | null;
}

interface SubSubCategory extends SeoFields {
    id: string;
    name: string;
}

interface SubCategory extends SeoFields {
    id: string;
    name: string;
    subSubCategories: SubSubCategory[];
}

interface Category extends SeoFields {
    id: string;
    name: string;
    subCategories: SubCategory[];
}

type SeoDraft = {
    metaTitle: string;
    metaDescription: string;
    imagePath: string;
    imageFile: File | null;
};

type SaveTarget =
    | { type: 'category'; categoryId: string }
    | { type: 'subcategory'; categoryId: string; subId: string }
    | { type: 'subsubcategory'; categoryId: string; subId: string; subSubId: string };

function createDraft(initial?: SeoFields): SeoDraft {
    return {
        metaTitle: initial?.metaTitle || '',
        metaDescription: initial?.metaDescription || '',
        imagePath: initial?.imagePath || '',
        imageFile: null,
    };
}

function SeoEditor({
    title,
    draft,
    onChange,
    onSave,
    saving,
}: {
    title: string;
    draft: SeoDraft;
    onChange: (update: Partial<SeoDraft>) => void;
    onSave: () => void;
    saving: boolean;
}) {
    return (
        <section className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="font-semibold text-[var(--text-primary)]">{title}</h3>
                <button
                    type="button"
                    onClick={onSave}
                    disabled={saving}
                    className="rounded-md bg-[var(--secondary)] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                    {saving ? 'Saving...' : 'Save SEO'}
                </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
                <Input
                    placeholder="Meta title"
                    value={draft.metaTitle}
                    onChange={(event) => onChange({ metaTitle: event.target.value })}
                />
                <Input
                    placeholder="Meta description"
                    value={draft.metaDescription}
                    onChange={(event) => onChange({ metaDescription: event.target.value })}
                />
                <div className="md:col-span-2">
                    <SingleImageUploader
                        label="OG image"
                        value={
                            draft.imageFile
                                ? URL.createObjectURL(draft.imageFile)
                                : draft.imagePath || undefined
                        }
                        onChange={(file) =>
                            onChange({
                                imageFile: file,
                                imagePath: file ? draft.imagePath : '',
                            })
                        }
                    />
                </div>
            </div>
        </section>
    );
}

export default function CategorySeoClient() {
    const { showToast } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingKey, setSavingKey] = useState<string | null>(null);
    const [drafts, setDrafts] = useState<Record<string, SeoDraft>>({});

    const draftKey = (target: SaveTarget) => {
        if (target.type === 'category') return `category:${target.categoryId}`;
        if (target.type === 'subcategory') return `sub:${target.categoryId}:${target.subId}`;
        return `subsub:${target.categoryId}:${target.subId}:${target.subSubId}`;
    };

    const loadCategories = useCallback(async () => {
        setLoading(true);
        const url = '/api/admin/seo/categories';

        try {
            const response = await fetch(url, { cache: 'no-store' });
            const body = await response.json().catch(() => ({}));

            if (!response.ok) {
                showToast(body.message || body.error || 'Failed to load categories', 'error', {
                    status: response.status,
                    body,
                    url,
                    method: 'GET',
                });
                setCategories([]);
                return;
            }

            const nextCategories = (body.categories || []) as Category[];
            setCategories(nextCategories);

            const nextDrafts: Record<string, SeoDraft> = {};
            for (const category of nextCategories) {
                nextDrafts[`category:${category.id}`] = createDraft(category);
                for (const subCategory of category.subCategories) {
                    nextDrafts[`sub:${category.id}:${subCategory.id}`] = createDraft(subCategory);
                    for (const subSubCategory of subCategory.subSubCategories) {
                        nextDrafts[`subsub:${category.id}:${subCategory.id}:${subSubCategory.id}`] =
                            createDraft(subSubCategory);
                    }
                }
            }
            setDrafts(nextDrafts);
        } catch (error) {
            showToast('Failed to load categories', 'error', {
                body: error,
                url,
                method: 'GET',
            });
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    const uploadImage = async (file: File) => {
        const formData = new FormData();
        formData.append('image', file);
        const response = await fetch('/api/categories/images', {
            method: 'POST',
            body: formData,
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok || !body.imagePath) {
            throw new Error(body.message || body.error || 'Failed to upload category image');
        }
        return body.imagePath as string;
    };

    const saveSeo = async (target: SaveTarget) => {
        const key = draftKey(target);
        const draft = drafts[key];
        if (!draft) {
            return;
        }

        setSavingKey(key);

        let url = '';
        if (target.type === 'category') {
            url = `/api/admin/seo/categories/${target.categoryId}`;
        } else if (target.type === 'subcategory') {
            url = `/api/admin/seo/categories/${target.categoryId}/subcategories/${target.subId}`;
        } else {
            url = `/api/admin/seo/categories/${target.categoryId}/subcategories/${target.subId}/subsubcategories/${target.subSubId}`;
        }

        try {
            const imagePath = draft.imageFile
                ? await uploadImage(draft.imageFile)
                : draft.imagePath.trim() || null;

            const response = await fetch(url, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    metaTitle: draft.metaTitle.trim() || null,
                    metaDescription: draft.metaDescription.trim() || null,
                    imagePath,
                }),
            });
            const body = await response.json().catch(() => ({}));

            if (!response.ok) {
                showToast(body.message || body.error || 'Failed to update category SEO', 'error', {
                    status: response.status,
                    body,
                    url,
                    method: 'PATCH',
                });
                return;
            }

            showToast('Category SEO updated', 'success');
            await loadCategories();
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to update category SEO', 'error', {
                body: error,
                url,
                method: 'PATCH',
            });
        } finally {
            setSavingKey(null);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <Link
                href="/manage/seo"
                className="mb-4 inline-block text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
                ← Back to SEO
            </Link>
            <div className="mb-8">
                <h1 className="mb-2 text-3xl font-bold">Category SEO</h1>
                <p className="text-[var(--text-secondary)]">
                    Edit meta tags and OG images for categories, subcategories, and sub-subcategories.
                </p>
            </div>

            {loading ? (
                <p className="text-[var(--text-secondary)]">Loading categories...</p>
            ) : categories.length === 0 ? (
                <p className="text-[var(--text-secondary)]">No categories found.</p>
            ) : (
                <div className="space-y-8">
                    {categories.map((category) => (
                        <div key={category.id} className="space-y-4">
                            <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{category.name}</h2>
                            <SeoEditor
                                title="Top-level category"
                                draft={drafts[`category:${category.id}`]}
                                onChange={(update) =>
                                    setDrafts((prev) => ({
                                        ...prev,
                                        [`category:${category.id}`]: {
                                            ...prev[`category:${category.id}`],
                                            ...update,
                                        },
                                    }))
                                }
                                onSave={() => saveSeo({ type: 'category', categoryId: category.id })}
                                saving={savingKey === `category:${category.id}`}
                            />

                            {category.subCategories.map((subCategory) => (
                                <div key={subCategory.id} className="space-y-3 pl-4 md:pl-8">
                                    <SeoEditor
                                        title={`Subcategory: ${subCategory.name}`}
                                        draft={drafts[`sub:${category.id}:${subCategory.id}`]}
                                        onChange={(update) =>
                                            setDrafts((prev) => ({
                                                ...prev,
                                                [`sub:${category.id}:${subCategory.id}`]: {
                                                    ...prev[`sub:${category.id}:${subCategory.id}`],
                                                    ...update,
                                                },
                                            }))
                                        }
                                        onSave={() =>
                                            saveSeo({
                                                type: 'subcategory',
                                                categoryId: category.id,
                                                subId: subCategory.id,
                                            })
                                        }
                                        saving={savingKey === `sub:${category.id}:${subCategory.id}`}
                                    />

                                    {subCategory.subSubCategories.map((subSubCategory) => (
                                        <div key={subSubCategory.id} className="pl-4 md:pl-8">
                                            <SeoEditor
                                                title={`Sub-subcategory: ${subSubCategory.name}`}
                                                draft={
                                                    drafts[
                                                        `subsub:${category.id}:${subCategory.id}:${subSubCategory.id}`
                                                    ]
                                                }
                                                onChange={(update) =>
                                                    setDrafts((prev) => ({
                                                        ...prev,
                                                        [`subsub:${category.id}:${subCategory.id}:${subSubCategory.id}`]:
                                                            {
                                                                ...prev[
                                                                    `subsub:${category.id}:${subCategory.id}:${subSubCategory.id}`
                                                                ],
                                                                ...update,
                                                            },
                                                    }))
                                                }
                                                onSave={() =>
                                                    saveSeo({
                                                        type: 'subsubcategory',
                                                        categoryId: category.id,
                                                        subId: subCategory.id,
                                                        subSubId: subSubCategory.id,
                                                    })
                                                }
                                                saving={
                                                    savingKey ===
                                                    `subsub:${category.id}:${subCategory.id}:${subSubCategory.id}`
                                                }
                                            />
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
