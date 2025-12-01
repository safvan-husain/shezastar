import { getAllCategories } from '@/lib/category/category.service';
import { Footer } from './Footer';

export async function FooterWrapper() {
  const categoriesResult = await getAllCategories();

  return <Footer categories={categoriesResult} />;
}
