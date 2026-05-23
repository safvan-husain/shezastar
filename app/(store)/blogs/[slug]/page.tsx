import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Blog } from '@/lib/blog/model/blog.model';
import {
    getCachedPublishedBlogBySlug,
    getCachedPublishedBlogSlugs,
} from '@/lib/blog/blog-cache';
import { AppError } from '@/lib/errors/app-error';
import { buildBlogCanonicalUrl, buildBlogPath } from '@/lib/seo/canonical';
import { buildSocialMetadata, serializeJsonLd, resolveMetadataImageUrl } from '@/lib/seo/metadata';

interface BlogDetailPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
    const slugs = await getCachedPublishedBlogSlugs();
    return slugs.map((slug) => ({ slug }));
}

function formatDate(value?: string) {
    if (!value) return null;

    return new Intl.DateTimeFormat('en', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(value));
}

function getBlogStructuredData(blog: Blog) {
    const canonicalUrl = buildBlogCanonicalUrl(blog.slug);
    const datePublished = blog.publishedAt || blog.createdAt;

    return {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: blog.title,
        description: blog.excerpt,
        image: blog.coverImageUrl
            ? [resolveMetadataImageUrl(blog.coverImageUrl)].filter(Boolean)
            : undefined,
        datePublished,
        dateModified: blog.updatedAt,
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': canonicalUrl,
        },
    };
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
    const { slug } = await params;

    try {
        const blog = await getCachedPublishedBlogBySlug(slug);
        const title = `${blog.title} | Sheza Star`;

        return {
            title,
            description: blog.excerpt,
            ...buildSocialMetadata({
                title,
                description: blog.excerpt,
                canonicalPath: buildBlogPath(slug),
                imageUrl: blog.coverImageUrl,
                type: 'article',
                publishedTime: blog.publishedAt || blog.createdAt,
                modifiedTime: blog.updatedAt,
            }),
        };
    } catch {
        return {
            title: 'Blog | Sheza Star',
        };
    }
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
    const { slug } = await params;

    return <CachedBlogPage slug={slug} />;
}

async function CachedBlogPage({ slug }: { slug: string }) {
    'use cache';

    let blog: Blog | null = null;

    try {
        blog = await getCachedPublishedBlogBySlug(slug);
    } catch (error) {
        if (error instanceof AppError && error.status === 404) {
            notFound();
        }
        throw error;
    }

    const publishedDate = formatDate(blog.publishedAt || blog.createdAt);

    return (
        <div className="min-h-screen bg-[var(--storefront-bg)] pt-24 md:pt-34 pb-16">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: serializeJsonLd(getBlogStructuredData(blog)) }}
            />
            <article className="container mx-auto max-w-6xl px-4">
                <nav aria-label="Breadcrumb" className="mb-8 text-sm">
                    <ol className="flex flex-wrap items-center gap-2 text-[var(--storefront-text-muted)]">
                        <li>
                            <Link
                                href="/"
                                className="font-medium text-[var(--storefront-text-secondary)] transition-colors hover:text-[var(--storefront-text-primary)]"
                            >
                                Home
                            </Link>
                        </li>
                        <li aria-hidden="true">/</li>
                        <li>
                            <Link
                                href="/blogs"
                                className="font-medium text-[var(--storefront-text-secondary)] transition-colors hover:text-[var(--storefront-text-primary)]"
                            >
                                Blogs
                            </Link>
                        </li>
                        <li aria-hidden="true">/</li>
                        <li className="max-w-[18rem] truncate font-semibold text-[var(--storefront-text-primary)] sm:max-w-lg">
                            {blog.title}
                        </li>
                    </ol>
                </nav>

                <header className="mb-8 border-b border-[var(--storefront-border)] pb-8">
                    {publishedDate && (
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--storefront-text-muted)]">
                            {publishedDate}
                        </p>
                    )}
                    <h1 className="text-3xl font-bold leading-tight text-[var(--storefront-text-primary)] sm:text-5xl">
                        {blog.title}
                    </h1>
                    <p className="mt-5 text-lg leading-8 text-[var(--storefront-text-secondary)]">
                        {blog.excerpt}
                    </p>
                </header>

                <div className={blog.coverImageUrl ? 'grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_420px]' : ''}>
                    <div
                        className="storefront-blog-content"
                        dangerouslySetInnerHTML={{ __html: blog.content }}
                    />

                    {blog.coverImageUrl && (
                        <div className="relative order-first aspect-[4/3] overflow-hidden rounded-[var(--radius-md)] border border-[var(--storefront-border)] bg-[var(--storefront-bg-subtle)] shadow-[var(--storefront-shadow-sm)] lg:sticky lg:top-32 lg:order-none">
                            <Image src={blog.coverImageUrl} alt={blog.title} fill className="object-cover" priority />
                        </div>
                    )}
                </div>
            </article>
        </div>
    );
}
