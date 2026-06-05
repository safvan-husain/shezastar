import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireAdminApiAuth = vi.fn();
const updateProductSeo = vi.fn();
const getProduct = vi.fn();
const buildAdminActivityActor = vi.fn();
const revalidateProductCache = vi.fn();

vi.mock('@/lib/auth/admin-auth', () => ({
    requireAdminApiAuth,
}));

vi.mock('@/lib/product/product.service', () => ({
    updateProductSeo,
    getProduct,
}));

vi.mock('@/lib/activity/activity.service', () => ({
    buildAdminActivityActor,
}));

vi.mock('@/lib/product/product-cache', () => ({
    revalidateProductCache,
}));

vi.mock('@/lib/logging/request-logger', () => ({
    withRequestLogging: <T>(handler: T) => handler,
}));

describe('PATCH /api/admin/seo/products/[id]', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        requireAdminApiAuth.mockResolvedValue({ _id: 'admin-1' });
        buildAdminActivityActor.mockReturnValue({ type: 'admin', adminId: 'admin-1', displayName: 'SEO Manager' });
        getProduct.mockResolvedValue({ id: 'prod-1', slug: 'old-slug' });
        updateProductSeo.mockResolvedValue({ id: 'prod-1', slug: 'new-slug', metaTitle: 'Title', metaDescription: 'Description' });
    });

    it('allows SEO managers to update product slug fields', async () => {
        const { PATCH } = await import('./route');
        const response = await PATCH(
            new Request('http://localhost/api/admin/seo/products/prod-1', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slug: 'new-slug',
                    metaTitle: 'Title',
                    metaDescription: 'Description',
                }),
            }),
            { params: Promise.resolve({ id: 'prod-1' }) },
        );

        expect(updateProductSeo).toHaveBeenCalledWith(
            'prod-1',
            {
                slug: 'new-slug',
                metaTitle: 'Title',
                metaDescription: 'Description',
            },
            expect.anything(),
        );
        expect(revalidateProductCache).toHaveBeenCalledWith({
            id: 'prod-1',
            slug: 'new-slug',
            previousSlug: 'old-slug',
        });
        expect(response.status).toBe(200);
    });
});
