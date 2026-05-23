'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import type { AdminRole } from '@/lib/auth/admin-auth-core';
import {
    canAccessManagePath,
    getDefaultManagePathForRole,
} from '@/lib/auth/admin-permissions';

export function ManageRouteGuard({ role }: { role: AdminRole }) {
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (!canAccessManagePath(role, pathname)) {
            router.replace(getDefaultManagePathForRole(role));
        }
    }, [pathname, role, router]);

    return null;
}
