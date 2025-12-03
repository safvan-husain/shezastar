'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/Button';
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
    const [confirmingProduct, setConfirmingProduct] = useState<Product | null>(null);

    // Sync local state when initialProducts changes after router.refresh()
    useEffect(() => {
        if (!isModalOpen) {
            setProducts(initialProducts);
        }
    }, [initialProducts, isModalOpen]);

    const handleRemove = async () => {
        if (!confirmingProduct) return;

        setDeletingId(confirmingProduct.id);
        try {
            const response = await fetch(`/api/admin/settings/featured-products/${confirmingProduct.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || 'Failed to remove product');
            }

            showToast('Product removed from featured list', 'success');
            setProducts(products.filter(p => p.id !== confirmingProduct.id));
            setConfirmingProduct(null);
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
                                <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)]">
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

                                <Button
                                    onClick={() => setConfirmingProduct(product)}
                                    disabled={deletingId === product.id}
                                    variant="danger"
                                    size="sm"
                                    className="w-full mt-4"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    {deletingId === product.id ? 'Removing...' : 'Remove'}
                                </Button>
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

            <ConfirmDialog
                isOpen={Boolean(confirmingProduct)}
                onClose={() => setConfirmingProduct(null)}
                onConfirm={handleRemove}
                title="Remove featured product"
                message={`Are you sure you want to remove "${confirmingProduct?.name}" from the featured list? This action can be undone by adding it back.`}
                confirmText="Remove"
                variant="danger"
                isLoading={Boolean(deletingId)}
            />
        </div>
    );
}
