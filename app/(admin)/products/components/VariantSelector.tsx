// app/(admin)/products/components/VariantSelector.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface VariantItem {
    id: string;
    name: string;
}

interface VariantType {
    id: string;
    name: string;
    items: VariantItem[];
}

interface ProductVariant {
    variantTypeId: string;
    variantTypeName: string;
    selectedItems: VariantItem[];
    priceModifier?: number;
}

interface VariantSelectorProps {
    variants: ProductVariant[];
    onChange: (variants: ProductVariant[]) => void;
}

export function VariantSelector({ variants, onChange }: VariantSelectorProps) {
    const [variantTypes, setVariantTypes] = useState<VariantType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/variant-types')
            .then(res => res.json())
            .then(data => {
                setVariantTypes(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load variant types:', err);
                setLoading(false);
            });
    }, []);

    const addVariant = (variantType: VariantType) => {
        if (variants.some(v => v.variantTypeId === variantType.id)) {
            return; // Already added
        }

        onChange([
            ...variants,
            {
                variantTypeId: variantType.id,
                variantTypeName: variantType.name,
                selectedItems: [],
                priceModifier: 0,
            },
        ]);
    };

    const removeVariant = (variantTypeId: string) => {
        onChange(variants.filter(v => v.variantTypeId !== variantTypeId));
    };

    const toggleItem = (variantTypeId: string, item: VariantItem) => {
        onChange(
            variants.map(v => {
                if (v.variantTypeId === variantTypeId) {
                    const isSelected = v.selectedItems.some(i => i.id === item.id);
                    return {
                        ...v,
                        selectedItems: isSelected
                            ? v.selectedItems.filter(i => i.id !== item.id)
                            : [...v.selectedItems, item],
                    };
                }
                return v;
            })
        );
    };

    const updatePriceModifier = (variantTypeId: string, value: number) => {
        onChange(
            variants.map(v =>
                v.variantTypeId === variantTypeId
                    ? { ...v, priceModifier: value }
                    : v
            )
        );
    };

    if (loading) {
        return <div className="text-center py-4">Loading variant types...</div>;
    }

    if (variantTypes.length === 0) {
        return (
            <Card>
                <p className="text-gray-500 text-center py-4">
                    No variant types available. Create variant types first.
                </p>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {variants.length === 0 && (
                <p className="text-sm text-gray-600">
                    Select variant types to add to this product
                </p>
            )}

            {variants.map(variant => {
                const variantType = variantTypes.find(vt => vt.id === variant.variantTypeId);
                if (!variantType) return null;

                return (
                    <Card key={variant.variantTypeId}>
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-semibold">{variant.variantTypeName}</h3>
                            <Button
                                size="sm"
                                variant="danger"
                                onClick={() => removeVariant(variant.variantTypeId)}
                            >
                                Remove
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">
                                    Select items:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {variantType.items.map(item => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => toggleItem(variant.variantTypeId, item)}
                                            className={`px-3 py-1.5 rounded-lg border transition-colors ${variant.selectedItems.some(i => i.id === item.id)
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                                                }`}
                                        >
                                            {item.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="max-w-xs">
                                <Input
                                    type="number"
                                    label="Price Modifier (optional)"
                                    placeholder="0"
                                    value={variant.priceModifier || ''}
                                    onChange={(e) => updatePriceModifier(
                                        variant.variantTypeId,
                                        parseFloat(e.target.value) || 0
                                    )}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Add to base price (can be negative)
                                </p>
                            </div>
                        </div>
                    </Card>
                );
            })}

            <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                    Add variant type:
                </p>
                <div className="flex flex-wrap gap-2">
                    {variantTypes
                        .filter(vt => !variants.some(v => v.variantTypeId === vt.id))
                        .map(variantType => (
                            <Button
                                key={variantType.id}
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => addVariant(variantType)}
                            >
                                + {variantType.name}
                            </Button>
                        ))}
                </div>
            </div>
        </div>
    );
}
