// lib/variant-type/variant-type.schema.ts
import { z } from 'zod';

export const VariantItemSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Item name is required'),
    metadata: z.record(z.any()).optional(),
});

export const CreateVariantTypeSchema = z.object({
    name: z.string().min(1, 'Variant type name is required'),
    items: z.array(VariantItemSchema).min(1, 'At least one item is required'),
});

export const UpdateVariantTypeSchema = z.object({
    name: z.string().min(1).optional(),
    items: z.array(VariantItemSchema).optional(),
});

export const AddItemSchema = z.object({
    name: z.string().min(1, 'Item name is required'),
    metadata: z.record(z.any()).optional(),
});

export type VariantItem = z.infer<typeof VariantItemSchema>;
export type CreateVariantTypeInput = z.infer<typeof CreateVariantTypeSchema>;
export type UpdateVariantTypeInput = z.infer<typeof UpdateVariantTypeSchema>;
export type AddItemInput = z.infer<typeof AddItemSchema>;
