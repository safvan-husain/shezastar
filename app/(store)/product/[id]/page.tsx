import { Product } from '@/lib/product/model/product.model';
import { ProductErrorHandler, ProductPageError } from '../components/ProductErrorHandler';
import { ProductDetails } from '../components/ProductDetails';
import { RelatedProducts } from '../components/RelatedProducts';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

function createErrorPayload(error: unknown, override?: Partial<ProductPageError>): ProductPageError {
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

async function fetchProduct(id: string): Promise<{ product: Product | null; error: ProductPageError | null }> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const url = `${baseUrl}/api/products/${encodeURIComponent(id)}`;
  console.log(url)
  const timeoutMs = Number(process.env.PRODUCT_FETCH_TIMEOUT_MS ?? 5000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { cache: 'no-store', signal: controller.signal });
    if (!res.ok) {
      console.log(`res not ok`)
      let body: any;
      try {
        body = await res.json();

      } catch {
        body = { error: 'Failed to parse response body' };
      }

      return {
        product: null,
        error: {
          message: body.message || body.error || 'Failed to load product',
          status: res.status,
          body,
          url: res.url,
          method: 'GET',
        },
      };
    }

    const data = await res.json();
    return { product: data ?? null, error: null };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        product: null,
        error: createErrorPayload(error, {
          message: 'Timed out while loading product',
          url,
        }),
      };
    }
    return {
      product: null,
      error: createErrorPayload(error, {
        message: error instanceof Error ? error.message : 'Failed to load product',
        url,
      }),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchRelatedProducts(categoryIds: string[]): Promise<{ products: Product[]; error: ProductPageError | null }> {
  if (categoryIds.length === 0) {
    return { products: [], error: null };
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const url = `${baseUrl}/api/products?categoryId=${encodeURIComponent(categoryIds[0])}&limit=8`;
  const timeoutMs = Number(process.env.PRODUCT_FETCH_TIMEOUT_MS ?? 5000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { cache: 'no-store', signal: controller.signal });
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
          message: body.message || body.error || 'Failed to load related products',
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
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        products: [],
        error: createErrorPayload(error, {
          message: 'Timed out while loading related products',
          url,
        }),
      };
    }
    return {
      products: [],
      error: createErrorPayload(error, {
        message: error instanceof Error ? error.message : 'Failed to load related products',
        url,
      }),
    };
  } finally {
    clearTimeout(timer);
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  const { product, error: productError } = await fetchProduct(id);

  if (productError) {
    return (
      <div className="container mx-auto px-4 py-12 space-y-4">
        <ProductErrorHandler error={productError} />
        <h1 className="text-3xl font-bold text-[var(--storefront-text-primary)]">Unable to load product</h1>
        <p className="text-[var(--storefront-text-secondary)]">
          Something went wrong while loading this product. Please try again, and copy the toast details if you need to report the issue.
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 space-y-4">
        <h1 className="text-3xl font-bold text-[var(--storefront-text-primary)]">Product not found</h1>
        <p className="text-[var(--storefront-text-secondary)]">
          We could not find this product. It may have been removed or the link is incorrect.
        </p>
      </div>
    );
  }

  const { products: relatedProducts, error: relatedError } = await fetchRelatedProducts(product.subCategoryIds);
  const filteredRelatedProducts = relatedProducts.filter(p => p.id !== product.id);

  return (
    <div className="container mx-auto px-4 py-12 space-y-12 mt-24 max-w-7xl">
      {relatedError && <ProductErrorHandler error={relatedError} />}
      
      <ProductDetails product={product} />
      
      <RelatedProducts products={filteredRelatedProducts} />
    </div>
  );
}
