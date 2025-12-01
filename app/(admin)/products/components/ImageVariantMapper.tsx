// app/(admin)/products/components/ImageVariantMapper.tsx
'use client';

import { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { Card } from '@/components/ui/Card';

interface ImageFile {
    id: string;
    url: string;
    preview: string;
    mappedVariants?: string[];
}

interface VariantItem {
    id: string;
    name: string;
}

interface ProductVariant {
    variantTypeId: string;
    variantTypeName: string;
    selectedItems: VariantItem[];
}

interface ImageVariantMapperProps {
    images: ImageFile[];
    variants: ProductVariant[];
    mappings: Record<string, string[]>; // imageId -> variant item IDs
    onChange: (mappings: Record<string, string[]>) => void;
}

function DraggableVariantTag({ item, variantTypeName }: { item: VariantItem; variantTypeName: string }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: item.id,
        data: { item, variantTypeName },
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`px-3 py-1.5 bg-[var(--bg-subtle)] text-[var(--text-primary)] rounded-lg cursor-move select-none border border-[var(--border-subtle)] ${isDragging ? 'opacity-50' : ''
                }`}
        >
            <span className="text-xs text-[var(--text-secondary)] mr-1">{variantTypeName}:</span>
            <span className="text-sm text-[var(--text-primary)]">{item.name}</span>
        </div>
    );
}

