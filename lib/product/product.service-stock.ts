// Append to end of product.service.ts

/**
 * Stock Management Functions
 */

import { getCollection } from '../db/mongo-client';
import { AppError } from '../errors/app-error';
import { ProductDocument } from './model/product.model';
import { getProduct } from './product.service';
import { getVariantCombinationKey } from './product.utils';
import { ObjectId } from 'mongodb';

const COLLECTION = 'products';

/**
 * Get stock count for a specific variant combination
 */
export async function getVariantStock(productId: string, selectedVariantItemIds: string[]): Promise<number> {
    const product = await getProduct(productId);
    const key = getVariantCombinationKey(selectedVariantItemIds);

    const stockEntry = product.variantStock.find(vs => vs.variantCombinationKey === key);
    return stockEntry?.stockCount ?? 0;
}

/**
 * Reduce stock atomically for a specific variant combination
 * @throws AppError if insufficient stock
 */
export async function reduceVariantStock(
    productId: string,
    selectedVariantItemIds: string[],
    quantity: number
): Promise<void> {
    const collection = await getCollection<ProductDocument>(COLLECTION);

    let objectId: ObjectId;
    try {
        objectId = new ObjectId(productId);
    } catch {
        throw new AppError(400, 'INVALID_ID');
    }

    const key = getVariantCombinationKey(selectedVariantItemIds);

    // Use atomic operation to prevent race conditions
    const result = await collection.findOneAndUpdate(
        {
            _id: objectId,
            'variantStock.variantCombinationKey': key,
            'variantStock.stockCount': { $gte: quantity }
        },
        {
            $inc: { 'variantStock.$.stockCount': -quantity },
            $set: { updatedAt: new Date() }
        },
        { returnDocument: 'after' }
    );

    if (!result) {
        // Check if product exists
        const product = await collection.findOne({ _id: objectId });
        if (!product) {
            throw new AppError(404, 'PRODUCT_NOT_FOUND');
        }

        // Check if variant combination exists
        const stockEntry = product.variantStock?.find(vs => vs.variantCombinationKey === key);
        if (!stockEntry) {
            // No stock tracking for this variant - treat as unlimited
            console.warn(`No stock tracking for product ${productId} variant ${key}`);
            return;
        }

        // Insufficient stock
        throw new AppError(400, 'INSUFFICIENT_STOCK', {
            productId,
            variantKey: key,
            requested: quantity,
            available: stockEntry.stockCount
        });
    }
}

/**
 * Validate stock availability for multiple items
 */
export async function validateStockAvailability(
    items: Array<{ productId: string; selectedVariantItemIds: string[]; quantity: number }>
): Promise<{ available: boolean; insufficientItems: Array<{ productId: string; variantKey: string; requested: number; available: number }> }> {
    const insufficientItems: Array<{ productId: string; variantKey: string; requested: number; available: number }> = [];

    for (const item of items) {
        try {
            const availableStock = await getVariantStock(item.productId, item.selectedVariantItemIds);
            const key = getVariantCombinationKey(item.selectedVariantItemIds);

            // If no stock entry exists (availableStock === 0 from default), treat as unlimited
            const product = await getProduct(item.productId);
            const hasStockTracking = product.variantStock.some(vs => vs.variantCombinationKey === key);

            if (hasStockTracking && availableStock < item.quantity) {
                insufficientItems.push({
                    productId: item.productId,
                    variantKey: key,
                    requested: item.quantity,
                    available: availableStock
                });
            }
        } catch (error) {
            // If product not found or other error, add to insufficient items
            console.error(`Error validating stock for product ${item.productId}:`, error);
            insufficientItems.push({
                productId: item.productId,
                variantKey: getVariantCombinationKey(item.selectedVariantItemIds),
                requested: item.quantity,
                available: 0
            });
        }
    }

    return {
        available: insufficientItems.length === 0,
        insufficientItems
    };
}
