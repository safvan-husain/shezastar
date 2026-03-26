// lib/product/product.service.ts
import { getCollection, ObjectId } from '@/lib/db/mongo-client';
import { AppError } from '@/lib/errors/app-error';
import { ProductDocument, toProduct, toProducts } from './model/product.model';
import { CreateProductInput, UpdateProductInput, ImageMappingInput, ProductImage, BulkPriceUpdateInput } from './product.schema';
import { nanoid } from 'nanoid';
import { deleteImages } from '@/lib/utils/file-upload';
import { getCategoryHierarchyIds, getCategoryLineageMap } from '@/lib/category/category.service';
import {
    buildProductActivityDiff,
    createActivityLog,
} from '@/lib/activity/activity.service';
import type { ActivityActor, ActivityEntity } from '@/lib/activity/model/activity.model';

const COLLECTION = 'products';

function buildProductEntity(product: { id: string; name: string }): ActivityEntity {
    return {
        kind: 'product',
        id: product.id,
        label: product.name,
    };
}

function buildProductSummary(actor: ActivityActor | undefined, verb: string, productName: string) {
    const actorName = actor?.displayName?.trim() || (actor?.type === 'admin' ? 'Admin' : 'System');
    return `${actorName} ${verb} product ${productName}`;
}

export async function createProduct(input: CreateProductInput, actor?: ActivityActor) {
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
        weight: input.weight,
        brandId: input.brandId,
        createdAt: now,
        updatedAt: now,
    };

    const result = await collection.insertOne(doc as ProductDocument);
    const created = await collection.findOne({ _id: result.insertedId });

    if (!created) {
        throw new AppError(500, 'FAILED_TO_CREATE_PRODUCT');
    }

    const product = toProduct(created);

    if (actor) {
        await createActivityLog({
            actionType: 'product.created',
            actor,
            primaryEntity: buildProductEntity(product),
            summary: buildProductSummary(actor, 'created', product.name),
            details: {
                basePrice: product.basePrice,
                offerPercentage: product.offerPercentage,
                categoryCount: product.subCategoryIds.length,
                variantCount: product.variants.length,
                imageCount: product.images.length,
            },
        });
    }

    return product;
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

    const product = toProduct(doc);

    if (product.brandId) {
        try {
            const brandCollection = await getCollection('brands');
            const brandDoc = await brandCollection.findOne({ _id: new ObjectId(product.brandId) });
            if (brandDoc) {
                product.brand = {
                    name: (brandDoc as any).name,
                    imageUrl: (brandDoc as any).imageUrl,
                };
            }
        } catch (e) {
            console.error('Failed to populate brand:', e);
        }
    }

    return product;
}

