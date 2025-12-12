// app/(admin)/products/new/page.tsx
import Link from 'next/link';
import { ProductForm } from '../components/ProductForm';

export default function NewProductPage() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-6">
                    <Link href="/manage/products" className="hover:text-[var(--foreground)] transition-colors">
                        Products
                    </Link>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-[var(--foreground)] font-medium">Create New</span>
                </nav>

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--ring)] flex items-center justify-center text-[var(--primary-foreground)]">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-[var(--foreground)]">
                                Create Product
                            </h1>
                            <p className="text-[var(--muted-foreground)] mt-1">
                                Add a new product to your catalog with images and variants
                            </p>
                        </div>
                    </div>
                    <div className="h-1 w-24 bg-gradient-to-r from-[var(--primary)] to-[var(--ring)] rounded-full"></div>
                </div>

                {/* Form */}
                <ProductForm />
            </div>
        </div>
    );
}
