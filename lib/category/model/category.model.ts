// lib/category/model/category.model.ts
import { ObjectId } from 'mongodb';
import { getCategorySlug, getSubCategorySlug, getSubSubCategorySlug } from '../slug';

export interface CategorySubSubCategory {
    id: string;
    name: string;
    slug: string;
}

export interface CategorySubCategory {
    id: string;
    name: string;
    slug: string;
    subSubCategories: CategorySubSubCategory[];
}

function normalizeSubSubCategories(
    categoryName: string,
    subCategoryName: string,
    subSubCategories?: CategorySubSubCategory[]
) {
    return (subSubCategories ?? []).map(subSub => ({
        ...subSub,
        slug: subSub.slug ?? getSubSubCategorySlug(categoryName, subCategoryName, subSub.name),
    }));
}

function normalizeSubCategory(
    categoryName: string,
    subCategory: CategorySubCategory
): CategorySubCategory {
    return {
        ...subCategory,
        slug: subCategory.slug ?? getSubCategorySlug(categoryName, subCategory.name),
        subSubCategories: normalizeSubSubCategories(
            categoryName,
            subCategory.name,
            subCategory.subSubCategories
        ),
    };
}

function normalizeSubCategories(categoryName: string, subCategories: CategorySubCategory[]) {
    return subCategories.map(subCategory => normalizeSubCategory(categoryName, subCategory));
}

export interface CategoryDocument {
    _id: ObjectId;
    name: string;
    slug: string;
    subCategories: CategorySubCategory[];
    createdAt: Date;
    updatedAt: Date;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    subCategories: CategorySubCategory[];
    createdAt: string;
    updatedAt: string;
}

export function toCategory(doc: CategoryDocument): Category {
    return {
        id: doc._id.toString(),
        name: doc.name,
        slug: doc.slug ?? getCategorySlug(doc.name),
        subCategories: normalizeSubCategories(doc.name, doc.subCategories),
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
    };
}

export function toCategories(docs: CategoryDocument[]): Category[] {
    return docs.map(toCategory);
}
