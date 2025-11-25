// app/(admin)/products/components/steps/ReviewStep.tsx
'use client';

import { Card } from '@/components/ui/Card';

interface ImageFile {
    id: string;
    file?: File;
    url: string;
    preview: string;
}

interface VariantItem {
    id: string;
    name: string;
}

interface ProductVariant {
    variantTypeId: string;
    variantTypeName: string;
    selectedItems: VariantItem[];
    priceModifier?: number;
}

interface ReviewStepProps {
    name: string;
    description: string;
    basePrice: string;
    offerPrice: string;
    images: ImageFile[];
    variants: ProductVariant[];
}

export function ReviewStep({ name, description, basePrice, offerPrice, images, variants }: ReviewStepProps) {
    return (
        <Card>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--ring)] flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-[var(--foreground)]">Review Product</h2>
            </div>
            <div className="space-y-6">
                <div className="p-5 bg-[var(--accent)] rounded-lg border border-[var(--border)]">
                    <h3 className="font-semibold text-[var(--foreground)] mb-2 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Product Name
                    </h3>
                    <p className="text-lg font-medium text-[var(--foreground)]">{name}</p>
                </div>
                {description && (
                    <div className="p-5 bg-[var(--accent)] rounded-lg border border-[var(--border)]">
                        <h3 className="font-semibold text-[var(--foreground)] mb-2 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                            </svg>
                            Description
                        </h3>
                        <p className="text-[var(--muted-foreground)]">{description}</p>
                    </div>
                )}
                <div className="p-5 bg-[var(--accent)] rounded-lg border border-[var(--border)]">
                    <h3 className="font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Pricing
                    </h3>
                    <div className="flex items-baseline gap-3">
                        {offerPrice ? (
                            <>
                                <span className="text-2xl font-bold text-[var(--success)]">${offerPrice}</span>
                                <span className="text-lg text-[var(--muted-foreground)] line-through">${basePrice}</span>
                                <span className="px-2 py-1 bg-[var(--danger)] text-white text-sm font-bold rounded">
                                    {Math.round(((parseFloat(basePrice) - parseFloat(offerPrice)) / parseFloat(basePrice)) * 100)}% OFF
                                </span>
                            </>
                        ) : (
                            <span className="text-2xl font-bold text-[var(--foreground)]">${basePrice}</span>
                        )}
                    </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-5 bg-[var(--accent)] rounded-lg border border-[var(--border)]">
                        <h3 className="font-semibold text-[var(--foreground)] mb-2 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Images
                        </h3>
                        <p className="text-2xl font-bold text-[var(--foreground)]">{images.length}</p>
                    </div>
                    <div className="p-5 bg-[var(--accent)] rounded-lg border border-[var(--border)]">
                        <h3 className="font-semibold text-[var(--foreground)] mb-2 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            Variant Types
                        </h3>
                        <p className="text-2xl font-bold text-[var(--foreground)]">{variants.length}</p>
                    </div>
                </div>
            </div>
        </Card>
    );
}
