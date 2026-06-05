// app/(admin)/products/components/ProductForm.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { ImagesStep } from './steps/ImagesStep';
import { CategoryStep } from './steps/CategoryStep';
import { VariantsStep } from './steps/VariantsStep';
import { VariantStockStep } from './steps/VariantStockStep';
import { InstallationServiceStep } from './steps/InstallationServiceStep';
import { ImageMappingStep } from './steps/ImageMappingStep';
import { ReviewStep } from './steps/ReviewStep';
import { ProductCardImage } from './ProductCardImage';
import { InstallationLocation } from '@/lib/app-settings/app-settings.schema';
import { ProductInstallationLocation } from '@/lib/product/product.schema';
import { stripHtml } from '@/lib/utils/string.utils';
import { buildSuggestedProductSlug, shouldPromptForSlugDecision } from './product-form-slug';

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

interface BrandOption {
    id: string;
    name: string;
}

interface ProductFormImage {
    id: string;
    url: string;
    mappedVariants?: string[];
}

interface ProductFormData {
    id?: string;
    name?: string;
    slug?: string;
    subtitle?: string;
    description?: string;
    metaTitle?: string;
    metaDescription?: string;
    specifications?: ProductSpecification[];
    basePrice?: string | number;
    offerPercentage?: string | number;
    images?: ProductFormImage[];
    variants?: ProductVariant[];
    variantStock?: Array<{ variantCombinationKey: string; stockCount: number; priceDelta?: number; price?: number }>;
    subCategoryIds?: string[];
    installationService?: {
        enabled?: boolean;
        inStorePrice?: number;
        atHomePrice?: number;
        availableLocations?: ProductInstallationLocation[];
    };
    brandId?: string;
}

interface ProductFormProps {
    initialData?: ProductFormData;
    globalInstallationLocations?: InstallationLocation[];
    brands?: BrandOption[];
    mode?: 'full' | 'seo';
}

function getErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback;
}

function ReadOnlyValue({ label, value }: { label: string; value: string }) {
    return (
        <Input
            label={label}
            value={value}
            disabled
            className="cursor-not-allowed opacity-80"
            readOnly
        />
    );
}

function ReadOnlyTextarea({ label, value, rows = 4 }: { label: string; value: string; rows?: number }) {
    return (
        <div className="w-full">
            <label className="mb-2 block text-sm font-semibold text-[var(--text-secondary)]">{label}</label>
            <textarea
                value={value}
                disabled
                readOnly
                rows={rows}
                className="w-full cursor-not-allowed rounded-lg border-2 border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-4 py-2.5 text-[var(--text-primary)] opacity-80"
            />
        </div>
    );
}

function ReadOnlyPillList({ label, items, emptyLabel }: { label: string; items: string[]; emptyLabel: string }) {
    return (
        <div>
            <p className="mb-2 text-sm font-semibold text-[var(--text-secondary)]">{label}</p>
            {items.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                        <span
                            key={item}
                            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3 py-1 text-sm text-[var(--text-secondary)]"
                        >
                            {item}
                        </span>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-[var(--text-muted)]">{emptyLabel}</p>
            )}
        </div>
    );
}

