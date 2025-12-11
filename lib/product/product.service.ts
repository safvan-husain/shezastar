// lib/product/product.service.ts
import { getCollection, ObjectId } from '@/lib/db/mongo-client';
import { AppError } from '@/lib/errors/app-error';
import { ProductDocument, toProduct, toProducts } from './model/product.model';
import { CreateProductInput, UpdateProductInput, ImageMappingInput, ProductImage } from './product.schema';
import { nanoid } from 'nanoid';
import { deleteImages } from '@/lib/utils/file-upload';
import { getCategoryHierarchyIds } from '@/lib/category/category.service';

const COLLECTION = 'products';

export async function createProduct(input: CreateProductInput) {
    const collection = await getCollection<ProductDocument>(COLLECTION);

    // Validate offer price is less than base price if provided
    if (input.offerPrice && input.offerPrice >= input.basePrice) {
        throw new AppError(400, 'INVALID_OFFER_PRICE', {
            message: 'Offer price must be less than base price',
        });
    }

    // Ensure all images have IDs
    const images = input.images.map((img, index) => ({
        ...img,
        id: img.id || nanoid(),
        order: img.order ?? index,
    }));

    const now = new Date();
    const doc: Omit<ProductDocument, '_id'> = {
        name: input.name,
        description: input.description,
        basePrice: input.basePrice,
        offerPrice: input.offerPrice,
        images,
        variants: input.variants,
        subCategoryIds: input.subCategoryIds || [],
        installationService: input.installationService,
        variantStock: input.variantStock || [],
        highlights: input.highlights ?? [],
        createdAt: now,
        updatedAt: now,
    };

    const result = await collection.insertOne(doc as ProductDocument);
    const created = await collection.findOne({ _id: result.insertedId });

    if (!created) {
        throw new AppError(500, 'FAILED_TO_CREATE_PRODUCT');
    }

    return toProduct(created);
}

export async function getProduct(id: string) {
    const collection = await getCollection<ProductDocument>(COLLECTION);

    let objectId: ObjectId;
    try {
        objectId = new ObjectId(id);
    } catch {
        throw new AppError(400, 'INVALID_ID');
    }

    const doc = await collection.findOne({ _id: objectId });
    if (!doc) {
        throw new AppError(404, 'PRODUCT_NOT_FOUND');
    }

    return toProduct(doc);
}

