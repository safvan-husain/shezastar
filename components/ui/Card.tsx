// components/ui/Card.tsx
import { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
    hover?: boolean;
}

export function Card({ children, className = '', hover = false }: CardProps) {
    return (
        <div className={`bg-[var(--card)] text-[var(--card-foreground)] rounded-xl shadow-lg border border-[var(--border)] p-6 transition-all duration-200 ${hover ? 'hover:shadow-xl hover:scale-[1.02]' : ''} ${className}`}>
            {children}
        </div>
    );
}
