// lib/variant-type/variant-type.service.ts
import { getCollection, ObjectId } from '@/lib/db/mongo-client';
import { AppError } from '@/lib/errors/app-error';
import { VariantTypeDocument, toVariantType, toVariantTypes } from './model/variant-type.model';
import { CreateVariantTypeInput, UpdateVariantTypeInput, VariantItem } from './variant-type.schema';
import { nanoid } from 'nanoid';

const COLLECTION = 'variant_types';

export async function createVariantType(input: CreateVariantTypeInput) {
    const collection = await getCollection<VariantTypeDocument>(COLLECTION);

    // Check if variant type with same name exists
    const existing = await collection.findOne({ name: input.name });
    if (existing) {
        throw new AppError(409, 'VARIANT_TYPE_EXISTS', { name: input.name });
    }

    // Add IDs to items if not present
    const items = input.items.map(item => ({
        ...item,
        id: item.id || nanoid(),
    }));

    const now = new Date();
    const doc: Omit<VariantTypeDocument, '_id'> = {
        name: input.name,
        items,
        createdAt: now,
        updatedAt: now,
    };

    const result = await collection.insertOne(doc as VariantTypeDocument);
    const created = await collection.findOne({ _id: result.insertedId });

    if (!created) {
        throw new AppError(500, 'FAILED_TO_CREATE_VARIANT_TYPE');
    }

    return toVariantType(created);
}

export async function getVariantType(id: string) {
    const collection = await getCollection<VariantTypeDocument>(COLLECTION);

    let objectId: ObjectId;
    try {
        objectId = new ObjectId(id);
    } catch {
        throw new AppError(400, 'INVALID_ID');
    }

    const doc = await collection.findOne({ _id: objectId });
    if (!doc) {
        throw new AppError(404, 'VARIANT_TYPE_NOT_FOUND');
    }

    return toVariantType(doc);
}

export async function getAllVariantTypes() {
    const collection = await getCollection<VariantTypeDocument>(COLLECTION);
    const docs = await collection.find({}).sort({ createdAt: -1 }).toArray();
    return toVariantTypes(docs);
}

export async function updateVariantType(id: string, input: UpdateVariantTypeInput) {
    const collection = await getCollection<VariantTypeDocument>(COLLECTION);

    let objectId: ObjectId;
    try {
        objectId = new ObjectId(id);
    } catch {
        throw new AppError(400, 'INVALID_ID');
    }

    // Check if variant type exists
    const existing = await collection.findOne({ _id: objectId });
    if (!existing) {
        throw new AppError(404, 'VARIANT_TYPE_NOT_FOUND');
    }

    // If updating name, check for duplicates
    if (input.name && input.name !== existing.name) {
        const duplicate = await collection.findOne({ name: input.name });
        if (duplicate) {
            throw new AppError(409, 'VARIANT_TYPE_EXISTS', { name: input.name });
        }
    }

    const updateDoc: any = {
        updatedAt: new Date(),
    };

    if (input.name) updateDoc.name = input.name;
    if (input.items) {
        // Ensure all items have IDs
        updateDoc.items = input.items.map(item => ({
            ...item,
            id: item.id || nanoid(),
        }));
    }

    await collection.updateOne({ _id: objectId }, { $set: updateDoc });

    const updated = await collection.findOne({ _id: objectId });
    if (!updated) {
        throw new AppError(500, 'FAILED_TO_UPDATE_VARIANT_TYPE');
    }

    return toVariantType(updated);
}

export async function deleteVariantType(id: string) {
    const collection = await getCollection<VariantTypeDocument>(COLLECTION);

    let objectId: ObjectId;
    try {
        objectId = new ObjectId(id);
    } catch {
        throw new AppError(400, 'INVALID_ID');
    }

    // Check if variant type exists
    const existing = await collection.findOne({ _id: objectId });
    if (!existing) {
        throw new AppError(404, 'VARIANT_TYPE_NOT_FOUND');
    }

    // Check if any products use this variant type
    const productsCollection = await getCollection('products');
    const productUsingVariant = await productsCollection.findOne({
        'variants.variantTypeId': id,
    });

    if (productUsingVariant) {
        throw new AppError(400, 'VARIANT_TYPE_IN_USE', {
            message: 'Cannot delete variant type that is used by products',
        });
    }

    await collection.deleteOne({ _id: objectId });

    return { success: true };
}

export async function addItemToVariantType(id: string, item: Omit<VariantItem, 'id'>) {
    const collection = await getCollection<VariantTypeDocument>(COLLECTION);

    let objectId: ObjectId;
    try {
        objectId = new ObjectId(id);
    } catch {
        throw new AppError(400, 'INVALID_ID');
    }

    const newItem: VariantItem = {
        ...item,
        id: nanoid(),
    };

    const result = await collection.updateOne(
        { _id: objectId },
        {
            $push: { items: newItem },
            $set: { updatedAt: new Date() },
        }
    );

    if (result.matchedCount === 0) {
        throw new AppError(404, 'VARIANT_TYPE_NOT_FOUND');
    }

    const updated = await collection.findOne({ _id: objectId });
    if (!updated) {
        throw new AppError(500, 'FAILED_TO_ADD_ITEM');
    }

    return toVariantType(updated);
}

export async function removeItemFromVariantType(id: string, itemId: string) {
    const collection = await getCollection<VariantTypeDocument>(COLLECTION);

    let objectId: ObjectId;
    try {
        objectId = new ObjectId(id);
    } catch {
        throw new AppError(400, 'INVALID_ID');
    }

    const result = await collection.updateOne(
        { _id: objectId },
        {
            $pull: { items: { id: itemId } },
            $set: { updatedAt: new Date() },
        }
    );

    if (result.matchedCount === 0) {
        throw new AppError(404, 'VARIANT_TYPE_NOT_FOUND');
    }

    const updated = await collection.findOne({ _id: objectId });
    if (!updated) {
        throw new AppError(500, 'FAILED_TO_REMOVE_ITEM');
    }

    return toVariantType(updated);
}
