'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { useToast } from '@/components/ui/Toast';
import type { Blog } from '@/lib/blog/model/blog.model';

interface BlogFormProps {
    initialData?: Blog;
}

async function parseResponseBody(response: Response) {
    try {
        return await response.json();
    } catch {
        return { error: 'Failed to parse response body' };
    }
}

export function BlogForm({ initialData }: BlogFormProps) {
    const router = useRouter();
    const { showToast } = useToast();
    const [title, setTitle] = useState(initialData?.title || '');
    const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
    const [content, setContent] = useState(initialData?.content || '');
    const [status, setStatus] = useState<'draft' | 'published'>(initialData?.status || 'draft');
    const [coverImageUrl, setCoverImageUrl] = useState(initialData?.coverImageUrl || '');
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState(initialData?.coverImageUrl || '');
    const [loading, setLoading] = useState(false);
    const [fieldError, setFieldError] = useState('');

    const handleCoverImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setCoverImageFile(file);
        setCoverImageUrl('');
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setFieldError('');

        if (!title.trim()) {
            setFieldError('Blog title is required');
            return;
        }

        if (!excerpt.trim()) {
            setFieldError('Blog excerpt is required');
            return;
        }

        if (!content.trim() || content === '<p></p>') {
            setFieldError('Blog content is required');
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('excerpt', excerpt);
        formData.append('content', content);
        formData.append('status', status);
        formData.append('coverImageUrl', coverImageUrl);
        if (coverImageFile) {
            formData.append('coverImage', coverImageFile);
        }

        const url = initialData?.id ? `/api/blogs/${initialData.id}` : '/api/blogs';
        const method = initialData?.id ? 'PUT' : 'POST';

        setLoading(true);

        try {
            const response = await fetch(url, {
                method,
                body: formData,
            });

            if (!response.ok) {
                const body = await parseResponseBody(response);
                const message = body.message || body.error || 'Failed to save blog';
                setFieldError(message);
                showToast(message, 'error', {
                    status: response.status,
                    body,
                    url: response.url,
                    method,
                });
                return;
            }

            showToast(initialData?.id ? 'Blog updated successfully' : 'Blog created successfully', 'success');
            router.push('/manage/blogs');
            router.refresh();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to save blog';
            setFieldError(message);
            showToast(message, 'error', {
                body: error instanceof Error ? { stack: error.stack } : { error },
                url,
                method,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {fieldError && (
                <div className="rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-5 py-4 text-[var(--text-primary)]">
                    <p className="font-semibold">Error</p>
                    <p className="text-sm text-[var(--text-secondary)]">{fieldError}</p>
                </div>
            )}

            <Card>
                <div className="space-y-6">
                    <Input
                        label="Title"
                        placeholder="e.g. Essential upgrades for daily drives"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        required
                    />

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-[var(--text-secondary)]">
                            Excerpt
                        </label>
                        <textarea
                            value={excerpt}
                            onChange={(event) => setExcerpt(event.target.value)}
                            maxLength={500}
                            rows={4}
                            className="w-full rounded-[var(--radius-md)] border-2 border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                            placeholder="Short summary shown on the storefront blog grid."
                            required
                        />
                        <p className="text-xs text-[var(--text-muted)]">{excerpt.length}/500 characters</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                        <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
                            {previewUrl ? (
                                <Image src={previewUrl} alt="Blog cover preview" fill className="object-cover" />
                            ) : (
                                <div className="flex h-full items-center justify-center px-4 text-center text-sm text-[var(--text-muted)]">
                                    Cover preview
                                </div>
                            )}
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-[var(--text-secondary)]">
                                    Cover Image
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleCoverImageChange}
                                    className="block w-full text-sm text-[var(--text-secondary)] file:mr-4 file:rounded-[var(--radius-md)] file:border-0 file:bg-[var(--primary)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[var(--primary-foreground)]"
                                />
                            </div>
                            <Input
                                label="Or Image URL"
                                placeholder="https://..."
                                value={coverImageUrl}
                                onChange={(event) => {
                                    setCoverImageUrl(event.target.value);
                                    setCoverImageFile(null);
                                    setPreviewUrl(event.target.value);
                                }}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-[var(--text-secondary)]">
                            Status
                        </label>
                        <select
                            value={status}
                            onChange={(event) => setStatus(event.target.value as 'draft' | 'published')}
                            className="h-11 rounded-[var(--radius-md)] border-2 border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-4 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                        >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                        </select>
                        <p className="text-xs text-[var(--text-muted)]">
                            Draft blogs stay in the admin panel. Only published blogs appear on the storefront.
                        </p>
                    </div>

                    <RichTextEditor
                        label="Content"
                        previewLabel="TipTap Editor"
                        value={content}
                        onChange={setContent}
                        rows={14}
                        placeholder="Write the blog content..."
                    />
                </div>
            </Card>

            <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border-subtle)] bg-[var(--bg-base)]/90 p-4 backdrop-blur-md">
                <div className="mx-auto flex max-w-5xl justify-between gap-4">
                    <Button type="button" variant="outline" onClick={() => router.push('/manage/blogs')} disabled={loading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Saving...' : initialData?.id ? 'Update Blog' : 'Create Blog'}
                    </Button>
                </div>
            </div>
            <div className="h-24" />
        </form>
    );
}
