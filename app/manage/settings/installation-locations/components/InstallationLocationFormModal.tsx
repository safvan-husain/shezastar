'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { InstallationLocation } from '@/lib/app-settings/app-settings.schema';

interface InstallationLocationFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: InstallationLocation | null;
}

export default function InstallationLocationFormModal({
    isOpen,
    onClose,
    onSuccess,
    initialData,
}: InstallationLocationFormModalProps) {
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        priceDelta: 0,
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                priceDelta: initialData.priceDelta,
            });
        } else {
            setFormData({
                name: '',
                priceDelta: 0,
            });
        }
    }, [initialData, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const url = initialData
                ? `/api/admin/settings/installation-locations/${initialData.id}`
                : '/api/admin/settings/installation-locations';

            const method = initialData ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || 'Failed to save location');
            }

            showToast(
                initialData ? 'Location updated successfully' : 'Location added successfully',
                'success'
            );
            onSuccess();
        } catch (error: any) {
            const message = error instanceof Error ? error.message : 'Something went wrong';
            showToast(message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'Edit Location' : 'Add Location'}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Location Name</label>
                    <input
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-md bg-[var(--bg-base)] text-[var(--text-primary)]"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Dubai, Abu Dhabi"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Delta Price ($)</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-md bg-[var(--bg-base)] text-[var(--text-primary)]"
                        value={formData.priceDelta}
                        onChange={(e) => setFormData({ ...formData, priceDelta: parseFloat(e.target.value) })}
                    />
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                        Extra cost added to the base &quot;At Home&quot; price for this location.
                    </p>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <Button variant="outline" onClick={onClose} type="button">
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Saving...' : initialData ? 'Update' : 'Add'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
