'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/Card';

interface ProductResult {
    id: string;
    name: string;
    basePrice: number;
}

interface ProductSearchSelectorProps {
    selectedProducts: ProductResult[];
    onSelectionChange: (products: ProductResult[]) => void;
}

export function ProductSearchSelector({ selectedProducts, onSelectionChange }: ProductSearchSelectorProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<ProductResult[]>([]);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchProducts = useCallback(async (query: string) => {
        if (!query.trim()) {
            setResults([]);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=20`);
            if (!res.ok) throw new Error('Failed to search products');
            const data = await res.json();
            // API returns { products: [...], pagination: {...} } or array directly
            const products = Array.isArray(data) ? data : (data.products || []);
            setResults(products.map((p: any) => ({
                id: p.id || p._id,
                name: p.name,
                basePrice: p.basePrice,
            })));
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchProducts(searchQuery), 300);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [searchQuery, fetchProducts]);

    const selectedIds = new Set(selectedProducts.map(p => p.id));
    const filteredResults = results.filter(r => !selectedIds.has(r.id));

    const handleSelect = (product: ProductResult) => {
        onSelectionChange([...selectedProducts, product]);
    };

    const handleRemove = (productId: string) => {
        onSelectionChange(selectedProducts.filter(p => p.id !== productId));
    };

    return (
        <div className="space-y-3">
            {/* Selected products  */}
            {selectedProducts.length > 0 && (
                <Card className="p-3">
                    <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2">
                        Selected ({selectedProducts.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {selectedProducts.map(p => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => handleRemove(p.id)}
                                className="flex items-center gap-1.5 px-3 py-1 bg-[var(--primary)] text-[var(--primary-foreground)] text-xs rounded-full hover:opacity-90 transition-colors"
                            >
                                <span className="truncate max-w-[12rem]">{p.name}</span>
                                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        ))}
                    </div>
                </Card>
            )}

            {/* Search input */}
            <div className="relative">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search products by name..."
                    className="w-full px-4 py-2.5 pl-10 border-2 border-[var(--border-subtle)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent bg-[var(--bg-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all"
                />
                <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>

            {/* Results */}
            {searchQuery.trim() && (
                <Card className="p-0">
                    <div className="max-h-64 overflow-y-auto divide-y divide-[var(--border)]">
                        {loading ? (
                            <div className="px-4 py-6 text-center text-sm text-[var(--text-secondary)]">
                                Searching...
                            </div>
                        ) : filteredResults.length === 0 ? (
                            <div className="px-4 py-6 text-center text-sm text-[var(--text-secondary)]">
                                {results.length > 0 ? 'All matching products already selected.' : 'No products found.'}
                            </div>
                        ) : (
                            filteredResults.map(product => (
                                <button
                                    key={product.id}
                                    type="button"
                                    onClick={() => handleSelect(product)}
                                    className="w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-[var(--bg-subtle)] transition-colors"
                                >
                                    <span className="text-sm truncate">{product.name}</span>
                                    <span className="text-xs text-[var(--text-muted)] whitespace-nowrap ml-3">
                                        AED {product.basePrice.toFixed(2)}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
}
