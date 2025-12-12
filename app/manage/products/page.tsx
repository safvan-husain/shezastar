// app/(admin)/products/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorToastHandler, type ToastErrorPayload } from '@/components/ErrorToastHandler';
import { Product } from '@/lib/product/model/product.model';
import ProductCard from './components/ProductCard';

interface ProductListResponse {
    products: Product[];
    pagination: { total: number };
}

async function getProducts(): Promise<{ products: Product[]; pagination: { total: number }; error: ToastErrorPayload | null }> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/products`;

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

            return {
                products: [],
                pagination: { total: 0 },
                error: {
                    message: body.message || body.error || 'Failed to load products',
                    status: res.status,
                    body,
                    url: res.url,
                    method: 'GET',
                },
            };
        }

        const data = (await res.json()) as ProductListResponse;
        return { ...data, error: null };
    } catch (error) {
        return {
            products: [],
            pagination: { total: 0 },
            error: {
                message: error instanceof Error ? error.message : 'Failed to load products',
                body: error instanceof Error ? { stack: error.stack } : { error },
                url,
                method: 'GET',
            },
        };
    }
}

export default async function ProductsPage() {
    const { products, error } = await getProducts();

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

                {/* Content Section */}
                {error ? (
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
                                    No products yet
                                </h3>
                                <p className="text-[var(--muted-foreground)] mb-6 max-w-md">
                                    Create your first product to start building your catalog. Add images, variants, and pricing.
                                </p>
                                <Link href="/manage/products/new">
                                    <Button>Get Started</Button>
                                </Link>
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
                                        <p className="text-sm opacity-90 mb-1">Total Products</p>
                                        <p className="text-3xl font-bold">{products.length}</p>
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
                    </>
                )}
            </div>
    );
}
