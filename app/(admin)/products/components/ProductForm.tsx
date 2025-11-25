// app/(admin)/products/components/ProductForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { ImagesStep } from './steps/ImagesStep';
import { VariantsStep } from './steps/VariantsStep';
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
    const [imageMappings, setImageMappings] = useState<Record<string, string[]>>(
        initialData?.images?.reduce((acc: any, img: any) => {
            if (img.mappedVariants && img.mappedVariants.length > 0) {
                acc[img.id] = img.mappedVariants;
            }
            return acc;
        }, {}) || {}
    );

    const steps = [
        { number: 1, title: 'Basic Info', description: 'Product details and pricing' },
        { number: 2, title: 'Images', description: 'Upload product images' },
        { number: 3, title: 'Variants', description: 'Configure product variants' },
        { number: 4, title: 'Image Mapping', description: 'Map images to variants' },
        { number: 5, title: 'Review', description: 'Review and submit' },
    ];

    const handleSubmit = async () => {
        setError('');
        setLoading(true);

        try {
            const productData = {
                name,
                description,
                basePrice: parseFloat(basePrice),
                offerPrice: offerPrice ? parseFloat(offerPrice) : undefined,
                images: [],
                variants,
            };

            const url = initialData?.id ? `/api/products/${initialData.id}` : '/api/products';
            const method = initialData?.id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to save product');
            }

            const product = await res.json();

            const newImages = images.filter(img => img.file);
            if (newImages.length > 0) {
                const formData = new FormData();
                newImages.forEach(img => {
                    if (img.file) formData.append('images', img.file);
                });

                const uploadRes = await fetch(`/api/products/${product.id}/images`, {
                    method: 'POST',
                    body: formData,
                });

                if (!uploadRes.ok) {
                    throw new Error('Failed to upload images');
                }

                const updatedProduct = await uploadRes.json();

                const imageIdMap: Record<string, string> = {};
                let newImageIndex = 0;
                images.forEach(img => {
                    if (img.file) {
                        const newImage = updatedProduct.images[updatedProduct.images.length - newImages.length + newImageIndex];
                        imageIdMap[img.id] = newImage.id;
                        newImageIndex++;
                    } else {
                        imageIdMap[img.id] = img.id;
                    }
                });

                const updatedMappings: Record<string, string[]> = {};
                Object.entries(imageMappings).forEach(([oldId, variantIds]) => {
                    const newId = imageIdMap[oldId];
                    if (newId) {
                        updatedMappings[newId] = variantIds;
                    }
                });

                if (Object.keys(updatedMappings).length > 0) {
                    const mappingData = Object.entries(updatedMappings).map(([imageId, variantItemIds]) => ({
                        imageId,
                        variantItemIds,
                    }));

                    await fetch(`/api/products/${product.id}/images/map`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(mappingData),
                    });
                }
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

            <Card className="overflow-x-auto">
                <div className="flex justify-between items-center min-w-max">
                    {steps.map((s, index) => (
                        <div key={s.number} className="flex items-center">
                            <div className="flex flex-col items-center">
                                <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${step >= s.number
                                            ? 'bg-gradient-to-br from-[var(--primary)] to-[var(--ring)] text-white shadow-lg scale-110'
                                            : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                                        } ${step === s.number ? 'ring-4 ring-[var(--primary)]/30' : ''}`}
                                >
                                    {step > s.number ? (
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        s.number
                                    )}
                                </div>
                                <div className="text-center mt-3 px-2">
                                    <p className={`text-sm font-semibold ${step >= s.number ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`}>
                                        {s.title}
                                    </p>
                                    <p className="text-xs text-[var(--muted-foreground)] hidden md:block mt-1">
                                        {s.description}
                                    </p>
                                </div>
                            </div>
                            {index < steps.length - 1 && (
                                <div className="relative mx-4 mb-8">
                                    <div className="h-1 w-16 bg-[var(--border)] rounded-full"></div>
                                    <div
                                        className={`absolute top-0 left-0 h-1 rounded-full transition-all duration-500 ${step > s.number ? 'w-full bg-gradient-to-r from-[var(--primary)] to-[var(--ring)]' : 'w-0'
                                            }`}
                                    ></div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </Card>

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
                <VariantsStep
                    variants={variants}
                    onVariantsChange={setVariants}
                />
            )}

            {step === 4 && (
                <ImageMappingStep
                    images={images}
                    variants={variants}
                    mappings={imageMappings}
                    onMappingsChange={setImageMappings}
                />
            )}

            {step === 5 && (
                <ReviewStep
                    name={name}
                    description={description}
                    basePrice={basePrice}
                    offerPrice={offerPrice}
                    images={images}
                    variants={variants}
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
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete Product
                        </Button>
                    )}
                    {step < 5 ? (
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
    );
}
