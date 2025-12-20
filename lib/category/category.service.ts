// lib/category/category.service.ts
import { getCollection, ObjectId } from '@/lib/db/mongo-client';
import { AppError } from '@/lib/errors/app-error';
import {
    CategoryDocument,
    CategorySubCategory,
    CategorySubSubCategory,
    toCategory,
    toCategories,
} from './model/category.model';
import {
    CreateCategoryInput,
    UpdateCategoryInput,
    AddSubCategoryInput,
    AddSubSubCategoryInput,
    UpdateSubCategoryInput,
    SubCategory as SchemaSubCategory,
    SubSubCategory as SchemaSubSubCategory,
} from './category.schema';
import { nanoid } from 'nanoid';
import {
    getCategorySlug,
    getSubCategorySlug,
    getSubSubCategorySlug,
} from './slug';

const COLLECTION = 'categories';

function parseObjectId(id: string) {
    try {
        return new ObjectId(id);
    } catch {
        throw new AppError(400, 'INVALID_ID');
    }
}

type NestedSubCategory = SchemaSubCategory | CategorySubCategory;
type NestedSubSubCategory = SchemaSubSubCategory | CategorySubSubCategory;

function normalizeSubSubCategory(
    categoryName: string,
    subCategoryName: string,
    subSubCategory: NestedSubSubCategory
): CategorySubSubCategory {
    return {
        id: subSubCategory.id,
        name: subSubCategory.name,
        slug: getSubSubCategorySlug(categoryName, subCategoryName, subSubCategory.name),
    };
}

function normalizeSubCategory(
    categoryName: string,
    subCategory: NestedSubCategory
): CategorySubCategory {
    return {
        id: subCategory.id,
        name: subCategory.name,
        slug: getSubCategorySlug(categoryName, subCategory.name),
        subSubCategories: (subCategory.subSubCategories ?? []).map(subSub =>
            normalizeSubSubCategory(categoryName, subCategory.name, subSub)
        ),
    };
}

