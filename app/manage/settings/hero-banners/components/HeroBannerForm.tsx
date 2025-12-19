'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
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
            className="space-y-6 pb-24"
        >
            <Card className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--ring)] flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
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

            </Card>

            <div className="fixed bottom-0 left-0 right-0 bg-[var(--bg-base)]/80 backdrop-blur-md border-t border-[var(--border)] p-4 z-50">
                <div className="max-w-6xl mx-auto flex justify-end gap-3">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-[var(--primary)] text-white rounded-xl hover:bg-[var(--primary-hover)] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
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
                                {mode === 'create' ? 'Create Banner' : 'Save Changes'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}
