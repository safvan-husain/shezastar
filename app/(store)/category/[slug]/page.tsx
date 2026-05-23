import type { Metadata } from 'next';
import { cache, Suspense } from 'react';
import { ProductGrid } from '@/components/ProductGrid';
import { getAllCategories } from '@/lib/category/category.service';
import { Category } from '@/lib/category/model/category.model';
import { Product } from '@/lib/product/model/product.model';
import { getAllProducts } from '@/lib/product/product.service';
import { AppError } from '@/lib/errors/app-error';
import { CategoryErrorHandler, CategoryPageError } from '../components/CategoryErrorHandler';
import { Breadcrumbs, BreadcrumbItem } from '../components/Breadcrumbs';
import { CategoryPageSkeleton } from '../components/CategoryPageSkeleton';
import { buildCategoryPath } from '@/lib/seo/canonical';

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

const fetchCategories = cache(async (): Promise<{ categories: Category[]; error: CategoryPageError | null }> => {
  try {
    return { categories: await getAllCategories(), error: null };
  } catch (error) {
    return {
      categories: [],
      error: createErrorPayload(error, {
        message: error instanceof Error ? error.message : 'Failed to load categories',
      }),
    };
  }
});

async function fetchProducts(categoryId: string): Promise<{ products: Product[]; error: CategoryPageError | null }> {
  try {
    const data = await getAllProducts(1, 200, categoryId);
    return { products: data.products ?? [], error: null };
  } catch (error) {
    return {
      products: [],
      error: createErrorPayload(error, {
        message: error instanceof Error ? error.message : 'Failed to load products for this category',
        url: `service:product:getAllProducts?categoryId=${encodeURIComponent(categoryId)}&limit=200`,
      }),
    };
  }
}

type CategoryLevel = 'category' | 'subCategory' | 'subSubCategory';

interface CategoryMatch {
  title: string;
  filterId: string;
  level: CategoryLevel;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImagePath: string | null;
  breadcrumbs: BreadcrumbItem[];
}

function matchesIdentifier(identifier: string, node: { id: string; slug?: string }) {
  return node.slug === identifier || node.id === identifier;
}

function findCategoryBySlug(categories: Category[], slug: string): CategoryMatch | null {
  for (const category of categories) {
    if (matchesIdentifier(slug, category)) {
      const filterId = category.slug || category.id;
      return {
        title: category.name,
        filterId,
        level: 'category',
        metaTitle: category.metaTitle ?? null,
        metaDescription: category.metaDescription ?? null,
        ogImagePath: category.imagePath ?? null,
        breadcrumbs: [{ id: category.id, label: category.name }],
      };
    }

    for (const sub of category.subCategories) {
      if (matchesIdentifier(slug, sub)) {
        const filterId = sub.slug || sub.id;
        return {
          title: sub.name,
          filterId,
          level: 'subCategory',
          metaTitle: sub.metaTitle ?? null,
          metaDescription: sub.metaDescription ?? null,
          ogImagePath: sub.imagePath ?? category.imagePath ?? null,
          breadcrumbs: [
            { id: category.slug || category.id, label: category.name, href: `/category/${category.slug}` },
            { id: sub.slug || sub.id, label: sub.name },
          ],
        };
      }

      const subSub = sub.subSubCategories.find((s) => matchesIdentifier(slug, s));
      if (subSub) {
        const filterId = subSub.slug || subSub.id;
        return {
          title: subSub.name,
          filterId,
          level: 'subSubCategory',
          metaTitle: subSub.metaTitle ?? null,
          metaDescription: subSub.metaDescription ?? null,
          ogImagePath: subSub.imagePath ?? sub.imagePath ?? category.imagePath ?? null,
          breadcrumbs: [
            { id: category.slug || category.id, label: category.name, href: `/category/${category.slug}` },
            { id: sub.slug || sub.id, label: sub.name, href: `/category/${sub.slug}` },
            { id: subSub.slug || subSub.id, label: subSub.name },
          ],
        };
      }
    }
  }

  return null;
}

function buildDescription(level: CategoryLevel, title: string, hasProducts: boolean) {
  if (level === 'category') {
    return `All products in ${title} and its subcategories.${hasProducts ? '' : ' No items yet.'}`;
  }

  if (level === 'subCategory') {
    return `Products in ${title} and its subcategories.${hasProducts ? '' : ' No items yet.'}`;
  }

  return `Products in ${title}.${hasProducts ? '' : ' No items yet.'}`;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const { categories, error } = await fetchCategories();
    if (error) {
      return {
        title: 'Category | Sheza Star',
        description: 'Browse categories on Sheza Star.',
      };
    }

    const match = findCategoryBySlug(categories, slug);
    if (!match) {
      return {
        title: 'Category not found | Sheza Star',
        description: 'Browse categories on Sheza Star.',
        alternates: {
          canonical: buildCategoryPath(slug),
        },
      };
    }

    const title = match.metaTitle || `${match.title} | Sheza Star`;
    const description = match.metaDescription || buildDescription(match.level, match.title, true);
    const imageUrl = match.ogImagePath || undefined;
    const canonical = buildCategoryPath(slug);

    return {
      title,
      description,
      alternates: {
        canonical,
      },
      openGraph: {
        title,
        description,
        type: 'website',
        url: canonical,
        images: imageUrl ? [{ url: imageUrl, alt: match.title }] : undefined,
      },
      twitter: {
        card: imageUrl ? 'summary_large_image' : 'summary',
        title,
        description,
        images: imageUrl ? [imageUrl] : undefined,
      },
    };
  } catch {
    return {
      title: 'Category | Sheza Star',
      description: 'Browse categories on Sheza Star.',
    };
  }
}

function CategoryLoadErrorState({ error }: { error: CategoryPageError }) {
  return (
    <div className="space-y-4">
      <CategoryErrorHandler error={error} />
      <h1 className="text-3xl font-bold text-[var(--text-primary)]">Unable to load categories</h1>
      <p className="text-[var(--text-secondary)]">
        Something went wrong while loading categories. Please try again, and copy the toast details if you need to report the issue.
      </p>
    </div>
  );
}

function CategoryNotFoundState() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-[var(--text-primary)]">Category not found</h1>
      <p className="text-[var(--text-secondary)]">
        We could not match this URL to a subcategory. Pick a category from the navigation to continue.
      </p>
    </div>
  );
}

async function CategoryProductsSection({ slug }: { slug: string }) {
  const { categories, error: loadError } = await fetchCategories();

  if (loadError) {
    return <CategoryLoadErrorState error={loadError} />;
  }

  const match = findCategoryBySlug(categories, slug);

  if (!match) {
    return <CategoryNotFoundState />;
  }

  const { products, error: productsError } = await fetchProducts(match.filterId);

  return (
    <>
      {productsError && <CategoryErrorHandler error={productsError} />}
      <div className="space-y-3">
        {match.breadcrumbs.length > 0 && <Breadcrumbs items={match.breadcrumbs} />}
      </div>

      <ProductGrid
        products={products}
        emptyMessage="No products are assigned to this category yet. Add them from the admin panel."
      />
    </>
  );
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  return (
    <div className="container mx-auto px-4 py-12 space-y-8 mt-24">
      <Suspense fallback={<CategoryPageSkeleton />}>
        <CategoryProductsSection slug={slug} />
      </Suspense>
    </div>
  );
}
