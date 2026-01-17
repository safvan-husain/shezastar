// lib/brand/model/brand.model.ts
import { ObjectId } from 'mongodb';

export interface BrandDocument {
    _id: ObjectId;
    name: string;
    imageUrl: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Brand {
    id: string;
    name: string;
    imageUrl: string;
    createdAt: string;
    updatedAt: string;
}

export function toBrand(doc: BrandDocument): Brand {
    return {
        id: doc._id.toString(),
        name: doc.name,
        imageUrl: doc.imageUrl,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
    };
}

export function toBrands(docs: BrandDocument[]): Brand[] {
    return docs.map(toBrand);
}
