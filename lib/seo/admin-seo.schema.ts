import { z } from 'zod';

export const ProductSeoUpdateSchema = z.object({
    metaTitle: z.string().nullable().optional(),
    metaDescription: z.string().nullable().optional(),
});

export const CategorySeoUpdateSchema = z.object({
    metaTitle: z.string().nullable().optional(),
    metaDescription: z.string().nullable().optional(),
    imagePath: z.string().nullable().optional(),
});

export type ProductSeoUpdateInput = z.infer<typeof ProductSeoUpdateSchema>;
export type CategorySeoUpdateInput = z.infer<typeof CategorySeoUpdateSchema>;

export interface ProductSeoListItem {
    id: string;
    name: string;
    metaTitle?: string | null;
    metaDescription?: string | null;
}
