'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import type { ProductSeoListItem } from '@/lib/seo/admin-seo.schema';

interface ProductSeoListResponse {
    products: ProductSeoListItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

type ProductDraft = {
    metaTitle: string;
    metaDescription: string;
};

export default function ProductSeoClient() {
    const { showToast } = useToast();
    const [products, setProducts] = useState<ProductSeoListItem[]>([]);
    const [drafts, setDrafts] = useState<Record<string, ProductDraft>>({});
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchProducts = useCallback(async (page: number, search: string) => {
        setLoading(true);
        const params = new URLSearchParams({
            page: page.toString(),
            limit: '20',
        });
        if (search) {
            params.set('search', search);
        }

        const url = `/api/admin/seo/products?${params.toString()}`;

        try {
            const response = await fetch(url, { cache: 'no-store' });
            const body = await response.json().catch(() => ({}));

            if (!response.ok) {
                showToast(body.message || body.error || 'Failed to load products', 'error', {
                    status: response.status,
                    body,
                    url,
                    method: 'GET',
                });
                setProducts([]);
                return;
            }

            const data = body as ProductSeoListResponse;
            setProducts(data.products);
            setPagination(data.pagination);
            setDrafts(
                data.products.reduce<Record<string, ProductDraft>>((acc, product) => {
                    acc[product.id] = {
                        metaTitle: product.metaTitle || '',
                        metaDescription: product.metaDescription || '',
                    };
                    return acc;
                }, {}),
            );
        } catch (error) {
            showToast('Failed to load products', 'error', {
                body: error,
                url,
                method: 'GET',
            });
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchProducts(1, debouncedSearch);
    }, [debouncedSearch, fetchProducts]);

    const handleSave = async (productId: string) => {
        const draft = drafts[productId];
        if (!draft) {
            return;
        }

        const url = `/api/admin/seo/products/${productId}`;
        setSavingId(productId);

        try {
            const response = await fetch(url, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    metaTitle: draft.metaTitle.trim() || null,
                    metaDescription: draft.metaDescription.trim() || null,
                }),
            });
            const body = await response.json().catch(() => ({}));

            if (!response.ok) {
                showToast(body.message || body.error || 'Failed to update product SEO', 'error', {
                    status: response.status,
                    body,
                    url,
                    method: 'PATCH',
                });
                return;
            }

            showToast('Product SEO updated', 'success');
            await fetchProducts(pagination.page, debouncedSearch);
        } catch (error) {
            showToast('Failed to update product SEO', 'error', {
                body: error,
                url,
                method: 'PATCH',
            });
        } finally {
            setSavingId(null);
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
                <h1 className="mb-2 text-3xl font-bold">Product SEO</h1>
                <p className="text-[var(--text-secondary)]">
                    Edit meta titles and descriptions only. Product pricing, images, and inventory are not editable here.
                </p>
            </div>

            <div className="mb-6">
                <Input
                    placeholder="Search products by name..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                />
            </div>

            {loading ? (
                <p className="text-[var(--text-secondary)]">Loading products...</p>
            ) : products.length === 0 ? (
                <p className="text-[var(--text-secondary)]">No products found.</p>
            ) : (
                <div className="space-y-4">
                    {products.map((product) => {
                        const draft = drafts[product.id];
                        return (
                            <section
                                key={product.id}
                                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 shadow-sm"
                            >
                                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">{product.name}</h2>
                                        <p className="text-sm text-[var(--text-secondary)]">ID: {product.id}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleSave(product.id)}
                                        disabled={savingId === product.id || !draft}
                                        className="rounded-md bg-[var(--secondary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--secondary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {savingId === product.id ? 'Saving...' : 'Save'}
                                    </button>
                                </div>

                                {draft && (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-sm font-medium">Meta title</label>
                                            <Input
                                                value={draft.metaTitle}
                                                onChange={(event) =>
                                                    setDrafts((prev) => ({
                                                        ...prev,
                                                        [product.id]: {
                                                            ...prev[product.id],
                                                            metaTitle: event.target.value,
                                                        },
                                                    }))
                                                }
                                                placeholder="Optional SEO title"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="mb-1 block text-sm font-medium">Meta description</label>
                                            <textarea
                                                value={draft.metaDescription}
                                                onChange={(event) =>
                                                    setDrafts((prev) => ({
                                                        ...prev,
                                                        [product.id]: {
                                                            ...prev[product.id],
                                                            metaDescription: event.target.value,
                                                        },
                                                    }))
                                                }
                                                placeholder="Optional SEO description"
                                                rows={3}
                                                className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-[var(--text-primary)]"
                                            />
                                        </div>
                                    </div>
                                )}
                            </section>
                        );
                    })}
                </div>
            )}

            {pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                    <button
                        type="button"
                        disabled={pagination.page <= 1 || loading}
                        onClick={() => fetchProducts(pagination.page - 1, debouncedSearch)}
                        className="rounded-md border border-[var(--border-subtle)] px-4 py-2 text-sm disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-[var(--text-secondary)]">
                        Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                        type="button"
                        disabled={pagination.page >= pagination.totalPages || loading}
                        onClick={() => fetchProducts(pagination.page + 1, debouncedSearch)}
                        className="rounded-md border border-[var(--border-subtle)] px-4 py-2 text-sm disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
