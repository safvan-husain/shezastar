// app/(admin)/variant-types/[id]/edit/page.tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getVariantType } from '@/lib/queries/variant-type.queries';
import { VariantTypeForm } from '../../components/VariantTypeForm';

export default async function EditVariantTypePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const variantType = await getVariantType(id);

    if (!variantType) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-6">
                    <Link href="/variant-types" className="hover:text-[var(--foreground)] transition-colors">
                        Variant Types
                    </Link>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-[var(--foreground)] font-medium">{variantType.name}</span>
                </nav>

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--ring)] flex items-center justify-center text-white font-bold text-xl">
                            {variantType.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-[var(--foreground)]">
                                Edit Variant Type
                            </h1>
                            <p className="text-[var(--muted-foreground)] mt-1">
                                Update {variantType.name} and its options
                            </p>
                        </div>
                    </div>
                    <div className="h-1 w-24 bg-gradient-to-r from-[var(--primary)] to-[var(--ring)] rounded-full"></div>
                </div>

                {/* Form */}
                <VariantTypeForm initialData={variantType} />
            </div>
        </div>
    );
}
