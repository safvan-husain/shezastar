'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorToastHandler, type ToastErrorPayload } from '@/components/ErrorToastHandler';
import { Product } from '@/lib/product/model/product.model';
import ProductCard from './ProductCard';

interface ProductListResponse {
    products: Product[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export default function ProductsClient() {
    const [products, setProducts] = useState<Product[]>([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<ToastErrorPayload | null>(null);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch products
    const fetchProducts = useCallback(async (page: number, search: string) => {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
            page: page.toString(),
            limit: '20',
        });

        if (search) {
            params.append('search', search);
        }

        const url = `/api/products?${params.toString()}`;

        try {
            const res = await fetch(url, {
                cache: 'no-store',
            });

            if (!res.ok) {
                let body: any = {};
                try {
                    body = await res.json();
                } catch {
                    body = { error: 'Failed to parse response body' };
                }

                setError({
                    message: body.message || body.error || 'Failed to load products',
                    status: res.status,
                    body,
                    url: res.url,
                    method: 'GET',
                });
                setProducts([]);
                setPagination({ page: 1, limit: 20, total: 0, totalPages: 0 });
                return;
            }

            const data = (await res.json()) as ProductListResponse;
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

    // Fetch products when page or search changes
    useEffect(() => {
        fetchProducts(pagination.page, debouncedSearch);
    }, [pagination.page, debouncedSearch, fetchProducts]);

    // Reset to page 1 when search changes
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
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {error && <ErrorToastHandler error={error} />}

            {/* Header Section */}
            <div className="mb-10 text-primary">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3">
                    <div>
                        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">
                            Products
                        </h1>
                        <p className="text-[var(--text-secondary)] text-lg">
                            Manage your product catalog and inventory
                        </p>
                    </div>
                    <Link href="/manage/products/new">
                        <Button size="lg" className="whitespace-nowrap">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Product
                        </Button>
                    </Link>
                </div>
                <div className="h-1 w-24 bg-gradient-to-r from-[var(--primary)] to-[var(--ring)] rounded-full"></div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <input
                        type="text"
                        placeholder="Search products by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-3 pl-12 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-all"
                    />
                    <svg
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

            {/* Loading State */}
            {loading ? (
                <Card className="text-center py-16">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[var(--muted-foreground)]">Loading products...</p>
                    </div>
                </Card>
            ) : error ? (
                <Card className="text-center py-16">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-[var(--muted)] flex items-center justify-center">
                            <svg className="w-10 h-10 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 11-12.728 0m12.728 0L12 12m0 0L5.636 5.636" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                                Unable to load products
                            </h3>
                            <p className="text-[var(--muted-foreground)] mb-6 max-w-md">
                                Please try again later. Use the toast details to report the failure if it keeps happening.
                            </p>
                            <Button onClick={() => fetchProducts(pagination.page, debouncedSearch)}>
                                Retry
                            </Button>
                        </div>
                    </div>
                </Card>
            ) : products.length === 0 ? (
                <Card className="text-center py-16">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-[var(--muted)] flex items-center justify-center">
                            <svg className="w-10 h-10 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                                {debouncedSearch ? 'No products found' : 'No products yet'}
                            </h3>
                            <p className="text-[var(--muted-foreground)] mb-6 max-w-md">
                                {debouncedSearch
                                    ? `No products match "${debouncedSearch}". Try a different search term.`
                                    : 'Create your first product to start building your catalog. Add images, variants, and pricing.'
                                }
                            </p>
                            {!debouncedSearch && (
                                <Link href="/manage/products/new">
                                    <Button>Get Started</Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </Card>
            ) : (
                <>
                    {/* Stats Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        <Card className="bg-[var(--bg-subtle)] text-[var(--text-primary)]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm opacity-90 mb-1">
                                        {debouncedSearch ? 'Search Results' : 'Total Products'}
                                    </p>
                                    <p className="text-3xl font-bold">{pagination.total}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                            </div>
                        </Card>
                        <Card className="bg-[var(--bg-subtle)] text-[var(--text-primary)]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm opacity-90 mb-1">Total Images</p>
                                    <p className="text-3xl font-bold">
                                        {products.reduce((sum: number, p: Product) => sum + (p.images?.length || 0), 0)}
                                    </p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </div>
                        </Card>
                        <Card className="bg-[var(--bg-subtle)] text-[var(--text-primary)]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm opacity-90 mb-1">With Variants</p>
                                    <p className="text-3xl font-bold">
                                        {products.filter((p: Product) => p.variants?.length > 0).length}
                                    </p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Products Grid */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                        {products.map((product: Product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {pagination.totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-center gap-4">
                            <Button
                                onClick={handlePreviousPage}
                                disabled={pagination.page === 1}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Previous
                            </Button>

                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-[var(--foreground)] font-medium">
                                    Page {pagination.page} of {pagination.totalPages}
                                </span>
                                <span className="text-[var(--muted-foreground)]">
                                    ({pagination.total} total)
                                </span>
                            </div>

                            <Button
                                onClick={handleNextPage}
                                disabled={pagination.page === pagination.totalPages}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                Next
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
