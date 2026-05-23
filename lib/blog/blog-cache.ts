import { cacheLife, cacheTag, revalidatePath, revalidateTag } from 'next/cache';
import { getCachedCollection } from '@/lib/db/mongo-client';
import { AppError } from '@/lib/errors/app-error';
import { BlogDocument, toBlog } from './model/blog.model';

export const BLOGS_CACHE_TAG = 'blogs';

export type CachedBlogSitemapEntry = {
    slug: string;
    updatedAt: string;
};

export function blogCacheTag(slug: string) {
    return `blog:${slug}`;
}

export async function getCachedPublishedBlogBySlug(slug: string) {
    'use cache';
    cacheLife('days');
    cacheTag(BLOGS_CACHE_TAG, blogCacheTag(slug));

    const collection = await getCachedCollection<BlogDocument>('blogs');
    const doc = await collection.findOne({ slug, status: 'published' });

    if (!doc) {
        throw new AppError(404, 'BLOG_NOT_FOUND', {
            message: 'Blog not found',
        });
    }

    return toBlog(doc);
}

export async function getCachedPublishedBlogSlugs() {
    'use cache';
    cacheLife('days');
    cacheTag(BLOGS_CACHE_TAG);

    const collection = await getCachedCollection<BlogDocument>('blogs');
    const docs = await collection
        .find({ status: 'published' }, { projection: { slug: 1 } })
        .toArray();

    return docs.map((doc) => doc.slug);
}

export async function getCachedPublishedBlogSitemapEntries(): Promise<CachedBlogSitemapEntry[]> {
    'use cache';
    cacheLife('days');
    cacheTag(BLOGS_CACHE_TAG);

    const collection = await getCachedCollection<BlogDocument>('blogs');
    const docs = await collection
        .find({ status: 'published' }, { projection: { slug: 1, updatedAt: 1 } })
        .toArray();

    return docs.map((doc) => ({
        slug: doc.slug,
        updatedAt: doc.updatedAt.toISOString(),
    }));
}

export function revalidateBlogCache() {
    revalidateTag(BLOGS_CACHE_TAG, { expire: 0 });
}

export function revalidateBlogPages(slug?: string) {
    revalidateBlogCache();

    if (slug) {
        revalidateTag(blogCacheTag(slug), { expire: 0 });
    }

    revalidatePath('/(store)/blogs', 'page');

    if (slug) {
        revalidatePath(`/(store)/blogs/${slug}`, 'page');
    }
}
