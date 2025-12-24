'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RichTextEditor } from '@/components/ui/RichTextEditor';

interface VariantDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    variantName: string;
    initialTitle?: string;
    initialSubtitle?: string;
    initialDescription?: string;
    onSave: (title?: string, subtitle?: string, description?: string) => void;
}

export function VariantDetailsModal({
    isOpen,
    onClose,
    variantName,
    initialTitle,
    initialSubtitle,
    initialDescription,
    onSave,
}: VariantDetailsModalProps) {
    const [title, setTitle] = useState(initialTitle || '');
    const [subtitle, setSubtitle] = useState(initialSubtitle || '');
    const [description, setDescription] = useState(initialDescription || '');

    useEffect(() => {
        if (isOpen) {
            setTitle(initialTitle || '');
            setSubtitle(initialSubtitle || '');
            setDescription(initialDescription || '');
        }
    }, [isOpen, initialTitle, initialSubtitle, initialDescription]);

    const handleSave = () => {
        // Pass undefined if empty to keep clean
        onSave(title || undefined, subtitle || undefined, description || undefined);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Edit Details: ${variantName}`}
        >
            <div className="space-y-6">
                <div>
                    <h3 className="text-sm font-medium text-[var(--muted-foreground)] mb-2">
                        Override Product Details
                    </h3>
                    <p className="text-xs text-[var(--muted-foreground)]">
                        Customize the title, subtitle, and description for this specific variant combination.
                        Leave empty to use the main product details.
                    </p>
                </div>

                <div className="space-y-4">
                    <Input
                        label="Variant Title Override"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Wireless Dash Cam - Red Edition"
                    />

                    <Input
                        label="Variant Subtitle Override"
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        placeholder="e.g., Special Limited Edition"
                    />

                    <RichTextEditor
                        label="Variant Description Override"
                        value={description}
                        onChange={setDescription}
                        placeholder="Enter specific description for this variant..."
                        rows={6}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>
                        Save Details
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
