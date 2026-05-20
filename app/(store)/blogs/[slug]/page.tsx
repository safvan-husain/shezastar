import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublishedBlogBySlug } from '@/lib/blog/blog.service';

interface BlogDetailPageProps {
    params: Promise<{ slug: string }>;
}

function formatDate(value?: string) {
    if (!value) return null;

    return new Intl.DateTimeFormat('en', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(value));
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
    const { slug } = await params;
    const blog = await getPublishedBlogBySlug(slug).catch(() => null);

    if (!blog) {
        return {
            title: 'Blog | Sheza Star',
        };
    }

    return {
        title: `${blog.title} | Sheza Star`,
        description: blog.excerpt,
    };
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
    const { slug } = await params;
    const blog = await getPublishedBlogBySlug(slug).catch(() => null);

    if (!blog) {
        notFound();
    }

    const publishedDate = formatDate(blog.publishedAt || blog.createdAt);

    return (
        <div className="min-h-screen bg-[var(--storefront-bg)] pt-24 md:pt-34 pb-16">
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
