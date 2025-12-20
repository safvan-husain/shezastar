import { CustomCard } from '@/lib/app-settings/app-settings.schema';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';

interface CustomCardItemProps {
    cardKey: string;
    card: CustomCard | null;
    onEdit: () => void;
    onDelete: () => void;
    isDeleting?: boolean;
}

export default function CustomCardItem({ cardKey, card, onEdit, onDelete, isDeleting }: CustomCardItemProps) {
    const isOccupied = !!card;

    return (
        <div className="bg-[var(--bg-elevated)] rounded-lg shadow-md border border-[var(--border-subtle)] overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[var(--bg-surface)]">
                <span className="font-semibold text-[var(--text-secondary)] uppercase text-sm">
                    {cardKey.replace('card', 'Slot ')}
                </span>
                {isOccupied ? (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Active
                    </span>
                ) : (
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        Empty
                    </span>
                )}
            </div>

            {isOccupied ? (
                <div className="flex-1 flex flex-col">
                    <div className="relative w-full h-48 bg-[var(--bg-surface)]">
                        {card.imagePath ? (
                            <Image
                                src={card.imagePath}
                                alt={card.title}
                                fill
                                unoptimized
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[var(--text-tertiary)]">
                                No Image
                            </div>
                        )}
                        {card.offerLabel && (
                            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                                {card.offerLabel}
                            </div>
                        )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                        <h3 className="text-lg font-bold mb-1 truncate" title={card.title}>
                            {card.title}
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)] mb-2 truncate" title={card.subtitle}>
                            {card.subtitle}
                        </p>
                        <a
                            href={card.urlLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline mb-4 truncate block"
                        >
                            {card.urlLink}
                        </a>

                        <div className="mt-auto flex gap-2">
                            <Button variant="outline" size="sm" onClick={onEdit} className="flex-1">
                                Edit
                            </Button>
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={onDelete}
                                disabled={isDeleting}
                                className="flex-1"
                            >
                                {isDeleting ? (
                                    <>
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--text-inverted)] border-t-transparent" />
                                        Deleting
                                    </>
                                ) : (
                                    'Delete'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-[var(--bg-surface)] flex items-center justify-center mb-4 text-[var(--text-tertiary)]">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </div>
                    <p className="text-[var(--text-secondary)] mb-4">This slot is empty</p>
                    <Button onClick={onEdit}>Add Card</Button>
                </div>
            )}
        </div>
    );
}
