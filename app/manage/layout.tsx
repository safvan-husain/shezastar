// app/manage/layout.tsx
import { connection } from 'next/server';
import { Suspense } from 'react';
import { getAdminRole, requireAdminAuth } from '@/lib/auth/admin-auth';

import AdminNavbar from './components/AdminNavbar';
import { ManageRouteGuard } from './components/ManageRouteGuard';

export default function ManageLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={null}>
            <ManageLayoutContent>{children}</ManageLayoutContent>
        </Suspense>
    );
}

async function ManageLayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    await connection();
    const admin = await requireAdminAuth();
    const adminRole = getAdminRole(admin);

    return (
        <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
            <ManageRouteGuard role={adminRole} />
            <div className="mx-auto flex min-h-screen w-full max-w-[1600px] gap-3 px-3 py-3 sm:gap-4 sm:px-4">
                <AdminNavbar adminRole={adminRole} />
                <main className="min-w-0 flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
}
