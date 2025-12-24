
import { searchProducts } from '@/lib/product/product.service';
import { ProductGrid } from '@/components/ProductGrid';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Search Results | ShezaStar',
    description: 'Search results for your query',
};


export default async function SearchPage(props: {
    searchParams: Promise<{ q?: string }>;
}) {
    const searchParams = await props.searchParams;
    const query = searchParams.q || '';
    const products = query ? await searchProducts(query, 50) : [];

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 pt-32 lg:pt-52">
            <h1 className="text-2xl font-bold mb-6 text-black/90">
                {query ? `Search Results for "${query}" (${products.length})` : 'Search Products'}
            </h1>

            {query ? (
                <ProductGrid
                    products={products}
                    emptyMessage={`No products found for "${query}". Try a different search term.`}
                />
            ) : (
                <p className="text-gray-500">Please enter a search term to find products.</p>
            )}
        </div>
    );
}
