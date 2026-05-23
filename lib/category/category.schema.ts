// lib/category/category.schema.ts
import { z } from 'zod';

const optionalSeoString = z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => {
        if (value === undefined) {
            return undefined;
        }
        if (value === null) {
            return null;
        }
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    });

export const SubSubCategorySchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Sub-subcategory name is required'),
    metaTitle: optionalSeoString,
    metaDescription: optionalSeoString,
    imagePath: optionalSeoString,
});

export const SubCategorySchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Subcategory name is required'),
    metaTitle: optionalSeoString,
    metaDescription: optionalSeoString,
    imagePath: optionalSeoString,
    subSubCategories: z.array(SubSubCategorySchema).default([]),
});

export const CreateCategorySchema = z.object({
    name: z.string().min(1, 'Category name is required'),
    metaTitle: optionalSeoString,
    metaDescription: optionalSeoString,
    imagePath: optionalSeoString,
    subCategories: z.array(SubCategorySchema).default([]),
});

export const UpdateCategorySchema = z.object({
    name: z.string().min(1).optional(),
    metaTitle: optionalSeoString,
    metaDescription: optionalSeoString,
    imagePath: optionalSeoString,
    subCategories: z.array(SubCategorySchema).optional(),
});

export const AddSubCategorySchema = z.object({
    name: z.string().min(1, 'Subcategory name is required'),
    metaTitle: optionalSeoString,
    metaDescription: optionalSeoString,
    imagePath: optionalSeoString,
});

export const AddSubSubCategorySchema = z.object({
    name: z.string().min(1, 'Sub-subcategory name is required'),
    metaTitle: optionalSeoString,
    metaDescription: optionalSeoString,
    imagePath: optionalSeoString,
});

export const UpdateSubCategorySchema = z.object({
    name: z.string().min(1).optional(),
    metaTitle: optionalSeoString,
    metaDescription: optionalSeoString,
    imagePath: optionalSeoString,
    subSubCategories: z.array(SubSubCategorySchema).optional(),
});

export type SubCategory = z.infer<typeof SubCategorySchema>;
export type SubSubCategory = z.infer<typeof SubSubCategorySchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
export type AddSubCategoryInput = z.infer<typeof AddSubCategorySchema>;
export type AddSubSubCategoryInput = z.infer<typeof AddSubSubCategorySchema>;
export type UpdateSubCategoryInput = z.infer<typeof UpdateSubCategorySchema>;
