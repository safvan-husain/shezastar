// lib/product/product.schema.ts
import { z } from 'zod';

export const ProductImageSchema = z.object({
    id: z.string(),
    url: z.string().min(1), // Changed from .url() to .min(1) to accept relative paths
    mappedVariants: z.array(z.string()).default([]), // Array of variant item IDs or combination keys
    order: z.number().default(0),
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
    // Optional price delta for this exact combination (peer to stockCount).
    // Effective unit price = (offerPrice ?? basePrice) + (priceDelta ?? 0).
    priceDelta: z.number().optional(),
});

export const InstallationServiceSchema = z.object({
    enabled: z.boolean().default(false),
    inStorePrice: z.number().min(0).optional(),
    atHomePrice: z.number().min(0).optional(),
});

export const CreateProductSchema = z.object({
    name: z.string().min(1, 'Product name is required'),
    description: z.string().optional(),
    basePrice: z.number().min(0, 'Base price must be positive'),
    offerPrice: z.number().min(0).optional(),
    highlights: z.array(z.string().min(1).trim()).default([]),
    images: z.array(ProductImageSchema).default([]),
    variants: z.array(ProductVariantSchema).default([]),
    subCategoryIds: z.array(z.string()).default([]),
    installationService: InstallationServiceSchema.optional(),
    variantStock: z.array(VariantStockSchema).default([]),
});

export const UpdateProductSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    basePrice: z.number().min(0).optional(),
    offerPrice: z.number().min(0).optional(),
    highlights: z.array(z.string().min(1).trim()).optional(),
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

export type ProductImage = z.infer<typeof ProductImageSchema>;
export type ProductVariant = z.infer<typeof ProductVariantSchema>;
export type VariantStock = z.infer<typeof VariantStockSchema>;
export type InstallationService = z.infer<typeof InstallationServiceSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type ImageMappingInput = z.infer<typeof ImageMappingSchema>;