export function ProductForm({ initialData, globalInstallationLocations = [], brands = [], mode = 'full' }: ProductFormProps) {
    const router = useRouter();
    const { showToast } = useToast();
    const isSeoMode = mode === 'seo';
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [name, setName] = useState(initialData?.name || '');
    const [slug, setSlug] = useState(initialData?.slug || '');
    const [subtitle, setSubtitle] = useState(initialData?.subtitle || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [metaTitle, setMetaTitle] = useState(initialData?.metaTitle || '');
    const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription || '');
    const [specifications, setSpecifications] = useState<ProductSpecification[]>(initialData?.specifications || []);
    const [basePrice, setBasePrice] = useState(initialData?.basePrice || '');
    const [offerPercentage, setOfferPercentage] = useState(initialData?.offerPercentage || '');
    const [images, setImages] = useState<ImageFile[]>(
        initialData?.images?.map((img) => ({
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
    const [slugTouched, setSlugTouched] = useState(false);
    const [isSlugDecisionOpen, setIsSlugDecisionOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const [imageMappings, setImageMappings] = useState<Record<string, string[]>>(
        initialData?.images?.reduce<Record<string, string[]>>((acc, img) => {
            if (img.mappedVariants && img.mappedVariants.length > 0) {
                acc[img.id] = img.mappedVariants;
            }
            return acc;
        }, {}) || {}
    );

    useEffect(() => {
        if (variants.length > 0) {
            return;
        }

        const parsedPrice = parseFloat(basePrice);
        if (!basePrice || Number.isNaN(parsedPrice) || parsedPrice <= 0) {
            return;
        }

        setVariantStock((prev) => {
            const defaultIndex = prev.findIndex((entry) => entry.variantCombinationKey === 'default');

            if (defaultIndex >= 0) {
                if (prev[defaultIndex].price === parsedPrice) {
                    return prev;
                }

                const next = [...prev];
                next[defaultIndex] = { ...next[defaultIndex], price: parsedPrice };
                return next;
            }

            return [
                ...prev,
                {
                    variantCombinationKey: 'default',
                    stockCount: 0,
                    price: parsedPrice,
                },
            ];
        });
    }, [basePrice, variants.length]);

    const submitFullProduct = async (slugUpdateMode?: 'keep' | 'regenerate') => {
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
            formData.append('slug', slug.trim());
            if (slugUpdateMode) {
                formData.append('slugUpdateMode', slugUpdateMode);
            }
            formData.append('subtitle', subtitle || '');
            // Ensure description is HTML
            const ensureHtml = (str: string) => {
                if (!str) return '';
                if (/<[a-z][\s\S]*>/i.test(str)) return str;
                return str.split('\n').filter(l => l.trim()).map(l => `<p>${l}</p>`).join('');
            };
            formData.append('description', ensureHtml(description || ''));
            formData.append('metaTitle', metaTitle.trim());
            formData.append('metaDescription', metaDescription.trim());
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

            // Ensure products without variants keep default stock in sync with base price
            const finalVariantStock = [...variantStock];
            if (variants.length === 0) {
                const parsedPrice = parseFloat(basePrice) || 0;
                const defaultIndex = finalVariantStock.findIndex(
                    (entry) => entry.variantCombinationKey === 'default'
                );

                if (defaultIndex >= 0) {
                    finalVariantStock[defaultIndex] = {
                        ...finalVariantStock[defaultIndex],
                        price: parsedPrice,
                    };
                } else {
                    finalVariantStock.push({
                        variantCombinationKey: 'default',
                        stockCount: 0,
                        price: parsedPrice,
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
                let data: Record<string, unknown> = {};
                try {
                    data = await res.json() as Record<string, unknown>;
                } catch {
                    data = { error: 'Failed to parse response body' };
                }

                const message =
                    (typeof data.message === 'string' && data.message) ||
                    (typeof data.error === 'string' && data.error) ||
                    'Failed to save product';
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
            setLoading(false);
            router.push('/manage/products');
            router.refresh();
        } catch (error) {
            const message = getErrorMessage(error, 'Failed to save product');
            setError(message);
            showToast(message, 'error', {
                url: requestUrl,
                method: requestMethod,
                body: { error: message },
            });
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        const shouldPrompt = shouldPromptForSlugDecision({
            currentName: name,
            initialName: initialData?.name,
            slugTouched,
            hasInitialProduct: Boolean(initialData?.id),
        });

        if (shouldPrompt) {
            setIsSlugDecisionOpen(true);
            return;
        }

        await submitFullProduct();
    };

    const handleDelete = async () => {
        if (!initialData?.id) return;

        setLoading(true);
        const url = `/api/products/${initialData.id}`;
        const method = 'DELETE';

        try {
            const res = await fetch(url, {
                method,
            });

            if (!res.ok) {
                let data: Record<string, unknown> = {};
                try {
                    data = await res.json() as Record<string, unknown>;
                } catch {
                    data = { error: 'Failed to parse response body' };
                }

                const message =
                    (typeof data.message === 'string' && data.message) ||
                    (typeof data.error === 'string' && data.error) ||
                    'Failed to delete product';
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
            setLoading(false);
            router.push('/manage/products');
            router.refresh();
        } catch (error) {
            const message = getErrorMessage(error, 'Failed to delete product');
            setError(message);
            showToast(message, 'error', {
                url,
                method,
                body: { error: message },
            });
            setLoading(false);
        }
    };

    const handleSeoSubmit = async () => {
        if (!initialData?.id) return;

        const url = `/api/admin/seo/products/${initialData.id}`;
        const method = 'PATCH';
        setLoading(true);
        setError('');

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slug: slug.trim() || null,
                    metaTitle: metaTitle.trim() || null,
                    metaDescription: metaDescription.trim() || null,
                }),
            });
            const body = await res.json().catch(() => ({}));

            if (!res.ok) {
                const message = body.message || body.error || 'Failed to update product SEO';
                setError(message);
                showToast(message, 'error', {
                    status: res.status,
                    body,
                    url: res.url,
                    method,
                });
                return;
            }

            showToast('Product SEO updated successfully', 'success');
            router.push('/manage/seo/products');
            router.refresh();
        } catch (error) {
            const message = getErrorMessage(error, 'Failed to update product SEO');
            setError(message);
            showToast(message, 'error', {
                url,
                method,
                body: { error: message },
            });
        } finally {
            setLoading(false);
        }
    };

    if (isSeoMode) {
        return (
            <div className="space-y-6 pb-32">
                {error && (
                    <div className="flex items-start gap-3 rounded-xl border-2 border-[var(--danger)] bg-[var(--danger)]/10 px-5 py-4 text-[var(--danger)]">
                        <svg className="mt-0.5 h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="font-semibold">Error</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                )}

                <Card>
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--ring)]">
                            <svg className="h-5 w-5 text-[var(--text-inverted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h10" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-[var(--foreground)]">SEO Fields</h2>
                            <p className="text-sm text-[var(--muted-foreground)]">Only these fields can be changed from this page.</p>
                        </div>
                    </div>
                    <div className="grid gap-5 md:grid-cols-2">
                        <Input
                            label="Product Slug (optional)"
                            value={slug}
                            onChange={(event) => {
                                setSlug(event.target.value);
                                setSlugTouched(true);
                            }}
                            placeholder="SEO-friendly product URL"
                        />
                        <Input
                            label="SEO Meta Title (optional)"
                            value={metaTitle}
                            onChange={(event) => setMetaTitle(event.target.value)}
                            placeholder="SEO title shown in search results"
                        />
                        <div className="md:col-span-2">
                            <label className="mb-2 block text-sm font-semibold text-[var(--text-secondary)]">
                                SEO Meta Description (optional)
                            </label>
                            <textarea
                                value={metaDescription}
                                onChange={(event) => setMetaDescription(event.target.value)}
                                placeholder="SEO description shown in search results"
                                rows={4}
                                className="w-full rounded-lg border-2 border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-4 py-2.5 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all duration-200 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                            />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-subtle)]">
                            <svg className="h-5 w-5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-[var(--foreground)]">Product Details</h2>
                            <p className="text-sm text-[var(--muted-foreground)]">Product content is read-only for SEO editing.</p>
                        </div>
                    </div>
                    <div className="grid gap-5 md:grid-cols-2">
                        <ReadOnlyValue label="Product Name" value={name} />
                        <ReadOnlyValue label="Subtitle" value={subtitle || 'Not set'} />
                        <ReadOnlyValue
                            label="Brand"
                            value={brands.find((brand) => brand.id === brandId)?.name || 'No brand'}
                        />
                        <ReadOnlyValue label="Price" value={basePrice ? `AED ${basePrice}` : 'Not set'} />
                        <ReadOnlyValue label="Offer Percentage" value={offerPercentage ? `${offerPercentage}%` : '0%'} />
                        <div className="md:col-span-2">
                            <ReadOnlyTextarea label="Description" value={description ? stripHtml(description) : 'No description'} />
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-subtle)]">
                            <svg className="h-5 w-5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-[var(--foreground)]">Product Images</h2>
                            <p className="text-sm text-[var(--muted-foreground)]">{images.length} image{images.length !== 1 ? 's' : ''} uploaded</p>
                        </div>
                    </div>
                    {images.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                            {images.map((image) => (
                                <div key={image.id} className="relative aspect-square overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
                                    <ProductCardImage src={image.preview || image.url} alt={name || 'Product image'} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-[var(--text-muted)]">No images uploaded.</p>
                    )}
                </Card>

                <Card>
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-subtle)]">
                            <svg className="h-5 w-5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-[var(--foreground)]">Catalog Settings</h2>
                            <p className="text-sm text-[var(--muted-foreground)]">Classification, variants, stock, and installation settings are locked here.</p>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <ReadOnlyPillList label="Assigned Categories" items={subCategoryIds} emptyLabel="No categories assigned." />
                        <ReadOnlyPillList
                            label="Variants"
                            items={variants.map((variant) => `${variant.variantTypeName}: ${variant.selectedItems.map((item) => item.name).join(', ')}`)}
                            emptyLabel="No variants configured."
                        />
                        <ReadOnlyPillList
                            label="Variant Stock"
                            items={variantStock.map((stock) => `${stock.variantCombinationKey}: ${stock.stockCount} in stock${stock.price ? `, AED ${stock.price}` : ''}`)}
                            emptyLabel="No variant stock configured."
                        />
                        <ReadOnlyValue label="Installation Service" value={installationEnabled ? 'Enabled' : 'Disabled'} />
                    </div>
                </Card>

                <Card>
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-subtle)]">
                            <svg className="h-5 w-5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M7 8h10" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-[var(--foreground)]">Specifications</h2>
                            <p className="text-sm text-[var(--muted-foreground)]">Specification content is read-only for SEO editing.</p>
                        </div>
                    </div>
                    {specifications.length > 0 ? (
                        <div className="space-y-4">
                            {specifications.map((specification, index) => (
                                <div key={`${specification.title}-${index}`} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/30 p-4">
                                    <p className="font-semibold text-[var(--foreground)]">{specification.title}</p>
                                    {specification.items.length > 0 && (
                                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
                                            {specification.items.map((item, itemIndex) => (
                                                <li key={`${item}-${itemIndex}`}>{item}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-[var(--text-muted)]">No specifications added.</p>
                    )}
                </Card>

                <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--bg-base)]/80 p-4 backdrop-blur-md">
                    <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 sm:flex-row">
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => router.push('/manage/seo/products')}
                            disabled={loading}
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel
                        </Button>

                        <Button size="lg" onClick={handleSeoSubmit} disabled={loading}>
                            {loading ? (
                                <>
                                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Update Product SEO
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }


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
                    slug={slug}
                    subtitle={subtitle}
                    description={description}
                    basePrice={basePrice}
                    offerPercentage={offerPercentage}
                    metaTitle={metaTitle}
                    metaDescription={metaDescription}
                    specifications={specifications}
                    onNameChange={setName}
                    onSlugChange={(value) => {
                        setSlug(value);
                        setSlugTouched(true);
                    }}
                    onSubtitleChange={setSubtitle}
                    onDescriptionChange={setDescription}
                    onMetaTitleChange={setMetaTitle}
                    onMetaDescriptionChange={setMetaDescription}
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
                                <Button variant="danger" size="lg" onClick={() => setIsDeleteDialogOpen(true)} disabled={loading}>
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

            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={async () => {
                    setIsDeleteDialogOpen(false);
                    await handleDelete();
                }}
                title="Delete product?"
                message="This will permanently remove the product and its uploaded images."
                confirmText="Delete Product"
                cancelText="Keep Product"
                variant="danger"
                isLoading={loading}
            />

            <ConfirmDialog
                isOpen={isSlugDecisionOpen}
                onClose={() => {
                    setIsSlugDecisionOpen(false);
                }}
                onCancel={async () => {
                    setIsSlugDecisionOpen(false);
                    await submitFullProduct('keep');
                }}
                onConfirm={async () => {
                    setIsSlugDecisionOpen(false);
                    await submitFullProduct('regenerate');
                }}
                title="Update product slug?"
                message={`The product name changed. Keep the current slug, or update it to "${buildSuggestedProductSlug(name)}"?`}
                confirmText="Update Slug"
                cancelText="Keep Old Slug"
                variant="primary"
                isLoading={loading}
            />
        </div>
    );
}
