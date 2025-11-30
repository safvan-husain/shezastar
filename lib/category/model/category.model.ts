// lib/category/model/category.model.ts
import { ObjectId } from 'mongodb';
import { SubCategory, SubSubCategory } from '../category.schema';

function normalizeSubSubCategories(subSubCategories?: SubSubCategory[]) {
    return subSubCategories ?? [];
}

function normalizeSubCategory(subCategory: SubCategory): SubCategory {
    return {
        ...subCategory,
        subSubCategories: normalizeSubSubCategories(subCategory.subSubCategories),
    };
}

function normalizeSubCategories(subCategories: SubCategory[]) {
    return subCategories.map(normalizeSubCategory);
}

export interface CategoryDocument {
    _id: ObjectId;
    name: string;
    subCategories: SubCategory[];
    createdAt: Date;
    updatedAt: Date;
}

export interface Category {
    id: string;
    name: string;
    subCategories: SubCategory[];
    createdAt: string;
    updatedAt: string;
}

export function toCategory(doc: CategoryDocument): Category {
    return {
        id: doc._id.toString(),
        name: doc.name,
        subCategories: normalizeSubCategories(doc.subCategories),
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
    };
}

export function toCategories(docs: CategoryDocument[]): Category[] {
    return docs.map(toCategory);
}
