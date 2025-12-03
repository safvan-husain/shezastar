'use client';

import { useState } from 'react';
import { CustomCards, CustomCard } from '@/lib/app-settings/app-settings.schema';
import { useRouter } from 'next/navigation';
import CustomCardItem from './CustomCardItem';
import EditCustomCardModal from './EditCustomCardModal';

interface CustomCardListProps {
    initialCards: CustomCards;
}

export default function CustomCardList({ initialCards }: CustomCardListProps) {
    const [cards, setCards] = useState<CustomCards>(initialCards);
    const [editingCardKey, setEditingCardKey] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

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

    const handleDelete = async (key: string) => {
        if (!confirm('Are you sure you want to delete this card?')) return;

        try {
            const res = await fetch(`/api/admin/settings/custom-cards/${key}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete card');

            const result = await res.json();
            setCards(result.customCards);
            router.refresh();
        } catch (error) {
            console.error('Error deleting card:', error);
            alert('Failed to delete card');
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cardKeys.map((key) => (
                    <CustomCardItem
                        key={key}
                        cardKey={key}
                        card={cards[key]}
                        onEdit={() => handleEdit(key)}
                        onDelete={() => handleDelete(key)}
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
        </>
    );
}
