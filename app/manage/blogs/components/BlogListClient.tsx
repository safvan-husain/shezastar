'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import type { Blog } from '@/lib/blog/model/blog.model';

interface BlogListClientProps {
    initialBlogs: Blog[];
}

async function parseResponseBody(response: Response) {
    try {
        return await response.json();
    } catch {
        return { error: 'Failed to parse response body' };
    }
}

export function BlogListClient({ initialBlogs }: BlogListClientProps) {
    const router = useRouter();
    const { showToast } = useToast();
    const [blogs, setBlogs] = useState(initialBlogs);
    const [confirmingBlog, setConfirmingBlog] = useState<Blog | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirmingBlog) return;

        const url = `/api/blogs/${confirmingBlog.id}`;
        setIsDeleting(true);

        try {
            const response = await fetch(url, { method: 'DELETE' });

            if (!response.ok) {
                const body = await parseResponseBody(response);
                const message = body.message || body.error || 'Failed to delete blog';
                showToast(message, 'error', {
                    status: response.status,
                    body,
                    url: response.url,
                    method: 'DELETE',
                });
                return;
            }

            setBlogs((current) => current.filter((blog) => blog.id !== confirmingBlog.id));
            setConfirmingBlog(null);
            showToast('Blog deleted successfully', 'success');
            router.refresh();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete blog';
            showToast(message, 'error', {
                body: error instanceof Error ? { stack: error.stack } : { error },
                url,
                method: 'DELETE',
            });
        } finally {
            setIsDeleting(false);
        }
    };

    if (blogs.length === 0) {
        return (
            <Card className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--bg-subtle)]">
                    <svg className="h-10 w-10 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h9l5 5v9a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">No blogs found</h2>
                <p className="mx-auto mt-2 max-w-sm text-[var(--text-secondary)]">
                    Create the first blog to make it available on the storefront blog page.
                </p>
                <Link href="/manage/blogs/new" className="mt-6">
                    <Button variant="outline">Create your first blog</Button>
                </Link>
            </Card>
        );
    }

    return (
        <>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {blogs.map((blog) => (
                    <Card key={blog.id} className="overflow-hidden p-0">
                        <div className="relative aspect-[16/9] bg-[var(--bg-subtle)]">
                            {blog.coverImageUrl ? (
                                <Image src={blog.coverImageUrl} alt={blog.title} fill className="object-cover" />
                            ) : (
                                <div className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">
                                    No cover image
                                </div>
                            )}
                            <span className="absolute left-3 top-3 rounded-[var(--radius-lg)] bg-[var(--bg-base)] px-3 py-1 text-xs font-semibold text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
                                {blog.status === 'published' ? 'Published' : 'Draft'}
                            </span>
                        </div>
                        <div className="space-y-4 p-5">
                            <div>
                                <h2 className="line-clamp-2 text-lg font-bold text-[var(--text-primary)]">
                                    {blog.title}
                                </h2>
                                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--text-secondary)]">
                                    {blog.excerpt}
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-4">
                                <span className="text-xs text-[var(--text-muted)]">
                                    {new Date(blog.updatedAt).toLocaleDateString()}
                                </span>
                                <div className="flex gap-2">
                                    <Link href={`/manage/blogs/${blog.id}`}>
                                        <Button size="sm" variant="outline">Edit</Button>
                                    </Link>
                                    <Button size="sm" variant="danger" onClick={() => setConfirmingBlog(blog)}>
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <ConfirmDialog
                isOpen={Boolean(confirmingBlog)}
                onClose={() => setConfirmingBlog(null)}
                onConfirm={handleDelete}
                title="Delete blog"
                message={`Delete "${confirmingBlog?.title || 'this blog'}"? This cannot be undone.`}
                confirmText="Delete"
                variant="danger"
                isLoading={isDeleting}
            />
        </>
    );
}
