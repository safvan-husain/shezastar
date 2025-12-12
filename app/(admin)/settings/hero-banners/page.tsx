import { getHeroBanners } from '@/lib/app-settings/app-settings.service';
import HeroBannerList from './components/HeroBannerList';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function HeroBannersPage() {
    const banners = await getHeroBanners();

    return (
        <div className="container mx-auto px-4 py-8">
            <Link
                href="/settings"
                className="mb-4 inline-block text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
                ← Back to Settings
            </Link>
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Hero Banners Management</h1>
                <p className="text-[var(--text-secondary)]">
                    Manage the hero banners displayed on the home page.
                </p>
            </div>

            <HeroBannerList initialBanners={banners} />
        </div>
    );
}
