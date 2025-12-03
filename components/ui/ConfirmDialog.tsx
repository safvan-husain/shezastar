// components/ui/ConfirmDialog.tsx
'use client';

import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary';
    isLoading?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    isLoading = false,
}: ConfirmDialogProps) {
    return (
        <Modal title={title} isOpen={isOpen} onClose={onClose}>
            <p className="text-[var(--text-secondary)] mb-6">{message}</p>

            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose} disabled={isLoading}>
                    {cancelText}
                </Button>
                <Button variant={variant} onClick={onConfirm} disabled={isLoading}>
                    {isLoading ? 'Processing...' : confirmText}
                </Button>
            </div>
        </Modal>
    );
}
