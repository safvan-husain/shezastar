import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Product } from '@/lib/product/model/product.model';
import { ProductErrorHandler, ProductPageError } from '../components/ProductErrorHandler';
import { ProductDetails } from '../components/ProductDetails';
import { RelatedProducts } from '../components/RelatedProducts';
import { ProductDetailsSkeleton } from '../components/ProductPageSkeleton';
import { RecentlyViewed } from '@/components/storefront/RecentlyViewed';
import { getBroaderCategoryContextIds } from '@/lib/category/category.service';
import { getCachedProduct } from '@/lib/product/product-cache';
import { getAllProducts } from '@/lib/product/product.service';
import { AppError } from '@/lib/errors/app-error';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

function createErrorPayload(error: unknown, override?: Partial<ProductPageError>): ProductPageError {
  if (error instanceof AppError) {
    return {
      message: error.details?.message || error.message || error.code,
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
    message: 'An unknown error occurred while loading product',
    body: { error },
    method: 'GET',
    ...override,
  };
}

function stripHtml(value?: string | null) {
  if (!value) return '';
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function buildProductDescription(product: Product) {
  return product.subtitle || stripHtml(product.description) || `Shop ${product.name} at Sheza Star.`;
}

async function fetchProduct(id: string): Promise<{ product: Product | null; error: ProductPageError | null }> {
  try {
    const product = await getCachedProduct(id);
    return { product, error: null };
  } catch (error) {
    return {
      product: null,
      error: createErrorPayload(error, {
        message: error instanceof Error ? error.message : 'Failed to load product',
        url: `service:product:getProduct:${encodeURIComponent(id)}`,
      }),
    };
  }
}

async function fetchRelatedProducts(categoryIds: string[], originId?: string): Promise<{ products: Product[]; error: ProductPageError | null }> {
  if (categoryIds.length === 0) {
    return { products: [], error: null };
  }

  try {
    const data = await getAllProducts(1, 8, categoryIds, originId);
    return { products: data.products ?? [], error: null };
  } catch (error) {
    const params = new URLSearchParams();
    categoryIds.forEach(id => params.append('categoryId', id));
    if (originId) params.append('originId', originId);
    params.append('limit', '8');
    return {
      products: [],
      error: createErrorPayload(error, {
        message: error instanceof Error ? error.message : 'Failed to load related products',
        url: `service:product:getAllProducts?${params.toString()}`,
      }),
    };
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const product = await getCachedProduct(id);
    const description = buildProductDescription(product);
    const imageUrl = product.images.find((image) => image.url)?.url;

    return {
      title: `${product.name} | Sheza Star`,
      description,
      alternates: {
        canonical: `/product/${id}`,
      },
      openGraph: {
        title: `${product.name} | Sheza Star`,
        description,
        type: 'website',
        images: imageUrl ? [{ url: imageUrl, alt: product.name }] : undefined,
      },
      twitter: {
        card: imageUrl ? 'summary_large_image' : 'summary',
        title: `${product.name} | Sheza Star`,
        description,
        images: imageUrl ? [imageUrl] : undefined,
      },
    };
  } catch {
    return {
      title: 'Product | Sheza Star',
      description: 'Shop quality car accessories from Sheza Star.',
    };
  }
}

function getTabbyConfig() {
  const tabbyPublicKey = process.env.TABBY_PUBLIC_KEY || '';
  const tabbyMerchantCode = process.env.TABBY_MERCHANT_CODE || '';

  return (tabbyPublicKey && tabbyMerchantCode)
    ? { publicKey: tabbyPublicKey, merchantCode: tabbyMerchantCode }
    : undefined;
}

function RelatedProductsSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading related products">
      <div className="h-8 w-48 animate-pulse rounded bg-[var(--storefront-bg-subtle)]" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <div className="aspect-square animate-pulse rounded-md bg-[var(--storefront-bg-subtle)]" />
            <div className="h-4 animate-pulse rounded bg-[var(--storefront-bg-subtle)]" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--storefront-bg-subtle)]" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductErrorState({ error }: { error: ProductPageError }) {
  return (
    <div className="space-y-4">
      <ProductErrorHandler error={error} />
      <h1 className="text-3xl font-bold text-[var(--storefront-text-primary)]">Unable to load product</h1>
      <p className="text-[var(--storefront-text-secondary)]">
        Something went wrong while loading this product. Please try again, and copy the toast details if you need to report the issue.
      </p>
    </div>
  );
}

function ProductNotFoundState() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-[var(--storefront-text-primary)]">Product not found</h1>
      <p className="text-[var(--storefront-text-secondary)]">
        We could not find this product. It may have been removed or the link is incorrect.
      </p>
    </div>
  );
}

async function ProductDetailsSection({ id }: { id: string }) {
  const { product, error: productError } = await fetchProduct(id);

  if (productError) {
    return <ProductErrorState error={productError} />;
  }

  if (!product) {
    return <ProductNotFoundState />;
  }

  return (
    <ProductDetails
      product={product}
      tabbyConfig={getTabbyConfig()}
    />
  );
}

async function RelatedProductsSection({ id }: { id: string }) {
  const { product, error: productError } = await fetchProduct(id);

  if (productError || !product) {
    return null;
  }

  const broaderCategoryIds = await getBroaderCategoryContextIds(product.subCategoryIds);
  const { products: relatedProducts, error: relatedError } = await fetchRelatedProducts(broaderCategoryIds, product.id);
  const filteredRelatedProducts = relatedProducts.filter(p => p.id !== product.id);

  return (
    <>
      {relatedError && <ProductErrorHandler error={relatedError} />}
      <RelatedProducts products={filteredRelatedProducts} />
    </>
  );
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  return (
    <div className="container mx-auto px-4 py-12 space-y-12 mt-24 lg:mt-32 max-w-7xl">
      <Suspense fallback={<ProductDetailsSkeleton />}>
        <ProductDetailsSection id={id} />
      </Suspense>

      <Suspense fallback={<RelatedProductsSkeleton />}>
        <RelatedProductsSection id={id} />
      </Suspense>

      <RecentlyViewed currentProductId={id} />
    </div>
  );
}
