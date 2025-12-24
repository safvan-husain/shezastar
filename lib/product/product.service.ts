// lib/product/product.service.ts
import { getCollection, ObjectId } from '@/lib/db/mongo-client';
import { AppError } from '@/lib/errors/app-error';
import { ProductDocument, toProduct, toProducts } from './model/product.model';
import { CreateProductInput, UpdateProductInput, ImageMappingInput, ProductImage } from './product.schema';
import { nanoid } from 'nanoid';
import { deleteImages } from '@/lib/utils/file-upload';
import { getCategoryHierarchyIds, getCategoryLineageMap } from '@/lib/category/category.service';

const COLLECTION = 'products';

export async function createProduct(input: CreateProductInput) {
    const collection = await getCollection<ProductDocument>(COLLECTION);

    // Validate input
    if (input.offerPercentage !== undefined && (input.offerPercentage < 0 || input.offerPercentage > 100)) {
        throw new AppError(400, 'INVALID_OFFER_PERCENTAGE', {
            message: 'Offer percentage must be between 0 and 100',
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
        subtitle: input.subtitle,
        description: input.description,
        basePrice: input.basePrice,
        offerPercentage: input.offerPercentage,
        images,
        variants: input.variants,
        subCategoryIds: input.subCategoryIds || [],
        installationService: input.installationService,
        variantStock: input.variantStock || [],
        specifications: input.specifications || [],
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

export async function getAllProducts(page = 1, limit = 20, categoryId?: string | string[], originId?: string) {
    const collection = await getCollection<ProductDocument>(COLLECTION);

    const skip = (page - 1) * limit;
    let filter: Record<string, any> = {};

    if (categoryId) {
        const ids = Array.isArray(categoryId) ? categoryId : [categoryId];
        const allHierarchyIds = await Promise.all(ids.map(id => getCategoryHierarchyIds(id)));
        const flatHierarchyIds = Array.from(new Set(allHierarchyIds.flat()));
        filter = { ...filter, subCategoryIds: { $in: flatHierarchyIds } };
    }

    if (originId) {
        try {
            filter = { ...filter, _id: { $ne: new ObjectId(originId) } };
        } catch {
            // ignore invalid originId
        }
    }

    let docs = await collection.find(filter).sort({ createdAt: -1 }).toArray();

    // Relevancy Sorting if originId is provided
    if (originId && docs.length > 0) {
        try {
            const originProduct = await getProduct(originId);
            const lineageMap = await getCategoryLineageMap();

            // Pre-calculate origin lineages
            const originLineages = originProduct.subCategoryIds
                .map(id => lineageMap.get(id))
                .filter((l): l is string[] => !!l);

            const scoredDocs = docs.map(doc => {
                let maxScore = 0;
                for (const cid of doc.subCategoryIds) {
                    const lineage = lineageMap.get(cid);
                    if (!lineage) continue;

                    for (const oLineage of originLineages) {
                        let overlap = 0;
                        const minLen = Math.min(lineage.length, oLineage.length);
                        for (let i = 0; i < minLen; i++) {
                            if (lineage[i] === oLineage[i]) {
                                overlap++;
                            } else {
                                break;
                            }
                        }
                        if (overlap > maxScore) maxScore = overlap;
                    }
                }
                return { doc, score: maxScore };
            });

            // Sort by score (DESC) and then by createdAt (DESC)
            scoredDocs.sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return b.doc.createdAt.getTime() - a.doc.createdAt.getTime();
            });

            docs = scoredDocs.map(s => s.doc);
        } catch (e) {
            console.error('Failed to apply relevancy sorting:', e);
            // Fallback to default sort if sorting fails
        }
    }

    const total = docs.length;
    const paginatedDocs = docs.slice(skip, skip + limit);

    return {
        products: toProducts(paginatedDocs),
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

    // Validate input
    if (input.offerPercentage !== undefined && (input.offerPercentage < 0 || input.offerPercentage > 100)) {
        throw new AppError(400, 'INVALID_OFFER_PERCENTAGE', {
            message: 'Offer percentage must be between 0 and 100',
        });
    }

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



    const updateDoc: any = {
        updatedAt: new Date(),
    };

    if (input.name) updateDoc.name = input.name;
    if (input.subtitle !== undefined) updateDoc.subtitle = input.subtitle;
    if (input.description !== undefined) updateDoc.description = input.description;
    if (input.basePrice !== undefined) updateDoc.basePrice = input.basePrice;
    if (input.offerPercentage !== undefined) updateDoc.offerPercentage = input.offerPercentage;
    if (input.variantStock !== undefined) updateDoc.variantStock = input.variantStock;
    if (input.specifications !== undefined) updateDoc.specifications = input.specifications;
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

export async function searchProducts(query: string, limit = 10) {
    const collection = await getCollection<ProductDocument>(COLLECTION);

    // Escape special characters for regex
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQuery, 'i');

    const filter = {
        $or: [
            { name: { $regex: regex } },
            { subtitle: { $regex: regex } },
            { description: { $regex: regex } },
            { 'specifications.items': { $regex: regex } }
        ]
    };

    const docs = await collection
        .find(filter)
        .limit(limit)
        .toArray();

    return toProducts(docs);
}
