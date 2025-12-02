import { getAppSettings } from '@/lib/app-settings/app-settings.service';
import HeroBannerForm from './components/HeroBannerForm';
import { HeroBanner } from '@/lib/app-settings/app-settings.schema';

export const dynamic = 'force-dynamic';

export default async function HeroBannerPage() {
    const settings = await getAppSettings();

    const defaultHeroBanner: HeroBanner = {
        imagePath: '',
        title: '',
        description: '',
        price: 0,
        offerPrice: 0,
        offerLabel: '',
    };

    const initialData = settings.homeHeroBanner || defaultHeroBanner;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Hero Banner Settings</h1>
                <p className="text-[var(--text-secondary)]">
                    Update the content of the main hero banner on the home page.
                </p>
            </div>

            <div className="max-w-4xl">
                <HeroBannerForm initialData={initialData} />
            </div>
        </div>
    );
}
