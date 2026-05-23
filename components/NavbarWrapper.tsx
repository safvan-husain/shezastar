import { getCachedAllCategories } from '@/lib/category/category-cache';
import { Navbar } from './Navbar';

export async function NavbarWrapper() {
  const categories = await getCachedAllCategories();
  return <Navbar categories={categories} />;
}
