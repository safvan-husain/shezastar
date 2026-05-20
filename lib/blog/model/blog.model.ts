import { ObjectId } from 'mongodb';

export type BlogStatus = 'draft' | 'published';

export interface BlogDocument {
    _id: ObjectId;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImageUrl?: string;
    status: BlogStatus;
    publishedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface Blog {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImageUrl?: string;
    status: BlogStatus;
    publishedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export function toBlog(doc: BlogDocument): Blog {
    return {
        id: doc._id.toString(),
        title: doc.title,
        slug: doc.slug,
        excerpt: doc.excerpt,
        content: doc.content,
        coverImageUrl: doc.coverImageUrl,
        status: doc.status,
        publishedAt: doc.publishedAt?.toISOString(),
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
    };
}

export function toBlogs(docs: BlogDocument[]): Blog[] {
    return docs.map(toBlog);
}
