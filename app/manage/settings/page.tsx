import Link from 'next/link';

export default function SettingsPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Settings</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <Link
                    href="/manage/settings/hero-banner"
                    className="block p-6 bg-[var(--bg-elevated)] rounded-lg shadow-md hover:shadow-lg transition-shadow border border-[var(--border-subtle)]"
                >
                    <h2 className="text-xl font-semibold mb-2">Hero Banners</h2>
                    <p className="text-[var(--text-secondary)]">
                       Manage the main hero banner on the home page.
                    </p>
                </Link>
                <Link
                    href="/manage/settings/custom-cards"
                    className="block p-6 bg-[var(--bg-elevated)] rounded-lg shadow-md hover:shadow-lg transition-shadow border border-[var(--border-subtle)]"
                >
                    <h2 className="text-xl font-semibold mb-2">Custom Cards</h2>
                    <p className="text-[var(--text-secondary)]">
                        Configure the six optional custom cards that appear throughout the experience.
                    </p>
                </Link>
                <Link
                    href="/manage/settings/featured-products"
                    className="block p-6 bg-[var(--bg-elevated)] rounded-lg shadow-md hover:shadow-lg transition-shadow border border-[var(--border-subtle)]"
                >
                    <h2 className="text-xl font-semibold mb-2">Featured Products</h2>
                    <p className="text-[var(--text-secondary)]">
                        Manage the featured products displayed on the home page.
                    </p>
                </Link>
            </div>
        </div>
    );
}
