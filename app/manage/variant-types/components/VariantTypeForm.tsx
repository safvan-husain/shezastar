// app/(admin)/variant-types/components/VariantTypeForm.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
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
    const { showToast } = useToast();
    const [name, setName] = useState(initialData?.name || '');
    const [items, setItems] = useState<VariantItem[]>(initialData?.items || []);
    const [newItemName, setNewItemName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const addItem = () => {
        if (!newItemName.trim()) return;

        setItems([...items, { id: nanoid(), name: newItemName.trim() }]);
        setNewItemName('');
        setSuccess('Item added successfully');
        if (successTimeoutRef.current) {
            clearTimeout(successTimeoutRef.current);
            successTimeoutRef.current = null;
        }
        successTimeoutRef.current = setTimeout(() => {
            setSuccess('');
            successTimeoutRef.current = null;
        }, 2000);
    };

    useEffect(() => {
        return () => {
            if (successTimeoutRef.current) {
                clearTimeout(successTimeoutRef.current);
            }
        };
    }, []);

    const removeItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!name.trim()) {
            setError('Variant type name is required');
            return;
        }

        if (items.length === 0) {
            setError('At least one item is required');
            return;
        }

        const url = initialData?.id
            ? `/api/variant-types/${initialData.id}`
            : '/api/variant-types';

        const method = initialData?.id ? 'PUT' : 'POST';

        setLoading(true);

        try {

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, items }),
            });

            if (!res.ok) {
                const data = await res.json();
                const errorMessage = data.message || data.error || 'Failed to save variant type';

                showToast(errorMessage, 'error', {
                    status: res.status,
                    body: data,
                    url: res.url,
                    method,
                });

                setError(errorMessage);
                setLoading(false);
                return;
            }

            showToast(
                initialData?.id ? 'Variant type updated successfully' : 'Variant type created successfully',
                'success'
            );

            router.push('/variant-types');
            router.refresh();
        } catch (err: any) {
            const errorMessage = err.message || 'An unexpected error occurred';
            showToast(errorMessage, 'error', {
                url,
                method,
                body: { error: errorMessage },
            });
            setError(errorMessage);
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!initialData?.id) return;

        if (!confirm('Are you sure you want to delete this variant type? This action cannot be undone.')) {
            return;
        }

        const url = `/api/variant-types/${initialData.id}`;
        const method = 'DELETE';

        setLoading(true);

        try {
            const res = await fetch(url, {
                method,
            });

            if (!res.ok) {
                const data = await res.json();
                const errorMessage = data.message || data.error || data.details?.message || 'Failed to delete variant type';

                showToast(errorMessage, 'error', {
                    status: res.status,
                    body: data,
                    url: res.url,
                    method: 'DELETE',
                });

                setError(errorMessage);
                setLoading(false);
                return;
            }

            showToast('Variant type deleted successfully', 'success');

            router.push('/variant-types');
            router.refresh();
        } catch (err: any) {
            const errorMessage = err.message || 'An unexpected error occurred';
            showToast(errorMessage, 'error', {
                url,
                method,
                body: { error: errorMessage },
            });
            setError(errorMessage);
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Alert */}
            {error && (
                <div className="bg-[var(--danger)]/10 border-2 border-[var(--danger)] text-[var(--danger)] px-5 py-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <p className="font-semibold">Error</p>
                        <p className="text-sm">{error}</p>
                    </div>
                </div>
            )}

            {/* Success Alert */}
            {success && (
                <div className="bg-[var(--success)]/10 border-2 border-[var(--success)] text-[var(--success)] px-5 py-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-semibold">{success}</p>
                </div>
            )}

            {/* Basic Information Card */}
            <Card>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--ring)] flex items-center justify-center">
                        <svg className="w-5 h-5 text-[var(--primary-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-[var(--foreground)]">Basic Information</h2>
                </div>
                <Input
                    label="Variant Type Name"
                    placeholder="e.g., Color, Size, Storage"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                <p className="text-sm text-[var(--muted-foreground)] mt-2">
                    Choose a descriptive name for this variant type
                </p>
            </Card>

            {/* Items Card */}
            <Card>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-[var(--bg-subtle)] flex items-center justify-center">
                        <svg className="w-5 h-5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-[var(--foreground)]">Items</h2>
                        <p className="text-sm text-[var(--muted-foreground)]">
                            {items.length} {items.length === 1 ? 'item' : 'items'} added
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 mb-6">
                    <Input
                        placeholder="Add item (e.g., Red, Large, 128GB)"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                addItem()
                            }
                        }}
                    />
                    <Button type="button" onClick={addItem} className="whitespace-nowrap">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add
                    </Button>
                </div>

                {items.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-[var(--border)] rounded-xl">
                        <div className="w-16 h-16 mx-auto rounded-full bg-[var(--muted)] flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                        </div>
                        <p className="text-[var(--muted-foreground)] font-medium">No items added yet</p>
                        <p className="text-sm text-[var(--muted-foreground)] mt-1">Add your first item to get started</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {items.map((item, index) => (
                            <div
                                key={item.id}
                                className="flex justify-between items-center p-4 bg-[var(--accent)] rounded-lg border border-[var(--border)] hover:border-[var(--primary)] transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--ring)] flex items-center justify-center text-[var(--primary-foreground)] text-sm font-bold">
                                        {index + 1}
                                    </div>
                                    <span className="font-medium text-[var(--foreground)]">{item.name}</span>
                                </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removeItem(item.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Remove
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Action Buttons */}
            <div className="fixed bottom-0 left-0 right-0 bg-[var(--bg-base)]/80 backdrop-blur-md border-t border-[var(--border)] p-4 z-50">
                <div className="max-w-6xl mx-auto flex flex-wrap gap-3 items-center justify-between">
                    <div className="flex flex-wrap gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={() => router.push('/manage/variant-types')}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel
                        </Button>
                        {initialData?.id && (
                            <Button
                                type="button"
                                variant="danger"
                                size="lg"
                                onClick={handleDelete}
                                disabled={loading}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1 1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete Variant Type
                            </Button>
                        )}
                    </div>
                    <Button type="submit" disabled={loading} size="lg">
                        {loading ? (
                            <>
                                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {initialData?.id ? 'Update Variant Type' : 'Create Variant Type'}
                            </>
                        )}
                    </Button>
                </div>
            </div>
            {/* Spacer for fixed bar */}
            <div className="h-24"></div>
        </form>
    );
}
