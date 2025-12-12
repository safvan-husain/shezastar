import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SingleImageUploader } from '@/components/ui/SingleImageUploader';
import { CustomCard, CustomCards } from '@/lib/app-settings/app-settings.schema';

interface EditCustomCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    cardKey: string;
    existingCard: CustomCard | null;
    onSave: (updatedCards: CustomCards) => void;
}

export default function EditCustomCardModal({
    isOpen,
    onClose,
    cardKey,
    existingCard,
    onSave,
}: EditCustomCardModalProps) {
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        imagePath: '',
        offerLabel: '',
        urlLink: '',
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (existingCard) {
            setFormData({
                title: existingCard.title,
                subtitle: existingCard.subtitle,
                imagePath: existingCard.imagePath,
                offerLabel: existingCard.offerLabel,
                urlLink: existingCard.urlLink,
            });
        } else {
            setFormData({
                title: '',
                subtitle: '',
                imagePath: '',
                offerLabel: '',
                urlLink: '',
            });
        }
        setImageFile(null);
    }, [existingCard, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (file: File | null) => {
        setImageFile(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const method = existingCard ? 'PUT' : 'POST';
            const data = new FormData();

            data.append('title', formData.title);
            data.append('subtitle', formData.subtitle);
            data.append('offerLabel', formData.offerLabel);
            data.append('urlLink', formData.urlLink);

            if (imageFile) {
                data.append('image', imageFile);
            } else if (formData.imagePath) {
                data.append('imagePath', formData.imagePath);
            }

            const res = await fetch(`/api/admin/settings/custom-cards/${cardKey}`, {
                method,
                body: data,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to save card');
            }

            const result = await res.json();
            onSave(result.customCards);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'An unexpected error occurred';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${existingCard ? 'Edit' : 'Add'} Custom Card - ${cardKey.replace('card', 'Slot ')}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <Input
                    label="Title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Summer Collection"
                />

                <Input
                    label="Subtitle"
                    name="subtitle"
                    value={formData.subtitle}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Up to 50% off"
                />

                <SingleImageUploader
                    label="Card Image"
                    value={imageFile ? URL.createObjectURL(imageFile) : formData.imagePath}
                    onChange={handleImageChange}
                />

                <Input
                    label="Offer Label"
                    name="offerLabel"
                    value={formData.offerLabel}
                    onChange={handleChange}
                    required
                    placeholder="e.g. NEW ARRIVAL"
                />

                <Input
                    label="URL Link"
                    name="urlLink"
                    value={formData.urlLink}
                    onChange={handleChange}
                    required
                    placeholder="https://example.com/collection"
                    type="url"
                />

                <div className="flex justify-end gap-3 mt-6">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Card'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
