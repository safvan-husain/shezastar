// app/(admin)/layout.tsx
import Link from 'next/link';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-8">
                            <Link href="/" className="text-xl font-bold text-gray-900">
                                ShezaStar Admin
                            </Link>
                            <div className="flex space-x-4">
                                <Link
                                    href="/products"
                                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Products
                                </Link>
                                <Link
                                    href="/categories"
                                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Categories
                                </Link>
                                <Link
                                    href="/variant-types"
                                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Variant Types
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
            <main className="container mx-auto px-4 py-8">{children}</main>
        </div>
    );
}
