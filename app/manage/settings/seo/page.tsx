import Link from 'next/link';
import { getStaticPageSeoSettings } from '@/lib/app-settings/app-settings.service';
import StaticSeoEditor from './components/StaticSeoEditor';

export default async function SeoSettingsPage() {
    const settings = await getStaticPageSeoSettings();

    return (
        <div className="container mx-auto px-4 py-8">
            <Link
                href="/manage/settings"
                className="mb-4 inline-block text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
                ← Back to Settings
            </Link>
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Static Page SEO</h1>
                <p className="text-[var(--text-secondary)]">
                    Update metadata for storefront static pages. Changes are applied to title, description, and optional OG image.
                </p>
            </div>

            <StaticSeoEditor initialSettings={settings} />
        </div>
    );
}
