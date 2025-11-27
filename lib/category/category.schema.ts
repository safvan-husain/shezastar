// lib/category/category.schema.ts
import { z } from 'zod';

export const SubCategorySchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Subcategory name is required'),
});

export const CreateCategorySchema = z.object({
    name: z.string().min(1, 'Category name is required'),
    subCategories: z.array(SubCategorySchema).default([]),
});

export const UpdateCategorySchema = z.object({
    name: z.string().min(1).optional(),
    subCategories: z.array(SubCategorySchema).optional(),
});

export const AddSubCategorySchema = z.object({
    name: z.string().min(1, 'Subcategory name is required'),
});

export type SubCategory = z.infer<typeof SubCategorySchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
export type AddSubCategoryInput = z.infer<typeof AddSubCategorySchema>;
