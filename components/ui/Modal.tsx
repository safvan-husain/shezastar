// components/ui/Modal.tsx
'use client';

import { ReactNode, useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-[var(--bg-base)]/60"
                onClick={onClose}
            />
            <div className="relative bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-[var(--border-subtle)]">
                <div className="sticky top-0 bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-[var(--text-primary)]">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-2xl"
                    >
                        ×
                    </button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}
