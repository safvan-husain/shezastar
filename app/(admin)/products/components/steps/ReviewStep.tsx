"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

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
    imageMappings: Record<string, string[]>;
    selectedSubCategoryIds: string[];
    installationEnabled: boolean;
    inStorePrice: string;
    atHomePrice: string;
}

export function ReviewStep({
    name,
    description,
    basePrice,
    offerPrice,
    images,
    variants,
    imageMappings,
    selectedSubCategoryIds,
    installationEnabled,
    inStorePrice,
    atHomePrice,
}: ReviewStepProps) {
    const { showToast } = useToast();

    const [selectedVariantItems, setSelectedVariantItems] = useState<Record<string, string | null>>({});

    const [activeImageId, setActiveImageId] = useState<string | null>(() => images[0]?.id ?? null);

    const selectedItemIds = useMemo(
        () => new Set(Object.values(selectedVariantItems).filter((id): id is string => Boolean(id))),
        [selectedVariantItems]
    );

    // Resolve human-readable category paths for selected sub-category IDs
    const [categoryLabels, setCategoryLabels] = useState<string[]>([]);

    useEffect(() => {
        let cancelled = false;

        async function loadCategories() {
            if (!selectedSubCategoryIds || selectedSubCategoryIds.length === 0) {
                setCategoryLabels([]);
                return;
            }

            try {
                const res = await fetch("/api/categories");
                if (!res.ok) {
                    let data: any = {};
                    try {
                        data = await res.json();
                    } catch {
                        // ignore JSON parse errors
                    }
                    const message = data.message || data.error || "Failed to load categories";
                    showToast(message, "error", {
                        status: res.status,
                        body: data,
                        url: res.url,
                        method: "GET",
                    });
                    return;
                }

                const data: {
                    id: string;
                    name: string;
                    subCategories: {
                        id: string;
                        name: string;
                        subSubCategories: { id: string; name: string }[];
                    }[];
                }[] = await res.json();

                const map = new Map<string, string[]>();

                data.forEach(category => {
                    category.subCategories.forEach(sub => {
                        if (sub.subSubCategories && sub.subSubCategories.length > 0) {
                            sub.subSubCategories.forEach(subSub => {
                                map.set(subSub.id, [category.name, sub.name, subSub.name]);
                            });
                        } else {
                            map.set(sub.id, [category.name, sub.name]);
                        }
                    });
                });

                const labels = selectedSubCategoryIds
                    .map(id => map.get(id))
                    .filter((path): path is string[] => Boolean(path))
                    .map(path => path.join(" / "));

                if (!cancelled) {
                    setCategoryLabels(labels);
                }
            } catch (err: any) {
                if (!cancelled) {
                    const message = err?.message || "Failed to load categories";
                    showToast(message, "error", {
                        url: '/api/categories',
                        method: 'GET',
                        body: { error: message },
                    });
                }
            }
        }

        loadCategories();

        return () => {
            cancelled = true;
        };
    }, [selectedSubCategoryIds, showToast]);

    const displayedImages = useMemo(() => {
        if (images.length === 0) return [] as ImageFile[];

        // No variant selection: show all images
        if (selectedItemIds.size === 0) {
            return images;
        }

        const selectedVariantItemIds = Array.from(selectedItemIds);

        return images.filter(image => {
            const mapped = imageMappings[image.id] || [];

            // Images with no mappings show for all variants
            if (!mapped || mapped.length === 0) {
                return true;
            }

            // Mirror backend filterImagesByVariants semantics:
            // image.mappedVariants is a list of "rules" (single item or combo)
            // The image should be shown if ANY rule is satisfied.
            return mapped.some(mappedId => {
                // Exact single-item match
                if (selectedVariantItemIds.includes(mappedId)) {
                    return true;
                }

                // Combination mapping, e.g. "red+128gb"
                const mappedItems = mappedId.split("+");
                return mappedItems.every(item => selectedVariantItemIds.includes(item));
            });
        });
    }, [images, imageMappings, selectedItemIds]);

    const activeImage =
        displayedImages.find(img => img.id === activeImageId) ??
        displayedImages[0] ??
        images[0] ??
        null;

    const handleVariantSelect = (variantTypeId: string, itemId: string) => {
        setSelectedVariantItems(prev => {
            const current = prev[variantTypeId];
            const next: Record<string, string | null> = { ...prev };

            // Toggle selection for preview: clicking again clears it
            next[variantTypeId] = current === itemId ? null : itemId;
            return next;
        });
    };

    const parsedBasePrice = parseFloat(basePrice) || 0;
    const parsedOfferPrice = offerPrice ? parseFloat(offerPrice) || 0 : null;

    const variantPriceModifier = variants.reduce((total, variant) => {
        const hasSelection = Boolean(selectedVariantItems[variant.variantTypeId]);
        if (!hasSelection || !variant.priceModifier) return total;
        return total + variant.priceModifier;
    }, 0);

    const effectiveBase = parsedBasePrice + variantPriceModifier;
    const effectiveOffer = parsedOfferPrice !== null ? parsedOfferPrice + variantPriceModifier : null;

    const inStorePriceNum =
        installationEnabled && inStorePrice !== "" ? Number(inStorePrice) : null;
    const atHomePriceNum =
        installationEnabled && atHomePrice !== "" ? Number(atHomePrice) : null;

    const hasInStoreInstallation =
        inStorePriceNum !== null && Number.isFinite(inStorePriceNum) && inStorePriceNum > 0;
    const hasAtHomeInstallation =
        atHomePriceNum !== null && Number.isFinite(atHomePriceNum) && atHomePriceNum > 0;

    const baseForInstallation = effectiveOffer ?? effectiveBase;

    const hasVariantsWithItems = variants.some(v => v.selectedItems.length > 0);

    return (
        <Card>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--ring)] flex items-center justify-center">
                    <svg className="w-5 h-5 text-[var(--text-inverted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-[var(--foreground)]">Preview Product Page</h2>
                    <p className="text-sm text-[var(--muted-foreground)]">
                        See how customers will experience this product
                    </p>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                {/* Gallery */}
                <div className="space-y-4">
                    <div className="aspect-[4/3] w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] overflow-hidden flex items-center justify-center">
                        {activeImage ? (
                            <img
                                src={activeImage.preview}
                                alt={name || 'Product preview'}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="text-sm text-[var(--text-muted)]">
                                Product images will appear here
                            </div>
                        )}
                    </div>

                    {displayedImages.length > 1 && (
                        <div className="flex gap-3 overflow-x-auto pb-1">
                            {displayedImages.map(image => {
                                const isActive = activeImage?.id === image.id;
                                return (
                                    <button
                                        key={image.id}
                                        type="button"
                                        onClick={() => setActiveImageId(image.id)}
                                        className={`relative rounded-lg border overflow-hidden flex-shrink-0 w-20 h-20 transition-all ${isActive
                                            ? 'border-[var(--primary)] ring-2 ring-[var(--ring)]'
                                            : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                                            }`}
                                        aria-label="Select image"
                                    >
                                        <img
                                            src={image.preview}
                                            alt="Product thumbnail"
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Details */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-2xl font-bold text-[var(--foreground)] mb-1">{name}</h3>
                        {description && (
                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                {description}
                            </p>
                        )}
                        {categoryLabels.length > 0 && (
                            <div className="mt-3 space-y-1">
                                <p className="text-xs font-semibold text-[var(--text-secondary)]">
                                    Categories
                                </p>
                                <ul className="space-y-0.5 text-xs text-[var(--text-muted)]">
                                    {categoryLabels.map(label => (
                                        <li key={label}>{label}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-baseline gap-3">
                            {effectiveOffer !== null ? (
                                <>
                                    <span className="text-3xl font-bold text-[var(--success)]">
                                        ${effectiveOffer.toFixed(2)}
                                    </span>
                                    <span className="text-lg text-[var(--muted-foreground)] line-through">
                                        ${effectiveBase.toFixed(2)}
                                    </span>
                                    {effectiveBase > 0 && (
                                        <span className="px-2 py-1 bg-[var(--danger)] text-[var(--text-inverted)] text-xs font-bold rounded">
                                            {Math.round(((effectiveBase - effectiveOffer) / effectiveBase) * 100)}% OFF
                                        </span>
                                    )}
                                </>
                            ) : (
                                <span className="text-3xl font-bold text-[var(--foreground)]">
                                    ${effectiveBase.toFixed(2)}
                                </span>
                            )}
                        </div>
                        {variantPriceModifier !== 0 && (
                            <p className="text-xs text-[var(--text-muted)]">
                                Includes variant adjustment of {variantPriceModifier > 0 ? '+' : ''}
                                ${variantPriceModifier.toFixed(2)} from base price
                            </p>
                        )}
                    </div>

                    {hasVariantsWithItems && (
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-semibold text-[var(--text-secondary)] mb-1">
                                    Variant options
                                </p>
                                <p className="text-xs text-[var(--text-muted)]">
                                    Click options to see how images respond to your mappings
                                </p>
                            </div>

                            {variants.map(variant => {
                                if (variant.selectedItems.length === 0) return null;

                                const activeItemId = selectedVariantItems[variant.variantTypeId];

                                return (
                                    <div key={variant.variantTypeId} className="space-y-2">
                                        <p className="text-sm font-medium text-[var(--text-secondary)]">
                                            {variant.variantTypeName}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {variant.selectedItems.map(item => {
                                                const isActive = activeItemId === item.id;
                                                return (
                                                    <Button
                                                        key={item.id}
                                                        type="button"
                                                        variant={isActive ? 'primary' : 'outline'}
                                                        size="sm"
                                                        className="min-w-[3rem]"
                                                        onClick={() => handleVariantSelect(variant.variantTypeId, item.id)}
                                                    >
                                                        {item.name}
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="pt-4 border-t border-[var(--border-subtle)] space-y-3">
                        {installationEnabled && (hasInStoreInstallation || hasAtHomeInstallation) && (
                            <div className="space-y-2">
                                <div>
                                    <p className="text-sm font-semibold text-[var(--text-secondary)] mb-1">
                                        Installation options
                                    </p>
                                    <p className="text-xs text-[var(--text-muted)]">
                                        Preview how installation pricing compares to the base product price.
                                    </p>
                                </div>

                                <div className="space-y-1 text-sm">
                                    <div className="flex items-baseline justify-between gap-3">
                                        <span className="text-[var(--text-secondary)]">Product only</span>
                                        <span className="font-semibold text-[var(--foreground)]">
                                            ${baseForInstallation.toFixed(2)}
                                        </span>
                                    </div>

                                    {hasInStoreInstallation && inStorePriceNum !== null && (
                                        <div className="flex items-baseline justify-between gap-3">
                                            <span className="text-[var(--text-secondary)]">
                                                With in-store installation
                                            </span>
                                            <div className="text-right">
                                                <span className="block font-semibold text-[var(--foreground)]">
                                                    ${(baseForInstallation + inStorePriceNum).toFixed(2)}
                                                </span>
                                                <span className="block text-xs text-[var(--text-muted)]">
                                                    +${inStorePriceNum.toFixed(2)} installation
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {hasAtHomeInstallation && atHomePriceNum !== null && (
                                        <div className="flex items-baseline justify-between gap-3">
                                            <span className="text-[var(--text-secondary)]">
                                                With at-home installation
                                            </span>
                                            <div className="text-right">
                                                <span className="block font-semibold text-[var(--foreground)]">
                                                    ${(baseForInstallation + atHomePriceNum).toFixed(2)}
                                                </span>
                                                <span className="block text-xs text-[var(--text-muted)]">
                                                    +${atHomePriceNum.toFixed(2)} installation
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <p className="text-xs text-[var(--text-muted)]">
                            This is a preview only. Customers will see a similar layout with cart and checkout
                            actions on the live storefront.
                        </p>
                    </div>
                </div>
            </div>
        </Card>
    );
}
