import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '@/lib/product/model/product.model';

const getCachedStorefrontProduct = vi.fn();
const permanentRedirect = vi.fn();

vi.mock('@/lib/product/product-cache', () => ({
    getCachedStorefrontProduct,
    getCachedProductSlugs: vi.fn().mockResolvedValue([]),
}));

vi.mock('next/navigation', () => ({
    permanentRedirect,
}));

describe('product metadata canonical', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('keeps product canonical path consistent', async () => {
        const mockProduct: Product = {
            id: 'prod-55',
            slug: 'mirror-dash-cam',
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

        getCachedStorefrontProduct.mockResolvedValue({
            product: mockProduct,
            matchedLegacyId: false,
        });

        const { generateMetadata } = await import('@/app/(store)/product/[id]/page');
        const metadata = await generateMetadata({ params: Promise.resolve({ id: 'mirror-dash-cam' }) });

        expect(metadata.alternates?.canonical).toBe('/product/mirror-dash-cam');
    });

    it('permanently redirects legacy object id URLs to the slug URL', async () => {
        const mockProduct: Product = {
            id: '507f1f77bcf86cd799439011',
            slug: 'mirror-dash-cam',
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

        getCachedStorefrontProduct.mockResolvedValue({
            product: mockProduct,
            matchedLegacyId: true,
        });

        const { default: ProductPage } = await import('@/app/(store)/product/[id]/page');
        await ProductPage({ params: Promise.resolve({ id: mockProduct.id }) });

        expect(permanentRedirect).toHaveBeenCalledWith('/product/mirror-dash-cam');
    });
});
