// lib/product/model/product.model.ts
import { ObjectId } from 'mongodb';
import { ProductImage, ProductVariant, InstallationService, VariantStock } from '../product.schema';

export interface ProductDocument {
    _id: ObjectId;
    name: string;
    description?: string;
    basePrice: number;
    offerPrice?: number;
    images: ProductImage[];
    variants: ProductVariant[];
    subCategoryIds: string[];
    installationService?: InstallationService;
    variantStock: VariantStock[];
    highlights?: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface Product {
    id: string;
    name: string;
    description?: string;
    basePrice: number;
    offerPrice?: number;
    images: ProductImage[];
    variants: ProductVariant[];
    subCategoryIds: string[];
    installationService?: InstallationService;
    variantStock: VariantStock[];
    highlights: string[];
    createdAt: string;
    updatedAt: string;
}

export function toProduct(doc: ProductDocument): Product {
    return {
        id: doc._id.toString(),
        name: doc.name,
        description: doc.description,
        basePrice: doc.basePrice,
        offerPrice: doc.offerPrice,
        images: doc.images,
        variants: doc.variants,
        subCategoryIds: doc.subCategoryIds || [],
        installationService: doc.installationService,
        variantStock: doc.variantStock || [],
        highlights: doc.highlights ?? [],
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
    };
}

export function toProducts(docs: ProductDocument[]): Product[] {
    return docs.map(toProduct);
}

/**
 * Filter images based on selected variant items
 * Returns images that match the selected variants or have no mapping (show for all)
 */
export function filterImagesByVariants(
    images: ProductImage[],
    selectedVariantItemIds: string[]
): ProductImage[] {
    return images
        .filter(image => {
            // If no mapping, show for all variants
            if (!image.mappedVariants || image.mappedVariants.length === 0) {
                return true;
            }

            // Check if any selected variant item matches the image mapping
            return image.mappedVariants.some(mappedId => {
                // Check for exact match (single variant item)
                if (selectedVariantItemIds.includes(mappedId)) {
                    return true;
                }

                // Check for combination match (e.g., "red+128gb")
                const mappedItems = mappedId.split('+');
                return mappedItems.every(item => selectedVariantItemIds.includes(item));
            });
        })
        .sort((a, b) => a.order - b.order);
}

// Per-combination pricing is now handled via product.variantStock.priceDelta
// and the getVariantCombinationKey helper in lib/product/product.utils.ts.
