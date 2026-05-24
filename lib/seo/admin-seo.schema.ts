import { z } from 'zod';
import type { Product } from '@/lib/product/model/product.model';

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

export type ProductSeoListItem = Product;
