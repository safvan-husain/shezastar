// app/(admin)/products/components/steps/ImagesStep.tsx
'use client';

import { Card } from '@/components/ui/Card';
import { ImageUploader } from '../ImageUploader';

interface ImageFile {
    id: string;
    file?: File;
    url: string;
    preview: string;
}

interface ImagesStepProps {
    images: ImageFile[];
    onImagesChange: (images: ImageFile[]) => void;
}

export function ImagesStep({ images, onImagesChange }: ImagesStepProps) {
    return (
        <Card>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-[var(--bg-subtle)] flex items-center justify-center">
                    <svg className="w-5 h-5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-[var(--foreground)]">Product Images</h2>
                    <p className="text-sm text-[var(--muted-foreground)]">{images.length} image{images.length !== 1 ? 's' : ''} uploaded</p>
                </div>
            </div>
            <ImageUploader images={images} onChange={onImagesChange} />
        </Card>
    );
}
