'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { HeroBannerWithId } from '@/lib/app-settings/app-settings.schema';
import HeroBannerForm from './HeroBannerForm';

interface HeroBannerListProps {
    initialBanners: HeroBannerWithId[];
}


export default function HeroBannerList({ initialBanners }: HeroBannerListProps) {
    const router = useRouter();
    const { showToast } = useToast();
    const [banners, setBanners] = useState(initialBanners);
    const [editingBanner, setEditingBanner] = useState<HeroBannerWithId | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmingBanner, setConfirmingBanner] = useState<HeroBannerWithId | null>(null);

    // Sync local state when initialBanners changes after router.refresh()
    useEffect(() => {
        if (!isCreating && !editingBanner) {
            setBanners(initialBanners);
        }
    }, [initialBanners, isCreating, editingBanner]);
    const handleDelete = async () => {
        if (!confirmingBanner) return;

        setDeletingId(confirmingBanner.id);
        try {
            const response = await fetch(`/api/admin/settings/hero-banners/${confirmingBanner.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || 'Failed to delete banner');
            }

            showToast('Banner deleted successfully', 'success');
            setBanners(banners.filter(b => b.id !== confirmingBanner.id));
            setConfirmingBanner(null);
            router.refresh();
        } catch (error: any) {
            const message = error instanceof Error ? error.message : 'Something went wrong';
            showToast(message, "error");
        } finally {
            setDeletingId(null);
        }
    };

    const handleCreateSuccess = () => {
        setIsCreating(false);
        router.refresh();
    };

    const handleEditSuccess = () => {
        setEditingBanner(null);
        router.refresh();
    };

    if (isCreating) {
        return (
            <div>
                <button
                    onClick={() => setIsCreating(false)}
                    className="mb-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                    ← Back to list
                </button>
                <HeroBannerForm mode="create" onSuccess={handleCreateSuccess} />
            </div>
        );
    }

    if (editingBanner) {
        return (
            <div>
                <button
                    onClick={() => setEditingBanner(null)}
                    className="mb-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                    ← Back to list
                </button>
                <HeroBannerForm
                    mode="edit"
                    initialData={editingBanner}
                    bannerId={editingBanner.id}
                    onSuccess={handleEditSuccess}
                />
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <button
                    onClick={() => setIsCreating(true)}
                    className="px-6 py-2 bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary-hover)] transition-colors font-medium"
                >
                    + Add New Banner
                </button>
            </div>

            {banners.length === 0 ? (
                <div className="text-center py-12 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)]">
                    <p className="text-[var(--text-secondary)] mb-4">No hero banners yet</p>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="px-6 py-2 bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary-hover)] transition-colors font-medium"
                    >
                        Create your first banner
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {banners.map((banner) => (
                        <div
                            key={banner.id}
                            className="bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)] overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                        >
                            <div className="aspect-video bg-[var(--bg-base)] relative">
                                {banner.imagePath ? (
                                    <img
                                        src={banner.imagePath}
                                        alt={banner.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[var(--text-secondary)]">
                                        No Image
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 bg-[var(--primary)] text-white px-2 py-1 rounded text-xs font-medium">
                                    {banner.offerLabel}
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="text-lg font-semibold mb-2 text-[var(--text-primary)]">
                                    {banner.title}
                                </h3>
                                <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">
                                    {banner.description}
                                </p>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-lg font-bold text-[var(--primary)]">
                                        ₹{banner.offerPrice}
                                    </span>
                                    <span className="text-sm text-[var(--text-secondary)] line-through">
                                        ₹{banner.price}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setEditingBanner(banner)}
                                        className="flex-1 px-4 py-2 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-md hover:bg-[var(--bg-elevated)] transition-colors text-[var(--text-primary)] font-medium"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setConfirmingBanner(banner)}
                                        disabled={deletingId === banner.id}
                                        className="flex-1 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                    >
                                        {deletingId === banner.id ? 'Deleting...' : 'Delete'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmDialog
                isOpen={Boolean(confirmingBanner)}
                onClose={() => setConfirmingBanner(null)}
                onConfirm={handleDelete}
                title="Delete hero banner"
                message={`Are you sure you want to delete "${confirmingBanner?.title}"? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
                isLoading={Boolean(deletingId)}
            />
        </div>
    );
}