function normalizeSubCategories(
    categoryName: string,
    subCategories: NestedSubCategory[] = []
): CategorySubCategory[] {
    return subCategories.map(sub => normalizeSubCategory(categoryName, sub));
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
        slug: getCategorySlug(input.name),
        subCategories: normalizeSubCategories(input.name, input.subCategories),
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

export async function getCategory(identifier: string) {
    const collection = await getCollection<CategoryDocument>(COLLECTION);

    let doc: CategoryDocument | null = null;
    if (ObjectId.isValid(identifier)) {
        doc = await collection.findOne({ _id: new ObjectId(identifier) });
    }
    if (!doc) {
        doc = await collection.findOne({ slug: identifier });
    }
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

    const updateDoc: Partial<Omit<CategoryDocument, '_id'>> = {
        updatedAt: new Date(),
    };
    const nextCategoryName = input.name ?? existing.name;

    if (input.name) {
        updateDoc.name = input.name;
        updateDoc.slug = getCategorySlug(input.name);
    }

    if (input.subCategories) {
        updateDoc.subCategories = normalizeSubCategories(nextCategoryName, input.subCategories);
    } else if (input.name) {
        updateDoc.subCategories = normalizeSubCategories(nextCategoryName, existing.subCategories);
    }

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
    const subCategories = normalizeSubCategories(existing.name, existing.subCategories);
    const nameExists = subCategories.some(sub => sub.name === input.name);
    if (nameExists) {
        throw new AppError(400, 'SUBCATEGORY_EXISTS', {
            message: 'Subcategory with this name already exists in this category',
        });
    }

    const newSubCategory: CategorySubCategory = {
        id: nanoid(),
        name: input.name,
        slug: getSubCategorySlug(existing.name, input.name),
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

    const subCategories = normalizeSubCategories(existing.name, existing.subCategories);
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

    const subCategories = normalizeSubCategories(existing.name, existing.subCategories);
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

    const newSubSubCategory: CategorySubSubCategory = {
        id: nanoid(),
        name: input.name,
        slug: getSubSubCategorySlug(existing.name, subCategory.name, input.name),
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

    const subCategories = normalizeSubCategories(existing.name, existing.subCategories);
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

    const subCategories = normalizeSubCategories(existing.name, existing.subCategories);
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

    const currentSubCategory = subCategories[subCategoryIndex];
    const nextSubCategoryName = input.name ?? currentSubCategory.name;
    const nextSubSubCategories: NestedSubSubCategory[] =
        input.subSubCategories ?? currentSubCategory.subSubCategories;

    const updatedSubCategory = normalizeSubCategory(existing.name, {
        ...currentSubCategory,
        name: nextSubCategoryName,
        subSubCategories: nextSubSubCategories,
    });

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

export async function getCategoryHierarchyIds(identifier: string): Promise<string[]> {
    const collection = await getCollection<CategoryDocument>(COLLECTION);
    const matchedIds = new Set<string>();

    if (ObjectId.isValid(identifier)) {
        const category = await collection.findOne({ _id: new ObjectId(identifier) });
        if (category) {
            matchedIds.add(category._id.toString());
            category.subCategories?.forEach(sub => {
                matchedIds.add(sub.id);
                (sub.subSubCategories || []).forEach(subSub => matchedIds.add(subSub.id));
            });
            return Array.from(matchedIds);
        }
    }

    const categoryBySlug = await collection.findOne({ slug: identifier });
    if (categoryBySlug) {
        matchedIds.add(categoryBySlug._id.toString());
        categoryBySlug.subCategories?.forEach(sub => {
            matchedIds.add(sub.id);
            (sub.subSubCategories || []).forEach(subSub => matchedIds.add(subSub.id));
        });
        return Array.from(matchedIds);
    }

    const categoryWithSub = await collection.findOne({
        $or: [
            { 'subCategories.id': identifier },
            { 'subCategories.slug': identifier },
        ],
    });
    if (categoryWithSub) {
        const subCategory = categoryWithSub.subCategories.find(
            sub => sub.id === identifier || sub.slug === identifier
        );
        if (subCategory) {
            matchedIds.add(subCategory.id);
            (subCategory.subSubCategories || []).forEach(subSub => matchedIds.add(subSub.id));
            return Array.from(matchedIds);
        }
    }

    const categoryWithSubSub = await collection.findOne({
        $or: [
            { 'subCategories.subSubCategories.id': identifier },
            { 'subCategories.subSubCategories.slug': identifier },
        ],
    });
    if (categoryWithSubSub) {
        for (const sub of categoryWithSubSub.subCategories) {
            const subSub = sub.subSubCategories?.find(
                s => s.id === identifier || s.slug === identifier
            );
            if (subSub) {
                matchedIds.add(subSub.id);
                return Array.from(matchedIds);
            }
        }
    }

    throw new AppError(404, 'CATEGORY_NOT_FOUND', {
        message: `Category with identifier "${identifier}" not found`,
    });
}

/**
 * Returns a map of category ID to its full lineage (ancestors + self)
 * Useful for relevancy scoring and finding broader contexts.
 */
export async function getCategoryLineageMap(): Promise<Map<string, string[]>> {
    const collection = await getCollection<CategoryDocument>(COLLECTION);
    const categories = await collection.find({}).toArray();
    const map = new Map<string, string[]>();

    for (const cat of categories) {
        const catId = cat._id.toString();
        map.set(catId, [catId]);

        for (const sub of cat.subCategories) {
            const subId = sub.id;
            map.set(subId, [catId, subId]);

            for (const subSub of sub.subSubCategories || []) {
                const subSubId = subSub.id;
                map.set(subSubId, [catId, subId, subSubId]);
            }
        }
    }

    return map;
}

/**
 * Returns identifying IDs for the broader context of the given categories.
 * Includes the categories themselves and all their ancestors.
 */
export async function getBroaderCategoryContextIds(ids: string[]): Promise<string[]> {
    const lineageMap = await getCategoryLineageMap();
    const broaderIds = new Set<string>();

    for (const id of ids) {
        const lineage = lineageMap.get(id);
        if (lineage) {
            lineage.forEach(lid => broaderIds.add(lid));
        }
    }

    return Array.from(broaderIds);
}
