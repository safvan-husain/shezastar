'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { Product } from '@/lib/product/model/product.model';

interface AddFeaturedProductModalProps {
    onClose: () => void;
    onSuccess: () => void;
    currentFeaturedIds: string[];
}

export default function AddFeaturedProductModal({
    onClose,
    onSuccess,
    currentFeaturedIds,
}: AddFeaturedProductModalProps) {
    const { showToast } = useToast();
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        // Filter products based on search term
        const filtered = products.filter(product => {
            // Exclude already featured products
            if (currentFeaturedIds.includes(product.id)) {
                return false;
            }

            // Filter by search term
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                return (
                    product.name.toLowerCase().includes(term) ||
                    product.description?.toLowerCase().includes(term)
                );
            }

            return true;
        });

        setFilteredProducts(filtered);
    }, [products, searchTerm, currentFeaturedIds]);

    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/products');
            
            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }

            const data = await response.json();
            setProducts(data.products || []);
        } catch (error: any) {
            const message = error instanceof Error ? error.message : 'Failed to load products';
            showToast(message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (productId: string) => {
        setAdding(productId);
        try {
            const response = await fetch('/api/admin/settings/featured-products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ productId }),
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || 'Failed to add product');
            }

            showToast('Product added to featured list', 'success');
            onSuccess();
        } catch (error: any) {
            const message = error instanceof Error ? error.message : 'Something went wrong';
            showToast(message, 'error');
        } finally {
            setAdding(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--bg-elevated)] rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-[var(--border-subtle)]">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                            Add Featured Product
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search products by name or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-[var(--border-subtle)] rounded-md bg-[var(--bg-base)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-center py-12">
                            <p className="text-[var(--text-secondary)]">Loading products...</p>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-[var(--text-secondary)]">
                                {searchTerm
                                    ? 'No products found matching your search'
                                    : 'All products are already featured'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="bg-[var(--bg-base)] rounded-lg border border-[var(--border-subtle)] overflow-hidden hover:shadow-md transition-shadow"
                                >
                                    <div className="aspect-square bg-[var(--bg-elevated)] relative">
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
                                    </div>
                                    <div className="p-3">
                                        <h3 className="text-sm font-semibold mb-1 text-[var(--text-primary)] line-clamp-1">
                                            {product.name}
                                        </h3>
                                        <div className="flex items-center gap-2 mb-3">
                                            {product.offerPrice ? (
                                                <>
                                                    <span className="text-sm font-bold text-[var(--success)]">
                                                        ${product.offerPrice}
                                                    </span>
                                                    <span className="text-xs text-[var(--text-secondary)] line-through">
                                                        ${product.basePrice}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-sm font-bold text-[var(--text-primary)]">
                                                    ${product.basePrice}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleAdd(product.id)}
                                            disabled={adding === product.id}
                                            className="w-full px-3 py-2 bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                        >
                                            {adding === product.id ? 'Adding...' : 'Add to Featured'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
