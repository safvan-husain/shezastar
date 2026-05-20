import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorToastHandler, type ToastErrorPayload } from '@/components/ErrorToastHandler';
import { getAllBlogs } from '@/lib/blog/blog.service';
import type { Blog } from '@/lib/blog/model/blog.model';
import { BlogListClient } from './components/BlogListClient';

async function fetchBlogs(): Promise<{ blogs: Blog[]; error: ToastErrorPayload | null }> {
    try {
        const blogs = await getAllBlogs({ status: 'all' });
        return { blogs, error: null };
    } catch (error) {
        return {
            blogs: [],
            error: {
                message: error instanceof Error ? error.message : 'Failed to load blogs',
                body: error instanceof Error ? { stack: error.stack } : { error },
                url: 'service:blog:getAllBlogs?status=all',
                method: 'GET',
            },
        };
    }
}

export default async function BlogsAdminPage() {
    const { blogs, error } = await fetchBlogs();

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {error && <ErrorToastHandler error={error} />}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">Blogs</h1>
                    <p className="text-[var(--text-secondary)]">Create and publish storefront blog cards.</p>
                </div>
                <Link href="/manage/blogs/new">
                    <Button>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Blog
                    </Button>
                </Link>
            </div>

            {error ? (
                <Card className="text-center py-16">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Unable to load blogs</h2>
                    <p className="mt-2 text-[var(--text-secondary)]">
                        Use the toast details to inspect the full failure.
                    </p>
                </Card>
            ) : (
                <BlogListClient initialBlogs={blogs} />
            )}
        </div>
    );
}
