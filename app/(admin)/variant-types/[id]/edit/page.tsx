// app/(admin)/variant-types/[id]/edit/page.tsx
import Link from 'next/link';
import { VariantTypeForm } from '../../components/VariantTypeForm';
import { VariantTypesErrorHandler } from '../../components/VariantTypesClient';

type VariantTypeFormData = NonNullable<Parameters<typeof VariantTypeForm>[0]['initialData']>;

interface VariantTypeResponse {
    variantType: VariantTypeFormData | null;
    error: {
        message: string;
        status?: number;
        body?: unknown;
        url?: string;
        method?: string;
    } | null;
}

async function getVariantType(id: string): Promise<VariantTypeResponse> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/variant-types/${id}`;

    try {
        const res = await fetch(url, {
            cache: 'no-store',
        });

        if (!res.ok) {
            let body: any = {};
            try {
                body = await res.json();
            } catch {
                body = { error: 'Failed to parse response' };
            }

            return {
                variantType: null,
                error: {
                    message: body.message || body.error || 'Failed to fetch variant type',
                    status: res.status,
                    body,
                    url: res.url,
                    method: 'GET',
                },
            };
        }

        return { variantType: (await res.json()) as VariantTypeFormData, error: null };
    } catch (error) {
        return {
            variantType: null,
            error: {
                message: error instanceof Error ? error.message : 'Failed to fetch variant type',
                body: error instanceof Error ? { stack: error.stack } : { error },
                url,
                method: 'GET',
            },
        };
    }
}

export default async function EditVariantTypePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const { variantType, error } = await getVariantType(id);

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {error && <VariantTypesErrorHandler error={error} />}
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-6">
                    <Link href="/variant-types" className="hover:text-[var(--foreground)] transition-colors">
                        Variant Types
                    </Link>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-[var(--foreground)] font-medium">{variantType?.name ?? 'Variant Type'}</span>
                </nav>

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--ring)] flex items-center justify-center text-[var(--primary-foreground)] font-bold text-xl">
                            {variantType?.name ? variantType.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-[var(--foreground)]">
                                Edit Variant Type
                            </h1>
                            <p className="text-[var(--muted-foreground)] mt-1">
                                {variantType ? `Update ${variantType.name} and its options` : 'Unable to load this variant type right now'}
                            </p>
                        </div>
                    </div>
                    <div className="h-1 w-24 bg-gradient-to-r from-[var(--primary)] to-[var(--ring)] rounded-full"></div>
                </div>

                {/* Form */}
                {variantType ? (
                    <VariantTypeForm initialData={variantType} />
                ) : (
                    <div className="rounded-xl border-2 border-[var(--border-subtle)] p-4 text-[var(--muted-foreground)]">
                        Unable to load this variant type. Please try again later and copy the toast details if you need support.
                    </div>
                )}
            </div>
        </div>
    );
}
