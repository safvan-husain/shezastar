// components/ui/Input.tsx
'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className = '', ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-semibold text-[var(--foreground)] mb-2">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] transition-all duration-200 ${error ? 'border-[var(--danger)]' : 'border-[var(--border)]'
                        } ${className}`}
                    {...props}
                />
                {error && (
                    <p className="mt-1.5 text-sm text-[var(--danger)] font-medium">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
