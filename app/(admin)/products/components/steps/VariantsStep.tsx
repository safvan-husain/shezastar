// app/(admin)/products/components/steps/VariantsStep.tsx
'use client';

import { Card } from '@/components/ui/Card';
import { VariantSelector } from '../VariantSelector';

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

interface VariantsStepProps {
    variants: ProductVariant[];
    onVariantsChange: (variants: ProductVariant[]) => void;
}

export function VariantsStep({ variants, onVariantsChange }: VariantsStepProps) {
    return (
        <Card>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--warning)] to-orange-600 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-[var(--foreground)]">Product Variants</h2>
                    <p className="text-sm text-[var(--muted-foreground)]">{variants.length} variant type{variants.length !== 1 ? 's' : ''} configured</p>
                </div>
            </div>
            <VariantSelector variants={variants} onChange={onVariantsChange} />
        </Card>
    );
}
