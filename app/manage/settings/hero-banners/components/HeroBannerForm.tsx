'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';
import { SingleImageUploader } from '@/components/ui/SingleImageUploader';
import {
    HeroBanner,
    CreateHeroBannerInput,
    UpdateHeroBannerInput,
    CreateHeroBannerSchema,
    UpdateHeroBannerSchema,
} from '@/lib/app-settings/app-settings.schema';

interface HeroBannerFormProps {
    mode: 'create' | 'edit';
    initialData?: HeroBanner;
    bannerId?: string;
    onSuccess?: () => void;
}

export default function HeroBannerForm({ mode, initialData, bannerId, onSuccess }: HeroBannerFormProps) {
    const { showToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);

    const defaultValues: HeroBanner = initialData || {
        imagePath: '',
        title: '',
        description: '',
        price: 0,
        offerPrice: 0,
        offerLabel: '',
    };

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<CreateHeroBannerInput | UpdateHeroBannerInput>({
        resolver: zodResolver(mode === 'create' ? CreateHeroBannerSchema : UpdateHeroBannerSchema),
        defaultValues,
    });

    const currentImagePath = watch('imagePath');

    const handleImageChange = (file: File | null) => {
        setImageFile(file);
        if (file) {
            // We set a temporary path or just keep it empty, validation might fail if empty.
            // But since we handle FormData, we can bypass validation or ensure schema allows empty if file is present.
            // However, the schema requires imagePath.
            // We can set a dummy value to satisfy client-side validation if needed, 
            // or we rely on the fact that we are sending FormData.
            // Let's set a dummy value if it's empty.
            setValue('imagePath', file.name, { shouldValidate: true });
        } else if (!initialData?.imagePath) {
            setValue('imagePath', '', { shouldValidate: true });
        }
    };

    const onSubmit = async (data: CreateHeroBannerInput | UpdateHeroBannerInput) => {
        setIsSubmitting(true);
        try {
            const url =
                mode === 'create'
                    ? '/api/admin/settings/hero-banners'
                    : `/api/admin/settings/hero-banners/${bannerId}`;

            const method = mode === 'create' ? 'POST' : 'PATCH';

            const formData = new FormData();
            formData.append('title', data.title);
            formData.append('description', data.description);
            formData.append('price', String(data.price));
            formData.append('offerPrice', String(data.offerPrice));
            formData.append('offerLabel', data.offerLabel);

            if (imageFile) {
                formData.append('image', imageFile);
            } else if (data.imagePath) {
                formData.append('imagePath', data.imagePath);
            }

            const response = await fetch(url, {
                method,
                body: formData,
            });

            // Handle non-JSON or error responses gracefully
            const contentType = response.headers.get('content-type');
            let result;

            if (contentType && contentType.includes('application/json')) {
                result = await response.json();
            } else {
                const errorText = await response.text();
                console.error('Non-JSON response received:', errorText);
                throw new Error(`Server error (${response.status}). The image might be too large or the server encountered an issue.`);
            }

            if (!response.ok) {
                throw new Error(result.message || `Failed to ${mode} banner`);
            }

            showToast(
                mode === 'create' ? 'Banner created successfully' : 'Banner updated successfully',
                'success'
            );
            onSuccess?.();
        } catch (error: any) {
            console.error('Form submission error:', error);
            showToast(error.message || 'Something went wrong', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6 bg-[var(--bg-elevated)] p-6 rounded-lg shadow-md border border-[var(--border-subtle)]"
        >
            <div className="mb-4">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                    {mode === 'create' ? 'Create New Banner' : 'Edit Banner'}
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <SingleImageUploader
                        label="Banner Image"
                        value={imageFile ? URL.createObjectURL(imageFile) : currentImagePath}
                        onChange={handleImageChange}
                        error={errors.imagePath?.message}
                    />
                    {/* Hidden input to register imagePath for validation if needed, 
                        though SingleImageUploader handles visual feedback. 
                        We keep it registered via setValue but no visual input. */}
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
                    {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Banner' : 'Save Changes'}
                </button>
            </div>
        </form>
    );
}
