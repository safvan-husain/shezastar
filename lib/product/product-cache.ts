import { cacheLife, cacheTag, revalidatePath, revalidateTag } from 'next/cache';
import { getCachedCollection, getCollection, ObjectId } from '@/lib/db/mongo-client';
import { ProductDocument, toProduct } from './model/product.model';
import { AppError } from '@/lib/errors/app-error';
import { buildDefaultProductSlug } from './product-slug';

const PRODUCTS_CACHE_TAG = 'products';
type ProductSlugRecord = Pick<ProductDocument, '_id' | 'name' | 'slug' | 'updatedAt'>;

export function productCacheTag(id: string) {
    return `product:${id}`;
}

export function productRelatedCacheTag(id: string) {
    return `product-related:${id}`;
}

async function persistMissingSlug(doc: ProductSlugRecord) {
    if (doc.slug) {
        return doc;
    }

    const collection = await getCollection<ProductDocument>('products');
    const baseSlug = buildDefaultProductSlug(doc.name);
    let slug = baseSlug;
    let index = 2;

    while (true) {
        const existing = await collection.findOne({
            slug,
            _id: { $ne: doc._id },
        });

        if (!existing) {
            const updatedAt = new Date();
            await collection.updateOne({ _id: doc._id }, { $set: { slug, updatedAt } });
            return {
                ...doc,
                slug,
                updatedAt,
            };
        }

        slug = `${baseSlug}-${index}`;
        index += 1;
    }
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

    const ensuredDoc = await persistMissingSlug(doc);
    const product = toProduct(ensuredDoc);

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
    const docs = await collection.find({}, { projection: { _id: 1, slug: 1, name: 1, updatedAt: 1 } }).toArray() as ProductSlugRecord[];
    const slugs: string[] = [];

    for (const doc of docs) {
        const ensuredDoc = await persistMissingSlug(doc);
        if (ensuredDoc.slug) {
            slugs.push(ensuredDoc.slug);
        }
    }

    return slugs;
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
