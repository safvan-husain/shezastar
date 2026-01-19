import { Product } from "@/lib/product/model/product.model";
import { ProductGrid } from "@/components/ProductGrid";
import { ErrorToastHandler, type ToastErrorPayload } from "@/components/ErrorToastHandler";
import { Pagination } from "@/components/storefront/Pagination";

interface ProductsPageProps {
    searchParams: Promise<{ page?: string }>;
}

async function fetchProducts(page = 1, limit = 24): Promise<{
    products: Product[];
    pagination?: { total: number; totalPages: number; page: number; limit: number };
    error: ToastErrorPayload | null
}> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const url = `${baseUrl}/api/products?page=${page}&limit=${limit}`;

    try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
            let body = {};
            try {
                body = await res.json();
            } catch {
                body = { error: "Failed to parse response body" };
            }

            return {
                products: [],
                error: {
                    message: "Failed to load products",
                    status: res.status,
                    body,
                    url: res.url,
                    method: "GET",
                },
            };
        }

        const data = await res.json();
        return {
            products: data.products ?? [],
            pagination: data.pagination,
            error: null
        };
    } catch (error) {
        return {
            products: [],
            error: {
                message: error instanceof Error ? error.message : "Failed to load products",
                body: error instanceof Error ? { stack: error.stack } : { error },
                url: url,
                method: "GET",
            },
        };
    }
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
    const resolvedParams = await searchParams;
    const currentPage = parseInt(resolvedParams.page || "1");

    const { products, pagination, error } = await fetchProducts(currentPage, 24);

    return (
        <div className="min-h-screen pt-24 pb-12">
            <section className="container mx-auto px-4 space-y-8">
                {error && <ErrorToastHandler error={error} />}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--storefront-border)] pb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-black">All Products</h1>
                        <p className="text-sm text-[var(--text-muted)] mt-1">
                            Browse our complete collection of quality products.
                        </p>
                    </div>
                    <div className="text-sm text-[var(--text-muted)] font-medium">
                        {pagination?.total || products.length} items found
                    </div>
                </div>

                {error ? (
                    <div className="rounded-xl border-2 border-[var(--storefront-border)] p-6 text-[var(--storefront-text-secondary)] text-center">
                        <p className="font-semibold text-[var(--storefront-text-primary)]">Unable to load catalog</p>
                        <p className="text-sm mt-2">
                            We could not load the products right now. Please try again shortly.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        <ProductGrid
                            products={products}
                            emptyMessage="No products found."
                        />

                        <div className="pt-8">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={pagination?.totalPages || 1}
                                baseUrl="/products"
                            />
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
