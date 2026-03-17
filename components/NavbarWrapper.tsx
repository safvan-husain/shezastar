import { getAllCategories } from '@/lib/category/category.service';
import { Navbar } from './Navbar';

export async function NavbarWrapper() {
  try {
    const categories = await getAllCategories();
    return <Navbar categories={categories} />;
  } catch (error) {
    console.error('Failed to load categories for navbar:', error);
    // Return empty navbar if categories fail to load
    return <Navbar categories={[]} />;
  }
}