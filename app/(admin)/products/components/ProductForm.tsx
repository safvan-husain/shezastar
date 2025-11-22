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

    // Form state
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
            // Step 1: Create/update product with basic info
            const productData = {
                name,
                description,
                basePrice: parseFloat(basePrice),
                offerPrice: offerPrice ? parseFloat(offerPrice) : undefined,
                images: [],
                variants,
            };

            const url = initialData?.id
                ? `/api/products/${initialData.id}`
                : '/api/products';

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

            // Step 2: Upload images if there are new ones
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

                // Map old image IDs to new ones
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

                // Update mappings with new image IDs
                const updatedMappings: Record<string, string[]> = {};
                Object.entries(imageMappings).forEach(([oldId, variantIds]) => {
                    const newId = imageIdMap[oldId];
                    if (newId) {
                        updatedMappings[newId] = variantIds;
                    }
                });

                // Step 3: Update image mappings
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

        if (!confirm('Are you sure you want to delete this product?')) {
            return;
        }

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
            case 3:
                return true; // Variants are optional
            case 4:
                return true; // Mapping is optional
            default:
                return true;
        }
    };

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {/* Progress Steps */}
            <Card>
                <div className="flex justify-between items-center">
                    {steps.map((s, index) => (
                        <div key={s.number} className="flex items-center">
                            <div className="flex flex-col items-center">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step >= s.number
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-600'
                                        }`}
                                >
                                    {s.number}
                                </div>
                                <div className="text-center mt-2">
                                    <p className="text-sm font-medium">{s.title}</p>
                                    <p className="text-xs text-gray-500 hidden md:block">{s.description}</p>
                                </div>
                            </div>
                            {index < steps.length - 1 && (
                                <div
                                    className={`h-1 w-12 mx-2 ${step > s.number ? 'bg-blue-600' : 'bg-gray-200'
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </Card>

            {/* Step Content */}
            {step === 1 && (
                <Card>
                    <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
                    <div className="space-y-4">
                        <Input
                            label="Product Name *"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Wireless Dash Cam"
                            required
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Product description..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={4}
                            />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
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
                    </div>
                </Card>
            )}

            {step === 2 && (
                <Card>
                    <h2 className="text-xl font-semibold mb-4">Product Images</h2>
                    <ImageUploader images={images} onChange={setImages} />
                </Card>
            )}

            {step === 3 && (
                <Card>
                    <h2 className="text-xl font-semibold mb-4">Product Variants</h2>
                    <VariantSelector variants={variants} onChange={setVariants} />
                </Card>
            )}

            {step === 4 && (
                <div>
                    <h2 className="text-xl font-semibold mb-4">Map Images to Variants</h2>
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
                    <h2 className="text-xl font-semibold mb-4">Review Product</h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-medium text-gray-700">Product Name</h3>
                            <p>{name}</p>
                        </div>
                        {description && (
                            <div>
                                <h3 className="font-medium text-gray-700">Description</h3>
                                <p className="text-gray-600">{description}</p>
                            </div>
                        )}
                        <div>
                            <h3 className="font-medium text-gray-700">Pricing</h3>
                            <p>
                                Base: ${basePrice}
                                {offerPrice && ` | Offer: $${offerPrice}`}
                            </p>
                        </div>
                        <div>
                            <h3 className="font-medium text-gray-700">Images</h3>
                            <p>{images.length} image{images.length !== 1 ? 's' : ''}</p>
                        </div>
                        <div>
                            <h3 className="font-medium text-gray-700">Variants</h3>
                            <p>{variants.length} variant type{variants.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Navigation */}
            <div className="flex justify-between">
                <div className="flex gap-2">
                    {step > 1 && (
                        <Button
                            variant="secondary"
                            onClick={() => setStep(step - 1)}
                            disabled={loading}
                        >
                            Previous
                        </Button>
                    )}
                    <Button
                        variant="secondary"
                        onClick={() => router.push('/products')}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                </div>

                <div className="flex gap-2">
                    {initialData?.id && step === 1 && (
                        <Button
                            variant="danger"
                            onClick={handleDelete}
                            disabled={loading}
                        >
                            Delete Product
                        </Button>
                    )}
                    {step < 5 ? (
                        <Button
                            onClick={() => setStep(step + 1)}
                            disabled={!canProceed() || loading}
                        >
                            Next
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={loading}>
                            {loading ? 'Saving...' : initialData?.id ? 'Update Product' : 'Create Product'}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
