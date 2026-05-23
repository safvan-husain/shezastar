import { getCachedAllCategories } from '@/lib/category/category-cache';
import { Footer } from './Footer';

export async function FooterWrapper() {
  const categoriesResult = await getCachedAllCategories();

  return <Footer categories={categoriesResult} />;
}
