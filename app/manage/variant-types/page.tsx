// app/(admin)/variant-types/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { VariantTypesErrorHandler } from './components/VariantTypesClient';

async function getVariantTypes() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/variant-types`, {
        cache: 'no-store',
    });

    if (!res.ok) {
        let body;
        try {
            body = await res.json();
        } catch {
            body = { error: 'Failed to parse response' };
        }
        
        return {
            error: {
                message: body.message || body.error || 'Failed to load variant types',
                status: res.status,
                body,
                url: res.url,
            },
            data: [],
        };
    }

    return { data: await res.json(), error: null };
}

export default async function VariantTypesPage() {
    const { data: variantTypes, error } = await getVariantTypes();

    return (
        <div className="min-h-screen bg-[var(--background)]">
            {error && <VariantTypesErrorHandler error={error} />}
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header Section */}
                <div className="mb-10">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3">
                        <div>
                            <h1 className="text-4xl font-bold text-[var(--foreground)] mb-2">
                                Variant Types
                            </h1>
                            <p className="text-[var(--muted-foreground)] text-lg">
                                Manage product variant types and their options
                            </p>
                        </div>
                        <Link href="/manage/variant-types/new">
                            <Button size="lg" className="whitespace-nowrap">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Create Variant Type
                            </Button>
                        </Link>
                    </div>
                    <div className="h-1 w-24 bg-gradient-to-r from-[var(--primary)] to-[var(--ring)] rounded-full"></div>
                </div>

                {/* Content Section */}
                {variantTypes.length === 0 ? (
                    <Card className="text-center py-16">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-[var(--muted)] flex items-center justify-center">
                                <svg className="w-10 h-10 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                                    No variant types yet
                                </h3>
                                <p className="text-[var(--muted-foreground)] mb-6 max-w-md">
                                    Create your first variant type to start organizing product options like colors, sizes, or storage capacities.
                                </p>
                                <Link href="/manage/variant-types/new">
                                    <Button>Get Started</Button>
                                </Link>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <>
                        {/* Stats Bar */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                            <Card className="bg-[var(--bg-subtle)] text-[var(--text-primary)]">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm opacity-90 mb-1">Total Types</p>
                                        <p className="text-3xl font-bold">{variantTypes.length}</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                    </div>
                                </div>
                            </Card>
                            <Card className="bg-[var(--bg-subtle)] text-[var(--text-primary)]">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm opacity-90 mb-1">Total Items</p>
                                        <p className="text-3xl font-bold">
                                            {variantTypes.reduce((sum: number, type: any) => sum + type.items.length, 0)}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                        </svg>
                                    </div>
                                </div>
                            </Card>
                            <Card className="bg-[var(--bg-subtle)] text-[var(--text-primary)]">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm opacity-90 mb-1">Avg Items/Type</p>
                                        <p className="text-3xl font-bold">
                                            {Math.round(variantTypes.reduce((sum: number, type: any) => sum + type.items.length, 0) / variantTypes.length)}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Variant Types Grid */}
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {variantTypes.map((type: any) => (
                                <Card key={type.id} hover>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--ring)] flex items-center justify-center text-[var(--primary-foreground)] font-bold text-lg">
                                                {type.name.charAt(0).toUpperCase()}
                                            </div>
                                            <h2 className="text-xl font-bold text-[var(--foreground)]">{type.name}</h2>
                                        </div>
                                        <Link href={`/variant-types/${type.id}/edit`}>
                                            <Button size="sm" variant="ghost">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </Button>
                                        </Link>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                            </svg>
                                            <span className="font-semibold">
                                                {type.items.length} {type.items.length === 1 ? 'item' : 'items'}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {type.items.slice(0, 6).map((item: any) => (
                                                <span
                                                    key={item.id}
                                                    className="px-3 py-1.5 bg-[var(--accent)] text-[var(--accent-foreground)] text-sm font-medium rounded-full border border-[var(--border)] transition-colors hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)]"
                                                >
                                                    {item.name}
                                                </span>
                                            ))}
                                            {type.items.length > 6 && (
                                                <span className="px-3 py-1.5 text-[var(--muted-foreground)] text-sm font-medium">
                                                    +{type.items.length - 6} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
