// lib/category/model/category.model.ts
import { ObjectId } from 'mongodb';
import { SubCategory } from '../category.schema';

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
        subCategories: doc.subCategories,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
    };
}

export function toCategories(docs: CategoryDocument[]): Category[] {
    return docs.map(toCategory);
}
