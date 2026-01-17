// app/(admin)/products/[id]/edit/page.tsx
import Link from 'next/link';
import { ProductForm } from '../../components/ProductForm';
import { ErrorToastHandler, type ToastErrorPayload } from '@/components/ErrorToastHandler';
import { getInstallationLocations } from '@/lib/app-settings/app-settings.service';
import { handleGetAllBrands } from '@/lib/brand/brand.controller';

type ProductFormData = NonNullable<Parameters<typeof ProductForm>[0]['initialData']>;

async function getProduct(id: string): Promise<{ product: ProductFormData | null; error: ToastErrorPayload | null }> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/products/${id}`;

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
                product: null,
                error: {
                    message: body.message || body.error || 'Failed to load product',
                    status: res.status,
                    body,
                    url: res.url,
                    method: 'GET',
                },
            };
        }

        return { product: (await res.json()) as ProductFormData, error: null };
    } catch (error) {
        return {
            product: null,
            error: {
                message: error instanceof Error ? error.message : 'Failed to load product',
                body: error instanceof Error ? { stack: error.stack } : { error },
                url,
                method: 'GET',
            },
        };
    }
}

export default async function EditProductPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const { product, error } = await getProduct(id);
    const globalInstallationLocations = await getInstallationLocations();
    const { body: brandsBody } = await handleGetAllBrands();
    const brands = Array.isArray(brandsBody) ? brandsBody : [];

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {error && <ErrorToastHandler error={error} />}
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-6">
                    <Link href="/manage/products" className="hover:text-[var(--foreground)] transition-colors">
                        Products
                    </Link>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-[var(--foreground)] font-medium">{product?.name ?? 'Product'}</span>
                </nav>

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--ring)] flex items-center justify-center text-[var(--primary-foreground)]">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-[var(--foreground)]">
                                Edit Product
                            </h1>
                            <p className="text-[var(--muted-foreground)] mt-1">
                                {product ? `Update ${product.name} details, images, and variants` : 'Unable to load this product right now'}
                            </p>
                        </div>
                    </div>
                    <div className="h-1 w-24 bg-gradient-to-r from-[var(--primary)] to-[var(--ring)] rounded-full"></div>
                </div>

                {/* Form */}
                {product ? (
                    <ProductForm initialData={product} globalInstallationLocations={globalInstallationLocations} brands={brands} />
                ) : (
                    <div className="rounded-xl border-2 border-[var(--border-subtle)] p-4 text-[var(--muted-foreground)]">
                        Unable to load this product. Try again later and copy the toast details for debugging.
                    </div>
                )}
            </div>
        </div>
    );
}
