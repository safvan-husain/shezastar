// app/(admin)/products/page.tsx
import Link from 'next/link';
import { getProducts } from '@/lib/queries/product.queries';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default async function ProductsPage() {
    const { products } = await getProducts();

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header Section */}
                <div className="mb-10">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3">
                        <div>
                            <h1 className="text-4xl font-bold text-[var(--foreground)] mb-2">
                                Products
                            </h1>
                            <p className="text-[var(--muted-foreground)] text-lg">
                                Manage your product catalog and inventory
                            </p>
                        </div>
                        <Link href="/products/new">
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
                {products.length === 0 ? (
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
                                <Link href="/products/new">
                                    <Button>Get Started</Button>
                                </Link>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <>
                        {/* Stats Bar */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                            <Card className="bg-gradient-to-br from-[var(--primary)] to-blue-600 text-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm opacity-90 mb-1">Total Products</p>
                                        <p className="text-3xl font-bold">{products.length}</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                </div>
                            </Card>
                            <Card className="bg-gradient-to-br from-[var(--success)] to-green-600 text-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm opacity-90 mb-1">Total Images</p>
                                        <p className="text-3xl font-bold">
                                            {products.reduce((sum: number, p: any) => sum + (p.images?.length || 0), 0)}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                </div>
                            </Card>
                            <Card className="bg-gradient-to-br from-[var(--warning)] to-orange-600 text-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm opacity-90 mb-1">With Variants</p>
                                        <p className="text-3xl font-bold">
                                            {products.filter((p: any) => p.variants?.length > 0).length}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Products Grid */}
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                            {products.map((product: any) => (
                                <Card key={product.id} className="overflow-hidden p-2">
                                    {/* Product Image */}
                                    <div className="relative bg-[var(--muted)] overflow-hidden aspect-square">
                                        {product.images && product.images.length > 0 ? (
                                            <img
                                                src={product.images[0].url}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <svg className="w-16 h-16 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        )}
                                        {product.offerPrice && (
                                            <div className="absolute top-3 right-3 bg-[var(--danger)] text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                                                SALE
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Info */}
                                    <div className="">
                                        <h2 className="text-xl font-bold text-[var(--foreground)] mb-2 line-clamp-1">
                                            {product.name}
                                        </h2>
                                        {product.description && (
                                            <p className="text-[var(--muted-foreground)] text-sm mb-4 line-clamp-2">
                                                {product.description}
                                            </p>
                                        )}

                                        {/* Pricing */}
                                        <div className="flex items-baseline gap-2 mb-4">
                                            {product.offerPrice ? (
                                                <>
                                                    <span className="text-2xl font-bold text-[var(--success)]">
                                                        ${product.offerPrice}
                                                    </span>
                                                    <span className="text-sm text-[var(--muted-foreground)] line-through">
                                                        ${product.basePrice}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-2xl font-bold text-[var(--foreground)]">
                                                    ${product.basePrice}
                                                </span>
                                            )}
                                        </div>

                                        {/* Meta Info */}
                                        <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)] mb-4 pb-4 border-b border-[var(--border)]">
                                            <div className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span className="font-medium">{product.images?.length || 0}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                </svg>
                                                <span className="font-medium">{product.variants?.length || 0} variants</span>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <Link href={`/products/${product.id}/edit`}>
                                            <Button size="sm" className="w-full">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                Edit Product
                                            </Button>
                                        </Link>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
