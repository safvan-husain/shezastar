import { getCustomCards } from '@/lib/app-settings/app-settings.service';
import CustomCardList from './components/CustomCardList';
import Link from 'next/link';
import { connection } from 'next/server';

export default async function CustomCardsPage() {
    await connection();

    const customCards = await getCustomCards();

    return (
        <div className="container mx-auto px-4 py-8">
            <Link
                href="/manage/settings"
                className="mb-4 inline-block text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
                ← Back to Settings
            </Link>
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Custom Cards Management</h1>
                <p className="text-[var(--text-secondary)]">
                    Manage the 6 optional custom cards displayed in the app.
                </p>
            </div>

            <CustomCardList initialCards={customCards} />
        </div>
    );
}
