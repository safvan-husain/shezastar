'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { nanoid } from 'nanoid';

interface SubCategory {
    id: string;
    name: string;
}

interface CategoryFormProps {
    initialData?: {
        id: string;
        name: string;
        subCategories: SubCategory[];
    };
}

export function CategoryForm({ initialData }: CategoryFormProps) {
    const router = useRouter();
    const [name, setName] = useState(initialData?.name || '');
    const [subCategories, setSubCategories] = useState<SubCategory[]>(
        initialData?.subCategories || []
    );
    const [newSubCategoryName, setNewSubCategoryName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const addSubCategory = () => {
        if (!newSubCategoryName.trim()) return;

        setSubCategories([
            ...subCategories,
            { id: nanoid(), name: newSubCategoryName.trim() },
        ]);
        setNewSubCategoryName('');
    };

    const removeSubCategory = (id: string) => {
        setSubCategories(subCategories.filter((sub) => sub.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const url = initialData?.id
                ? `/api/categories/${initialData.id}`
                : '/api/categories';
            const method = initialData?.id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, subCategories }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to save category');
            }

            router.push('/categories');
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-[var(--danger)]/10 border-2 border-[var(--danger)] text-[var(--danger)] px-5 py-4 rounded-xl">
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium mb-2">
                    Category Name
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    placeholder="e.g., Electronics, Clothing"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">
                    Subcategories
                </label>
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newSubCategoryName}
                            onChange={(e) => setNewSubCategoryName(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addSubCategory();
                                }
                            }}
                            className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                            placeholder="e.g., Smartphones, Laptops"
                        />
                        <Button
                            type="button"
                            onClick={addSubCategory}
                            disabled={!newSubCategoryName.trim()}
                        >
                            Add
                        </Button>
                    </div>

                    {subCategories.length > 0 && (
                        <div className="space-y-2">
                            {subCategories.map((sub) => (
                                <div
                                    key={sub.id}
                                    className="flex items-center justify-between p-3 bg-[var(--muted)] rounded-lg"
                                >
                                    <span>{sub.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeSubCategory(sub.id)}
                                        className="text-[var(--danger)] hover:text-[var(--danger)]/80"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-3 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/categories')}
                    disabled={loading}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={loading || !name.trim()}>
                    {loading ? 'Saving...' : initialData?.id ? 'Update' : 'Create'}
                </Button>
            </div>
        </form>
    );
}
