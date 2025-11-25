// app/(admin)/products/components/ProductForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ImageUploader } from './ImageUploader';
import { VariantSelector } from './VariantSelector';
import { ImageVariantMapper } from './ImageVariantMapper';

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
                                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                                        step >= s.number
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
                                        className={`absolute top-0 left-0 h-1 rounded-full transition-all duration-500 ${
                                            step > s.number ? 'w-full bg-gradient-to-r from-[var(--primary)] to-[var(--ring)]' : 'w-0'
                                        }`}
                                    ></div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </Card>

            {step === 1 && (
                <Card>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--ring)] flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-[var(--foreground)]">Basic Information</h2>
                    </div>
                    <div className="space-y-5">
                        <Input
                            label="Product Name *"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Wireless Dash Cam"
                            required
                        />
                        <div>
                            <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe your product features and benefits..."
                                className="w-full px-4 py-3 border-2 border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] transition-all duration-200 resize-none"
                                rows={5}
                            />
                        </div>
                        <div className="grid md:grid-cols-2 gap-5">
                            <Input
                                type="number"
                                label="Base Price *"
                                value={basePrice}
                                onChange={(e) => setBasePrice(e.target.value)}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                required
                            />
                            <Input
                                type="number"
                                label="Offer Price (optional)"
                                value={offerPrice}
                                onChange={(e) => setOfferPrice(e.target.value)}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                            />
                        </div>
                        {offerPrice && parseFloat(offerPrice) < parseFloat(basePrice) && (
                            <div className="bg-[var(--success)]/10 border border-[var(--success)] text-[var(--success)] px-4 py-3 rounded-lg flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-medium">
                                    {Math.round(((parseFloat(basePrice) - parseFloat(offerPrice)) / parseFloat(basePrice)) * 100)}% discount applied
                                </span>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {step === 2 && (
                <Card>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--success)] to-green-600 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-[var(--foreground)]">Product Images</h2>
                            <p className="text-sm text-[var(--muted-foreground)]">{images.length} image{images.length !== 1 ? 's' : ''} uploaded</p>
                        </div>
                    </div>
                    <ImageUploader images={images} onChange={setImages} />
                </Card>
            )}

            {step === 3 && (
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
                    <VariantSelector variants={variants} onChange={setVariants} />
                </Card>
            )}

            {step === 4 && (
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        mappings={imageMappings}
                        onChange={setImageMappings}
                    />
                </div>
            )}

            {step === 5 && (
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