export async function getAllProducts(page = 1, limit = 20, categoryId?: string) {
    const collection = await getCollection<ProductDocument>(COLLECTION);

    const skip = (page - 1) * limit;
    let filter: Record<string, any> = {};

    if (categoryId) {
        const categoryFilterIds = await getCategoryHierarchyIds(categoryId);
        filter = { subCategoryIds: { $in: categoryFilterIds } };
    }

    const [docs, total] = await Promise.all([
        collection.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
        collection.countDocuments(filter),
    ]);

    return {
        products: toProducts(docs),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

export async function updateProduct(id: string, input: UpdateProductInput) {
    const collection = await getCollection<ProductDocument>(COLLECTION);

    let objectId: ObjectId;
    try {
        objectId = new ObjectId(id);
    } catch {
        throw new AppError(400, 'INVALID_ID');
    }

    // Check if product exists
    const existing = await collection.findOne({ _id: objectId });
    if (!existing) {
        throw new AppError(404, 'PRODUCT_NOT_FOUND');
    }

    // Validate offer price
    const basePrice = input.basePrice ?? existing.basePrice;
    const offerPrice = input.offerPrice ?? existing.offerPrice;
    if (offerPrice && offerPrice >= basePrice) {
        throw new AppError(400, 'INVALID_OFFER_PRICE', {
            message: 'Offer price must be less than base price',
        });
    }

    const updateDoc: any = {
        updatedAt: new Date(),
    };

    if (input.name) updateDoc.name = input.name;
    if (input.description !== undefined) updateDoc.description = input.description;
    if (input.basePrice !== undefined) updateDoc.basePrice = input.basePrice;
    if (input.offerPrice !== undefined) updateDoc.offerPrice = input.offerPrice;
    if (input.variantStock !== undefined) updateDoc.variantStock = input.variantStock;
    if (input.highlights !== undefined) updateDoc.highlights = input.highlights;
    if (input.images) {
        // Ensure all images have IDs
        updateDoc.images = input.images.map((img, index) => ({
            ...img,
            id: img.id || nanoid(),
            order: img.order ?? index,
        }));
    }
    if (input.variants) updateDoc.variants = input.variants;
    if (input.subCategoryIds !== undefined) updateDoc.subCategoryIds = input.subCategoryIds;
    if (input.installationService !== undefined) updateDoc.installationService = input.installationService;

    await collection.updateOne({ _id: objectId }, { $set: updateDoc });

    const updated = await collection.findOne({ _id: objectId });
    if (!updated) {
        throw new AppError(500, 'FAILED_TO_UPDATE_PRODUCT');
    }

    return toProduct(updated);
}

export async function deleteProduct(id: string) {
    const collection = await getCollection<ProductDocument>(COLLECTION);

    let objectId: ObjectId;
    try {
        objectId = new ObjectId(id);
    } catch {
        throw new AppError(400, 'INVALID_ID');
    }

    const existing = await collection.findOne({ _id: objectId });
    if (!existing) {
        throw new AppError(404, 'PRODUCT_NOT_FOUND');
    }

    // Delete all product images
    if (existing.images && existing.images.length > 0) {
        const imageUrls = existing.images.map(img => img.url);
        await deleteImages(imageUrls);
    }

    await collection.deleteOne({ _id: objectId });

    return { success: true };
}

export async function addProductImages(id: string, images: ProductImage[]) {
    const collection = await getCollection<ProductDocument>(COLLECTION);

    let objectId: ObjectId;
    try {
        objectId = new ObjectId(id);
    } catch {
        throw new AppError(400, 'INVALID_ID');
    }

    const existing = await collection.findOne({ _id: objectId });
    if (!existing) {
        throw new AppError(404, 'PRODUCT_NOT_FOUND');
    }

    // Ensure all new images have IDs
    const newImages = images.map((img, index) => ({
        ...img,
        id: img.id || nanoid(),
        order: img.order ?? (existing.images.length + index),
    }));

    await collection.updateOne(
        { _id: objectId },
        {
            $push: { images: { $each: newImages } },
            $set: { updatedAt: new Date() },
        }
    );

    const updated = await collection.findOne({ _id: objectId });
    if (!updated) {
        throw new AppError(500, 'FAILED_TO_ADD_IMAGES');
    }

    return toProduct(updated);
}

export async function deleteProductImage(id: string, imageId: string) {
    const collection = await getCollection<ProductDocument>(COLLECTION);

    let objectId: ObjectId;
    try {
        objectId = new ObjectId(id);
    } catch {
        throw new AppError(400, 'INVALID_ID');
    }

    const existing = await collection.findOne({ _id: objectId });
    if (!existing) {
        throw new AppError(404, 'PRODUCT_NOT_FOUND');
    }

    // Find the image to delete
    const imageToDelete = existing.images.find(img => img.id === imageId);
    if (!imageToDelete) {
        throw new AppError(404, 'IMAGE_NOT_FOUND');
    }

    // Delete the physical file
    await deleteImages([imageToDelete.url]);

    // Remove from database
    await collection.updateOne(
        { _id: objectId },
        {
            $pull: { images: { id: imageId } },
            $set: { updatedAt: new Date() },
        }
    );

    const updated = await collection.findOne({ _id: objectId });
    if (!updated) {
        throw new AppError(500, 'FAILED_TO_DELETE_IMAGE');
    }

    return toProduct(updated);
}

export async function mapImageToVariants(id: string, mappings: ImageMappingInput[]) {
    const collection = await getCollection<ProductDocument>(COLLECTION);

    let objectId: ObjectId;
    try {
        objectId = new ObjectId(id);
    } catch {
        throw new AppError(400, 'INVALID_ID');
    }

    const existing = await collection.findOne({ _id: objectId });
    if (!existing) {
        throw new AppError(404, 'PRODUCT_NOT_FOUND');
    }

    // Update image mappings
    const updatedImages = existing.images.map(img => {
        const mapping = mappings.find(m => m.imageId === img.id);
        if (mapping) {
            // Create combination key if multiple items, or use single item ID
            const mappedVariants = mapping.variantItemIds.length > 1
                ? [mapping.variantItemIds.sort().join('+')]
                : mapping.variantItemIds;

            return {
                ...img,
                mappedVariants,
            };
        }
        return img;
    });

    await collection.updateOne(
        { _id: objectId },
        {
            $set: {
                images: updatedImages,
                updatedAt: new Date(),
            },
        }
    );

    const updated = await collection.findOne({ _id: objectId });
    if (!updated) {
        throw new AppError(500, 'FAILED_TO_MAP_IMAGES');
    }

    return toProduct(updated);
}
