import { ProductGrid } from '@/components/ProductGrid';
import { getAllCategories } from '@/lib/category/category.service';
import { Category } from '@/lib/category/model/category.model';
import { Product } from '@/lib/product/model/product.model';
import { AppError } from '@/lib/errors/app-error';
import { CategoryErrorHandler, CategoryPageError } from '../components/CategoryErrorHandler';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

function createErrorPayload(error: unknown, override?: Partial<CategoryPageError>): CategoryPageError {
  if (error instanceof AppError) {
    return {
      message: error.details?.message || error.code,
      status: error.status,
      body: {
        code: error.code,
        details: error.details,
      },
      method: 'GET',
      ...override,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      body: { stack: error.stack },
      method: 'GET',
      ...override,
    };
  }

  return {
    message: 'An unknown error occurred while loading data',
    body: { error },
    method: 'GET',
    ...override,
  };
}

async function fetchProducts(categoryId: string): Promise<{ products: Product[]; error: CategoryPageError | null }> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const url = `${baseUrl}/api/products?categoryId=${encodeURIComponent(categoryId)}&limit=200`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      let body: any;
      try {
        body = await res.json();
      } catch {
        body = { error: 'Failed to parse response body' };
      }

      return {
        products: [],
        error: {
          message: body.message || body.error || 'Failed to load products for this category',
          status: res.status,
          body,
          url: res.url,
          method: 'GET',
        },
      };
    }

    const data = await res.json();
    return { products: data.products ?? [], error: null };
  } catch (error) {
    return {
      products: [],
      error: createErrorPayload(error, {
        message: error instanceof Error ? error.message : 'Failed to load products for this category',
        url,
      }),
    };
  }
}

function matchesIdentifier(identifier: string, node: { id: string; slug?: string }) {
  return node.slug === identifier || node.id === identifier;
}

function findCategoryBySlug(categories: Category[], slug: string) {
  for (const category of categories) {
    for (const sub of category.subCategories) {
      if (matchesIdentifier(slug, sub)) {
        return {
          title: sub.name,
          filterId: sub.id,
          breadcrumbs: [category.name, sub.name],
        };
      }

      const subSub = sub.subSubCategories.find((s) => matchesIdentifier(slug, s));
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
  const { slug } = await params;

  let categories: Category[] = [];
  let loadError: CategoryPageError | null = null;
  try {
    categories = await getAllCategories();
  } catch (error) {
    loadError = createErrorPayload(error, {
      message: error instanceof Error ? error.message : 'Failed to load categories',
    });
  }

  if (loadError) {
    return (
      <div className="container mx-auto px-4 py-12 space-y-4">
        <CategoryErrorHandler error={loadError} />
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Unable to load categories</h1>
        <p className="text-[var(--text-secondary)]">
          Something went wrong while loading categories. Please try again, and copy the toast details if you need to report the issue.
        </p>
      </div>
    );
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

  const { products, error: productsError } = await fetchProducts(match.filterId);

  return (
    <div className="container mx-auto px-4 py-12 space-y-8">
      {productsError && <CategoryErrorHandler error={productsError} />}
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
