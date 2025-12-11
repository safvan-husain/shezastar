// lib/product/model/product.model.ts
import { ObjectId } from 'mongodb';
import { ProductImage, ProductVariant, InstallationService } from '../product.schema';

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
    stockCount?: number;
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
    stockCount?: number;
    highlights: string[];
    createdAt: string;
    updatedAt: string;
}

export function toProduct(doc: ProductDocument): Product {
    const product: Product = {
        id: doc._id.toString(),
        name: doc.name,
        description: doc.description,
        basePrice: doc.basePrice,
        offerPrice: doc.offerPrice,
        images: doc.images,
        variants: doc.variants,
        subCategoryIds: doc.subCategoryIds || [],
        installationService: doc.installationService,
        highlights: doc.highlights ?? [],
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
    };

    // Only include stockCount if it's defined
    if (doc.stockCount !== undefined && doc.stockCount !== null) {
        product.stockCount = doc.stockCount;
    }

    return product;
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

/**
 * Calculate effective price based on selected variants
 */
export function calculatePrice(
    basePrice: number,
    offerPrice: number | undefined,
    variants: ProductVariant[],
    selectedVariantItemIds: string[]
): number {
    let price = offerPrice ?? basePrice;

    // Apply variant price modifiers
    for (const variant of variants) {
        if (variant.priceModifier && variant.selectedItems.some(item => selectedVariantItemIds.includes(item.id))) {
            price += variant.priceModifier;
        }
    }

    return price;
}
