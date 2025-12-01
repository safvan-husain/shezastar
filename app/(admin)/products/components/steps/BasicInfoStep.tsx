// app/(admin)/products/components/steps/BasicInfoStep.tsx
'use client';

import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface BasicInfoStepProps {
    name: string;
    description: string;
    basePrice: string;
    offerPrice: string;
    onNameChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    onBasePriceChange: (value: string) => void;
    onOfferPriceChange: (value: string) => void;
}

export function BasicInfoStep({
    name,
    description,
    basePrice,
    offerPrice,
    onNameChange,
    onDescriptionChange,
    onBasePriceChange,
    onOfferPriceChange,
}: BasicInfoStepProps) {
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
