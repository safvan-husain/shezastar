// lib/category/category.controller.ts
import { catchError } from '@/lib/errors/app-error';
import {
    CreateCategorySchema,
    UpdateCategorySchema,
    AddSubCategorySchema,
} from './category.schema';
import * as categoryService from './category.service';

export async function handleCreateCategory(input: unknown) {
    try {
        const parsed = CreateCategorySchema.parse(input);
        const result = await categoryService.createCategory(parsed);
        return { status: 201, body: result };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleGetCategory(id: string) {
    try {
        const result = await categoryService.getCategory(id);
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleGetAllCategories() {
    try {
        const result = await categoryService.getAllCategories();
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleUpdateCategory(id: string, input: unknown) {
    try {
        const parsed = UpdateCategorySchema.parse(input);
        const result = await categoryService.updateCategory(id, parsed);
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleDeleteCategory(id: string) {
    try {
        const result = await categoryService.deleteCategory(id);
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleAddSubCategory(id: string, input: unknown) {
    try {
        const parsed = AddSubCategorySchema.parse(input);
        const result = await categoryService.addSubCategory(id, parsed);
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleRemoveSubCategory(id: string, subCategoryId: string) {
    try {
        const result = await categoryService.removeSubCategory(id, subCategoryId);
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}
