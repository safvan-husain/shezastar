// lib/product/product.schema.ts
import { z } from 'zod';

export const ProductImageSchema = z.object({
    id: z.string(),
    url: z.string().min(1), // Changed from .url() to .min(1) to accept relative paths
    mappedVariants: z.array(z.string()).default([]), // Array of variant item IDs or combination keys
    order: z.number().default(0),
});

export const ProductSpecificationSchema = z.object({
    title: z.string().min(1, 'Specification title is required'),
    items: z.array(z.string().min(1).trim()).default([]),
});

export const ProductVariantSchema = z.object({
    variantTypeId: z.string(),
    variantTypeName: z.string(),
    selectedItems: z.array(z.object({
        id: z.string(),
        name: z.string(),
    })),
});

export const VariantStockSchema = z.object({
    variantCombinationKey: z.string(), // e.g., "color-red+size-large" or "default" for no variants
    stockCount: z.number().int().min(0, 'Stock count must be non-negative'),
    // @deprecated - Use 'price' instead (Price Delta logic removed)
    priceDelta: z.number().optional(),
    // Full price for this variant combination. PREFERRED over priceDelta.
    price: z.number().optional(),
});

export const ProductInstallationLocationSchema = z.object({
    locationId: z.string(),
    name: z.string(),
    priceDelta: z.number().min(0),
    enabled: z.boolean().default(true),
});

export const InstallationServiceSchema = z.object({
    enabled: z.boolean().default(false),
    inStorePrice: z.number().min(0).optional(),
    atHomePrice: z.number().min(0).optional(),
    availableLocations: z.array(ProductInstallationLocationSchema).default([]),
});

export const CreateProductSchema = z.object({
    name: z.string().min(1, 'Product name is required'),
    subtitle: z.string().optional(),
    description: z.string().nullable().optional(),
    basePrice: z.number().min(0, 'Base price must be positive'),
    offerPrice: z.number().min(0).optional(),
    specifications: z.array(ProductSpecificationSchema).default([]),
    images: z.array(ProductImageSchema).default([]),
    variants: z.array(ProductVariantSchema).default([]),
    subCategoryIds: z.array(z.string()).default([]),
    installationService: InstallationServiceSchema.optional(),
    variantStock: z.array(VariantStockSchema).default([]),
});

export const UpdateProductSchema = z.object({
    name: z.string().min(1).optional(),
    subtitle: z.string().optional(),
    description: z.string().nullable().optional(),
    basePrice: z.number().min(0).optional(),
    offerPrice: z.number().min(0).optional(),
    specifications: z.array(ProductSpecificationSchema).optional(),
    images: z.array(ProductImageSchema).optional(),
    variants: z.array(ProductVariantSchema).optional(),
    subCategoryIds: z.array(z.string()).optional(),
    installationService: InstallationServiceSchema.optional(),
    variantStock: z.array(VariantStockSchema).optional(),
});

export const ImageMappingSchema = z.object({
    imageId: z.string(),
    variantItemIds: z.array(z.string()), // Can be single items or combination
});

export type ProductSpecification = z.infer<typeof ProductSpecificationSchema>;
export type ProductImage = z.infer<typeof ProductImageSchema>;
export type ProductVariant = z.infer<typeof ProductVariantSchema>;
export type VariantStock = z.infer<typeof VariantStockSchema>;
export type InstallationService = z.infer<typeof InstallationServiceSchema>;
export type ProductInstallationLocation = z.infer<typeof ProductInstallationLocationSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type ImageMappingInput = z.infer<typeof ImageMappingSchema>;
