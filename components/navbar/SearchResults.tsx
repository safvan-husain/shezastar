
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/product/model/product.model';
import { formatCurrency } from '@/lib/utils/currency';
import { stripHtml } from '@/lib/utils/string.utils';

interface SearchResultsProps {
    results: Product[];
    isLoading: boolean;
    onClose: () => void;
    query: string;
}

export function SearchResults({ results, isLoading, onClose, query }: SearchResultsProps) {
    if (isLoading) {
        return (
            <div className="absolute top-full left-0 w-full bg-white shadow-xl border border-gray-100 rounded-b-lg p-6 z-50">
                <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                </div>
            </div>
        );
    }

    if (!results.length && query) {
        return (
            <div className="absolute top-full left-0 w-full bg-white shadow-xl border border-gray-100 rounded-b-lg p-6 z-50">
                <p className="text-gray-500 text-center text-sm">No results found for "{query}"</p>
            </div>
        );
    }

    if (!results.length) return null;

    return (
        <div className="absolute top-full left-0 w-full bg-white shadow-xl border border-gray-100 rounded-b-lg py-4 z-50 max-h-[70vh] overflow-y-auto">
            <div className="px-4 pb-2 border-b border-gray-50 mb-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Products</h3>
            </div>
            <div className="flex flex-col">
                {results.map((product) => (
                    <Link
                        key={product.id}
                        href={`/product/${product.id}`}
                        onClick={onClose}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors group"
                    >
                        <div className="relative w-12 h-12 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                            {product.images[0]?.url && (
                                <Image
                                    src={product.images[0].url}
                                    alt={product.name}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            )}
                        </div>
                        <div className="flex-grow min-w-0">
                            <div className="flex justify-between items-start">
                                <h4 className="text-sm font-medium text-gray-900 truncate pr-2 group-hover:text-amber-600 transition-colors">
                                    {product.name}
                                </h4>
                                <div className="text-right flex-shrink-0">
                                    {product.offerPercentage ? (
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-bold text-red-600">
                                                {formatCurrency(product.basePrice * (1 - product.offerPercentage / 100))}
                                            </span>
                                            <span className="text-[10px] text-gray-400 line-through">
                                                {formatCurrency(product.basePrice)}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-sm font-medium text-gray-900">
                                            {formatCurrency(product.basePrice)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                                {product.subtitle || stripHtml(product.description?.substring(0, 60))}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
            <div className="mt-2 text-center border-t border-gray-50 pt-2">
                <Link
                    href={`/search?q=${encodeURIComponent(query)}`}
                    onClick={onClose}
                    className="text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
                >
                    View all results
                </Link>
            </div>
        </div>
    );
}
