'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

type NavItem = {
    href: string;
    label: string;
};

const NAV_ITEMS: NavItem[] = [
    { href: '/manage', label: 'Dashboard' },
    { href: '/manage/products', label: 'Products' },
    { href: '/manage/categories', label: 'Categories' },
    { href: '/manage/brands', label: 'Brands' },
    { href: '/manage/variant-types', label: 'Variant Types' },
    { href: '/manage/orders', label: 'Orders' },
    { href: '/manage/settings', label: 'Settings' },
];

export default function AdminNavbar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [isBackingUp, setIsBackingUp] = useState(false);

    const isActive = (href: string) => {
        if (!pathname) return false;
        if (href === '/') return pathname === '/';
        return pathname === href || pathname.startsWith(`${href}/`);
    };

    const handleBackup = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (isBackingUp) return;

        setIsBackingUp(true);
        try {
            const response = await fetch('/api/manage/backup');
            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/login';
                    return;
                }
                throw new Error('Backup failed');
            }

            // Get filename from header or use default
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `mongodb-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.archive.gz`;
            if (contentDisposition && contentDisposition.includes('filename=')) {
                filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Backup error:', error);
            alert('Failed to download backup. Please try again.');
        } finally {
            setIsBackingUp(false);
        }
    };

    const linkBase =
        'px-3 py-2 rounded-md text-sm font-medium transition-colors';

    return (
        <nav className="backdrop-blur-sm shadow-lg border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] sticky top-0 z-30">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsOpen((v) => !v)}
                            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-strong)]"
                            aria-label="Toggle navigation"
                            aria-expanded={isOpen}
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-5 w-5"
                            >
                                {isOpen ? (
                                    <>
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </>
                                ) : (
                                    <>
                                        <line x1="3" y1="6" x2="21" y2="6" />
                                        <line x1="3" y1="12" x2="21" y2="12" />
                                        <line x1="3" y1="18" x2="21" y2="18" />
                                    </>
                                )}
                            </svg>
                        </button>

                        <Link
                            href="/manage"
                            className="text-lg md:text-xl font-bold text-[var(--text-primary)] whitespace-nowrap"
                        >
                            ShezaStar Admin
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center gap-1">
                        {NAV_ITEMS.map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`${linkBase} ${active
                                        ? 'bg-[var(--bg-subtle)] text-[var(--text-primary)]'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                                        }`}
                                    aria-current={active ? 'page' : undefined}
                                    onClick={() => setIsOpen(false)}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                        <button
                            type="button"
                            onClick={handleBackup}
                            disabled={isBackingUp}
                            className={`${linkBase} text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed`}
                            title="Download MongoDB Backup"
                        >
                            {isBackingUp ? (
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : (
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-4 w-4"
                                >
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                            )}
                            {isBackingUp ? 'Backing up...' : 'Backup'}
                        </button>
                    </div>
                </div>

                <div
                    className={`md:hidden overflow-hidden transition-all duration-200 ${isOpen
                        ? 'max-h-96 opacity-100 pb-3'
                        : 'max-h-0 opacity-0'
                        }`}
                >
                    <div className="flex flex-col gap-1 pt-1">
                        {NAV_ITEMS.map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`${linkBase} ${active
                                        ? 'bg-[var(--bg-subtle)] text-[var(--text-primary)]'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                                        }`}
                                    aria-current={active ? 'page' : undefined}
                                    onClick={() => setIsOpen(false)}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                        <button
                            type="button"
                            onClick={handleBackup}
                            disabled={isBackingUp}
                            className={`${linkBase} text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] flex items-center gap-2 disabled:opacity-50`}
                        >
                            {isBackingUp ? (
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : (
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-4 w-4"
                                >
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                            )}
                            {isBackingUp ? 'Backing up...' : 'Backup'}
                        </button>
                    </div>
                </div>
            </div>
        </nav >
    );
}
