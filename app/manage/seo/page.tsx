import { getAuthenticatedAdmin, getAdminRole } from '@/lib/auth/admin-auth';
import { redirect } from 'next/navigation';
import SeoHubPage from './components/SeoHubPage';

export default async function ManageSeoPage() {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
        redirect('/login');
    }

    return <SeoHubPage adminRole={getAdminRole(admin)} />;
}
