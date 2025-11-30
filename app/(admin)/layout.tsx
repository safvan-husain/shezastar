// app/(admin)/layout.tsx
import Link from 'next/link';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
            <nav className="backdrop-blur-sm shadow-lg border-b border-[var(--border-subtle)] bg-[color:rgba(0,0,0,0.02)] dark:bg-[color:rgba(15,23,42,0.8)]">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-8">
                            <Link href="/" className="text-xl font-bold text-[var(--text-primary)] dark:text-[var(--text-inverted)]">
                                ShezaStar Admin
                            </Link>
                            <div className="flex space-x-4">
                                <Link
                                    href="/products"
                                    className="text-[var(--text-secondary)] dark:text-[color:rgba(249,250,251,0.8)] hover:text-[var(--text-primary)] dark:hover:text-[var(--text-inverted)] px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Products
                                </Link>
                                <Link
                                    href="/categories"
                                    className="text-[var(--text-secondary)] dark:text-[color:rgba(249,250,251,0.8)] hover:text-[var(--text-primary)] dark:hover:text-[var(--text-inverted)] px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Categories
                                </Link>
                                <Link
                                    href="/variant-types"
                                    className="text-[var(--text-secondary)] dark:text-[color:rgba(249,250,251,0.8)] hover:text-[var(--text-primary)] dark:hover:text-[var(--text-inverted)] px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Variant Types
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
