// app/(admin)/layout.tsx
import Link from 'next/link';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[var(--primary)] via-blue-600 to-blue-800">
            <nav className="bg-white/10 backdrop-blur-sm shadow-lg border-b border-white/20">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-8">
                            <Link href="/" className="text-xl font-bold text-white">
                                ShezaStar Admin
                            </Link>
                            <div className="flex space-x-4">
                                <Link
                                    href="/products"
                                    className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Products
                                </Link>
                                <Link
                                    href="/categories"
                                    className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Categories
                                </Link>
                                <Link
                                    href="/variant-types"
                                    className="text-white/80 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
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
