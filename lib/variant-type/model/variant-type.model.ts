// lib/variant-type/model/variant-type.model.ts
import { ObjectId } from 'mongodb';
import { VariantItem } from '../variant-type.schema';

export interface VariantTypeDocument {
    _id: ObjectId;
    name: string;
    items: VariantItem[];
    createdAt: Date;
    updatedAt: Date;
}

export interface VariantType {
    id: string;
    name: string;
    items: VariantItem[];
    createdAt: string;
    updatedAt: string;
}

export function toVariantType(doc: VariantTypeDocument): VariantType {
    return {
        id: doc._id.toString(),
        name: doc.name,
        items: doc.items,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
    };
}

export function toVariantTypes(docs: VariantTypeDocument[]): VariantType[] {
    return docs.map(toVariantType);
}
