'use server';

import { revalidatePath } from 'next/cache';
import { catchError } from '@/lib/errors/app-error';
import {
    AddSubCategorySchema,
    CreateCategorySchema,
    UpdateCategorySchema,
} from '@/lib/validations/category.schema';
import * as categoryService from '@/lib/services/category.service';

export type ActionResponse<T> =
    | { success: true; data: T }
    | { success: false; error: ReturnType<typeof catchError>['body'] };

function revalidateCategoryPaths(categoryId?: string) {
    revalidatePath('/categories');
    revalidatePath('/products/new');
    revalidatePath('/products/[id]/edit', 'page');

    if (categoryId) {
        revalidatePath(`/categories/${categoryId}/edit`);
    }
}

export async function createCategoryAction(formData: FormData): Promise<ActionResponse<any>> {
    try {
        const parsed = CreateCategorySchema.parse({
            name: formData.get('name'),
            subCategories: formData.get('subCategories')
                ? JSON.parse(formData.get('subCategories') as string)
                : [],
        });

        const category = await categoryService.createCategory(parsed);
        revalidateCategoryPaths(category.id);

        return { success: true, data: category };
    } catch (err) {
        const { body } = catchError(err);
        return { success: false, error: body };
    }
}

export async function updateCategoryAction(
    categoryId: string,
    formData: FormData,
): Promise<ActionResponse<any>> {
    try {
        const parsed = UpdateCategorySchema.parse({
            name: formData.get('name') || undefined,
            subCategories: formData.get('subCategories')
                ? JSON.parse(formData.get('subCategories') as string)
                : undefined,
        });

        const category = await categoryService.updateCategory(categoryId, parsed);
        revalidateCategoryPaths(categoryId);

        return { success: true, data: category };
    } catch (err) {
        const { body } = catchError(err);
        return { success: false, error: body };
    }
}

export async function deleteCategoryAction(
    categoryId: string,
): Promise<ActionResponse<{ success: true }>> {
    try {
        await categoryService.deleteCategory(categoryId);
        revalidateCategoryPaths(categoryId);

        return { success: true, data: { success: true } };
    } catch (err) {
        const { body } = catchError(err);
        return { success: false, error: body };
    }
}

export async function addSubCategoryAction(
    categoryId: string,
    formData: FormData,
): Promise<ActionResponse<any>> {
    try {
        const parsed = AddSubCategorySchema.parse({
            name: formData.get('name'),
        });

        const category = await categoryService.addSubCategory(categoryId, parsed);
        revalidateCategoryPaths(categoryId);

        return { success: true, data: category };
    } catch (err) {
        const { body } = catchError(err);
        return { success: false, error: body };
    }
}

export async function removeSubCategoryAction(
    categoryId: string,
    subCategoryId: string,
): Promise<ActionResponse<any>> {
    try {
        const category = await categoryService.removeSubCategory(categoryId, subCategoryId);
        revalidateCategoryPaths(categoryId);

        return { success: true, data: category };
    } catch (err) {
        const { body } = catchError(err);
        return { success: false, error: body };
    }
}
