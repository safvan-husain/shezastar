'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { InstallationLocation } from '@/lib/app-settings/app-settings.schema';
import InstallationLocationFormModal from './InstallationLocationFormModal';

interface InstallationLocationsListProps {
    initialLocations: InstallationLocation[];
}

export default function InstallationLocationsList({ initialLocations }: InstallationLocationsListProps) {
    const router = useRouter();
    const { showToast } = useToast();
    const [locations, setLocations] = useState(initialLocations);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<InstallationLocation | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmingLocation, setConfirmingLocation] = useState<InstallationLocation | null>(null);

    useEffect(() => {
        if (!isFormOpen) {
            setLocations(initialLocations);
        }
    }, [initialLocations, isFormOpen]);

    const handleAddClick = () => {
        setEditingLocation(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (loc: InstallationLocation) => {
        setEditingLocation(loc);
        setIsFormOpen(true);
    };

    const handleFormSuccess = () => {
        setIsFormOpen(false);
        router.refresh();
    };

    const handleDelete = async () => {
        if (!confirmingLocation) return;

        setDeletingId(confirmingLocation.id);
        try {
            const response = await fetch(`/api/admin/settings/installation-locations/${confirmingLocation.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || 'Failed to remove location');
            }

            showToast('Location removed', 'success');
            setLocations(locations.filter(l => l.id !== confirmingLocation.id));
            setConfirmingLocation(null);
            router.refresh();
        } catch (error: any) {
            const message = error instanceof Error ? error.message : 'Something went wrong';
            showToast(message, 'error');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div>
            <div className="mb-6">
                <Button onClick={handleAddClick}>
                    + Add Location
                </Button>
            </div>

            {locations.length === 0 ? (
                <div className="text-center py-12 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)]">
                    <p className="text-[var(--text-secondary)] mb-4">No installation locations configured</p>
                    <Button onClick={handleAddClick}>
                        Add your first location
                    </Button>
                </div>
            ) : (
                <div className="bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)] overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)]">
                                <th className="p-4 font-semibold text-[var(--text-secondary)]">Location Name</th>
                                <th className="p-4 font-semibold text-[var(--text-secondary)]">Delta Price</th>
                                <th className="p-4 font-semibold text-[var(--text-secondary)] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {locations.map((loc) => (
                                <tr key={loc.id} className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-base)]">
                                    <td className="p-4 text-[var(--text-primary)] font-medium">{loc.name}</td>
                                    <td className="p-4 text-[var(--text-primary)]">
                                        {loc.priceDelta > 0 ? `+$${loc.priceDelta}` : 'No extra cost'}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="outline" onClick={() => handleEditClick(loc)}>
                                                Edit
                                            </Button>
                                            <Button size="sm" variant="danger" onClick={() => setConfirmingLocation(loc)}>
                                                Remove
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <InstallationLocationFormModal
                isOpen={isFormOpen}
                initialData={editingLocation}
                onClose={() => setIsFormOpen(false)}
                onSuccess={handleFormSuccess}
            />

            <ConfirmDialog
                isOpen={Boolean(confirmingLocation)}
                onClose={() => setConfirmingLocation(null)}
                onConfirm={handleDelete}
                title="Remove Location"
                message={`Are you sure you want to remove "${confirmingLocation?.name}"?`}
                confirmText="Remove"
                variant="danger"
                isLoading={Boolean(deletingId)}
            />
        </div>
    );
}