function DroppableImage({
    image,
    mappedItems,
    mappedItemDetails,
    onRemoveMapping,
}: {
    image: ImageFile;
    mappedItems: string[];
    mappedItemDetails: { id: string; displayName: string }[];
    onRemoveMapping: (variantItemId: string) => void;
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: image.id,
    });

    return (
        <div
            ref={setNodeRef}
            className={`relative border-2 rounded-lg overflow-hidden transition-colors ${isOver ? 'border-[var(--border-strong)] bg-[var(--bg-subtle)]' : 'border-[var(--border-subtle)]'
                }`}
        >
            <div
                className={`absolute inset-0 flex items-center justify-center bg-[var(--bg-subtle)] bg-opacity-80 text-sm text-[var(--text-secondary)] font-medium transition-opacity ${isOver ? 'opacity-100' : 'opacity-0'
                    } pointer-events-none`}
            >
                Drop to map
            </div>
            <img
                src={image.preview}
                alt="Product"
                className="w-full h-40 object-cover"
            />
            {mappedItems.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 p-2">
                    <div className="flex flex-wrap gap-1">
                        {mappedItemDetails.map(item => (
                            <span
                                key={item.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--bg-subtle)] text-[var(--text-primary)] text-xs rounded border border-[var(--border-subtle)]"
                            >
                                <span>{item.displayName}</span>
                                <button
                                    type="button"
                                    onClick={() => onRemoveMapping(item.id)}
                                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                    aria-label={`Remove ${item.displayName} from image`}
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export function ImageVariantMapper({ images, variants, mappings, onChange }: ImageVariantMapperProps) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [showBulkMapping, setShowBulkMapping] = useState(false);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const imageId = over.id as string;
        const variantItemId = active.id as string;

        // Add the variant item to the image mapping (no toggle on drop)
        const currentMappings = new Set(mappings[imageId] || []);
        if (!currentMappings.has(variantItemId)) {
            currentMappings.add(variantItemId);
            onChange({
                ...mappings,
                [imageId]: Array.from(currentMappings),
            });
        }
    };

    const clearMapping = (imageId: string) => {
        const newMappings = { ...mappings };
        delete newMappings[imageId];
        onChange(newMappings);
    };

    const removeMapping = (imageId: string, variantItemId: string) => {
        const currentMappings = mappings[imageId] || [];
        const newMappings = currentMappings.filter(id => id !== variantItemId);
        onChange({
            ...mappings,
            [imageId]: newMappings,
        });
    };

    const toggleItemSelection = (itemId: string) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(itemId)) {
            newSelected.delete(itemId);
        } else {
            newSelected.add(itemId);
        }
        setSelectedItems(newSelected);
    };

    const mapSelectedToImage = (imageId: string) => {
        if (selectedItems.size === 0) return;

        const currentMappings = mappings[imageId] || [];
        const newMappings = [...new Set([...currentMappings, ...Array.from(selectedItems)])];

        onChange({
            ...mappings,
            [imageId]: newMappings,
        });

        setSelectedItems(new Set());
    };

    const handleToggleBulk = () => {
        setShowBulkMapping(prev => {
            if (prev) {
                setSelectedItems(new Set());
            }
            return !prev;
        });
    };

    if (images.length === 0) {
        return (
            <Card>
                <p className="text-[var(--text-muted)] text-center py-4">
                    Upload images first to map them to variants
                </p>
            </Card>
        );
    }

    if (variants.length === 0 || variants.every(v => v.selectedItems.length === 0)) {
        return (
            <Card>
                <p className="text-[var(--text-muted)] text-center py-4">
                    Add variants and select items to map them to images
                </p>
            </Card>
        );
    }

    // Get all variant items with their type names
    const allVariantItems = variants.flatMap(v =>
        v.selectedItems.map(item => ({
            ...item,
            variantTypeName: v.variantTypeName,
            displayName: `${v.variantTypeName}: ${item.name}`,
        }))
    );

    const variantLookup = new Map(allVariantItems.map(item => [item.id, item]));

    return (
        <div className="space-y-6">
            <Card>
                <h3 className="text-lg font-semibold mb-4">How to Map Images to Variants</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-[var(--text-secondary)]">
                    <li>Drag a variant tag and drop it on an image to map them (primary flow)</li>
                    <li>Use the chip "×" or "Clear" to remove a mapping</li>
                    <li>Images with no mappings will show for all variant combinations</li>
                    <li>Need bulk mapping? Expand the optional Bulk Mapping panel</li>
                </ol>
            </Card>

            <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Variant Items Panel */}
                    <Card>
                        <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                                <h3 className="text-lg font-semibold">Variant Items</h3>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    Drag these onto images; bulk mapping is optional
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleToggleBulk}
                                className="text-xs px-2 py-1 bg-[var(--bg-subtle)] text-[var(--text-primary)] rounded hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
                            >
                                {showBulkMapping ? 'Hide Bulk Mapping' : 'Show Bulk Mapping'}
                            </button>
                        </div>

                        {variants.map(variant => (
                            <div key={variant.variantTypeId} className="mb-4">
                                <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
                                    {variant.variantTypeName}
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {variant.selectedItems.map(item => (
                                        <div key={item.id} className="relative">
                                            {showBulkMapping && (
                                                <input
                                                    type="checkbox"
                                                    checked={selectedItems.has(item.id)}
                                                    onChange={() => toggleItemSelection(item.id)}
                                                    className="absolute top-1 left-1 z-10"
                                                />
                                            )}
                                            <DraggableVariantTag
                                                item={item}
                                                variantTypeName={variant.variantTypeName}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {showBulkMapping && selectedItems.size > 0 && (
                            <div className="mt-4 p-3 bg-[var(--bg-subtle)] rounded-lg border border-[var(--border-subtle)]">
                                <p className="text-sm font-medium text-[var(--text-primary)]">
                                    {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} selected
                                </p>
                                <p className="text-xs text-[var(--text-secondary)] mt-1">
                                    Click "Map Selected" on any image below
                                </p>
                            </div>
                        )}
                    </Card>

                    {/* Images Panel */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Product Images</h3>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Drop variant items here to map them
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            {images.map(image => {
                                const imageMappings = mappings[image.id] || [];
                                const mappedItemDetails = imageMappings
                                    .map(id => variantLookup.get(id))
                                    .filter((item): item is typeof allVariantItems[number] => Boolean(item));

                                return (
                                    <div key={image.id} className="space-y-2">
                                        <DroppableImage
                                            image={image}
                                            mappedItems={imageMappings}
                                            mappedItemDetails={mappedItemDetails}
                                            onRemoveMapping={variantId => removeMapping(image.id, variantId)}
                                        />

                                        <div className="space-y-1">
                                            <div className="flex gap-2">
                                                {showBulkMapping && selectedItems.size > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => mapSelectedToImage(image.id)}
                                                        className="text-xs px-2 py-1 bg-[var(--bg-subtle)] text-[var(--text-primary)] rounded hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
                                                    >
                                                        Map Selected
                                                    </button>
                                                )}
                                                {imageMappings.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => clearMapping(image.id)}
                                                        className="text-xs px-2 py-1 bg-[var(--bg-subtle)] text-[var(--text-primary)] rounded hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
                                                    >
                                                        Clear
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <DragOverlay>
                    {activeId ? (
                        <div className="px-3 py-1.5 bg-[var(--bg-subtle)] text-[var(--text-primary)] rounded-lg border border-[var(--border-subtle)]">
                            {variantLookup.get(activeId)?.displayName || variantLookup.get(activeId)?.name}
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
