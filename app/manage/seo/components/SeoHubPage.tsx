import Link from 'next/link';
import type { AdminRole } from '@/lib/auth/admin-auth-core';

const SEO_SECTIONS = [
    {
        href: '/manage/seo/products',
        title: 'Product SEO',
        description: 'Update meta titles and descriptions for storefront products.',
    },
    {
        href: '/manage/seo/categories',
        title: 'Category SEO',
        description: 'Update category meta tags and OG images across all category levels.',
    },
    {
        href: '/manage/seo/static-pages',
        title: 'Static Page SEO',
        description: 'Update titles, descriptions, and OG images for static storefront pages.',
    },
] as const;

export default function SeoHubPage({ adminRole }: { adminRole: AdminRole }) {
    return (
        <div className="container mx-auto px-4 py-8">
            {adminRole === 'super_admin' && (
                <Link
                    href="/manage"
                    className="mb-4 inline-block text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                >
                    ← Back to dashboard
                </Link>
            )}
            <div className="mb-8">
                <h1 className="mb-2 text-3xl font-bold">SEO Management</h1>
                <p className="text-[var(--text-secondary)]">
                    Manage storefront metadata without changing product, category, or page content.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {SEO_SECTIONS.map((section) => (
                    <Link
                        key={section.href}
                        href={section.href}
                        className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 shadow-sm transition hover:border-[var(--text-primary)]"
                    >
                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">{section.title}</h2>
                        <p className="mt-2 text-sm text-[var(--text-secondary)]">{section.description}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
