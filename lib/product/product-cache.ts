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

export async function getCachedStorefrontProduct(identifier: string) {
    'use cache';
    cacheLife('days');
    cacheTag(PRODUCTS_CACHE_TAG, productCacheTag(identifier));

    const collection = await getCachedCollection<ProductDocument>('products');
    let doc: ProductDocument | null = null;
    let matchedLegacyId = false;

    if (ObjectId.isValid(identifier)) {
        doc = await collection.findOne({ _id: new ObjectId(identifier) });
        matchedLegacyId = Boolean(doc);
    }

    if (!doc) {
        doc = await collection.findOne({ slug: identifier });
    }

    if (!doc) {
        throw new AppError(404, 'PRODUCT_NOT_FOUND');
    }

    const product = toProduct(doc);

    if (product.brandId) {
        const brandCollection = await getCachedCollection('brands');
        const brandDoc = await brandCollection.findOne({ _id: new ObjectId(product.brandId) });
        if (brandDoc) {
            const brand = brandDoc as { name?: string; imageUrl?: string };
            product.brand = {
                name: brand.name ?? '',
                imageUrl: brand.imageUrl ?? '',
            };
        }
    }

    return {
        product,
        matchedLegacyId,
    };
}

export async function getCachedProductSlugs() {
    'use cache';
    cacheLife('days');
    cacheTag(PRODUCTS_CACHE_TAG);

    const collection = await getCachedCollection<ProductDocument>('products');
    const docs = await collection.find({}, { projection: { _id: 1, slug: 1 } }).toArray();
    return docs
        .map((doc) => ('slug' in doc && typeof doc.slug === 'string' ? doc.slug : ('_id' in doc && doc._id instanceof ObjectId ? doc._id.toString() : null)))
        .filter((slug): slug is string => Boolean(slug));
}

export function revalidateProductCache(options?: string | { id?: string; slug?: string; previousSlug?: string }) {
    revalidateTag(PRODUCTS_CACHE_TAG, { expire: 0 });
    revalidatePath('/(store)/products', 'page');

    if (!options) {
        return;
    }

    const id = typeof options === 'string' ? options : options.id;
    const slug = typeof options === 'string' ? undefined : options.slug;
    const previousSlug = typeof options === 'string' ? undefined : options.previousSlug;
    const identifiers = [id, slug, previousSlug].filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index);

    for (const identifier of identifiers) {
        revalidateTag(productCacheTag(identifier), { expire: 0 });
        revalidateTag(productRelatedCacheTag(identifier), { expire: 0 });
        revalidatePath(`/(store)/product/${identifier}`, 'page');
    }
}
