import { revalidatePath, revalidateTag } from 'next/cache';

const CATEGORIES_CACHE_TAG = 'categories';

export function revalidateCategoryCache() {
    revalidateTag(CATEGORIES_CACHE_TAG, { expire: 0 });
    revalidatePath('/(store)', 'layout');
    revalidatePath('/(store)/category', 'page');
    revalidatePath('/manage/categories', 'page');
}
