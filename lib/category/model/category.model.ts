// lib/category/model/category.model.ts
import { ObjectId } from 'mongodb';
import { getCategorySlug, getSubCategorySlug, getSubSubCategorySlug } from '../slug';

export interface CategorySubSubCategory {
    id: string;
    name: string;
    slug: string;
    metaTitle?: string | null;
    metaDescription?: string | null;
    imagePath?: string | null;
}

export interface CategorySubCategory {
    id: string;
    name: string;
    slug: string;
    metaTitle?: string | null;
    metaDescription?: string | null;
    imagePath?: string | null;
    subSubCategories: CategorySubSubCategory[];
}

function normalizeSubSubCategories(
    categoryName: string,
    subCategoryName: string,
    subSubCategories?: CategorySubSubCategory[]
) {
    return (subSubCategories ?? []).map(subSub => ({
        id: subSub.id,
        name: subSub.name,
        slug: subSub.slug ?? getSubSubCategorySlug(categoryName, subCategoryName, subSub.name),
        metaTitle: subSub.metaTitle ?? null,
        metaDescription: subSub.metaDescription ?? null,
        imagePath: subSub.imagePath ?? null,
    }));
}

function normalizeSubCategory(
    categoryName: string,
    subCategory: CategorySubCategory
): CategorySubCategory {
    return {
        id: subCategory.id,
        name: subCategory.name,
        slug: subCategory.slug ?? getSubCategorySlug(categoryName, subCategory.name),
        metaTitle: subCategory.metaTitle ?? null,
        metaDescription: subCategory.metaDescription ?? null,
        imagePath: subCategory.imagePath ?? null,
        subSubCategories: normalizeSubSubCategories(
            categoryName,
            subCategory.name,
            subCategory.subSubCategories
        ),
    };
}

function normalizeSubCategories(
    categoryName: string,
    subCategories: CategorySubCategory[] | null | undefined
) {
    return (subCategories ?? []).map(subCategory => normalizeSubCategory(categoryName, subCategory));
}

export interface CategoryDocument {
    _id: ObjectId;
    name: string;
    slug: string;
    metaTitle?: string | null;
    metaDescription?: string | null;
    imagePath?: string | null;
    subCategories: CategorySubCategory[];
    createdAt: Date;
    updatedAt: Date;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    metaTitle?: string | null;
    metaDescription?: string | null;
    imagePath?: string | null;
    subCategories: CategorySubCategory[];
    createdAt: string;
    updatedAt: string;
}

export function toCategory(doc: CategoryDocument): Category {
    return {
        id: doc._id.toString(),
        name: doc.name,
        slug: doc.slug ?? getCategorySlug(doc.name),
        metaTitle: doc.metaTitle ?? null,
        metaDescription: doc.metaDescription ?? null,
        imagePath: doc.imagePath ?? null,
        subCategories: normalizeSubCategories(doc.name, doc.subCategories ?? []),
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
    };
}

export function toCategories(docs: CategoryDocument[]): Category[] {
    return docs.map(toCategory);
}
