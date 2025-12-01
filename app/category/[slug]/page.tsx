import { ProductGrid } from '@/components/ProductGrid';
import { getAllCategories } from '@/lib/category/category.service';
import { Category } from '@/lib/category/model/category.model';
import { Product } from '@/lib/product/model/product.model';

interface CategoryPageProps {
  params: { slug: string };
}

async function fetchProducts(subCategoryId: string): Promise<Product[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const url = `${baseUrl}/api/products?subCategoryId=${encodeURIComponent(subCategoryId)}&limit=200`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];

    const data = await res.json();
    return data.products ?? [];
  } catch (error) {
    console.error('Failed to load products for category', error);
    return [];
  }
}

function findCategoryBySlug(categories: Category[], slug: string) {
  for (const category of categories) {
    for (const sub of category.subCategories) {
      if (sub.id === slug) {
        return {
          title: sub.name,
          filterId: sub.id,
          breadcrumbs: [category.name, sub.name],
        };
      }

      const subSub = sub.subSubCategories.find((s) => s.id === slug);
      if (subSub) {
        return {
          title: subSub.name,
          filterId: subSub.id,
          breadcrumbs: [category.name, sub.name, subSub.name],
        };
      }
    }
  }

  return null;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = params;

  let categories: Category[] = [];
  try {
    categories = await getAllCategories();
  } catch (error) {
    console.error('Failed to load categories for category page', error);
  }

  const match = findCategoryBySlug(categories, slug);

  if (!match) {
    return (
      <div className="container mx-auto px-4 py-12 space-y-4">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Category not found</h1>
        <p className="text-[var(--text-secondary)]">
          We could not match this URL to a subcategory. Pick a category from the navigation to continue.
        </p>
      </div>
    );
  }

  const products = await fetchProducts(match.filterId);

  return (
    <div className="container mx-auto px-4 py-12 space-y-8">
      <div className="space-y-3">
        {match.breadcrumbs.length > 0 && (
          <p className="text-sm text-[var(--text-muted)]">{match.breadcrumbs.join(' / ')}</p>
        )}
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">{match.title}</h1>
        <p className="text-[var(--text-secondary)]">
          Products matched to this subcategory.{products.length > 0 ? '' : ' No items yet.'}
        </p>
      </div>

      <ProductGrid
        products={products}
        emptyMessage="No products are assigned to this subcategory yet. Add them from the admin panel."
      />
    </div>
  );
}
