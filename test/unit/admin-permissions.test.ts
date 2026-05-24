import { describe, expect, it } from 'vitest';
import {
    canAccessManagePath,
    getAdminRole,
    getDefaultManagePathForRole,
    isSeoManager,
    isSuperAdmin,
} from '@/lib/auth/admin-permissions';
import type { AdminDocument } from '@/lib/auth/admin-auth-core';
import { ObjectId } from 'mongodb';

function createAdmin(role: AdminDocument['role']): AdminDocument {
    return {
        _id: new ObjectId(),
        email: `${role}@example.com`,
        role,
        passwordHash: 'hash',
        salt: 'salt',
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

describe('admin permissions', () => {
    it('defaults missing role to super_admin', () => {
        const admin = {
            ...createAdmin('super_admin'),
            role: undefined,
        } as AdminDocument;
        expect(getAdminRole(admin)).toBe('super_admin');
    });

    it('identifies seo manager and super admin roles', () => {
        expect(isSeoManager(createAdmin('seo_manager'))).toBe(true);
        expect(isSuperAdmin(createAdmin('super_admin'))).toBe(true);
    });

    it('allows seo manager under /manage/seo and /manage/products only', () => {
        expect(canAccessManagePath('seo_manager', '/manage/seo')).toBe(true);
        expect(canAccessManagePath('seo_manager', '/manage/seo/products')).toBe(true);
        expect(canAccessManagePath('seo_manager', '/manage/seo/products/507f1f77bcf86cd799439011/edit')).toBe(true);
        expect(canAccessManagePath('seo_manager', '/manage/products')).toBe(true);
        expect(canAccessManagePath('seo_manager', '/manage/products/new')).toBe(false);
        expect(canAccessManagePath('seo_manager', '/manage/products/507f1f77bcf86cd799439011/edit')).toBe(false);
        expect(canAccessManagePath('seo_manager', '/manage/products/bulk-price-update')).toBe(false);
        expect(canAccessManagePath('seo_manager', '/manage')).toBe(false);
        expect(canAccessManagePath('seo_manager', '/manage/categories')).toBe(false);
    });

    it('allows super admin everywhere in manage', () => {
        expect(canAccessManagePath('super_admin', '/manage/products')).toBe(true);
        expect(canAccessManagePath('super_admin', '/manage/seo/categories')).toBe(true);
    });

    it('returns role-specific default manage paths', () => {
        expect(getDefaultManagePathForRole('seo_manager')).toBe('/manage/seo');
        expect(getDefaultManagePathForRole('super_admin')).toBe('/manage');
    });
});
