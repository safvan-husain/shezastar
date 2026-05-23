import { cacheLife, cacheTag, revalidatePath, revalidateTag } from 'next/cache';
import { getCachedCollection } from '@/lib/db/mongo-client';
import { CategoryDocument, toCategories } from './model/category.model';

const CATEGORIES_CACHE_TAG = 'categories';

export async function getCachedAllCategories() {
    'use cache';
    cacheLife('days');
    cacheTag(CATEGORIES_CACHE_TAG);

    const collection = await getCachedCollection<CategoryDocument>('categories');
    const docs = await collection.find({}).sort({ name: 1 }).toArray();
    return toCategories(docs);
}

export function revalidateCategoryCache() {
    revalidateTag(CATEGORIES_CACHE_TAG, { expire: 0 });
    revalidatePath('/(store)', 'layout');
    revalidatePath('/(store)/category', 'page');
    revalidatePath('/manage/categories', 'page');
}
