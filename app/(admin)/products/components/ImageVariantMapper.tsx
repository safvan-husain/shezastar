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
            className={`px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg cursor-move select-none ${isDragging ? 'opacity-50' : ''
                }`}
        >
            {item.name}
        </div>
    );
}

function DroppableImage({ image, mappedItems }: { image: ImageFile; mappedItems: string[] }) {
    const { setNodeRef, isOver } = useDroppable({
        id: image.id,
    });

    return (
        <div
            ref={setNodeRef}
            className={`relative border-2 rounded-lg overflow-hidden transition-colors ${isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
        >
            <img
                src={image.preview}
                alt="Product"
                className="w-full h-40 object-cover"
            />
            {mappedItems.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 p-2">
                    <div className="flex flex-wrap gap-1">
                        {mappedItems.map(itemId => (
                            <span
                                key={itemId}
                                className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded"
                            >
                                {itemId}
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

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const imageId = over.id as string;
        const variantItemId = active.id as string;

        // Get current mappings for this image
        const currentMappings = mappings[imageId] || [];

        // Toggle the variant item
        const newMappings = currentMappings.includes(variantItemId)
            ? currentMappings.filter(id => id !== variantItemId)
            : [...currentMappings, variantItemId];

        onChange({
            ...mappings,
            [imageId]: newMappings,
        });
    };

    const clearMapping = (imageId: string) => {
        const newMappings = { ...mappings };
        delete newMappings[imageId];
        onChange(newMappings);
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

    if (images.length === 0) {
        return (
            <Card>
                <p className="text-gray-500 text-center py-4">
                    Upload images first to map them to variants
                </p>
            </Card>
        );
    }

    if (variants.length === 0 || variants.every(v => v.selectedItems.length === 0)) {
        return (
            <Card>
                <p className="text-gray-500 text-center py-4">
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

    return (
        <div className="space-y-6">
            <Card>
                <h3 className="text-lg font-semibold mb-4">How to Map Images to Variants</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                    <li>Drag a variant tag and drop it on an image to map them</li>
                    <li>Or select multiple variants and click "Map Selected" on an image</li>
                    <li>Images with no mappings will show for all variant combinations</li>
                    <li>When multiple variants are mapped, the image shows only for that combination</li>
                </ol>
            </Card>

            <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Variant Items Panel */}
                    <Card>
                        <h3 className="text-lg font-semibold mb-4">Variant Items</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Drag these onto images or select multiple and use "Map Selected"
                        </p>

                        {variants.map(variant => (
                            <div key={variant.variantTypeId} className="mb-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">
                                    {variant.variantTypeName}
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {variant.selectedItems.map(item => (
                                        <div key={item.id} className="relative">
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.has(item.id)}
                                                onChange={() => toggleItemSelection(item.id)}
                                                className="absolute top-1 left-1 z-10"
                                            />
                                            <DraggableVariantTag
                                                item={item}
                                                variantTypeName={variant.variantTypeName}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {selectedItems.size > 0 && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm font-medium text-blue-900">
                                    {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} selected
                                </p>
                                <p className="text-xs text-blue-700 mt-1">
                                    Click "Map Selected" on any image below
                                </p>
                            </div>
                        )}
                    </Card>

                    {/* Images Panel */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Product Images</h3>
                        <p className="text-sm text-gray-600">
                            Drop variant items here to map them
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            {images.map(image => {
                                const imageMappings = mappings[image.id] || [];
                                const mappedItemNames = imageMappings
                                    .map(id => allVariantItems.find(item => item.id === id)?.displayName)
                                    .filter(Boolean);

                                return (
                                    <div key={image.id} className="space-y-2">
                                        <DroppableImage image={image} mappedItems={imageMappings} />

                                        <div className="space-y-1">
                                            {mappedItemNames.length > 0 && (
                                                <div className="text-xs">
                                                    {mappedItemNames.map((name, i) => (
                                                        <div key={i} className="text-gray-600">{name}</div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                {selectedItems.size > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => mapSelectedToImage(image.id)}
                                                        className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                                    >
                                                        Map Selected
                                                    </button>
                                                )}
                                                {imageMappings.length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => clearMapping(image.id)}
                                                        className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
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
                        <div className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg">
                            {allVariantItems.find(item => item.id === activeId)?.name}
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
