// lib/brand/brand.service.ts
import { getCollection, ObjectId } from '@/lib/db/mongo-client';
import { AppError } from '@/lib/errors/app-error';
import { BrandDocument, toBrand, toBrands } from './model/brand.model';
import { CreateBrandInput, UpdateBrandInput } from './brand.schema';
import { deleteImages } from '@/lib/utils/file-upload';

const COLLECTION = 'brands';

export async function createBrand(input: CreateBrandInput) {
    const collection = await getCollection<BrandDocument>(COLLECTION);

    const now = new Date();
    const doc: Omit<BrandDocument, '_id'> = {
        name: input.name,
        imageUrl: input.imageUrl,
        createdAt: now,
        updatedAt: now,
    };

    const result = await collection.insertOne(doc as BrandDocument);
    const created = await collection.findOne({ _id: result.insertedId });

    if (!created) {
        throw new AppError(500, 'FAILED_TO_CREATE_BRAND');
    }

    return toBrand(created);
}

export async function getBrand(id: string) {
    const collection = await getCollection<BrandDocument>(COLLECTION);

    let objectId: ObjectId;
    try {
        objectId = new ObjectId(id);
    } catch {
        throw new AppError(400, 'INVALID_ID');
    }

    const doc = await collection.findOne({ _id: objectId });
    if (!doc) {
        throw new AppError(404, 'BRAND_NOT_FOUND');
    }

    return toBrand(doc);
}

export async function getAllBrands() {
    const collection = await getCollection<BrandDocument>(COLLECTION);
    const docs = await collection.find({}).sort({ name: 1 }).toArray();
    return toBrands(docs);
}

export async function updateBrand(id: string, input: UpdateBrandInput) {
    const collection = await getCollection<BrandDocument>(COLLECTION);

    let objectId: ObjectId;
    try {
        objectId = new ObjectId(id);
    } catch {
        throw new AppError(400, 'INVALID_ID');
    }

    const existing = await collection.findOne({ _id: objectId });
    if (!existing) {
        throw new AppError(404, 'BRAND_NOT_FOUND');
    }

    const updateDoc: any = {
        updatedAt: new Date(),
    };

    if (input.name) updateDoc.name = input.name;
    if (input.imageUrl) {
        // If image is changing, we could delete the old one, but usually it's better to keep it unless we are sure it's not used elsewhere.
        // For simplicity, we'll just update the URL.
        updateDoc.imageUrl = input.imageUrl;
    }

    await collection.updateOne({ _id: objectId }, { $set: updateDoc });

    const updated = await collection.findOne({ _id: objectId });
    if (!updated) {
        throw new AppError(500, 'FAILED_TO_UPDATE_BRAND');
    }

    return toBrand(updated);
}

export async function deleteBrand(id: string) {
    const collection = await getCollection<BrandDocument>(COLLECTION);

    let objectId: ObjectId;
    try {
        objectId = new ObjectId(id);
    } catch {
        throw new AppError(400, 'INVALID_ID');
    }

    const existing = await collection.findOne({ _id: objectId });
    if (!existing) {
        throw new AppError(404, 'BRAND_NOT_FOUND');
    }

    // Delete brand image
    if (existing.imageUrl) {
        await deleteImages([existing.imageUrl]);
    }

    await collection.deleteOne({ _id: objectId });

    return { success: true };
}
