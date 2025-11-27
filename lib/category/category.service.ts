// lib/category/category.service.ts
import { getCollection, ObjectId } from '@/lib/db/mongo-client';
import { AppError } from '@/lib/errors/app-error';
import { CategoryDocument, toCategory, toCategories } from './model/category.model';
import { CreateCategoryInput, UpdateCategoryInput, AddSubCategoryInput } from './category.schema';
import { nanoid } from 'nanoid';

const COLLECTION = 'categories';

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
        subCategories: input.subCategories,
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

    let objectId: ObjectId;
    try {
        objectId = new ObjectId(id);
    } catch {
        throw new AppError(400, 'INVALID_ID');
    }

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

    let objectId: ObjectId;
    try {
        objectId = new ObjectId(id);
    } catch {
        throw new AppError(400, 'INVALID_ID');
    }

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
    if (input.subCategories) updateDoc.subCategories = input.subCategories;

    await collection.updateOne({ _id: objectId }, { $set: updateDoc });

    const updated = await collection.findOne({ _id: objectId });
    if (!updated) {
        throw new AppError(500, 'FAILED_TO_UPDATE_CATEGORY');
    }

    return toCategory(updated);
}

export async function deleteCategory(id: string) {
    const collection = await getCollection<CategoryDocument>(COLLECTION);

    let objectId: ObjectId;
    try {
        objectId = new ObjectId(id);
    } catch {
        throw new AppError(400, 'INVALID_ID');
    }

    const existing = await collection.findOne({ _id: objectId });
    if (!existing) {
        throw new AppError(404, 'CATEGORY_NOT_FOUND');
    }

    await collection.deleteOne({ _id: objectId });

    return { success: true };
}

export async function addSubCategory(id: string, input: AddSubCategoryInput) {
    const collection = await getCollection<CategoryDocument>(COLLECTION);

    let objectId: ObjectId;
    try {
        objectId = new ObjectId(id);
    } catch {
        throw new AppError(400, 'INVALID_ID');
    }

    const existing = await collection.findOne({ _id: objectId });
    if (!existing) {
        throw new AppError(404, 'CATEGORY_NOT_FOUND');
    }

    // Check if subcategory name already exists in this category
    const nameExists = existing.subCategories.some(sub => sub.name === input.name);
    if (nameExists) {
        throw new AppError(400, 'SUBCATEGORY_EXISTS', {
            message: 'Subcategory with this name already exists in this category',
        });
    }

    const newSubCategory = {
        id: nanoid(),
        name: input.name,
    };

    await collection.updateOne(
        { _id: objectId },
        {
            $push: { subCategories: newSubCategory },
            $set: { updatedAt: new Date() },
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

    let objectId: ObjectId;
    try {
        objectId = new ObjectId(id);
    } catch {
        throw new AppError(400, 'INVALID_ID');
    }

    const existing = await collection.findOne({ _id: objectId });
    if (!existing) {
        throw new AppError(404, 'CATEGORY_NOT_FOUND');
    }

    const subCategoryExists = existing.subCategories.some(sub => sub.id === subCategoryId);
    if (!subCategoryExists) {
        throw new AppError(404, 'SUBCATEGORY_NOT_FOUND');
    }

    await collection.updateOne(
        { _id: objectId },
        {
            $pull: { subCategories: { id: subCategoryId } },
            $set: { updatedAt: new Date() },
        }
    );

    const updated = await collection.findOne({ _id: objectId });
    if (!updated) {
        throw new AppError(500, 'FAILED_TO_REMOVE_SUBCATEGORY');
    }

    return toCategory(updated);
}
