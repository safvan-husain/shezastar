// app/(admin)/products/components/steps/BasicInfoStep.tsx
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface BasicInfoStepProps {
    name: string;
    subtitle: string;
    description: string;
    basePrice: string;
    offerPrice: string;
    highlights: string[];
    specifications: Array<{ title: string; items: string[] }>;
    onNameChange: (value: string) => void;
    onSubtitleChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    onBasePriceChange: (value: string) => void;
    onOfferPriceChange: (value: string) => void;
    onHighlightsChange: (value: string[]) => void;
    onSpecificationsChange: (value: Array<{ title: string; items: string[] }>) => void;
}

export function BasicInfoStep({
    name,
    subtitle,
    description,
    basePrice,
    offerPrice,
    highlights,
    specifications,
    onNameChange,
    onSubtitleChange,
    onDescriptionChange,
    onBasePriceChange,
    onOfferPriceChange,
    onHighlightsChange,
    onSpecificationsChange,
}: BasicInfoStepProps) {
    const [newHighlight, setNewHighlight] = useState('');
    const [newSpecTitle, setNewSpecTitle] = useState('');
    return (
        <Card>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--ring)] flex items-center justify-center">
                    <svg className="w-5 h-5 text-[var(--text-inverted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-[var(--foreground)]">Basic Information</h2>
            </div>
            <div className="space-y-5">
                <Input
                    label="Product Name *"
                    value={name}
                    onChange={(e) => onNameChange(e.target.value)}
                    placeholder="e.g., Wireless Dash Cam"
                    required
                />
                <Input
                    label="Subtitle *"
                    value={subtitle}
                    onChange={(e) => onSubtitleChange(e.target.value)}
                    placeholder="e.g., 4K Ultra HD Dual Camera with Night Vision"
                    required
                />
                <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                        Description
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => onDescriptionChange(e.target.value)}
                        placeholder="Describe your product features and benefits..."
                        className="w-full px-4 py-3 border-2 border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] transition-all duration-200 resize-none"
                        rows={5}
                    />
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                    <Input
                        type="number"
                        label="Base Price *"
                        value={basePrice}
                        onChange={(e) => onBasePriceChange(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        required
                    />
                    <Input
                        type="number"
                        label="Offer Price (optional)"
                        value={offerPrice}
                        onChange={(e) => onOfferPriceChange(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                        Product Specifications
                    </label>
                    <p className="text-xs text-[var(--muted-foreground)] mb-3">
                        Detailed technical specs. Add a title (e.g., "Display") and its bullet points.
                    </p>

                    <div className="space-y-4">
                        {specifications.map((spec, sIndex) => (
                            <div key={sIndex} className="p-4 border-2 border-[var(--border)] rounded-xl space-y-3 bg-[var(--bg-subtle)]/30">
                                <div className="flex justify-between items-center">
                                    <input
                                        className="text-sm font-bold bg-transparent border-none focus:outline-none focus:ring-0 text-[var(--foreground)] w-full"
                                        value={spec.title}
                                        onChange={(e) => {
                                            const next = [...specifications];
                                            next[sIndex].title = e.target.value;
                                            onSpecificationsChange(next);
                                        }}
                                        placeholder="Specification Title (e.g. Dimensions)"
                                    />
                                    <button
                                        type="button"
                                        className="text-xs text-[var(--danger)] hover:underline"
                                        onClick={() => {
                                            const next = specifications.filter((_, i) => i !== sIndex);
                                            onSpecificationsChange(next);
                                        }}
                                    >
                                        Remove Section
                                    </button>
                                </div>

                                <div className="space-y-2 pl-2 border-l-2 border-[var(--primary)]/20">
                                    {spec.items.map((item, iIndex) => (
                                        <div key={iIndex} className="flex gap-2 items-center">
                                            <span className="text-[var(--primary)] text-xs">•</span>
                                            <input
                                                className="flex-1 text-sm bg-transparent border-none focus:outline-none focus:ring-0 text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                                                value={item}
                                                autoFocus={iIndex === spec.items.length - 1 && item === ''}
                                                onChange={(e) => {
                                                    const next = [...specifications];
                                                    next[sIndex].items[iIndex] = e.target.value;
                                                    onSpecificationsChange(next);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        const next = [...specifications];
                                                        next[sIndex].items.push('');
                                                        onSpecificationsChange(next);
                                                    } else if (e.key === 'Backspace' && item === '' && spec.items.length > 1) {
                                                        e.preventDefault();
                                                        const next = [...specifications];
                                                        next[sIndex].items.splice(iIndex, 1);
                                                        onSpecificationsChange(next);
                                                    }
                                                }}
                                                placeholder="Add a detail..."
                                            />
                                            <button
                                                type="button"
                                                className="text-[10px] text-[var(--muted-foreground)] hover:text-[var(--danger)]"
                                                onClick={() => {
                                                    const next = [...specifications];
                                                    next[sIndex].items.splice(iIndex, 1);
                                                    onSpecificationsChange(next);
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1"
                                        onClick={() => {
                                            const next = [...specifications];
                                            next[sIndex].items.push('');
                                            onSpecificationsChange(next);
                                        }}
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add Detail
                                    </button>
                                </div>
                            </div>
                        ))}

                        <div className="flex gap-2">
                            <Input
                                value={newSpecTitle}
                                onChange={(e) => setNewSpecTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && newSpecTitle.trim()) {
                                        e.preventDefault();
                                        onSpecificationsChange([
                                            ...specifications,
                                            { title: newSpecTitle.trim(), items: [''] }
                                        ]);
                                        setNewSpecTitle('');
                                    }
                                }}
                                placeholder="Add new section title (e.g. Battery) and press Enter..."
                            />
                        </div>
                    </div>
                </div>
                {offerPrice && parseFloat(offerPrice) < parseFloat(basePrice) && (
                    <div className="bg-[var(--success)]/10 border border-[var(--success)] text-[var(--success)] px-4 py-3 rounded-lg flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">
                            {Math.round(((parseFloat(basePrice) - parseFloat(offerPrice)) / parseFloat(basePrice)) * 100)}% discount applied
                        </span>
                    </div>
                )}
            </div>
        </Card>
    );
}
