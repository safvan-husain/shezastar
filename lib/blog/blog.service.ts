import { getCollection, ObjectId } from '@/lib/db/mongo-client';
import { AppError } from '@/lib/errors/app-error';
import type { CreateBlogInput, UpdateBlogInput } from './blog.schema';
import { BlogDocument, toBlog, toBlogs } from './model/blog.model';

const COLLECTION = 'blogs';

function normalizeSlugPart(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

async function buildUniqueSlug(title: string, existingId?: ObjectId) {
    const collection = await getCollection<BlogDocument>(COLLECTION);
    const baseSlug = normalizeSlugPart(title) || 'blog';
    let slug = baseSlug;
    let index = 2;

    while (true) {
        const filter: Record<string, unknown> = { slug };
        if (existingId) {
            filter._id = { $ne: existingId };
        }

        const existing = await collection.findOne(filter);
        if (!existing) return slug;

        slug = `${baseSlug}-${index}`;
        index += 1;
    }
}

function parseObjectId(id: string) {
    try {
        return new ObjectId(id);
    } catch {
        throw new AppError(400, 'INVALID_BLOG_ID', {
            message: 'Invalid blog id',
        });
    }
}

function resolvePublishedAt(inputStatus: 'draft' | 'published', previous?: BlogDocument) {
    if (inputStatus === 'published') {
        return previous?.publishedAt ?? new Date();
    }

    return undefined;
}

export async function createBlog(input: CreateBlogInput) {
    const collection = await getCollection<BlogDocument>(COLLECTION);
    const now = new Date();
    const slug = await buildUniqueSlug(input.title);

    const doc: Omit<BlogDocument, '_id'> = {
        title: input.title,
        slug,
        excerpt: input.excerpt,
        content: input.content,
        coverImageUrl: input.coverImageUrl || undefined,
        status: input.status,
        publishedAt: resolvePublishedAt(input.status),
        createdAt: now,
        updatedAt: now,
    };

    const result = await collection.insertOne(doc as BlogDocument);
    const created = await collection.findOne({ _id: result.insertedId });

    if (!created) {
        throw new AppError(500, 'FAILED_TO_CREATE_BLOG');
    }

    return toBlog(created);
}

export async function getBlog(id: string) {
    const collection = await getCollection<BlogDocument>(COLLECTION);
    const objectId = parseObjectId(id);
    const doc = await collection.findOne({ _id: objectId });

    if (!doc) {
        throw new AppError(404, 'BLOG_NOT_FOUND', {
            message: 'Blog not found',
        });
    }

    return toBlog(doc);
}

export async function getPublishedBlogBySlug(slug: string) {
    const collection = await getCollection<BlogDocument>(COLLECTION);
    const doc = await collection.findOne({ slug, status: 'published' });

    if (!doc) {
        throw new AppError(404, 'BLOG_NOT_FOUND', {
            message: 'Blog not found',
        });
    }

    return toBlog(doc);
}

export async function getAllBlogs(options: { status?: 'draft' | 'published' | 'all' } = {}) {
    const collection = await getCollection<BlogDocument>(COLLECTION);
    const filter = options.status && options.status !== 'all' ? { status: options.status } : {};
    const docs = await collection
        .find(filter)
        .sort({ publishedAt: -1, createdAt: -1 })
        .toArray();

    return toBlogs(docs);
}

export async function updateBlog(id: string, input: UpdateBlogInput) {
    const collection = await getCollection<BlogDocument>(COLLECTION);
    const objectId = parseObjectId(id);
    const existing = await collection.findOne({ _id: objectId });

    if (!existing) {
        throw new AppError(404, 'BLOG_NOT_FOUND', {
            message: 'Blog not found',
        });
    }

    const nextStatus = input.status ?? existing.status;
    const updateDoc: Partial<BlogDocument> = {
        updatedAt: new Date(),
        publishedAt: resolvePublishedAt(nextStatus, existing),
    };

    if (input.title !== undefined) {
        updateDoc.title = input.title;
        updateDoc.slug = await buildUniqueSlug(input.title, objectId);
    }

    if (input.excerpt !== undefined) updateDoc.excerpt = input.excerpt;
    if (input.content !== undefined) updateDoc.content = input.content;
    if (input.coverImageUrl !== undefined) updateDoc.coverImageUrl = input.coverImageUrl || undefined;
    if (input.status !== undefined) updateDoc.status = input.status;

    await collection.updateOne({ _id: objectId }, { $set: updateDoc });
    const updated = await collection.findOne({ _id: objectId });

    if (!updated) {
        throw new AppError(500, 'FAILED_TO_UPDATE_BLOG');
    }

    return toBlog(updated);
}

export async function deleteBlog(id: string) {
    const collection = await getCollection<BlogDocument>(COLLECTION);
    const objectId = parseObjectId(id);
    const result = await collection.deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
        throw new AppError(404, 'BLOG_NOT_FOUND', {
            message: 'Blog not found',
        });
    }

    return { success: true };
}
