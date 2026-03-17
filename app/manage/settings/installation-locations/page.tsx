import { getInstallationLocations } from '@/lib/app-settings/app-settings.service';
import InstallationLocationsList from './components/InstallationLocationsList';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function InstallationLocationsPage() {
    const locations = await getInstallationLocations();

    return (
        <div className="container mx-auto px-4 py-8">
            <Link
                href="/manage/settings"
                className="mb-4 inline-block text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
                ← Back to Settings
            </Link>
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Installation Locations</h1>
                <p className="text-[var(--text-secondary)]">
                    Manage available locations for "At Home" installation services and their price deltas.
                </p>
            </div>

            <InstallationLocationsList initialLocations={locations} />
        </div>
    );
}
