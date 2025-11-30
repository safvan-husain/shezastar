// lib/category/category.service.ts
import { getCollection, ObjectId } from '@/lib/db/mongo-client';
import { AppError } from '@/lib/errors/app-error';
import { CategoryDocument, toCategory, toCategories } from './model/category.model';
import {
    CreateCategoryInput,
    UpdateCategoryInput,
    AddSubCategoryInput,
    AddSubSubCategoryInput,
    UpdateSubCategoryInput,
    SubCategory,
} from './category.schema';
import { nanoid } from 'nanoid';

const COLLECTION = 'categories';

function parseObjectId(id: string) {
    try {
        return new ObjectId(id);
    } catch {
        throw new AppError(400, 'INVALID_ID');
    }
}

function normalizeSubCategories(subCategories: SubCategory[] = []) {
    return subCategories.map(sub => ({
        ...sub,
        subSubCategories: sub.subSubCategories ?? [],
    }));
}

export async function createCategory(input: CreateCategoryInput) {
    const collection = await getCollection<CategoryDocument>(COLLECTION);

    // Check if category name already exists
    const existing = await collection.findOne({ name: input.name });
    if (existing) {
        throw new AppError(400, 'CATEGORY_EXISTS', {
            message: 'Category with this name already exists',
        });
    }

    const now = new Date();
    const doc: Omit<CategoryDocument, '_id'> = {
        name: input.name,
        subCategories: normalizeSubCategories(input.subCategories),
        createdAt: now,
        updatedAt: now,
    };

    const result = await collection.insertOne(doc as CategoryDocument);
    const created = await collection.findOne({ _id: result.insertedId });

    if (!created) {
        throw new AppError(500, 'FAILED_TO_CREATE_CATEGORY');
    }

    return toCategory(created);
}

export async function getCategory(id: string) {
    const collection = await getCollection<CategoryDocument>(COLLECTION);

    const objectId = parseObjectId(id);

    const doc = await collection.findOne({ _id: objectId });
    if (!doc) {
        throw new AppError(404, 'CATEGORY_NOT_FOUND');
    }

    return toCategory(doc);
}

export async function getAllCategories() {
    const collection = await getCollection<CategoryDocument>(COLLECTION);
    const docs = await collection.find({}).sort({ name: 1 }).toArray();
    return toCategories(docs);
}

export async function updateCategory(id: string, input: UpdateCategoryInput) {
    const collection = await getCollection<CategoryDocument>(COLLECTION);

    const objectId = parseObjectId(id);

    const existing = await collection.findOne({ _id: objectId });
    if (!existing) {
        throw new AppError(404, 'CATEGORY_NOT_FOUND');
    }

    // Check if new name conflicts with another category
    if (input.name && input.name !== existing.name) {
        const nameExists = await collection.findOne({ name: input.name });
        if (nameExists) {
            throw new AppError(400, 'CATEGORY_EXISTS', {
                message: 'Category with this name already exists',
            });
        }
    }

    const updateDoc: any = {
        updatedAt: new Date(),
    };

    if (input.name) updateDoc.name = input.name;
    if (input.subCategories) updateDoc.subCategories = normalizeSubCategories(input.subCategories);

    await collection.updateOne({ _id: objectId }, { $set: updateDoc });

    const updated = await collection.findOne({ _id: objectId });
    if (!updated) {
        throw new AppError(500, 'FAILED_TO_UPDATE_CATEGORY');
    }

    return toCategory(updated);
}

export async function deleteCategory(id: string) {
    const collection = await getCollection<CategoryDocument>(COLLECTION);

    const objectId = parseObjectId(id);

    const existing = await collection.findOne({ _id: objectId });
    if (!existing) {
        throw new AppError(404, 'CATEGORY_NOT_FOUND');
    }

    await collection.deleteOne({ _id: objectId });

    return { success: true };
}

export async function addSubCategory(id: string, input: AddSubCategoryInput) {
    const collection = await getCollection<CategoryDocument>(COLLECTION);

    const objectId = parseObjectId(id);

    const existing = await collection.findOne({ _id: objectId });
    if (!existing) {
        throw new AppError(404, 'CATEGORY_NOT_FOUND');
    }

    // Check if subcategory name already exists in this category
    const subCategories = normalizeSubCategories(existing.subCategories);
    const nameExists = subCategories.some(sub => sub.name === input.name);
    if (nameExists) {
        throw new AppError(400, 'SUBCATEGORY_EXISTS', {
            message: 'Subcategory with this name already exists in this category',
        });
    }

    const newSubCategory = {
        id: nanoid(),
        name: input.name,
        subSubCategories: [],
    };

    await collection.updateOne(
        { _id: objectId },
        {
            $set: {
                subCategories: [...subCategories, newSubCategory],
                updatedAt: new Date(),
            },
        }
    );

    const updated = await collection.findOne({ _id: objectId });
    if (!updated) {
        throw new AppError(500, 'FAILED_TO_ADD_SUBCATEGORY');
    }

    return toCategory(updated);
}

