// app/(admin)/products/components/steps/VariantStockStep.tsx
'use client';

import { Card } from '@/components/ui/Card';
import { useState, useEffect } from 'react';
import { generateAllVariantCombinations } from '@/lib/product/product.utils';

interface VariantItem {
    id: string;
    name: string;
}

interface ProductVariant {
    variantTypeId: string;
    variantTypeName: string;
    selectedItems: VariantItem[];
}

interface VariantStock {
    variantCombinationKey: string;
    stockCount: number;
    priceDelta?: number;
    price?: number;
}

interface VariantStockStepProps {
    variants: ProductVariant[];
    variantStock: VariantStock[];
    basePrice: number;
    offerPercentage: number;
    onVariantStockChange: (variantStock: VariantStock[]) => void;
}

export function VariantStockStep({ variants, variantStock, basePrice, offerPercentage, onVariantStockChange }: VariantStockStepProps) {
    const [combinations, setCombinations] = useState<Array<{ key: string; label: string; itemIds: string[] }>>([]);
    const [stockValues, setStockValues] = useState<Record<string, number>>({});
    const [priceValues, setPriceValues] = useState<Record<string, number>>({});

    // Generate all possible combinations when variants change
    useEffect(() => {
        const allCombinations = generateAllVariantCombinations(variants);
        setCombinations(allCombinations);

        // Initialize stock and price values from existing variantStock or default to base/offer price
        const initialStockValues: Record<string, number> = {};
        const initialPriceValues: Record<string, number> = {};
        const defaultPrice = basePrice || 0;

        allCombinations.forEach(combo => {
            const existing = variantStock.find(vs => vs.variantCombinationKey === combo.key);
            initialStockValues[combo.key] = existing?.stockCount ?? 0;

            // Logic: prefer 'price', fallback to defaultPrice.
            if (existing?.price !== undefined) {
                initialPriceValues[combo.key] = existing.price;
            } else {
                initialPriceValues[combo.key] = defaultPrice;
            }
        });
        setStockValues(initialStockValues);
        setPriceValues(initialPriceValues);
    }, [variants, variantStock, basePrice]);

    const rebuildVariantStock = (stocks: Record<string, number>, prices: Record<string, number>) => {
        const newVariantStock: VariantStock[] = Object.entries(stocks).map(([key, stockCount]) => ({
            variantCombinationKey: key,
            stockCount,
            price: prices[key] ?? 0,
            // Clear priceDelta to avoid confusion
            priceDelta: undefined
        }));
        onVariantStockChange(newVariantStock);
    };

    const handleStockChange = (key: string, value: number) => {
        const newStockValues = { ...stockValues, [key]: value };
        setStockValues(newStockValues);
        rebuildVariantStock(newStockValues, priceValues);
    };

    const handlePriceChange = (key: string, value: number) => {
        const newPriceValues = { ...priceValues, [key]: value };
        setPriceValues(newPriceValues);
        rebuildVariantStock(stockValues, newPriceValues);
    };

    const handleBulkSet = () => {
        const value = prompt('Enter stock count to set for all variants:');
        if (value === null) return;

        const numValue = parseInt(value, 10);
        if (isNaN(numValue) || numValue < 0) {
            alert('Please enter a valid non-negative number');
            return;
        }

        const newStockValues: Record<string, number> = {};
        combinations.forEach(combo => {
            newStockValues[combo.key] = numValue;
        });
        setStockValues(newStockValues);

        rebuildVariantStock(newStockValues, priceValues);
    };

    const totalStock = Object.values(stockValues).reduce((sum, val) => sum + val, 0);

    return (
        <Card>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--bg-subtle)] flex items-center justify-center">
                        <svg className="w-5 h-5 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-[var(--foreground)]">Inventory Stock</h2>
                        <p className="text-sm text-[var(--muted-foreground)]">
                            {combinations.length} variant combination{combinations.length !== 1 ? 's' : ''} • Total: {totalStock} units
                        </p>
                    </div>
                </div>
                {combinations.length > 1 && (
                    <button
                        type="button"
                        onClick={handleBulkSet}
                        className="px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-subtle)] rounded-lg hover:bg-[var(--bg-muted)] transition"
                    >
                        Set All
                    </button>
                )}
            </div>

            {combinations.length === 0 ? (
                <div className="text-center py-8 text-[var(--muted-foreground)]">
                    <p>No variants defined. Stock will be tracked at product level.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {combinations.map((combo) => {
                        const stock = stockValues[combo.key] ?? 0;
                        const price = priceValues[combo.key] ?? 0;

                        return (
                            <div key={combo.key} className="flex items-center gap-6 p-4 bg-[var(--bg-subtle)] rounded-lg">
                                <div className="flex-1">
                                    <p className="font-medium text-[var(--foreground)]">{combo.label}</p>
                                    <p className="text-xs text-[var(--muted-foreground)] mt-1">Key: {combo.key}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <label htmlFor={`stock-${combo.key}`} className="text-sm text-[var(--muted-foreground)]">
                                            Stock:
                                        </label>
                                        <input
                                            id={`stock-${combo.key}`}
                                            type="number"
                                            min="0"
                                            value={stock}
                                            onChange={(e) => handleStockChange(combo.key, parseInt(e.target.value, 10) || 0)}
                                            className="w-24 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                                        />
                                        <span className="text-sm text-[var(--muted-foreground)]">units</span>
                                    </div>

                                    <div className="flex flex-col items-end gap-1 min-w-[12rem]">
                                        <div className="flex items-center gap-2">
                                            <label htmlFor={`price-${combo.key}`} className="text-sm text-[var(--muted-foreground)] whitespace-nowrap">
                                                Final Price:
                                            </label>
                                            <input
                                                id={`price-${combo.key}`}
                                                type="number"
                                                step="0.01"
                                                value={price}
                                                onChange={(e) => handlePriceChange(combo.key, parseFloat(e.target.value) || 0)}
                                                className="w-28 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                                            />
                                        </div>
                                        {offerPercentage > 0 && (
                                            <div className="text-[10px] text-[var(--success)] font-medium">
                                                Calculated Offer: AED {(price * (1 - offerPercentage / 100)).toFixed(2)} ({offerPercentage}% off)
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>Note:</strong> Stock is tracked per variant combination. When a customer purchases a specific variant, only that combination's stock will be reduced.
                </p>
            </div>
        </Card>
    );
}
