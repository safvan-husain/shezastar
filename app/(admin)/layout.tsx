// app/(admin)/layout.tsx
import Link from 'next/link';

import { requireAdminAuth } from '@/lib/auth/admin-auth';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await requireAdminAuth();
    return (
        <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
            <nav className="backdrop-blur-sm shadow-lg border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-8">
                            <Link href="/" className="text-xl font-bold text-[var(--text-primary)]">
                                ShezaStar Admin
                            </Link>
                            <div className="flex space-x-4">
                                <Link
                                    href="/products"
                                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Products
                                </Link>
                                <Link
                                    href="/categories"
                                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Categories
                                </Link>
                                <Link
                                    href="/variant-types"
                                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Variant Types
                                </Link>
                                <Link
                                    href="/manage-orders"
                                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Manage Orders
                                </Link>
                                <Link
                                    href="/settings"
                                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Settings
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
            <main>{children}</main>
        </div>
    );
}
