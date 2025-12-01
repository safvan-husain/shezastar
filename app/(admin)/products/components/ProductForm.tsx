// app/(admin)/products/components/ProductForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { ImagesStep } from './steps/ImagesStep';
import { CategoryStep } from './steps/CategoryStep';
import { VariantsStep } from './steps/VariantsStep';
import { InstallationServiceStep } from './steps/InstallationServiceStep';
import { ImageMappingStep } from './steps/ImageMappingStep';
import { ReviewStep } from './steps/ReviewStep';

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

interface ProductFormProps {
    initialData?: any;
}

export function ProductForm({ initialData }: ProductFormProps) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [name, setName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [basePrice, setBasePrice] = useState(initialData?.basePrice || '');
    const [offerPrice, setOfferPrice] = useState(initialData?.offerPrice || '');
    const [images, setImages] = useState<ImageFile[]>(
        initialData?.images?.map((img: any) => ({
            id: img.id,
            url: img.url,
            preview: img.url,
        })) || []
    );
    const [variants, setVariants] = useState<ProductVariant[]>(initialData?.variants || []);
    const [subCategoryIds, setSubCategoryIds] = useState<string[]>(initialData?.subCategoryIds || []);
    const [installationEnabled, setInstallationEnabled] = useState(initialData?.installationService?.enabled || false);
    const [inStorePrice, setInStorePrice] = useState(initialData?.installationService?.inStorePrice?.toString() || '');
    const [atHomePrice, setAtHomePrice] = useState(initialData?.installationService?.atHomePrice?.toString() || '');
    const [imageMappings, setImageMappings] = useState<Record<string, string[]>>(
        initialData?.images?.reduce((acc: any, img: any) => {
            if (img.mappedVariants && img.mappedVariants.length > 0) {
                acc[img.id] = img.mappedVariants;
            }
            return acc;
        }, {}) || {}
    );

    const handleSubmit = async () => {
        setError('');
        setLoading(true);

        try {
            const formData = new FormData();

            // Add basic product data
            formData.append('name', name);
            if (description) formData.append('description', description);
            formData.append('basePrice', basePrice);
            if (offerPrice) formData.append('offerPrice', offerPrice);
            formData.append('variants', JSON.stringify(variants));
            formData.append('subCategoryIds', JSON.stringify(subCategoryIds));
            
            // Add installation service data
            const installationService = {
                enabled: installationEnabled,
                inStorePrice: installationEnabled && inStorePrice ? parseFloat(inStorePrice) : undefined,
                atHomePrice: installationEnabled && atHomePrice ? parseFloat(atHomePrice) : undefined,
            };
            formData.append('installationService', JSON.stringify(installationService));

            // Add existing images metadata
            const existingImages = images.filter(img => !img.file).map((img, index) => ({
                id: img.id,
                url: img.url,
                mappedVariants: imageMappings[img.id] || [],
                order: index,
            }));
            formData.append('existingImages', JSON.stringify(existingImages));

            // Add new image files
            const newImages = images.filter(img => img.file);
            newImages.forEach((img, index) => {
                if (img.file) {
                    formData.append('newImages', img.file);
                    // Store temporary ID and mappings for new images
                    formData.append(`newImageMeta_${index}`, JSON.stringify({
                        tempId: img.id,
                        mappedVariants: imageMappings[img.id] || [],
                        order: images.indexOf(img),
                    }));
                }
            });
            formData.append('newImagesCount', newImages.length.toString());

            const url = initialData?.id ? `/api/products/${initialData.id}` : '/api/products';
            const method = initialData?.id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to save product');
            }

            router.push('/products');
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!initialData?.id) return;
        if (!confirm('Are you sure you want to delete this product?')) return;

        setLoading(true);

        try {
            const res = await fetch(`/api/products/${initialData.id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                throw new Error('Failed to delete product');
            }

            router.push('/products');
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const canProceed = () => {
        switch (step) {
            case 1:
                return name.trim() && basePrice && parseFloat(basePrice) > 0;
            case 2:
                return images.length > 0;
            default:
                return true;
        }
    };

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-[var(--danger)]/10 border-2 border-[var(--danger)] text-[var(--danger)] px-5 py-4 rounded-xl flex items-start gap-3">
                    <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <p className="font-semibold">Error</p>
                        <p className="text-sm">{error}</p>
                    </div>
                </div>
            )}

            {/* Grid layout: progress steps on left (hidden on mobile), form content on right */}
            <div className="space-y-6">
                {step === 1 && (
                    <BasicInfoStep
                        name={name}
                        description={description}
                        basePrice={basePrice}
                        offerPrice={offerPrice}
                        onNameChange={setName}
                        onDescriptionChange={setDescription}
                        onBasePriceChange={setBasePrice}
                        onOfferPriceChange={setOfferPrice}
                    />
                )}

                {step === 2 && (
                    <ImagesStep
                        images={images}
                        onImagesChange={setImages}
                    />
                )}

                {step === 3 && (
                    <CategoryStep
                        selectedSubCategoryIds={subCategoryIds}
                        onSelectionChange={setSubCategoryIds}
                    />
                )}

                {step === 4 && (
                    <VariantsStep
                        variants={variants}
                        onVariantsChange={setVariants}
                    />
                )}

                {step === 5 && (
                    <InstallationServiceStep
                        enabled={installationEnabled}
                        inStorePrice={inStorePrice}
                        atHomePrice={atHomePrice}
                        onEnabledChange={setInstallationEnabled}
                        onInStorePriceChange={setInStorePrice}
                        onAtHomePriceChange={setAtHomePrice}
                    />
                )}

                {step === 6 && (
                    <ImageMappingStep
                        images={images}
                        variants={variants}
                        mappings={imageMappings}
                        onMappingsChange={setImageMappings}
                    />
                )}

                {step === 7 && (
                    <ReviewStep
                        name={name}
                        description={description}
                        basePrice={basePrice}
                        offerPrice={offerPrice}
                        images={images}
                        variants={variants}
                        imageMappings={imageMappings}
                    />
                )}

                <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
                    <div className="flex flex-wrap gap-3">
                        {step > 1 && (
                            <Button variant="outline" size="lg" onClick={() => setStep(step - 1)} disabled={loading}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Previous
                            </Button>
                        )}
                        <Button variant="outline" size="lg" onClick={() => router.push('/products')} disabled={loading}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel
                        </Button>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {initialData?.id && step === 1 && (
                            <Button variant="danger" size="lg" onClick={handleDelete} disabled={loading}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1 1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete Product
                            </Button>
                        )}
                        {step < 7 ? (
                            <Button size="lg" onClick={() => setStep(step + 1)} disabled={!canProceed() || loading}>
                                Next
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Button>
                        ) : (
                            <Button size="lg" onClick={handleSubmit} disabled={loading}>
                                {loading ? (
                                    <>
                                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {initialData?.id ? 'Update Product' : 'Create Product'}
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
