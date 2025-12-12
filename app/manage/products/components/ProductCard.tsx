'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Product } from '@/lib/product/model/product.model';
import { ProductCardImage } from './ProductCardImage';
import AddToFeaturedButton from './AddToFeaturedButton';

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const [showFeaturedButton, setShowFeaturedButton] = useState(false);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent default browser context menu
        setShowFeaturedButton(true);
    };

    return (
        <div onContextMenu={handleContextMenu}>
            <Card 
                key={product.id} 
                className="overflow-hidden p-2 relative"
            >
            {/* Product Image */}
            <div className="relative bg-[var(--muted)] overflow-hidden aspect-square">
                {product.images && product.images.length > 0 ? (
                    <ProductCardImage src={product.images[0].url} alt={product.name} />
                ) : (
                    <ProductCardImage alt={product.name} />
                )}
                {product.offerPrice && (
                    <div className="absolute top-3 right-3 bg-[var(--danger)] text-[var(--text-inverted)] px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                        SALE
                    </div>
                )}
                
                {/* Add to Featured Button - appears on double-tap or hover */}
                <AddToFeaturedButton 
                    productId={product.id}
                    show={showFeaturedButton}
                    onHide={() => setShowFeaturedButton(false)}
                />
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
        </div>
    );
}
