'use client';

import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './Button';

interface SingleImageUploaderProps {
    value?: string;
    onChange: (file: File | null) => void;
    label?: string;
    error?: string;
}

export function SingleImageUploader({ value, onChange, label = 'Image', error }: SingleImageUploaderProps) {
    const [preview, setPreview] = useState<string | null>(value || null);

    useEffect(() => {
        if (value) {
            setPreview(value);
        }
    }, [value]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setPreview(objectUrl);
            onChange(file);
        }
    }, [onChange]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp']
        },
        maxFiles: 1,
        multiple: false,
    });

    const removeImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreview(null);
        onChange(null);
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">
                {label}
            </label>

            <div
                {...getRootProps()}
                className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors min-h-[200px] flex flex-col items-center justify-center ${isDragActive ? 'border-[var(--border-strong)] bg-[var(--bg-subtle)]' : 'border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                    } ${error ? 'border-red-500' : ''}`}
            >
                <input {...getInputProps()} />

                {preview ? (
                    <div className="relative w-full h-full min-h-[160px] flex items-center justify-center">
                        <img
                            src={preview}
                            alt="Preview"
                            className="max-h-[200px] max-w-full object-contain rounded-md"
                        />
                        <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ) : (
                    <>
                        <svg
                            className="mx-auto h-12 w-12 text-[var(--text-muted)]"
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
                            {isDragActive ? 'Drop image here' : 'Drag & drop image here, or click to select'}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">PNG, JPG, JPEG, WEBP up to 5MB</p>
                    </>
                )}
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}
