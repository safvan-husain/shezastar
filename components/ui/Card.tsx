// components/ui/Card.tsx
import { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
    hover?: boolean;
}

export function Card({ children, className = '', hover = false }: CardProps) {
    // Extract padding classes from className if provided, otherwise use default p-6
    const hasPadding = className.match(/\bp-\d+|\bpx-\d+|\bpy-\d+|\bpt-\d+|\bpb-\d+|\bpl-\d+|\bpr-\d+/);
    const defaultPadding = hasPadding ? '' : 'p-6';
    
    return (
        <div className={`bg-[var(--card)] text-[var(--card-foreground)] rounded-xl shadow-lg border border-[var(--border)] ${defaultPadding} transition-all duration-200 ${hover ? 'hover:shadow-xl hover:scale-[1.02]' : ''} ${className}`}>
            {children}
        </div>
    );
}
