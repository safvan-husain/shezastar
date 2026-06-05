import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireAdminApiAuth = vi.fn();
const buildAdminActivityActor = vi.fn();
const handleUpdateProduct = vi.fn();
const getProduct = vi.fn();
const revalidateProductCache = vi.fn();

vi.mock('@/lib/auth/admin-auth', () => ({
    requireAdminApiAuth,
}));

vi.mock('@/lib/activity/activity.service', () => ({
    buildAdminActivityActor,
}));

vi.mock('@/lib/product/product.controller', () => ({
    handleGetProduct: vi.fn(),
    handleUpdateProduct,
    handleDeleteProduct: vi.fn(),
}));

vi.mock('@/lib/product/product.service', () => ({
    getProduct,
}));

vi.mock('@/lib/product/product-cache', () => ({
    revalidateProductCache,
}));

vi.mock('@/lib/logging/request-logger', () => ({
    withRequestLogging: <T>(handler: T) => handler,
}));

describe('PUT /api/products/[id]', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        requireAdminApiAuth.mockResolvedValue({ _id: 'admin-1' });
        buildAdminActivityActor.mockReturnValue({ type: 'admin', adminId: 'admin-1', displayName: 'Admin' });
        getProduct.mockResolvedValue({ id: 'prod-1', slug: 'old-slug' });
        handleUpdateProduct.mockResolvedValue({
            status: 200,
            body: { id: 'prod-1', slug: 'old-slug', name: 'New Name' },
        });
    });

    it('passes explicit slug update mode through the full product route', async () => {
        const { PUT } = await import('./route');
        const response = await PUT(
            new Request('http://localhost/api/products/prod-1', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'New Name',
                    slugUpdateMode: 'keep',
                }),
            }),
            { params: Promise.resolve({ id: 'prod-1' }) },
        );

        expect(handleUpdateProduct).toHaveBeenCalledWith(
            'prod-1',
            {
                name: 'New Name',
                slugUpdateMode: 'keep',
            },
            expect.anything(),
        );
        expect(revalidateProductCache).toHaveBeenCalledWith({
            id: 'prod-1',
            slug: 'old-slug',
            previousSlug: 'old-slug',
        });
        expect(response.status).toBe(200);
    });
});
