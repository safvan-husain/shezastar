'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';

interface AddToFeaturedButtonProps {
    productId: string;
    show: boolean;
    onHide: () => void;
}

export default function AddToFeaturedButton({ productId, show, onHide }: AddToFeaturedButtonProps) {
    const { showToast } = useToast();
    const [adding, setAdding] = useState(false);

    const handleAdd = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setAdding(true);
        try {
            const response = await fetch('/api/admin/settings/featured-products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ productId }),
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || 'Failed to add product');
            }

            showToast('Product added to featured list', 'success');
            onHide();
        } catch (error: any) {
            const message = error instanceof Error ? error.message : 'Something went wrong';
            showToast(message, 'error');
        } finally {
            setAdding(false);
        }
    };

    if (!show) return null;

    return (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-10 animate-fade-in">
            <div className="flex flex-col gap-2 items-center">
                <button
                    onClick={handleAdd}
                    disabled={adding}
                    className="px-4 py-2 bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
                >
                    {adding ? 'Adding...' : '⭐ Add to Featured'}
                </button>
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onHide();
                    }}
                    className="px-3 py-1 text-white text-sm hover:text-gray-300 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
