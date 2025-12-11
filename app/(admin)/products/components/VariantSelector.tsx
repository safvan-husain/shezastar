// app/(admin)/products/components/VariantSelector.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

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
}

interface VariantSelectorProps {
    variants: ProductVariant[];
    onChange: (variants: ProductVariant[]) => void;
}

export function VariantSelector({ variants, onChange }: VariantSelectorProps) {
    const { showToast } = useToast();
    const [variantTypes, setVariantTypes] = useState<VariantType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function loadVariantTypes() {
            try {
                const res = await fetch('/api/variant-types');
                if (!res.ok) {
                    let data: any = {};
                    try {
                        data = await res.json();
                    } catch {
                        data = { error: 'Failed to parse response body' };
                    }
                    const errorMessage = data.message || data.error || 'Failed to load variant types';

                    showToast(errorMessage, 'error', {
                        status: res.status,
                        body: data,
                        url: res.url,
                        method: 'GET',
                    });

                    return;
                }

                const data = await res.json();
                if (!cancelled) {
                    setVariantTypes(data);
                }
            } catch (err: any) {
                if (!cancelled) {
                    const message = err?.message || 'Failed to load variant types';
                    showToast(message, 'error', {
                        url: '/api/variant-types',
                        method: 'GET',
                        body: { error: message },
                    });
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadVariantTypes();
        return () => {
            cancelled = true;
        };
    }, [showToast]);

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



    if (loading) {
        return <div className="text-center py-4">Loading variant types...</div>;
    }

    if (variantTypes.length === 0) {
        return (
            <Card>
                <p className="text-[var(--text-muted)] text-center py-4">
                    No variant types available. Create variant types first.
                </p>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {variants.length === 0 && (
                <p className="text-sm text-[var(--text-secondary)]">
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
                                <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">
                                    Select items:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {variantType.items.map(item => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => toggleItem(variant.variantTypeId, item)}
                                            className={`px-3 py-1.5 rounded-lg border transition-colors ${variant.selectedItems.some(i => i.id === item.id)
                                                    ? 'bg-[var(--border-strong)] text-[var(--text-primary)] border-[var(--border-strong)] shadow-sm'
                                                    : 'bg-[var(--bg-base)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                                                }`}
                                        >
                                            {item.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>
                );
            })}

            <div>
                <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">
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
