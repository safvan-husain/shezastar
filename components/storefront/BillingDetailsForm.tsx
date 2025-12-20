'use client';

import type { ChangeEvent, InputHTMLAttributes } from 'react';
import type { BillingDetails } from '@/lib/billing-details/billing-details.schema';

export type BillingDetailsFormValue = {
    email: string;
    firstName: string;
    lastName: string;
    country: string;
    streetAddress1: string;
    streetAddress2: string;
    city: string;
    stateOrCounty: string;
    phone: string;
    orderNotes: string;
};

export const EMPTY_BILLING_DETAILS: BillingDetailsFormValue = {
    email: '',
    firstName: '',
    lastName: '',
    country: '',
    streetAddress1: '',
    streetAddress2: '',
    city: '',
    stateOrCounty: '',
    phone: '',
    orderNotes: '',
};

export function mapBillingDetailsToFormValue(details?: BillingDetails | null): BillingDetailsFormValue {
    if (!details) {
        return { ...EMPTY_BILLING_DETAILS };
    }
    return {
        email: details.email ?? '',
        firstName: details.firstName ?? '',
        lastName: details.lastName ?? '',
        country: details.country ?? '',
        streetAddress1: details.streetAddress1 ?? '',
        streetAddress2: details.streetAddress2 ?? '',
        city: details.city ?? '',
        stateOrCounty: details.stateOrCounty ?? '',
        phone: details.phone ?? '',
        orderNotes: details.orderNotes ?? '',
    };
}

export function toBillingDetailsPayload(value: BillingDetailsFormValue): BillingDetails {
    const trimmed = (input: string) => input.trim();
    const payload: BillingDetails = {
        email: trimmed(value.email),
        firstName: trimmed(value.firstName),
        lastName: trimmed(value.lastName),
        country: trimmed(value.country),
        streetAddress1: trimmed(value.streetAddress1),
        city: trimmed(value.city),
        phone: trimmed(value.phone),
    };

    if (value.streetAddress2.trim()) {
        payload.streetAddress2 = trimmed(value.streetAddress2);
    }
    if (value.stateOrCounty.trim()) {
        payload.stateOrCounty = trimmed(value.stateOrCounty);
    }
    if (value.orderNotes.trim()) {
        payload.orderNotes = trimmed(value.orderNotes);
    }

    return payload;
}

export type BillingDetailsFormErrors = Partial<Record<keyof BillingDetailsFormValue, string>>;

export function validateBillingDetailsForm(value: BillingDetailsFormValue): BillingDetailsFormErrors {
    const errors: BillingDetailsFormErrors = {};
    const required: Array<keyof BillingDetailsFormValue> = [
        'email',
        'firstName',
        'lastName',
        'country',
        'streetAddress1',
        'city',
        'phone',
    ];

    for (const field of required) {
        if (!value[field]?.trim()) {
            errors[field] = 'Required';
        }
    }

    if (value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) {
        errors.email = 'Enter a valid email';
    }

    return errors;
}

interface BillingDetailsFormProps {
    value: BillingDetailsFormValue;
    errors?: BillingDetailsFormErrors;
    onChange: (field: keyof BillingDetailsFormValue, value: string) => void;
}

export function BillingDetailsForm({ value, errors = {}, onChange }: BillingDetailsFormProps) {
    const handleChange = (field: keyof BillingDetailsFormValue) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onChange(field, event.target.value);
    };

    return (
        <div className="bg-[var(--storefront-bg-subtle)] border border-[var(--storefront-border-light)] rounded-lg p-3 sm:p-4 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
                <FormField
                    label="First name"
                    value={value.firstName}
                    error={errors.firstName}
                    onChange={handleChange('firstName')}
                />
                <FormField
                    label="Last name"
                    value={value.lastName}
                    error={errors.lastName}
                    onChange={handleChange('lastName')}
                />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
                <FormField
                    label="Email"
                    type="email"
                    value={value.email}
                    error={errors.email}
                    onChange={handleChange('email')}
                />
                <FormField
                    label="Phone"
                    value={value.phone}
                    error={errors.phone}
                    onChange={handleChange('phone')}
                />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
                <FormField
                    label="Country"
                    value={value.country}
                    error={errors.country}
                    onChange={handleChange('country')}
                />
                <FormField
                    label="City"
                    value={value.city}
                    error={errors.city}
                    onChange={handleChange('city')}
                />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
                <FormField
                    label="Street address 1"
                    value={value.streetAddress1}
                    error={errors.streetAddress1}
                    onChange={handleChange('streetAddress1')}
                />
                <FormField
                    label="Street address 2"
                    value={value.streetAddress2}
                    error={errors.streetAddress2}
                    onChange={handleChange('streetAddress2')}
                    placeholder="Apartment, suite, etc."
                />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
                <FormField
                    label="State / County"
                    value={value.stateOrCounty}
                    error={errors.stateOrCounty}
                    onChange={handleChange('stateOrCounty')}
                />
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-[var(--storefront-text-secondary)] mb-2">
                        Order notes
                    </label>
                    <textarea
                        value={value.orderNotes}
                        onChange={handleChange('orderNotes')}
                        className={`w-full rounded-lg border bg-[var(--storefront-bg)] border-[var(--storefront-border)] px-3 py-2 text-sm text-[var(--storefront-text-primary)] placeholder:text-[var(--storefront-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--storefront-button-primary)] ${errors.orderNotes ? 'border-[var(--storefront-sale)]' : ''}`}
                        rows={4}
                        placeholder="Add delivery preferences or additional instructions"
                    />
                    {errors.orderNotes && (
                        <p className="mt-1 text-xs text-[var(--storefront-sale-text)]">{errors.orderNotes}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

function FormField({ label, error, className = '', ...props }: FormFieldProps) {
    return (
        <div className="flex flex-col">
            <label className="text-sm font-medium text-[var(--storefront-text-secondary)] mb-2">
                {label}
            </label>
            <input
                {...props}
                className={`w-full rounded-lg border bg-[var(--storefront-bg)] border-[var(--storefront-border)] px-3 py-2 text-sm text-[var(--storefront-text-primary)] placeholder:text-[var(--storefront-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--storefront-button-primary)] ${error ? 'border-[var(--storefront-sale)]' : ''} ${className}`}
            />
            {error && (
                <p className="mt-1 text-xs text-[var(--storefront-sale-text)]">{error}</p>
            )}
        </div>
    );
}
