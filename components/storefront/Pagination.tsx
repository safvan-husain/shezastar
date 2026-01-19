'use client';

import Link from 'next/link';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    baseUrl: string;
}

export function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
    if (totalPages <= 1) return null;

    const getPageUrl = (page: number) => {
        // Handle both cases: baseUrl being a pathname or a full URL
        // Since this is for internal routing, it's usually just a pathname
        const separator = baseUrl.includes('?') ? '&' : '?';
        return `${baseUrl}${separator}page=${page}`;
    };

    const renderPageLinks = () => {
        const pages = [];
        const maxVisiblePages = 5;

        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === currentPage;
            pages.push(
                <Link
                    key={i}
                    href={getPageUrl(i)}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${isActive
                            ? 'bg-[var(--storefront-button-primary)] text-white border-[var(--storefront-button-primary)]'
                            : 'bg-white text-[var(--storefront-text-secondary)] border-[var(--storefront-border)] hover:bg-[var(--storefront-bg-hover)]'
                        }`}
                >
                    {i}
                </Link>
            );
        }
        return pages;
    };

    return (
        <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
            <Link
                href={currentPage > 1 ? getPageUrl(currentPage - 1) : '#'}
                className={`flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--storefront-border)] bg-white transition-colors hover:bg-[var(--storefront-bg-hover)] ${currentPage === 1 ? 'pointer-events-none opacity-50' : ''
                    }`}
                aria-disabled={currentPage === 1}
            >
                <svg
                    className="h-5 w-5 text-[var(--storefront-text-secondary)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                    />
                </svg>
            </Link>

            <div className="flex items-center gap-2">
                {renderPageLinks()}
            </div>

            <Link
                href={currentPage < totalPages ? getPageUrl(currentPage + 1) : '#'}
                className={`flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--storefront-border)] bg-white transition-colors hover:bg-[var(--storefront-bg-hover)] ${currentPage === totalPages ? 'pointer-events-none opacity-50' : ''
                    }`}
                aria-disabled={currentPage === totalPages}
            >
                <svg
                    className="h-5 w-5 text-[var(--storefront-text-secondary)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                    />
                </svg>
            </Link>
        </nav>
    );
}