export async function removeSubCategory(id: string, subCategoryId: string) {
    const collection = await getCollection<CategoryDocument>(COLLECTION);

    const objectId = parseObjectId(id);

    const existing = await collection.findOne({ _id: objectId });
    if (!existing) {
        throw new AppError(404, 'CATEGORY_NOT_FOUND');
    }

    const subCategories = normalizeSubCategories(existing.subCategories);
    const updatedSubCategories = subCategories.filter(sub => sub.id !== subCategoryId);

    if (updatedSubCategories.length === subCategories.length) {
        throw new AppError(404, 'SUBCATEGORY_NOT_FOUND');
    }

    await collection.updateOne(
        { _id: objectId },
        {
            $set: { subCategories: updatedSubCategories, updatedAt: new Date() },
        }
    );

    const updated = await collection.findOne({ _id: objectId });
    if (!updated) {
        throw new AppError(500, 'FAILED_TO_REMOVE_SUBCATEGORY');
    }

    return toCategory(updated);
}

export async function addSubSubCategory(
    categoryId: string,
    subCategoryId: string,
    input: AddSubSubCategoryInput
) {
    const collection = await getCollection<CategoryDocument>(COLLECTION);
    const objectId = parseObjectId(categoryId);

    const existing = await collection.findOne({ _id: objectId });
    if (!existing) {
        throw new AppError(404, 'CATEGORY_NOT_FOUND');
    }

    const subCategories = normalizeSubCategories(existing.subCategories);
    const subCategory = subCategories.find(sub => sub.id === subCategoryId);
    if (!subCategory) {
        throw new AppError(404, 'SUBCATEGORY_NOT_FOUND');
    }

    const duplicateName = subCategory.subSubCategories.some(subSub => subSub.name === input.name);
    if (duplicateName) {
        throw new AppError(400, 'SUBSUBCATEGORY_EXISTS', {
            message: 'Sub-subcategory with this name already exists in this subcategory',
        });
    }

    const newSubSubCategory = {
        id: nanoid(),
        name: input.name,
    };

    subCategory.subSubCategories.push(newSubSubCategory);

    await collection.updateOne(
        { _id: objectId },
        {
            $set: {
                subCategories,
                updatedAt: new Date(),
            },
        }
    );

    const updated = await collection.findOne({ _id: objectId });
    if (!updated) {
        throw new AppError(500, 'FAILED_TO_ADD_SUBSUBCATEGORY');
    }

    return toCategory(updated);
}

export async function removeSubSubCategory(
    categoryId: string,
    subCategoryId: string,
    subSubCategoryId: string
) {
    const collection = await getCollection<CategoryDocument>(COLLECTION);
    const objectId = parseObjectId(categoryId);

    const existing = await collection.findOne({ _id: objectId });
    if (!existing) {
        throw new AppError(404, 'CATEGORY_NOT_FOUND');
    }

    const subCategories = normalizeSubCategories(existing.subCategories);
    const subCategory = subCategories.find(sub => sub.id === subCategoryId);
    if (!subCategory) {
        throw new AppError(404, 'SUBCATEGORY_NOT_FOUND');
    }

    const initialLength = subCategory.subSubCategories.length;
    subCategory.subSubCategories = subCategory.subSubCategories.filter(
        subSub => subSub.id !== subSubCategoryId
    );

    if (initialLength === subCategory.subSubCategories.length) {
        throw new AppError(404, 'SUBSUBCATEGORY_NOT_FOUND');
    }

    await collection.updateOne(
        { _id: objectId },
        {
            $set: {
                subCategories,
                updatedAt: new Date(),
            },
        }
    );

    const updated = await collection.findOne({ _id: objectId });
    if (!updated) {
        throw new AppError(500, 'FAILED_TO_REMOVE_SUBSUBCATEGORY');
    }

    return toCategory(updated);
}

export async function updateSubCategory(
    categoryId: string,
    subCategoryId: string,
    input: UpdateSubCategoryInput
) {
    const collection = await getCollection<CategoryDocument>(COLLECTION);
    const objectId = parseObjectId(categoryId);

    const existing = await collection.findOne({ _id: objectId });
    if (!existing) {
        throw new AppError(404, 'CATEGORY_NOT_FOUND');
    }

    const subCategories = normalizeSubCategories(existing.subCategories);
    const subCategoryIndex = subCategories.findIndex(sub => sub.id === subCategoryId);
    if (subCategoryIndex === -1) {
        throw new AppError(404, 'SUBCATEGORY_NOT_FOUND');
    }

    const duplicateName =
        input.name &&
        subCategories.some(sub => sub.name === input.name && sub.id !== subCategoryId);
    if (duplicateName) {
        throw new AppError(400, 'SUBCATEGORY_EXISTS', {
            message: 'Subcategory with this name already exists in this category',
        });
    }

    if (input.subSubCategories) {
        const names = input.subSubCategories.map(sub => sub.name);
        const hasDuplicateNames = new Set(names).size !== names.length;
        if (hasDuplicateNames) {
            throw new AppError(400, 'SUBSUBCATEGORY_EXISTS', {
                message: 'Sub-subcategory names must be unique within a subcategory',
            });
        }
    }

    const updatedSubCategory: SubCategory = {
        ...subCategories[subCategoryIndex],
        ...(input.name ? { name: input.name } : {}),
        ...(input.subSubCategories ? { subSubCategories: input.subSubCategories } : {}),
    };

    subCategories[subCategoryIndex] = updatedSubCategory;

    await collection.updateOne(
        { _id: objectId },
        {
            $set: {
                subCategories,
                updatedAt: new Date(),
            },
        }
    );

    const updated = await collection.findOne({ _id: objectId });
    if (!updated) {
        throw new AppError(500, 'FAILED_TO_UPDATE_SUBCATEGORY');
    }

    return toCategory(updated);
}
