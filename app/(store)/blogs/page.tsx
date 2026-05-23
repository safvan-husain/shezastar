import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ErrorToastHandler, type ToastErrorPayload } from '@/components/ErrorToastHandler';
import { getAllBlogs } from '@/lib/blog/blog.service';
import type { Blog } from '@/lib/blog/model/blog.model';
import { getStaticPageMetadata } from '@/lib/seo/static-page-seo';

export async function generateMetadata(): Promise<Metadata> {
    return getStaticPageMetadata('blogs');
}

async function fetchPublishedBlogs(): Promise<{ blogs: Blog[]; error: ToastErrorPayload | null }> {
    try {
        const blogs = await getAllBlogs({ status: 'published' });
        return { blogs, error: null };
    } catch (error) {
        return {
            blogs: [],
            error: {
                message: error instanceof Error ? error.message : 'Failed to load blogs',
                body: error instanceof Error ? { stack: error.stack } : { error },
                url: 'service:blog:getAllBlogs?status=published',
                method: 'GET',
            },
        };
    }
}

function formatDate(value?: string) {
    if (!value) return null;

    return new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(value));
}

export default async function BlogsPage() {
    const { blogs, error } = await fetchPublishedBlogs();

    return (
        <div className="min-h-screen bg-[var(--storefront-bg)] pt-24 md:pt-34 pb-16">
            {error && <ErrorToastHandler error={error} />}

            <section className="container mx-auto px-4">
                <div className="mb-10 border-b border-[var(--storefront-border)] pb-6">
                    <h1 className="text-3xl font-bold text-[var(--storefront-text-primary)] sm:text-4xl">
                        Blogs
                    </h1>
                    <p className="mt-3 max-w-2xl text-[var(--storefront-text-secondary)]">
                        Practical guides, product notes, and car accessory ideas from Sheza Star.
                    </p>
                </div>

                {error ? (
                    <div className="rounded-[var(--radius-md)] border border-[var(--storefront-border)] bg-[var(--storefront-bg-subtle)] p-8 text-center">
                        <h2 className="text-xl font-semibold text-[var(--storefront-text-primary)]">
                            Unable to load blogs
                        </h2>
                        <p className="mt-2 text-sm text-[var(--storefront-text-secondary)]">
                            We could not load the blog list right now. Please try again shortly.
                        </p>
                    </div>
                ) : blogs.length === 0 ? (
                    <div className="rounded-[var(--radius-md)] border border-[var(--storefront-border)] bg-[var(--storefront-bg-subtle)] p-8 text-center">
                        <h2 className="text-xl font-semibold text-[var(--storefront-text-primary)]">
                            No blogs available
                        </h2>
                        <p className="mt-2 text-sm text-[var(--storefront-text-secondary)]">
                            New posts will appear here once they are published.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {blogs.map((blog) => {
                            const publishedDate = formatDate(blog.publishedAt || blog.createdAt);

                            return (
                                <article
                                    key={blog.id}
                                    className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--storefront-border)] bg-[var(--storefront-bg)] shadow-[var(--storefront-shadow-sm)]"
                                >
                                    <Link href={`/blogs/${blog.slug}`} className="block h-full">
                                        <div className="relative aspect-[16/10] bg-[var(--storefront-bg-subtle)]">
                                            {blog.coverImageUrl ? (
                                                <Image src={blog.coverImageUrl} alt={blog.title} fill className="object-cover" />
                                            ) : (
                                                <div className="flex h-full items-center justify-center px-6 text-center text-sm text-[var(--storefront-text-muted)]">
                                                    Sheza Star Blog
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-3 p-5">
                                            {publishedDate && (
                                                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--storefront-text-muted)]">
                                                    {publishedDate}
                                                </p>
                                            )}
                                            <h2 className="line-clamp-2 text-xl font-bold leading-tight text-[var(--storefront-text-primary)]">
                                                {blog.title}
                                            </h2>
                                            <p className="line-clamp-4 text-sm leading-6 text-[var(--storefront-text-secondary)]">
                                                {blog.excerpt}
                                            </p>
                                            <p className="text-sm font-semibold text-[var(--storefront-text-primary)]">
                                                Read blog
                                            </p>
                                        </div>
                                    </Link>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
