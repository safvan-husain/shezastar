'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { CategoryTreeSelector } from './CategoryTreeSelector';
import { ProductSearchSelector } from './ProductSearchSelector';
import { handleApiError } from '@/lib/utils/api-error-handler';

type Mode = 'category' | 'product' | 'all';
type Method = 'percentage' | 'fixed';

interface SelectedProduct {
    id: string;
    name: string;
    basePrice: number;
}

const MODE_TABS: { value: Mode; label: string; description: string }[] = [
    {
        value: 'category',
        label: 'By Category',
        description: 'Select categories to update all products within them',
    },
    {
        value: 'product',
        label: 'By Product Name',
        description: 'Search and select individual products to update',
    },
    {
        value: 'all',
        label: 'All Products',
        description: 'Update prices for every product in the catalog',
    },
];

export default function BulkPriceUpdateClient() {
    const [mode, setMode] = useState<Mode>('category');
    const [method, setMethod] = useState<Method>('percentage');
    const [value, setValue] = useState('');
    const [offerPercentage, setOfferPercentage] = useState('');
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const { showToast } = useToast();
    const parsedOfferPercentage =
        offerPercentage.trim() === '' ? undefined : Number(offerPercentage);

    const canSubmit = () => {
        if (!value || Number(value) <= 0) return false;
        if (
            parsedOfferPercentage !== undefined &&
            (Number.isNaN(parsedOfferPercentage) || parsedOfferPercentage < 0 || parsedOfferPercentage > 100)
        ) {
            return false;
        }
        if (mode === 'category' && selectedCategoryIds.length === 0) return false;
        if (mode === 'product' && selectedProducts.length === 0) return false;
        return true;
    };

    const handleSubmit = async () => {
        if (!canSubmit()) return;

        setSubmitting(true);
        let apiErrorHandled = false;
        try {
            const ids =
                mode === 'category'
                    ? selectedCategoryIds
                    : mode === 'product'
                        ? selectedProducts.map(p => p.id)
                        : [];

            const res = await fetch('/api/admin/products/bulk-price-update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode,
                    ids,
                    method,
                    value: Number(value),
                    ...(parsedOfferPercentage !== undefined ? { offerPercentage: parsedOfferPercentage } : {}),
                }),
            });

            if (!res.ok) {
                apiErrorHandled = true;
                await handleApiError(res, showToast);
            }

            const result = await res.json();
            showToast(
                `Successfully updated ${result.modifiedCount} product${result.modifiedCount !== 1 ? 's' : ''}`,
                'success'
            );

            // Reset selections after success
            setValue('');
            setOfferPercentage('');
            setSelectedCategoryIds([]);
            setSelectedProducts([]);
        } catch (err: any) {
            if (apiErrorHandled) {
                return;
            }

            if (err instanceof Error && err.message) {
                showToast(err.message, 'error', {
                    url: '/api/admin/products/bulk-price-update',
                    method: 'POST',
                    body: { error: err.message },
                });
                return;
            }

            showToast('Failed to update prices', 'error', {
                url: '/api/admin/products/bulk-price-update',
                method: 'POST',
                body: { error: 'Failed to update prices' },
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-10 max-w-4xl space-y-8">
            {/* Header */}
            <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--text-secondary)]">
                    Products
                </p>
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">Bulk Price Update</h1>
                <p className="text-[var(--text-secondary)]">
                    Update product prices in bulk by category, product name, or across the entire catalog.
                </p>
            </div>

            {/* Mode selector tabs */}
            <Card>
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Select Update Method</h2>
                    <div className="grid gap-3 md:grid-cols-3">
                        {MODE_TABS.map(tab => (
                            <button
                                key={tab.value}
                                type="button"
                                onClick={() => setMode(tab.value)}
                                className={`text-left p-4 rounded-lg border-2 transition-all duration-200 ${mode === tab.value
                                        ? 'border-[var(--primary)] bg-[var(--primary)]/5 shadow-md'
                                        : 'border-[var(--border-subtle)] hover:border-[var(--border)] hover:bg-[var(--bg-subtle)]'
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <div
                                        className={`w-3 h-3 rounded-full border-2 transition-all ${mode === tab.value
                                                ? 'border-[var(--primary)] bg-[var(--primary)]'
                                                : 'border-[var(--border-subtle)]'
                                            }`}
                                    />
                                    <span className="font-semibold text-sm">{tab.label}</span>
                                </div>
                                <p className="text-xs text-[var(--text-secondary)] ml-5">{tab.description}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Selection area */}
            <div className="space-y-3">
                <h2 className="text-lg font-semibold">
                    {mode === 'category' && 'Select Categories'}
                    {mode === 'product' && 'Select Products'}
                    {mode === 'all' && 'All Products Selected'}
                </h2>

                {mode === 'category' && (
                    <CategoryTreeSelector
                        selectedIds={selectedCategoryIds}
                        onSelectionChange={setSelectedCategoryIds}
                    />
                )}

                {mode === 'product' && (
                    <ProductSearchSelector
                        selectedProducts={selectedProducts}
                        onSelectionChange={setSelectedProducts}
                    />
                )}

                {mode === 'all' && (
                    <Card>
                        <div className="flex items-center gap-3 py-2">
                            <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium">All products in the catalog will be updated</p>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    This action will apply the price change to every product.
                                </p>
                            </div>
                        </div>
                    </Card>
                )}
            </div>

            {/* Price update controls */}
            <Card>
                <div className="space-y-5">
                    <h2 className="text-lg font-semibold">Price Increase</h2>

                    {/* Method toggle */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-[var(--text-secondary)]">
                            Increase Type
                        </label>
                        <div className="inline-flex rounded-lg border-2 border-[var(--border-subtle)] overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setMethod('percentage')}
                                className={`px-5 py-2 text-sm font-semibold transition-all ${method === 'percentage'
                                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                                        : 'bg-transparent hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
                                    }`}
                            >
                                Percentage (%)
                            </button>
                            <button
                                type="button"
                                onClick={() => setMethod('fixed')}
                                className={`px-5 py-2 text-sm font-semibold transition-all ${method === 'fixed'
                                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                                        : 'bg-transparent hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
                                    }`}
                            >
                                Fixed (AED)
                            </button>
                        </div>
                    </div>

                    {/* Value input */}
                    <Input
                        label={method === 'percentage' ? 'Increase by (%)' : 'Increase by (AED)'}
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder={method === 'percentage' ? 'e.g. 10' : 'e.g. 25.00'}
                        value={value}
                        onChange={e => setValue(e.target.value)}
                    />

                    {/* Preview hint */}
                    {value && Number(value) > 0 && (
                        <div className="p-3 bg-[var(--muted)] rounded-lg text-sm text-[var(--text-secondary)]">
                            {method === 'percentage' ? (
                                <span>
                                    Each product&apos;s price will increase by <strong>{value}%</strong>.
                                    For example, AED 100 → AED {(100 * (1 + Number(value) / 100)).toFixed(2)}
                                </span>
                            ) : (
                                <span>
                                    Each product&apos;s price will increase by <strong>AED {Number(value).toFixed(2)}</strong>.
                                    For example, AED 100 → AED {(100 + Number(value)).toFixed(2)}
                                </span>
                            )}
                        </div>
                    )}

                    <Input
                        label="Offer Percentage (Optional)"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="Leave blank to keep existing offers"
                        value={offerPercentage}
                        onChange={e => setOfferPercentage(e.target.value)}
                    />

                    <p className="text-sm text-[var(--text-secondary)]">
                        Set a value from 0 to 100 to overwrite each selected product&apos;s offer percentage. Leave it blank to keep the current offer percentage unchanged.
                    </p>

                    {parsedOfferPercentage !== undefined && (
                        <div className="p-3 bg-[var(--muted)] rounded-lg text-sm text-[var(--text-secondary)]">
                            Each selected product&apos;s offer percentage will be set to <strong>{parsedOfferPercentage}%</strong>.
                        </div>
                    )}
                </div>
            </Card>

            {/* Submit */}
            <div className="flex items-center justify-end gap-4">
                <Button
                    variant="primary"
                    size="lg"
                    disabled={!canSubmit() || submitting}
                    onClick={handleSubmit}
                >
                    {submitting ? (
                        <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Updating Prices...
                        </>
                    ) : (
                        'Apply Price Update'
                    )}
                </Button>
            </div>
        </div>
    );
}
