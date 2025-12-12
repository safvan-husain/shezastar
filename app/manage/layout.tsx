// app/manage/layout.tsx
import { requireAdminAuth } from '@/lib/auth/admin-auth';

import AdminNavbar from './components/AdminNavbar';

export default async function ManageLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await requireAdminAuth();

    return (
        <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
            <AdminNavbar />
            <main>{children}</main>
        </div>
    );
}
