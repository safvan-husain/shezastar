import type { Metadata } from 'next';
import { Product, isProductInStock } from '@/lib/product/model/product.model';
import { ProductErrorHandler, ProductPageError } from '../components/ProductErrorHandler';
import { ProductDetails } from '../components/ProductDetails';
import { RelatedProductsClient } from '../components/RelatedProductsClient';
import { RecentlyViewed } from '@/components/storefront/RecentlyViewed';
import { getCachedProduct, getCachedProductIds } from '@/lib/product/product-cache';
import { AppError } from '@/lib/errors/app-error';
import { buildProductCanonicalUrl, buildProductPath } from '@/lib/seo/canonical';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const ids = await getCachedProductIds();
  return ids.map(id => ({ id }));
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
  return product.metaDescription || product.subtitle || stripHtml(product.description) || `Shop ${product.name} at Sheza Star.`;
}

function buildProductTitle(product: Product) {
  return product.metaTitle || `${product.name} | Sheza Star`;
}

function getPrimaryImageUrl(product: Product) {
  return product.images[0]?.url;
}

function getProductStructuredData(product: Product) {
  const description = buildProductDescription(product);
  const primaryImage = getPrimaryImageUrl(product);
  const defaultVariant = product.variantStock.find((entry) => entry.variantCombinationKey === 'default');
  const price = defaultVariant?.price ?? product.basePrice;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description,
    image: primaryImage ? [primaryImage] : undefined,
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: 'AED',
      availability: isProductInStock(product)
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: buildProductCanonicalUrl(product.id),
    },
  };
}

function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
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

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const product = await getCachedProduct(id);
    const description = buildProductDescription(product);
    const title = buildProductTitle(product);
    const imageUrl = getPrimaryImageUrl(product);
    const canonical = buildProductPath(id);

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
        images: imageUrl ? [{ url: imageUrl, alt: product.name }] : undefined,
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

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  return <CachedProductPage id={id} />;
}

async function CachedProductPage({ id }: { id: string }) {
  'use cache';

  const { product, error: productError } = await fetchProduct(id);

  return (
    <div className="container mx-auto px-4 py-12 space-y-12 mt-24 lg:mt-32 max-w-7xl">
      {productError ? (
        <ProductErrorState error={productError} />
      ) : product ? (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: serializeJsonLd(getProductStructuredData(product)) }}
          />
          <ProductDetails
            product={product}
            tabbyConfig={getTabbyConfig()}
          />
          <RelatedProductsClient productId={product.id} />
        </>
      ) : (
        <ProductNotFoundState />
      )}

      <RecentlyViewed currentProductId={id} />
    </div>
  );
}
