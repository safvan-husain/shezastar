import { getAllCategories } from '@/lib/category/category.service';
import { getStorefrontSession } from '@/lib/storefront-session';
import { Navbar } from './Navbar';

export async function NavbarWrapper() {
  try {
    const [categories, session] = await Promise.all([
      getAllCategories(),
      getStorefrontSession(),
    ]);
    const isAuthenticated = !!session?.userId;

    return <Navbar categories={categories} isAuthenticated={isAuthenticated} />;
  } catch (error) {
    console.error('Failed to load categories for navbar:', error);
    // Return empty navbar if categories fail to load
    return <Navbar categories={[]} isAuthenticated={false} />;
  }
}