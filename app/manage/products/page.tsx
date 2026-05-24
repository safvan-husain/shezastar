// app/(admin)/products/page.tsx
import ProductsClient from './components/ProductsClient';
import { getAdminRole, requireAdminAuth } from '@/lib/auth/admin-auth';

export default async function ProductsPage() {
    const admin = await requireAdminAuth();
    return <ProductsClient adminRole={getAdminRole(admin)} />;
}
