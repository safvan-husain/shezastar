import Link from 'next/link';
import { getStaticPageSeoSettings } from '@/lib/app-settings/app-settings.service';
import StaticSeoEditor from '@/app/manage/settings/seo/components/StaticSeoEditor';

export default async function StaticPagesSeoPage() {
    const settings = await getStaticPageSeoSettings();

    return (
        <div className="container mx-auto px-4 py-8">
            <Link
                href="/manage/seo"
                className="mb-4 inline-block text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
                ← Back to SEO
            </Link>
            <div className="mb-8">
                <h1 className="mb-2 text-3xl font-bold">Static Page SEO</h1>
                <p className="text-[var(--text-secondary)]">
                    Update metadata for storefront static pages. Changes apply to title, description, and optional OG image.
                </p>
            </div>

            <StaticSeoEditor initialSettings={settings} />
        </div>
    );
}
