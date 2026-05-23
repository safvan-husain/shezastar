import { describe, expect, it, vi } from 'vitest';
import type { Product } from '@/lib/product/model/product.model';

const getCachedProduct = vi.fn();

vi.mock('@/lib/product/product-cache', () => ({
    getCachedProduct,
    getCachedProductIds: vi.fn().mockResolvedValue([]),
}));

describe('product metadata canonical', () => {
    it('keeps product canonical path consistent', async () => {
        const mockProduct: Product = {
            id: 'prod-55',
            name: 'Mirror Dash Cam',
            subtitle: null,
            description: 'Front and rear recording',
            metaTitle: null,
            metaDescription: null,
            basePrice: 1000,
            images: [{ id: 'img-1', url: 'https://cdn.example.com/p.jpg', alt: 'Product', order: 0, mappedVariants: [] }],
            variants: [],
            subCategoryIds: [],
            variantStock: [],
            specifications: [],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
        };

        getCachedProduct.mockResolvedValue(mockProduct);

        const { generateMetadata } = await import('@/app/(store)/product/[id]/page');
        const metadata = await generateMetadata({ params: Promise.resolve({ id: 'prod-55' }) });

        expect(metadata.alternates?.canonical).toBe('/product/prod-55');
    });
});
