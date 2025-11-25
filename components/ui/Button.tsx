// components/ui/Button.tsx
'use client';

import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
}

export function Button({
    variant = 'primary',
    size = 'md',
    className = '',
    children,
    ...props
}: ButtonProps) {
    const baseStyles = 'font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--ring)] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2';

    const variantStyles = {
        primary: 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 shadow-md hover:shadow-lg',
        secondary: 'bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--accent)] shadow-sm hover:shadow-md',
        danger: 'bg-[var(--danger)] text-white hover:opacity-90 shadow-md hover:shadow-lg',
        ghost: 'hover:bg-[var(--accent)] text-[var(--foreground)]',
        outline: 'border-2 border-[var(--border)] hover:bg-[var(--accent)] text-[var(--foreground)]',
    };

    const sizeStyles = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-5 py-2.5 text-base',
        lg: 'px-7 py-3.5 text-lg',
    };

    return (
        <button
            className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
