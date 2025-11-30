// lib/category/category.schema.ts
import { z } from 'zod';

export const SubSubCategorySchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Sub-subcategory name is required'),
});

export const SubCategorySchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Subcategory name is required'),
    subSubCategories: z.array(SubSubCategorySchema).default([]),
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

export const AddSubSubCategorySchema = z.object({
    name: z.string().min(1, 'Sub-subcategory name is required'),
});

export const UpdateSubCategorySchema = z.object({
    name: z.string().min(1).optional(),
    subSubCategories: z.array(SubSubCategorySchema).optional(),
});

export type SubCategory = z.infer<typeof SubCategorySchema>;
export type SubSubCategory = z.infer<typeof SubSubCategorySchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
export type AddSubCategoryInput = z.infer<typeof AddSubCategorySchema>;
export type AddSubSubCategoryInput = z.infer<typeof AddSubSubCategorySchema>;
export type UpdateSubCategoryInput = z.infer<typeof UpdateSubCategorySchema>;
