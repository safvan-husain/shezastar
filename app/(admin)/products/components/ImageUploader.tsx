// app/(admin)/products/components/ImageUploader.tsx
'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/Button';

interface ImageFile {
    id: string;
    file?: File;
    url: string;
    preview: string;
}

interface ImageUploaderProps {
    images: ImageFile[];
    onChange: (images: ImageFile[]) => void;
}

function SortableImage({ image, onRemove }: { image: ImageFile; onRemove: () => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: image.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="relative group cursor-move"
        >
            <img
                src={image.preview}
                alt="Product"
                className="w-full h-32 object-cover rounded-lg"
            />
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                }}
                className="absolute top-2 right-2 bg-[var(--bg-base)] text-[var(--text-primary)] border border-[var(--border-subtle)] p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}

export function ImageUploader({ images, onChange }: ImageUploaderProps) {
    const [uploading, setUploading] = useState(false);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const newImages: ImageFile[] = acceptedFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            url: '',
            preview: URL.createObjectURL(file),
        }));

        onChange([...images, ...newImages]);
    }, [images, onChange]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp']
        },
        multiple: true,
    });

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = images.findIndex(img => img.id === active.id);
            const newIndex = images.findIndex(img => img.id === over.id);

            const newImages = [...images];
            const [removed] = newImages.splice(oldIndex, 1);
            newImages.splice(newIndex, 0, removed);

            onChange(newImages);
        }
    };

    const removeImage = (id: string) => {
        onChange(images.filter(img => img.id !== id));
    };

    return (
        <div className="space-y-4">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-[var(--border-strong)] bg-[var(--bg-subtle)]' : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                    }`}
            >
                <input {...getInputProps()} />
                <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                >
                    <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    {isDragActive ? 'Drop images here' : 'Drag & drop images here, or click to select'}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">PNG, JPG, JPEG, WEBP up to 5MB</p>
            </div>

            {images.length > 0 && (
                <div>
                    <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">
                        {images.length} {images.length === 1 ? 'image' : 'images'} (drag to reorder)
                    </p>
                    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={images.map(img => img.id)} strategy={verticalListSortingStrategy}>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {images.map((image) => (
                                    <SortableImage
                                        key={image.id}
                                        image={image}
                                        onRemove={() => removeImage(image.id)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            )}
        </div>
    );
}