export async function getAllProducts(page = 1, limit = 20, categoryId?: string | string[], originId?: string) {
    const collection = await getCollection<ProductDocument>(COLLECTION);

    const skip = (page - 1) * limit;
    let filter: Record<string, any> = {};

    // Get lineage map once for all uses if needed
    const lineageMap = (categoryId || originId) ? await getCategoryLineageMap() : null;

    if (categoryId && lineageMap) {
        const ids = Array.isArray(categoryId) ? categoryId : [categoryId];
        
        // Resolve all hierarchy IDs using the lineage map instead of repeated DB queries
        const flatHierarchyIds = new Set<string>();
        for (const id of ids) {
            // Check if it's a category/sub/sub-sub ID
            if (lineageMap.has(id)) {
                // To get hierarchy for id, we want all IDs that have this id in their lineage
                for (const [mid, lineage] of lineageMap.entries()) {
                    if (lineage.includes(id)) {
                        flatHierarchyIds.add(mid);
                    }
                }
            }
        }
        
        if (flatHierarchyIds.size > 0) {
            filter = { ...filter, subCategoryIds: { $in: Array.from(flatHierarchyIds) } };
        }
    }

    if (originId) {
        try {
            filter = { ...filter, _id: { $ne: new ObjectId(originId) } };
        } catch {
            // ignore invalid originId
        }
    }

    // Performance Optimization: If we have an originId (relevancy sorting), we fetch a pool of candidates.
    // Otherwise we do proper DB pagination to avoid fetching huge datasets.
    let docs: ProductDocument[];
    if (originId) {
        // Fetch up to 500 latest matching products as candidates for relevancy scoring.
        // This prevents memory issues and timeouts on large catalogs.
        docs = await collection.find(filter)
            .sort({ createdAt: -1 })
            .limit(500)
            .toArray();
    } else {
        // Normal paginated request
        docs = await collection.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();
    }

    // Relevancy Sorting if originId is provided
    if (originId && docs.length > 0 && lineageMap) {
        try {
            const originProduct = await getProduct(originId);

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

    const total = originId ? docs.length : await collection.countDocuments(filter);
    const paginatedDocs = originId ? docs.slice(skip, skip + limit) : docs;

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

export async function updateProduct(id: string, input: UpdateProductInput, actor?: ActivityActor) {
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
    if (input.brandId !== undefined) updateDoc.brandId = input.brandId;
    if (input.weight !== undefined) updateDoc.weight = input.weight;

    await collection.updateOne({ _id: objectId }, { $set: updateDoc });

    const updated = await collection.findOne({ _id: objectId });
    if (!updated) {
        throw new AppError(500, 'FAILED_TO_UPDATE_PRODUCT');
    }

    const product = toProduct(updated);

    if (actor) {
        await createActivityLog({
            actionType: 'product.updated',
            actor,
            primaryEntity: buildProductEntity(product),
            summary: buildProductSummary(actor, 'updated', product.name),
            details: {
                changedFieldCount: Object.keys(input).length,
            },
            diff: buildProductActivityDiff(existing, updated, Object.keys(input) as Array<keyof ProductDocument>),
        });
    }

    return product;
}

export async function updateProductWeight(id: string, weight: number) {
    const collection = await getCollection<ProductDocument>(COLLECTION);

    let objectId: ObjectId;
    try {
        objectId = new ObjectId(id);
    } catch {
        throw new AppError(400, 'INVALID_ID');
    }

    const result = await collection.findOneAndUpdate(
        { _id: objectId },
        { $set: { weight, updatedAt: new Date() } },
        { returnDocument: 'after' }
    );

    if (!result) {
        throw new AppError(404, 'PRODUCT_NOT_FOUND');
    }

    return toProduct(result);
}

export async function deleteProduct(id: string, actor?: ActivityActor) {
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

    if (actor) {
        await createActivityLog({
            actionType: 'product.deleted',
            actor,
            primaryEntity: {
                kind: 'product',
                id,
                label: existing.name,
            },
            summary: buildProductSummary(actor, 'deleted', existing.name),
            details: {
                basePrice: existing.basePrice,
                imageCount: existing.images.length,
                variantCount: existing.variants.length,
            },
        });
    }

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
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
        return [];
    }

    const searchableFields = ['name', 'subtitle', 'description', 'specifications.items'] as const;
    const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const createOrFilter = (regex: RegExp) => ({
        $or: searchableFields.map((field) => ({ [field]: { $regex: regex } })),
    });

    const words = trimmedQuery.split(/\s+/).filter(Boolean);

    if (words.length === 1) {
        const wordRegex = new RegExp(`\\b${escapeRegex(words[0])}\\b`, 'i');
        const docs = await collection.find(createOrFilter(wordRegex)).limit(limit).toArray();
        return toProducts(docs);
    }

    const escapedPhrase = words.map(escapeRegex).join('\\s+');
    const phraseRegex = new RegExp(`\\b${escapedPhrase}\\b`, 'i');
    const phraseDocs = await collection.find(createOrFilter(phraseRegex)).limit(limit).toArray();

    if (phraseDocs.length >= limit) {
        return toProducts(phraseDocs);
    }

    const wordClauses = words.map((word) => {
        const wordRegex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'i');
        return createOrFilter(wordRegex);
    });

    const phraseIds = phraseDocs.map((doc) => doc._id);
    const fallbackFilter: Record<string, any> = {
        $and: wordClauses,
    };

    if (phraseIds.length > 0) {
        fallbackFilter._id = { $nin: phraseIds };
    }

    const fallbackLimit = limit - phraseDocs.length;
    const fallbackDocs = fallbackLimit > 0
        ? await collection.find(fallbackFilter).limit(fallbackLimit).toArray()
        : [];

    return toProducts([...phraseDocs, ...fallbackDocs]);
}

export async function bulkUpdatePrices(input: BulkPriceUpdateInput, actor?: ActivityActor) {
    const collection = await getCollection<ProductDocument>(COLLECTION);

    // Build the filter based on mode
    let filter: Record<string, any> = {};

    if (input.mode === 'category') {
        if (input.ids.length === 0) {
            throw new AppError(400, 'NO_CATEGORIES_SELECTED', {
                message: 'At least one category must be selected',
            });
        }
        // Resolve all hierarchy IDs for the selected categories
        const allHierarchyIds = await Promise.all(
            input.ids.map(id => getCategoryHierarchyIds(id))
        );
        const flatIds = Array.from(new Set(allHierarchyIds.flat()));
        filter = { subCategoryIds: { $in: flatIds } };
    } else if (input.mode === 'product') {
        if (input.ids.length === 0) {
            throw new AppError(400, 'NO_PRODUCTS_SELECTED', {
                message: 'At least one product must be selected',
            });
        }
        const objectIds = input.ids.map(id => {
            try {
                return new ObjectId(id);
            } catch {
                throw new AppError(400, 'INVALID_ID', {
                    message: `Invalid product ID: ${id}`,
                });
            }
        });
        filter = { _id: { $in: objectIds } };
    }
    // mode === 'all' => empty filter matches everything

    // Fetch all matching products
    const docs = await collection.find(filter).toArray();

    if (docs.length === 0) {
        return { modifiedCount: 0 };
    }

    // Compute new prices and build bulk operations
    const operationDetails = docs.map(doc => {
        const newBasePrice =
            input.method === 'percentage'
                ? Math.round(doc.basePrice * (1 + input.value / 100) * 100) / 100
                : Math.round((doc.basePrice + input.value) * 100) / 100;

        const newVariantStock = (doc.variantStock || []).map(vs => {
            if (vs.price != null) {
                const newPrice =
                    input.method === 'percentage'
                        ? Math.round(vs.price * (1 + input.value / 100) * 100) / 100
                        : Math.round((vs.price + input.value) * 100) / 100;
                return { ...vs, price: newPrice };
            }
            return vs;
        });

        return {
            doc,
            newBasePrice,
            newVariantStock,
        };
    });

    const operations = operationDetails.map(({ doc, newBasePrice, newVariantStock }) => ({
        updateOne: {
            filter: { _id: doc._id },
            update: {
                $set: {
                    basePrice: newBasePrice,
                    variantStock: newVariantStock,
                    updatedAt: new Date(),
                },
            },
        },
    }));

    const result = await collection.bulkWrite(operations);

    if (actor && docs.length > 0) {
        await createActivityLog({
            actionType: 'product.bulk_price_updated',
            actor,
            primaryEntity: {
                kind: 'product',
                id: 'bulk-price-update',
                label: `${docs.length} products`,
            },
            relatedEntities: docs.map((doc) => ({
                kind: 'product',
                id: doc._id.toHexString(),
                label: doc.name,
            })),
            summary: `${actor.displayName?.trim() || 'Admin'} bulk updated ${docs.length} products`,
            details: {
                mode: input.mode,
                method: input.method,
                value: input.value,
                affectedCount: docs.length,
                products: operationDetails.map(({ doc, newBasePrice, newVariantStock }) => ({
                    productId: doc._id.toHexString(),
                    name: doc.name,
                    basePriceBefore: doc.basePrice,
                    basePriceAfter: newBasePrice,
                    variantPriceDeltas: (doc.variantStock || []).flatMap((entry, index) => {
                        const nextEntry = newVariantStock[index];
                        if (entry.price == null || nextEntry?.price == null || entry.price === nextEntry.price) {
                            return [];
                        }

                        return [{
                            variantCombinationKey: entry.variantCombinationKey,
                            before: entry.price,
                            after: nextEntry.price,
                        }];
                    }),
                })),
            },
        });
    }

    return { modifiedCount: result.modifiedCount };
}
