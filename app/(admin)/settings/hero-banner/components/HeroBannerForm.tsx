'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { HeroBanner, UpdateHeroBannerInput, UpdateHeroBannerSchema } from '@/lib/app-settings/app-settings.schema';

interface HeroBannerFormProps {
    initialData: HeroBanner;
}

export default function HeroBannerForm({ initialData }: HeroBannerFormProps) {
    const router = useRouter();
    const { showToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<UpdateHeroBannerInput>({
        resolver: zodResolver(UpdateHeroBannerSchema),
        defaultValues: initialData,
    });

    const onSubmit = async (data: UpdateHeroBannerInput) => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/admin/settings/hero-banner', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to update settings');
            }

            showToast('Hero banner updated successfully', 'success');
            router.refresh();
        } catch (error: any) {
            showToast(error.message || 'Something went wrong', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-[var(--bg-elevated)] p-6 rounded-lg shadow-md border border-[var(--border-subtle)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label htmlFor="imagePath" className="block text-sm font-medium text-[var(--text-secondary)]">
                        Image Path
                    </label>
                    <input
                        id="imagePath"
                        type="text"
                        {...register('imagePath')}
                        className="w-full px-4 py-2 rounded-md bg-[var(--bg-base)] border border-[var(--border-subtle)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-colors text-[var(--text-primary)]"
                        placeholder="/images/hero.jpg"
                    />
                    {errors.imagePath && (
                        <p className="text-red-500 text-xs mt-1">{errors.imagePath.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="title" className="block text-sm font-medium text-[var(--text-secondary)]">
                        Title
                    </label>
                    <input
                        id="title"
                        type="text"
                        {...register('title')}
                        className="w-full px-4 py-2 rounded-md bg-[var(--bg-base)] border border-[var(--border-subtle)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-colors text-[var(--text-primary)]"
                        placeholder="Summer Collection"
                    />
                    {errors.title && (
                        <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
                    )}
                </div>

                <div className="col-span-1 md:col-span-2 space-y-2">
                    <label htmlFor="description" className="block text-sm font-medium text-[var(--text-secondary)]">
                        Description
                    </label>
                    <textarea
                        id="description"
                        rows={3}
                        {...register('description')}
                        className="w-full px-4 py-2 rounded-md bg-[var(--bg-base)] border border-[var(--border-subtle)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-colors text-[var(--text-primary)]"
                        placeholder="Discover our latest arrivals..."
                    />
                    {errors.description && (
                        <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="price" className="block text-sm font-medium text-[var(--text-secondary)]">
                        Price
                    </label>
                    <input
                        id="price"
                        type="number"
                        step="0.01"
                        {...register('price', { valueAsNumber: true })}
                        className="w-full px-4 py-2 rounded-md bg-[var(--bg-base)] border border-[var(--border-subtle)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-colors text-[var(--text-primary)]"
                    />
                    {errors.price && (
                        <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="offerPrice" className="block text-sm font-medium text-[var(--text-secondary)]">
                        Offer Price
                    </label>
                    <input
                        id="offerPrice"
                        type="number"
                        step="0.01"
                        {...register('offerPrice', { valueAsNumber: true })}
                        className="w-full px-4 py-2 rounded-md bg-[var(--bg-base)] border border-[var(--border-subtle)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-colors text-[var(--text-primary)]"
                    />
                    {errors.offerPrice && (
                        <p className="text-red-500 text-xs mt-1">{errors.offerPrice.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="offerLabel" className="block text-sm font-medium text-[var(--text-secondary)]">
                        Offer Label
                    </label>
                    <input
                        id="offerLabel"
                        type="text"
                        {...register('offerLabel')}
                        className="w-full px-4 py-2 rounded-md bg-[var(--bg-base)] border border-[var(--border-subtle)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-colors text-[var(--text-primary)]"
                        placeholder="Limited Time Offer"
                    />
                    {errors.offerLabel && (
                        <p className="text-red-500 text-xs mt-1">{errors.offerLabel.message}</p>
                    )}
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
    );
}
