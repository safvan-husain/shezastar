// app/manage/brands/components/BrandForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import Image from 'next/image';

interface BrandFormProps {
    initialData?: {
        id?: string;
        name: string;
        imageUrl: string;
    };
}

export function BrandForm({ initialData }: BrandFormProps) {
    const router = useRouter();
    const { showToast } = useToast();
    const [name, setName] = useState(initialData?.name || '');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>(initialData?.imageUrl || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) {
            setError('Brand name is required');
            return;
        }

        if (!previewUrl) {
            setError('Brand image is required');
            return;
        }

        const url = initialData?.id
            ? `/api/brands/${initialData.id}`
            : '/api/brands';

        const method = initialData?.id ? 'PUT' : 'POST';

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('name', name);
            if (imageFile) {
                formData.append('image', imageFile);
            }

            const res = await fetch(url, {
                method,
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                const errorMessage = data.error || 'Failed to save brand';
                setError(errorMessage);
                setLoading(false);
                return;
            }

            showToast(
                initialData?.id ? 'Brand updated successfully' : 'Brand created successfully',
                'success'
            );

            router.push('/manage/brands');
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!initialData?.id) return;
        if (!confirm('Are you sure you want to delete this brand?')) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/brands/${initialData.id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || 'Failed to delete brand');
                setLoading(false);
                return;
            }

            showToast('Brand deleted successfully', 'success');
            router.push('/manage/brands');
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-[var(--danger)]/10 border-2 border-[var(--danger)] text-[var(--danger)] px-5 py-4 rounded-xl">
                    <p className="font-semibold">Error</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}

            <Card>
                <div className="space-y-6">
                    <Input
                        label="Brand Name"
                        placeholder="e.g., Apple, Nike, Samsung"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--foreground)]">Brand Image</label>
                        <div className="flex items-start gap-4">
                            <div className="relative w-32 h-32 rounded-xl border-2 border-dashed border-[var(--border)] overflow-hidden flex items-center justify-center bg-[var(--bg-subtle)]">
                                {previewUrl ? (
                                    <Image
                                        src={previewUrl}
                                        alt="Preview"
                                        fill
                                        className="object-contain"
                                    />
                                ) : (
                                    <svg className="w-8 h-8 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                )}
                            </div>
                            <div className="space-y-2">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="block w-full text-sm text-[var(--muted-foreground)]
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-full file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-[var(--primary)] file:text-[var(--primary-foreground)]
                                        hover:file:bg-[var(--primary)]/90"
                                />
                                <p className="text-xs text-[var(--muted-foreground)]">
                                    PNG, JPG or WebP. Max 5MB.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="fixed bottom-0 left-0 right-0 bg-[var(--bg-base)]/80 backdrop-blur-md border-t border-[var(--border)] p-4 z-50">
                <div className="max-w-6xl mx-auto flex justify-between gap-4">
                    <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={() => router.push('/manage/brands')}>
                            Cancel
                        </Button>
                        {initialData?.id && (
                            <Button type="button" variant="danger" onClick={handleDelete} disabled={loading}>
                                Delete Brand
                            </Button>
                        )}
                    </div>
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Saving...' : initialData?.id ? 'Update Brand' : 'Create Brand'}
                    </Button>
                </div>
            </div>
            <div className="h-24"></div>
        </form>
    );
}
