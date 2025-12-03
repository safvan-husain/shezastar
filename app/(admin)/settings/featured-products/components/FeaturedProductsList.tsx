'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { Product } from '@/lib/product/model/product.model';
import AddFeaturedProductModal from './AddFeaturedProductModal';

interface FeaturedProductsListProps {
    initialProducts: Product[];
}

export default function FeaturedProductsList({ initialProducts }: FeaturedProductsListProps) {
    const router = useRouter();
    const { showToast } = useToast();
    const [products, setProducts] = useState(initialProducts);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Sync local state when initialProducts changes after router.refresh()
    useEffect(() => {
        if (!isModalOpen) {
            setProducts(initialProducts);
        }
    }, [initialProducts, isModalOpen]);

    const handleRemove = async (productId: string) => {
        if (!confirm('Are you sure you want to remove this product from featured list?')) {
            return;
        }

        setDeletingId(productId);
        try {
            const response = await fetch(`/api/admin/settings/featured-products/${productId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || 'Failed to remove product');
            }

            showToast('Product removed from featured list', 'success');
            setProducts(products.filter(p => p.id !== productId));
            router.refresh();
        } catch (error: any) {
            const message = error instanceof Error ? error.message : 'Something went wrong';
            showToast(message, 'error');
        } finally {
            setDeletingId(null);
        }
    };

    const handleAddSuccess = () => {
        setIsModalOpen(false);
        router.refresh();
    };

    return (
        <div>
            <div className="mb-6">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-6 py-2 bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary-hover)] transition-colors font-medium"
                >
                    + Add Featured Product
                </button>
            </div>

            {products.length === 0 ? (
                <div className="text-center py-12 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)]">
                    <p className="text-[var(--text-secondary)] mb-4">No featured products yet</p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-2 bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary-hover)] transition-colors font-medium"
                    >
                        Add your first featured product
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {products.map((product) => (
                        <div
                            key={product.id}
                            className="bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)] overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                        >
                            <div className="aspect-square bg-[var(--bg-base)] relative">
                                {product.images && product.images.length > 0 ? (
                                    <img
                                        src={product.images[0].url}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[var(--text-secondary)]">
                                        No Image
                                    </div>
                                )}
                                {product.offerPrice && (
                                    <div className="absolute top-2 right-2 bg-[var(--danger)] text-white px-2 py-1 rounded text-xs font-medium">
                                        SALE
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="text-lg font-semibold mb-2 text-[var(--text-primary)] line-clamp-1">
                                    {product.name}
                                </h3>
                                {product.description && (
                                    <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">
                                        {product.description}
                                    </p>
                                )}
                                <div className="flex items-center gap-2 mb-4">
                                    {product.offerPrice ? (
                                        <>
                                            <span className="text-lg font-bold text-[var(--success)]">
                                                ${product.offerPrice}
                                            </span>
                                            <span className="text-sm text-[var(--text-secondary)] line-through">
                                                ${product.basePrice}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-lg font-bold text-[var(--text-primary)]">
                                            ${product.basePrice}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleRemove(product.id)}
                                    disabled={deletingId === product.id}
                                    className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                >
                                    {deletingId === product.id ? 'Removing...' : 'Remove'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <AddFeaturedProductModal
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleAddSuccess}
                    currentFeaturedIds={products.map(p => p.id)}
                />
            )}
        </div>
    );
}
