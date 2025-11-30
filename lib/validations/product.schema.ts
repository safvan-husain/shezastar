import { z } from 'zod';

const ProductImageSchema = z.object({
    id: z.string().min(1),
    url: z.string().min(1),
    mappedVariants: z.array(z.string()).default([]),
    order: z.number().int().nonnegative().default(0),
});

const ProductVariantSelectedItemSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
});

const ProductVariantSchema = z.object({
    variantTypeId: z.string().min(1),
    variantTypeName: z.string().min(1),
    selectedItems: z.array(ProductVariantSelectedItemSchema),
    priceModifier: z.number().optional(),
});

const InstallationServiceSchema = z.object({
    enabled: z.boolean().default(false),
    inStorePrice: z.number().min(0).optional(),
    atHomePrice: z.number().min(0).optional(),
});

export const CreateProductSchema = z.object({
    name: z.string().min(1, 'Product name is required'),
    description: z.string().optional(),
    basePrice: z.number().min(0, 'Base price must be positive'),
    offerPrice: z.number().min(0).optional(),
    images: z.array(ProductImageSchema).default([]),
    variants: z.array(ProductVariantSchema).default([]),
    subCategoryIds: z.array(z.string()).default([]),
    installationService: InstallationServiceSchema.optional(),
});

export const UpdateProductSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    basePrice: z.number().min(0).optional(),
    offerPrice: z.number().min(0).optional(),
    images: z.array(ProductImageSchema).optional(),
    variants: z.array(ProductVariantSchema).optional(),
    subCategoryIds: z.array(z.string()).optional(),
    installationService: InstallationServiceSchema.optional(),
});

export const ImageMappingSchema = z.object({
    imageId: z.string().min(1),
    variantItemIds: z.array(z.string().min(1)),
});

export type ProductImageInput = z.infer<typeof ProductImageSchema>;
export type ProductVariantInput = z.infer<typeof ProductVariantSchema>;
export type InstallationServiceInput = z.infer<typeof InstallationServiceSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type ImageMappingInput = z.infer<typeof ImageMappingSchema>;
