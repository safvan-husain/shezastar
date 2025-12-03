import Image from 'next/image';
import { Product } from '@/lib/product/model/product.model';
import { ProductGrid } from '@/components/ProductGrid';
import { ProductErrorHandler, ProductPageError } from '../components/ProductErrorHandler';

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

function formatPrice(value: number) {
  return `AED ${value.toFixed(2)}`;
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
      
      {/* Product Details */}
      <div className="grid gap-8 lg:grid-cols-[2fr_3fr]">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-[var(--storefront-bg-subtle)]">
            {product.images?.[0] ? (
              <Image
                src={product.images[0].url}
                alt={product.name}
                fill
                unoptimized
                sizes="(max-width: 824px) 80vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-[var(--storefront-text-muted)]">
                <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h18M3 19h18M5 5v14M19 5v14" />
                </svg>
                <p className="text-sm tracking-wide">No image available</p>
              </div>
            )}
            {product.offerPrice && (
              <div className="absolute top-4 left-4">
                <span className="inline-flex items-center rounded-md bg-[var(--storefront-sale)] px-3 py-1.5 text-sm font-semibold text-white">
                  SALE
                </span>
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {product.images.slice(0, 4).map((image, index) => (
                <div
                  key={image.id || index}
                  className="relative aspect-square overflow-hidden rounded-md bg-[var(--storefront-bg-subtle)] border border-[var(--storefront-border)] cursor-pointer hover:border-[var(--storefront-text-primary)] transition"
                >
                  <Image
                    src={image.url}
                    alt={`${product.name} - Image ${index + 1}`}
                    fill
                    unoptimized
                    sizes="(max-width: 1024px) 25vw, 12.5vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-[var(--storefront-text-primary)]">{product.name}</h1>
            {product.description && (
              <p className="text-[var(--storefront-text-secondary)] leading-relaxed">{product.description}</p>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            {product.offerPrice ? (
              <>
                <span className="text-4xl font-bold text-[var(--storefront-sale)]">{formatPrice(product.offerPrice)}</span>
                <span className="text-xl text-[var(--storefront-text-muted)] line-through">{formatPrice(product.basePrice)}</span>
                <span className="text-sm font-semibold text-[var(--storefront-sale)]">
                  Save {formatPrice(product.basePrice - product.offerPrice)}
                </span>
              </>
            ) : (
              <span className="text-4xl font-bold text-[var(--storefront-text-primary)]">{formatPrice(product.basePrice)}</span>
            )}
          </div>

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-4">
              {product.variants.map((variant) => (
                <div key={variant.variantTypeId} className="space-y-2">
                  <label className="text-sm font-medium text-[var(--storefront-text-primary)]">
                    {variant.variantTypeName}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {variant.selectedItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="px-4 py-2 rounded-md border border-[var(--storefront-border)] bg-[var(--storefront-bg)] text-[var(--storefront-text-primary)] hover:border-[var(--storefront-text-primary)] transition"
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Installation Service */}
          {product.installationService?.enabled && (
            <div className="rounded-lg border border-[var(--storefront-border)] bg-[var(--storefront-bg-subtle)] p-4 space-y-2">
              <h3 className="font-semibold text-[var(--storefront-text-primary)]">Installation Service Available</h3>
              <p className="text-lg font-semibold text-[var(--storefront-text-primary)]">
                {formatPrice(product.installationService.atHomePrice ?? 0)}
              </p>
            </div>
          )}

          {/* Add to Cart Button */}
          <button
            type="button"
            className="w-full py-4 rounded-lg bg-[var(--storefront-button-primary)] text-white font-semibold hover:bg-[var(--storefront-button-primary-hover)] transition"
          >
            Add to Cart
          </button>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              className="py-3 rounded-lg border border-[var(--storefront-border)] bg-[var(--storefront-button-secondary)] text-[var(--storefront-text-primary)] font-medium hover:bg-[var(--storefront-button-secondary-hover)] transition"
            >
              Add to Wishlist
            </button>
            <button
              type="button"
              className="py-3 rounded-lg border border-[var(--storefront-border)] bg-[var(--storefront-button-secondary)] text-[var(--storefront-text-primary)] font-medium hover:bg-[var(--storefront-button-secondary-hover)] transition"
            >
              Compare
            </button>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {filteredRelatedProducts.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-[var(--storefront-text-primary)]">Related Products</h2>
          <ProductGrid
            products={filteredRelatedProducts}
            emptyMessage="No related products available."
          />
        </div>
      )}
    </div>
  );
}
