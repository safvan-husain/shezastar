// app/(admin)/products/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

async function getProducts() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/products`, {
        cache: 'no-store',
    });

    if (!res.ok) {
        return { products: [], pagination: { total: 0 } };
    }

    return res.json();
}

export default async function ProductsPage() {
    const { products } = await getProducts();

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Products</h1>
                <Link href="/products/new">
                    <Button>Create Product</Button>
                </Link>
            </div>

            {products.length === 0 ? (
                <Card>
                    <p className="text-gray-500 text-center py-8">
                        No products yet. Create your first product to get started.
                    </p>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {products.map((product: any) => (
                        <Card key={product.id}>
                            {product.images && product.images.length > 0 && (
                                <img
                                    src={product.images[0].url}
                                    alt={product.name}
                                    className="w-full h-48 object-cover rounded-lg mb-4"
                                />
                            )}
                            <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
                            {product.description && (
                                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                    {product.description}
                                </p>
                            )}
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    {product.offerPrice ? (
                                        <>
                                            <span className="text-lg font-bold text-green-600">
                                                ${product.offerPrice}
                                            </span>
                                            <span className="text-sm text-gray-500 line-through ml-2">
                                                ${product.basePrice}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-lg font-bold">
                                            ${product.basePrice}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2 text-sm text-gray-600 mb-4">
                                <span>{product.images?.length || 0} images</span>
                                <span>•</span>
                                <span>{product.variants?.length || 0} variants</span>
                            </div>
                            <Link href={`/products/${product.id}/edit`}>
                                <Button size="sm" className="w-full">Edit Product</Button>
                            </Link>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
