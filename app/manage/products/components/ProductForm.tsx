// app/(admin)/products/components/ProductForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { ImagesStep } from './steps/ImagesStep';
import { CategoryStep } from './steps/CategoryStep';
import { VariantsStep } from './steps/VariantsStep';
import { VariantStockStep } from './steps/VariantStockStep';
import { InstallationServiceStep } from './steps/InstallationServiceStep';
import { ImageMappingStep } from './steps/ImageMappingStep';
import { ReviewStep } from './steps/ReviewStep';
import { InstallationLocation } from '@/lib/app-settings/app-settings.schema';
import { ProductInstallationLocation } from '@/lib/product/product.schema';

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

interface ProductSpecification {
    title: string;
    items: string[];
}

interface ProductVariant {
    variantTypeId: string;
    variantTypeName: string;
    selectedItems: VariantItem[];
}

interface ProductFormProps {
    initialData?: any;
    globalInstallationLocations?: InstallationLocation[];
    brands?: any[];
}

export function ProductForm({ initialData, globalInstallationLocations = [], brands = [] }: ProductFormProps) {
    const router = useRouter();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [name, setName] = useState(initialData?.name || '');
    const [subtitle, setSubtitle] = useState(initialData?.subtitle || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [specifications, setSpecifications] = useState<ProductSpecification[]>(initialData?.specifications || []);
    const [basePrice, setBasePrice] = useState(initialData?.basePrice || '');
    const [offerPercentage, setOfferPercentage] = useState(initialData?.offerPercentage || '');
    const [images, setImages] = useState<ImageFile[]>(
        initialData?.images?.map((img: any) => ({
            id: String(img.id),
            url: img.url,
            preview: img.url,
        })) || []
    );
    const [variants, setVariants] = useState<ProductVariant[]>(initialData?.variants || []);
    const [variantStock, setVariantStock] = useState<Array<{ variantCombinationKey: string; stockCount: number; priceDelta?: number; price?: number }>>(
        initialData?.variantStock || []
    );
    const [subCategoryIds, setSubCategoryIds] = useState<string[]>(initialData?.subCategoryIds || []);
    const [installationEnabled, setInstallationEnabled] = useState(initialData?.installationService?.enabled || false);
    const [inStorePrice, setInStorePrice] = useState(initialData?.installationService?.inStorePrice?.toString() || '');
    const [atHomePrice, setAtHomePrice] = useState(initialData?.installationService?.atHomePrice?.toString() || '');
    const [availableLocations, setAvailableLocations] = useState<ProductInstallationLocation[]>(
        initialData?.installationService?.availableLocations || []
    );
    const [brandId, setBrandId] = useState(initialData?.brandId || '');

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

        // Explicit validation checks
        if (!name.trim()) {
            const msg = 'Product name is required';
            setError(msg);
            showToast(msg, 'error');
            return;
        }

        const price = parseFloat(basePrice);
        if (!basePrice || isNaN(price) || price <= 0) {
            const msg = 'Base price must be greater than zero';
            setError(msg);
            showToast(msg, 'error');
            return;
        }

        if (images.length === 0) {
            const msg = 'At least one product image is required';
            setError(msg);
            showToast(msg, 'error');
            return;
        }

        const requestUrl = initialData?.id ? `/api/products/${initialData.id}` : '/api/products';
        const requestMethod = initialData?.id ? 'PUT' : 'POST';
        setLoading(true);

        try {
            const formData = new FormData();

            // Add basic product data
            formData.append('name', name);
            formData.append('subtitle', subtitle || '');
            // Ensure description is HTML
            const ensureHtml = (str: string) => {
                if (!str) return '';
                if (/<[a-z][\s\S]*>/i.test(str)) return str;
                return str.split('\n').filter(l => l.trim()).map(l => `<p>${l}</p>`).join('');
            };
            formData.append('description', ensureHtml(description || ''));
            formData.append('basePrice', basePrice);
            if (offerPercentage) {
                formData.append('offerPercentage', offerPercentage);
            }

            const normalizedSpecifications = specifications.map(spec => ({
                title: spec.title.trim(),
                items: spec.items.map(i => i.trim()).filter(Boolean)
            })).filter(spec => spec.title);
            formData.append('specifications', JSON.stringify(normalizedSpecifications));

            formData.append('variants', JSON.stringify(variants));

            // Ensure products without variants have a default stock entry
            let finalVariantStock = [...variantStock];
            if (variants.length === 0) {
                // If no variants, ensure we have a default stock entry
                const hasDefaultEntry = finalVariantStock.some(vs => vs.variantCombinationKey === 'default');
                if (!hasDefaultEntry) {
                    finalVariantStock.push({
                        variantCombinationKey: 'default',
                        stockCount: 0,
                        price: parseFloat(basePrice) || 0,
                    });
                }
            }

            formData.append('variantStock', JSON.stringify(finalVariantStock));
            formData.append('subCategoryIds', JSON.stringify(subCategoryIds));
            if (brandId) {
                formData.append('brandId', brandId);
            }

            // Add installation service data
            const installationService = {
                enabled: installationEnabled,
                inStorePrice: installationEnabled && inStorePrice ? parseFloat(inStorePrice) : undefined,
                atHomePrice: installationEnabled && atHomePrice ? parseFloat(atHomePrice) : undefined,
                availableLocations: installationEnabled ? availableLocations : [],
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

            const res = await fetch(requestUrl, {
                method: requestMethod,
                body: formData,
            });

            if (!res.ok) {
                let data: any = {};
                try {
                    data = await res.json();
                } catch {
                    data = { error: 'Failed to parse response body' };
                }

                const message = data.message || data.error || 'Failed to save product';
                showToast(message, 'error', {
                    status: res.status,
                    body: data,
                    url: res.url,
                    method: requestMethod,
                });
                setError(message);
                setLoading(false);
                return;
            }

            showToast(
                initialData?.id ? 'Product updated successfully' : 'Product created successfully',
                'success'
            );
            router.push('/manage/products');
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            showToast(err.message || 'Failed to save product', 'error', {
                url: requestUrl,
                method: requestMethod,
                body: { error: err.message },
            });
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!initialData?.id) return;
        if (!confirm('Are you sure you want to delete this product?')) return;

        setLoading(true);
        const url = `/api/products/${initialData.id}`;
        const method = 'DELETE';

        try {
            const res = await fetch(url, {
                method,
            });

            if (!res.ok) {
                let data: any = {};
                try {
                    data = await res.json();
                } catch {
                    data = { error: 'Failed to parse response body' };
                }

                const message = data.message || data.error || 'Failed to delete product';
                showToast(message, 'error', {
                    status: res.status,
                    body: data,
                    url: res.url,
                    method,
                });
                setError(message);
                setLoading(false);
                return;
            }

            showToast('Product deleted successfully', 'success');
            router.push('/manage/products');
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            showToast(err.message || 'Failed to delete product', 'error', {
                url,
                method,
                body: { error: err.message },
            });
            setLoading(false);
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

            {/* Stacked Layout: All sections visible as cards */}
            <div className="space-y-8 pb-32">
                <BasicInfoStep
                    name={name}
                    subtitle={subtitle}
                    description={description}
                    basePrice={basePrice}
                    offerPercentage={offerPercentage}
                    specifications={specifications}
                    onNameChange={setName}
                    onSubtitleChange={setSubtitle}
                    onDescriptionChange={setDescription}
                    onBasePriceChange={setBasePrice}
                    onOfferPercentageChange={setOfferPercentage}
                    onSpecificationsChange={setSpecifications}
                    brands={brands}
                    brandId={brandId}
                    onBrandIdChange={setBrandId}
                />

                <ImagesStep
                    images={images}
                    onImagesChange={setImages}
                />

                <CategoryStep
                    selectedSubCategoryIds={subCategoryIds}
                    onSelectionChange={setSubCategoryIds}
                />

                <VariantsStep
                    variants={variants}
                    onVariantsChange={setVariants}
                />

                <VariantStockStep
                    variants={variants}
                    variantStock={variantStock}
                    basePrice={parseFloat(basePrice) || 0}
                    offerPercentage={parseFloat(offerPercentage) || 0}
                    onVariantStockChange={setVariantStock}
                />

                <InstallationServiceStep
                    enabled={installationEnabled}
                    inStorePrice={inStorePrice}
                    atHomePrice={atHomePrice}
                    globalLocations={globalInstallationLocations}
                    availableLocations={availableLocations}
                    onEnabledChange={setInstallationEnabled}
                    onInStorePriceChange={setInStorePrice}
                    onAtHomePriceChange={setAtHomePrice}
                    onAvailableLocationsChange={setAvailableLocations}
                />

                <ImageMappingStep
                    images={images}
                    variants={variants}
                    mappings={imageMappings}
                    onMappingsChange={setImageMappings}
                />

                <ReviewStep
                    name={name}
                    subtitle={subtitle}
                    description={description}
                    basePrice={basePrice}
                    offerPercentage={offerPercentage}
                    specifications={specifications}
                    images={images}
                    variants={variants}
                    variantStock={variantStock}
                    imageMappings={imageMappings}
                    selectedSubCategoryIds={subCategoryIds}
                    installationEnabled={installationEnabled}
                    inStorePrice={inStorePrice}
                    atHomePrice={atHomePrice}
                />

                <div className="fixed bottom-0 left-0 right-0 bg-[var(--bg-base)]/80 backdrop-blur-md border-t border-[var(--border)] p-4 z-50">
                    <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between gap-4">
                        <div className="flex flex-wrap gap-3">
                            <Button variant="outline" size="lg" onClick={() => router.push('/manage/products')} disabled={loading}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Cancel
                            </Button>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {initialData?.id && (
                                <Button variant="danger" size="lg" onClick={handleDelete} disabled={loading}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1 1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete Product
                                </Button>
                            )}
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
