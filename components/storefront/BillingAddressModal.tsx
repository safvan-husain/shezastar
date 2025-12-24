'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import {
    BillingDetailsForm,
    mapBillingDetailsToFormValue,
    toBillingDetailsPayload,
    validateBillingDetailsForm,
    type BillingDetailsFormValue,
    type BillingDetailsFormErrors,
} from './BillingDetailsForm';
import { useStorefrontCart } from './StorefrontCartProvider';
import { useToast } from '@/components/ui/Toast';

interface BillingAddressModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function BillingAddressModal({ isOpen, onClose }: BillingAddressModalProps) {
    const { billingDetails, saveBillingDetails, isLoading } = useStorefrontCart();
    const { showToast } = useToast();
    const [form, setForm] = useState<BillingDetailsFormValue>(() =>
        mapBillingDetailsToFormValue(billingDetails)
    );
    const [errors, setErrors] = useState<BillingDetailsFormErrors>({});

    useEffect(() => {
        if (isOpen) {
            setForm(mapBillingDetailsToFormValue(billingDetails));
            setErrors({});
        }
    }, [isOpen, billingDetails]);

    const handleChange = (field: keyof BillingDetailsFormValue, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors = validateBillingDetailsForm(form);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            showToast('Please correct the errors in the form.', 'error');
            return;
        }

        const payload = toBillingDetailsPayload(form);
        const success = await saveBillingDetails(payload);
        if (success) {
            showToast('Billing address updated successfully.', 'success');
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Manage Building Address" containerClassName="bg-white">
            <form onSubmit={handleSubmit} className="space-y-6">
                <BillingDetailsForm value={form} errors={errors} onChange={handleChange} />
                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--storefront-border-light)]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-[var(--storefront-text-secondary)] hover:bg-[var(--storefront-bg-subtle)] rounded-md transition-colors"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-[var(--storefront-button-primary)] hover:bg-[var(--storefront-button-primary-hover)] rounded-md transition-colors disabled:opacity-50"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Saving...' : 'Save Address'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
