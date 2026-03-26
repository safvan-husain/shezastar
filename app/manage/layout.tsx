// app/manage/layout.tsx
import { requireAdminAuth } from '@/lib/auth/admin-auth';

import AdminNavbar from './components/AdminNavbar';

export const dynamic = "force-dynamic";

export default async function ManageLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await requireAdminAuth();

    return (
        <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
            <div className="mx-auto flex min-h-screen w-full max-w-[1600px] gap-3 px-3 py-3 sm:gap-4 sm:px-4">
                <AdminNavbar />
                <main className="min-w-0 flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
}
