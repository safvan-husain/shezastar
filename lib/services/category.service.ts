import { nanoid } from 'nanoid';
import { prisma } from '@/lib/db/prisma';
import { AppError } from '@/lib/errors/app-error';
import {
    AddSubCategoryInput,
    CreateCategoryInput,
    SubCategoryDTO,
    SubCategoryInput,
    UpdateCategoryInput,
} from '@/lib/validations/category.schema';

function ensureValidId(id: string) {
    if (!/^[a-fA-F0-9]{24}$/.test(id)) {
        throw new AppError(400, 'INVALID_ID');
    }
}

function normalizeSubCategories(subCategories: SubCategoryInput[] = []): SubCategoryDTO[] {
    return subCategories.map(sub => ({
        id: sub.id && sub.id.trim().length > 0 ? sub.id : nanoid(),
        name: sub.name,
    }));
}

export async function createCategory(input: CreateCategoryInput) {
    const existing = await prisma.category.findFirst({ where: { name: input.name } });
    if (existing) {
        throw new AppError(400, 'CATEGORY_EXISTS', {
            message: 'Category with this name already exists',
        });
    }

    const created = await prisma.category.create({
        data: {
            name: input.name,
            subCategories: normalizeSubCategories(input.subCategories),
        },
    });

    return created;
}

export async function getCategory(id: string) {
    ensureValidId(id);
    const category = await prisma.category.findUnique({ where: { id } });

    if (!category) {
        throw new AppError(404, 'CATEGORY_NOT_FOUND');
    }

    return category;
}

export async function getAllCategories() {
    return prisma.category.findMany({ orderBy: { name: 'asc' } });
}

export async function updateCategory(id: string, input: UpdateCategoryInput) {
    ensureValidId(id);
    const existing = await prisma.category.findUnique({ where: { id } });

    if (!existing) {
        throw new AppError(404, 'CATEGORY_NOT_FOUND');
    }

    if (input.name && input.name !== existing.name) {
        const nameExists = await prisma.category.findFirst({
            where: { name: input.name, NOT: { id } },
        });

        if (nameExists) {
            throw new AppError(400, 'CATEGORY_EXISTS', {
                message: 'Category with this name already exists',
            });
        }
    }

    const subCategories = input.subCategories ? normalizeSubCategories(input.subCategories) : undefined;

    const updated = await prisma.category.update({
        where: { id },
        data: {
            name: input.name ?? existing.name,
            subCategories: subCategories ?? existing.subCategories,
        },
    });

    return updated;
}

export async function deleteCategory(id: string) {
    ensureValidId(id);
    const existing = await prisma.category.findUnique({ where: { id } });

    if (!existing) {
        throw new AppError(404, 'CATEGORY_NOT_FOUND');
    }

    await prisma.category.delete({ where: { id } });
    return { success: true } as const;
}

export async function addSubCategory(id: string, input: AddSubCategoryInput) {
    ensureValidId(id);
    const existing = await prisma.category.findUnique({ where: { id } });

    if (!existing) {
        throw new AppError(404, 'CATEGORY_NOT_FOUND');
    }

    const subCategories = existing.subCategories ?? [];
    const nameExists = subCategories.some(sub => sub.name === input.name);
    if (nameExists) {
        throw new AppError(400, 'SUBCATEGORY_EXISTS', {
            message: 'Subcategory with this name already exists in this category',
        });
    }

    const newSubCategory: SubCategoryDTO = {
        id: nanoid(),
        name: input.name,
    };

    const updated = await prisma.category.update({
        where: { id },
        data: {
            subCategories: [...subCategories, newSubCategory],
        },
    });

    return updated;
}

export async function removeSubCategory(id: string, subCategoryId: string) {
    ensureValidId(id);
    const existing = await prisma.category.findUnique({ where: { id } });

    if (!existing) {
        throw new AppError(404, 'CATEGORY_NOT_FOUND');
    }

    const subCategories = existing.subCategories ?? [];
    const subCategoryExists = subCategories.some(sub => sub.id === subCategoryId);

    if (!subCategoryExists) {
        throw new AppError(404, 'SUBCATEGORY_NOT_FOUND');
    }

    const updated = await prisma.category.update({
        where: { id },
        data: {
            subCategories: subCategories.filter(sub => sub.id !== subCategoryId),
        },
    });

    return updated;
}
