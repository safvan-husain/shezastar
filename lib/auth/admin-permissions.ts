import type { AdminDocument, AdminRole } from '@/lib/auth/admin-auth-core';

export const SUPER_ADMIN_ROLES = ['super_admin'] as const satisfies readonly AdminRole[];
export const SEO_ADMIN_ROLES = ['super_admin', 'seo_manager'] as const satisfies readonly AdminRole[];

export const SEO_MANAGER_ALLOWED_PATH_PREFIXES = ['/manage/seo'] as const;

export function getAdminRole(admin: AdminDocument): AdminRole {
    return admin.role ?? 'super_admin';
}

export function isSeoManager(admin: AdminDocument) {
    return getAdminRole(admin) === 'seo_manager';
}

export function isSuperAdmin(admin: AdminDocument) {
    return getAdminRole(admin) === 'super_admin';
}

export function canAccessManagePath(role: AdminRole, pathname: string) {
    if (role === 'super_admin') {
        return true;
    }

    return SEO_MANAGER_ALLOWED_PATH_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
}

export function getDefaultManagePathForRole(role: AdminRole) {
    return role === 'seo_manager' ? '/manage/seo' : '/manage';
}
