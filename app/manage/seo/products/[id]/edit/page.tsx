import Link from 'next/link';
import { ProductForm } from '@/app/manage/products/components/ProductForm';
import { ErrorToastHandler, type ToastErrorPayload } from '@/components/ErrorToastHandler';
import { getInstallationLocations } from '@/lib/app-settings/app-settings.service';
import { handleGetAllBrands } from '@/lib/brand/brand.controller';

type ProductFormData = NonNullable<Parameters<typeof ProductForm>[0]['initialData']>;

async function getProduct(id: string): Promise<{ product: ProductFormData | null; error: ToastErrorPayload | null }> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/products/${id}`;

    try {
        const res = await fetch(url, { cache: 'no-store' });

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

export default async function EditProductSeoPage({
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
            <div className="container mx-auto max-w-6xl px-4 py-8">
                {error && <ErrorToastHandler error={error} />}

                <nav className="mb-6 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                    <Link href="/manage/seo/products" className="transition-colors hover:text-[var(--foreground)]">
                        Product SEO
                    </Link>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="font-medium text-[var(--foreground)]">{product?.name ?? 'Product'}</span>
                </nav>

                <div className="mb-8">
                    <div className="mb-3 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--ring)] text-[var(--primary-foreground)]">
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h10" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-[var(--foreground)]">Edit Product SEO</h1>
                            <p className="mt-1 text-[var(--muted-foreground)]">
                                {product ? `Update meta fields for ${product.name}` : 'Unable to load this product right now'}
                            </p>
                        </div>
                    </div>
                    <div className="h-1 w-24 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--ring)]" />
                </div>

                {product ? (
                    <ProductForm
                        key={product.id}
                        initialData={product}
                        globalInstallationLocations={globalInstallationLocations}
                        brands={brands}
                        mode="seo"
                    />
                ) : (
                    <div className="rounded-xl border-2 border-[var(--border-subtle)] p-4 text-[var(--muted-foreground)]">
                        Unable to load this product. Try again later and copy the toast details for debugging.
                    </div>
                )}
            </div>
        </div>
    );
}
