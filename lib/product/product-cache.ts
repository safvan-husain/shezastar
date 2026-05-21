import { cacheLife, cacheTag, revalidatePath, revalidateTag } from 'next/cache';
import { getCachedCollection, ObjectId } from '@/lib/db/mongo-client';
import { ProductDocument, toProduct } from './model/product.model';
import { AppError } from '@/lib/errors/app-error';

const PRODUCTS_CACHE_TAG = 'products';

export function productCacheTag(id: string) {
    return `product:${id}`;
}

export function productRelatedCacheTag(id: string) {
    return `product-related:${id}`;
}

export async function getCachedProduct(id: string) {
    'use cache';
    cacheLife('days');
    cacheTag(PRODUCTS_CACHE_TAG, productCacheTag(id));

    let objectId: ObjectId;
    try {
        objectId = new ObjectId(id);
    } catch {
        throw new AppError(400, 'INVALID_ID');
    }

    const collection = await getCachedCollection<ProductDocument>('products');
    const doc = await collection.findOne({ _id: objectId });
    if (!doc) {
        throw new AppError(404, 'PRODUCT_NOT_FOUND');
    }

    const product = toProduct(doc);

    if (product.brandId) {
        const brandCollection = await getCachedCollection('brands');
        const brandDoc = await brandCollection.findOne({ _id: new ObjectId(product.brandId) });
        if (brandDoc) {
            product.brand = {
                name: (brandDoc as any).name,
                imageUrl: (brandDoc as any).imageUrl,
            };
        }
    }

    return product;
}

export function revalidateProductCache(id?: string) {
    revalidateTag(PRODUCTS_CACHE_TAG, { expire: 0 });
    revalidatePath('/(store)/products', 'page');

    if (!id) {
        return;
    }

    revalidateTag(productCacheTag(id), { expire: 0 });
    revalidateTag(productRelatedCacheTag(id), { expire: 0 });
    revalidatePath(`/(store)/product/${id}`, 'page');
}
