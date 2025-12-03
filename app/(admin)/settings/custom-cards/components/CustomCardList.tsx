'use client';

import { useState } from 'react';
import { CustomCards } from '@/lib/app-settings/app-settings.schema';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import CustomCardItem from './CustomCardItem';
import EditCustomCardModal from './EditCustomCardModal';

interface CustomCardListProps {
    initialCards: CustomCards;
}

export default function CustomCardList({ initialCards }: CustomCardListProps) {
    const [cards, setCards] = useState<CustomCards>(initialCards);
    const [editingCardKey, setEditingCardKey] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [confirmingCardKey, setConfirmingCardKey] = useState<string | null>(null);
    const [deletingKeys, setDeletingKeys] = useState<Set<string>>(() => new Set());
    const router = useRouter();
    const { showToast } = useToast();

    const cardKeys = ['card1', 'card2', 'card3', 'card4', 'card5', 'card6'] as const;

    const handleEdit = (key: string) => {
        setEditingCardKey(key);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCardKey(null);
    };

    const handleSave = (updatedCards: CustomCards) => {
        setCards(updatedCards);
        handleCloseModal();
        router.refresh();
    };

    const openDeleteConfirmation = (key: string) => {
        setConfirmingCardKey(key);
    };

    const closeDeleteConfirmation = () => {
        setConfirmingCardKey(null);
    };

    const handleConfirmDelete = async () => {
        if (!confirmingCardKey) return;

        const key = confirmingCardKey;
        const cardKey = key as keyof CustomCards;
        const apiUrl = `/api/admin/settings/custom-cards/${key}`;
        const previousCard = cards[cardKey];

        closeDeleteConfirmation();

        setDeletingKeys((prev) => {
            const next = new Set(prev);
            next.add(key);
            return next;
        });

        setCards((prev) => ({
            ...prev,
            [cardKey]: null,
        }));

        try {
            const response = await fetch(apiUrl, { method: 'DELETE' });
            const responseBody: any = await response.json().catch(() => null);

            if (!response.ok) {
                throw {
                    message: responseBody?.message ?? 'Failed to delete card',
                    status: response.status,
                    body: responseBody,
                    url: apiUrl,
                    method: 'DELETE',
                };
            }

            if (responseBody?.customCards) {
                setCards(responseBody.customCards);
            }

            showToast('Card deleted successfully', 'success');
            router.refresh();
        } catch (error: any) {
            console.error('Error deleting card:', error);
            showToast(
                error?.message ?? 'Failed to delete card',
                'error',
                {
                    status: error?.status,
                    body: error?.body,
                    url: error?.url ?? apiUrl,
                    method: error?.method ?? 'DELETE',
                },
            );
            setCards((prev) => ({
                ...prev,
                [cardKey]: previousCard,
            }));
        } finally {
            setDeletingKeys((prev) => {
                const next = new Set(prev);
                next.delete(key);
                return next;
            });
        }
    };

    const pendingCardName = confirmingCardKey
        ? cards[confirmingCardKey as keyof CustomCards]?.title ?? 'this card'
        : 'this card';

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cardKeys.map((key) => (
                    <CustomCardItem
                        key={key}
                        cardKey={key}
                        card={cards[key]}
                        onEdit={() => handleEdit(key)}
                        onDelete={() => openDeleteConfirmation(key)}
                        isDeleting={deletingKeys.has(key)}
                    />
                ))}
            </div>

            {isModalOpen && editingCardKey && (
                <EditCustomCardModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    cardKey={editingCardKey}
                    existingCard={cards[editingCardKey as keyof CustomCards]}
                    onSave={handleSave}
                />
            )}
            <Modal
                title="Delete custom card"
                isOpen={Boolean(confirmingCardKey)}
                onClose={closeDeleteConfirmation}
            >
                <p className="text-[var(--text-secondary)]">
                    Are you sure you want to delete {pendingCardName}? This action cannot be undone.
                </p>

                <div className="mt-6 flex justify-end gap-2">
                    <Button variant="outline" onClick={closeDeleteConfirmation}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleConfirmDelete}>
                        Delete card
                    </Button>
                </div>
            </Modal>
        </>
    );
}
