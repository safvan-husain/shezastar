import { getCustomCards } from '@/lib/app-settings/app-settings.service';
import CustomCardList from './components/CustomCardList';

export const dynamic = 'force-dynamic';

export default async function CustomCardsPage() {
    const customCards = await getCustomCards();

    return (
        <div className="container mx-auto px-4 py-8">
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
