'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorToastHandler, type ToastErrorPayload } from '@/components/ErrorToastHandler';
import type { Product } from '@/lib/product/model/product.model';
import ProductCard from '@/app/manage/products/components/ProductCard';

interface ProductSeoListResponse {
    products: Product[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export default function ProductSeoClient() {
    const [products, setProducts] = useState<Product[]>([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<ToastErrorPayload | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchProducts = useCallback(async (page: number, search: string) => {
        setLoading(true);
        setError(null);

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

            if (!response.ok) {
                let body: any = {};
                try {
                    body = await response.json();
                } catch {
                    body = { error: 'Failed to parse response body' };
                }

                setError({
                    message: body.message || body.error || 'Failed to load products',
                    status: response.status,
                    body,
                    url: response.url,
                    method: 'GET',
                });
                setProducts([]);
                setPagination({ page: 1, limit: 20, total: 0, totalPages: 0 });
                return;
            }

            const data = (await response.json()) as ProductSeoListResponse;
            setProducts(data.products);
            setPagination(data.pagination);
        } catch (err) {
            setError({
                message: err instanceof Error ? err.message : 'Failed to load products',
                body: err instanceof Error ? { stack: err.stack } : { error: err },
                url,
                method: 'GET',
            });
            setProducts([]);
            setPagination({ page: 1, limit: 20, total: 0, totalPages: 0 });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts(pagination.page, debouncedSearch);
    }, [pagination.page, debouncedSearch, fetchProducts]);

    useEffect(() => {
        if (pagination.page !== 1) {
            setPagination(prev => ({ ...prev, page: 1 }));
        }
    }, [debouncedSearch]);

    const handlePreviousPage = () => {
        if (pagination.page > 1) {
            setPagination(prev => ({ ...prev, page: prev.page - 1 }));
        }
    };

    const handleNextPage = () => {
        if (pagination.page < pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: prev.page + 1 }));
        }
    };

    return (
        <div className="container mx-auto max-w-7xl px-4 py-8">
            {error && <ErrorToastHandler error={error} />}

            <Link
                href="/manage/seo"
                className="mb-4 inline-block text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
                ← Back to SEO
            </Link>

            <div className="mb-10 text-primary">
                <div className="mb-3">
                    <h1 className="mb-2 text-4xl font-bold text-[var(--text-primary)]">Product SEO</h1>
                    <p className="text-lg text-[var(--text-secondary)]">
                        Search products and update storefront meta titles and descriptions only.
                    </p>
                </div>
                <div className="h-1 w-24 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--ring)]" />
            </div>

            <div className="mb-6">
                <div className="relative max-w-md">
                    <input
                        type="text"
                        placeholder="Search products by name..."
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 pl-12 text-[var(--foreground)] transition-all focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    />
                    <svg
                        className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted-foreground)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
                            aria-label="Clear product search"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
                {debouncedSearch && (
                    <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                        Searching for: <span className="font-medium text-[var(--foreground)]">{debouncedSearch}</span>
                    </p>
                )}
            </div>

            {loading ? (
                <Card className="py-16 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" />
                        <p className="text-[var(--muted-foreground)]">Loading products...</p>
                    </div>
                </Card>
            ) : error ? (
                <Card className="py-16 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--muted)]">
                            <svg className="h-10 w-10 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 11-12.728 0m12.728 0L12 12m0 0L5.636 5.636" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="mb-2 text-xl font-semibold text-[var(--foreground)]">Unable to load products</h3>
                            <p className="mb-6 max-w-md text-[var(--muted-foreground)]">
                                Please try again later. Use the toast details to report the failure if it keeps happening.
                            </p>
                            <Button onClick={() => fetchProducts(pagination.page, debouncedSearch)}>Retry</Button>
                        </div>
                    </div>
                </Card>
            ) : products.length === 0 ? (
                <Card className="py-16 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--muted)]">
                            <svg className="h-10 w-10 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="mb-2 text-xl font-semibold text-[var(--foreground)]">
                                {debouncedSearch ? 'No products found' : 'No products yet'}
                            </h3>
                            <p className="mb-6 max-w-md text-[var(--muted-foreground)]">
                                {debouncedSearch
                                    ? `No products match "${debouncedSearch}". Try a different search term.`
                                    : 'Products will appear here when they are added by a super admin.'}
                            </p>
                        </div>
                    </div>
                </Card>
            ) : (
                <>
                    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <Card className="bg-[var(--bg-subtle)] text-[var(--text-primary)]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="mb-1 text-sm opacity-90">{debouncedSearch ? 'Search Results' : 'Total Products'}</p>
                                    <p className="text-3xl font-bold">{pagination.total}</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-elevated)]">
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                            </div>
                        </Card>
                        <Card className="bg-[var(--bg-subtle)] text-[var(--text-primary)]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="mb-1 text-sm opacity-90">With Meta Title</p>
                                    <p className="text-3xl font-bold">{products.filter((product) => Boolean(product.metaTitle)).length}</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-elevated)]">
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h10" />
                                    </svg>
                                </div>
                            </div>
                        </Card>
                        <Card className="bg-[var(--bg-subtle)] text-[var(--text-primary)]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="mb-1 text-sm opacity-90">With Meta Description</p>
                                    <p className="text-3xl font-bold">{products.filter((product) => Boolean(product.metaDescription)).length}</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-elevated)]">
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h8M8 14h5m-8 6h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                        {products.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                editHref={`/manage/seo/products/${product.id}/edit`}
                                editLabel="Edit SEO"
                                showFeaturedAction={false}
                            />
                        ))}
                    </div>

                    {pagination.totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-center gap-4">
                            <Button
                                onClick={handlePreviousPage}
                                disabled={pagination.page === 1}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Previous
                            </Button>

                            <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium text-[var(--foreground)]">
                                    Page {pagination.page} of {pagination.totalPages}
                                </span>
                                <span className="text-[var(--muted-foreground)]">({pagination.total} total)</span>
                            </div>

                            <Button
                                onClick={handleNextPage}
                                disabled={pagination.page === pagination.totalPages}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                Next
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
