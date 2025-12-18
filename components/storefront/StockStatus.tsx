'use client';

interface StockStatusProps {
    inStock: boolean;
    className?: string;
}

export function StockStatus({ inStock, className = '' }: StockStatusProps) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={inStock ? 'text-emerald-600' : 'text-red-600'}
            >
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <path d="m3.3 7 8.7 5 8.7-5" />
                <path d="M12 22V12" />
            </svg>
            <span className={`text-sm font-semibold ${inStock ? 'text-emerald-600' : 'text-red-600'}`}>
                {inStock ? 'In Stock' : 'Out of Stock'}
            </span>
        </div>
    );
}
