// app/(admin)/products/components/steps/ImageMappingStep.tsx
'use client';

import { Card } from '@/components/ui/Card';
import { ImageVariantMapper } from '../ImageVariantMapper';

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
    priceDelta?: number;
}

interface ImageMappingStepProps {
}

interface ImageMappingStepProps {
    images: ImageFile[];
    variants: ProductVariant[];
    mappings: Record<string, string[]>;
    onMappingsChange: (mappings: Record<string, string[]>) => void;
}

export function ImageMappingStep({ images, variants, mappings, onMappingsChange }: ImageMappingStepProps) {
    return (
        <Card>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--ring)] flex items-center justify-center">
                    <svg className="w-5 h-5 text-[var(--text-inverted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-[var(--foreground)]">Map Images to Variants</h2>
                    <p className="text-sm text-[var(--muted-foreground)]">Connect images with specific variant options</p>
                </div>
            </div>
            <ImageVariantMapper
                images={images}
                variants={variants}
                mappings={mappings}
                onChange={onMappingsChange}
            />
        </Card>
    );
}
