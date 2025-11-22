// app/(admin)/variant-types/components/VariantTypeForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { nanoid } from 'nanoid';

interface VariantItem {
    id: string;
    name: string;
}

interface VariantTypeFormProps {
    initialData?: {
        id?: string;
        name: string;
        items: VariantItem[];
    };
}

export function VariantTypeForm({ initialData }: VariantTypeFormProps) {
    const router = useRouter();
    const [name, setName] = useState(initialData?.name || '');
    const [items, setItems] = useState<VariantItem[]>(initialData?.items || []);
    const [newItemName, setNewItemName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const addItem = () => {
        if (!newItemName.trim()) return;

        setItems([...items, { id: nanoid(), name: newItemName.trim() }]);
        setNewItemName('');
    };

    const removeItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) {
            setError('Variant type name is required');
            return;
        }

        if (items.length === 0) {
            setError('At least one item is required');
            return;
        }

        setLoading(true);

        try {
            const url = initialData?.id
                ? `/api/variant-types/${initialData.id}`
                : '/api/variant-types';

            const method = initialData?.id ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, items }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to save variant type');
            }

            router.push('/variant-types');
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!initialData?.id) return;

        if (!confirm('Are you sure you want to delete this variant type?')) {
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`/api/variant-types/${initialData.id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || data.details?.message || 'Failed to delete variant type');
            }

            router.push('/variant-types');
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            <Card>
                <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
                <Input
                    label="Variant Type Name"
                    placeholder="e.g., Color, Size, Storage"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </Card>

            <Card>
                <h2 className="text-lg font-semibold mb-4">Items</h2>

                <div className="flex gap-2 mb-4">
                    <Input
                        placeholder="Add item (e.g., Red, Large, 128GB)"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())}
                    />
                    <Button type="button" onClick={addItem}>
                        Add
                    </Button>
                </div>

                {items.length === 0 ? (
                    <p className="text-gray-500 text-sm">No items added yet</p>
                ) : (
                    <div className="space-y-2">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className="flex justify-between items-center p-3 bg-gray-50 rounded"
                            >
                                <span>{item.name}</span>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="danger"
                                    onClick={() => removeItem(item.id)}
                                >
                                    Remove
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : initialData?.id ? 'Update' : 'Create'}
                </Button>
                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => router.push('/variant-types')}
                >
                    Cancel
                </Button>
                {initialData?.id && (
                    <Button
                        type="button"
                        variant="danger"
                        onClick={handleDelete}
                        disabled={loading}
                        className="ml-auto"
                    >
                        Delete
                    </Button>
                )}
            </div>
        </form>
    );
}
