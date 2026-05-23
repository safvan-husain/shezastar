import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { ObjectId } from 'mongodb';
import { GET as listProductSeo } from '@/app/api/admin/seo/products/route';
import { PATCH as patchProductSeoById } from '@/app/api/admin/seo/products/[id]/route';
import { POST as createProductRoute } from '@/app/api/products/route';
import { PUT as updateProduct, DELETE as deleteProduct } from '@/app/api/products/[id]/route';
import { PATCH as patchStaticSeo } from '@/app/api/admin/settings/seo/[key]/route';
import { createProduct } from '@/lib/product/product.service';
import { clear } from '../test-db';
import { AppError } from '@/lib/errors/app-error';
import type { AdminDocument } from '@/lib/auth/admin-auth-core';

const authState = vi.hoisted(() => ({
    adminId: '507f1f77bcf86cd799439011',
    email: 'seo@example.com',
    role: 'seo_manager' as const,
    displayName: 'SEO Manager',
}));

function buildAdmin(role: 'seo_manager' | 'super_admin'): AdminDocument {
    return {
        _id: new ObjectId(authState.adminId),
        email: role === 'seo_manager' ? authState.email : 'admin@example.com',
        role,
        displayName: role === 'seo_manager' ? authState.displayName : 'Super Admin',
        passwordHash: 'hash',
        salt: 'salt',
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

vi.mock('@/lib/auth/admin-auth', async () => {
    const actual = await vi.importActual<typeof import('@/lib/auth/admin-auth')>('@/lib/auth/admin-auth');
    return {
        ...actual,
        getAuthenticatedAdmin: vi.fn(async () => buildAdmin(authState.role)),
        requireAdminApiAuth: vi.fn(async (options?: { roles?: Array<'super_admin' | 'seo_manager'> }) => {
            const admin = buildAdmin(authState.role);
            if (options?.roles && !options.roles.includes(admin.role)) {
                throw new AppError(403, 'FORBIDDEN', { message: 'Insufficient permissions' });
            }
            return admin;
        }),
    };
});

vi.mock('@/lib/utils/file-upload', () => ({
    saveImage: vi.fn().mockResolvedValue('/uploads/test-static-seo.jpg'),
    deleteImage: vi.fn().mockResolvedValue(undefined),
    saveImages: vi.fn().mockResolvedValue([]),
}));

describe('admin SEO permissions integration', () => {
    let productId: string;

    beforeAll(async () => {
        await clear();
        authState.role = 'seo_manager';
        const product = await createProduct({
            name: 'SEO Permission Product',
            basePrice: 100,
            images: [],
            variants: [],
            variantStock: [],
            specifications: [],
            subCategoryIds: [],
        });
        productId = product.id;
    });

    afterAll(async () => {
        await clear();
        vi.restoreAllMocks();
    });

    it('allows seo manager to list and patch product SEO fields', async () => {
        const listRes = await listProductSeo(new Request('http://localhost/api/admin/seo/products'));
        const listBody = await listRes.json();

        expect(listRes.status).toBe(200);
        expect(listBody.products.some((item: { id: string }) => item.id === productId)).toBe(true);

        const patchRes = await patchProductSeoById(
            new Request(`http://localhost/api/admin/seo/products/${productId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    metaTitle: 'SEO Title',
                    metaDescription: 'SEO Description',
                }),
            }),
            { params: Promise.resolve({ id: productId }) },
        );
        const patchBody = await patchRes.json();

        expect(patchRes.status).toBe(200);
        expect(patchBody.metaTitle).toBe('SEO Title');
        expect(patchBody.metaDescription).toBe('SEO Description');
    });

    it('allows seo manager full product updates', async () => {
        const response = await updateProduct(
            new Request(`http://localhost/api/products/${productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Renamed Product',
                    basePrice: 999,
                }),
            }),
            { params: Promise.resolve({ id: productId }) },
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.name).toBe('Renamed Product');
        expect(body.basePrice).toBe(999);
    });

    it('allows seo manager to create and delete products', async () => {
        const createResponse = await createProductRoute(
            new Request('http://localhost/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'SEO Manager Created Product',
                    basePrice: 250,
                    images: [],
                    variants: [],
                    variantStock: [],
                    specifications: [],
                    subCategoryIds: [],
                }),
            }),
        );
        const created = await createResponse.json();

        expect(createResponse.status).toBe(201);
        expect(created.name).toBe('SEO Manager Created Product');

        const deleteResponse = await deleteProduct(
            new Request(`http://localhost/api/products/${created.id}`, { method: 'DELETE' }),
            { params: Promise.resolve({ id: created.id }) },
        );

        expect(deleteResponse.status).toBe(200);
    });

    it('allows seo manager to update static page SEO', async () => {
        const formData = new FormData();
        formData.append('title', 'Updated Home Title');
        formData.append('metaDescription', 'Updated home description for SEO manager test.');
        formData.append('currentOgImage', '');
        formData.append('removeOgImage', 'false');

        const response = await patchStaticSeo(
            new Request('http://localhost/api/admin/settings/seo/home', {
                method: 'PATCH',
                body: formData,
            }),
            { params: Promise.resolve({ key: 'home' }) },
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.title).toBe('Updated Home Title');
    });

    it('allows super admin through protected product update routes', async () => {
        authState.role = 'super_admin';

        const response = await updateProduct(
            new Request(`http://localhost/api/products/${productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Super Admin Rename',
                    basePrice: 150,
                }),
            }),
            { params: Promise.resolve({ id: productId }) },
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.name).toBe('Super Admin Rename');
    });
});
