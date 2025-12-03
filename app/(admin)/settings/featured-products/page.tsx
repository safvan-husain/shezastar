import { getFeaturedProducts } from '@/lib/app-settings/app-settings.service';
import FeaturedProductsList from './components/FeaturedProductsList';

export const dynamic = 'force-dynamic';

export default async function FeaturedProductsPage() {
    const products = await getFeaturedProducts();

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Featured Products Management</h1>
                <p className="text-[var(--text-secondary)]">
                    Manage the featured products displayed on the home page.
                </p>
            </div>

            <FeaturedProductsList initialProducts={products} />
        </div>
    );
}
