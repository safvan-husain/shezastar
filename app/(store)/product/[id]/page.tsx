import { Product } from '@/lib/product/model/product.model';
import { ProductErrorHandler, ProductPageError } from '../components/ProductErrorHandler';
import { ProductDetails } from '../components/ProductDetails';
import { RelatedProducts } from '../components/RelatedProducts';
import { RecentlyViewed } from '@/components/storefront/RecentlyViewed';
import { getBroaderCategoryContextIds } from '@/lib/category/category.service';
import { getAllProducts, getProduct } from '@/lib/product/product.service';
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

async function fetchProduct(id: string): Promise<{ product: Product | null; error: ProductPageError | null }> {
  try {
    const product = await getProduct(id);
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

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const tabbyPublicKey = process.env.TABBY_PUBLIC_KEY || '';
  const tabbyMerchantCode = process.env.TABBY_MERCHANT_CODE || '';
  const tabbyConfig = (tabbyPublicKey && tabbyMerchantCode)
    ? { publicKey: tabbyPublicKey, merchantCode: tabbyMerchantCode }
    : undefined;

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

  const broaderCategoryIds = await getBroaderCategoryContextIds(product.subCategoryIds);
  const { products: relatedProducts, error: relatedError } = await fetchRelatedProducts(broaderCategoryIds, product.id);
  const filteredRelatedProducts = relatedProducts.filter(p => p.id !== product.id);

  return (
    <div className="container mx-auto px-4 py-12 space-y-12 mt-24 lg:mt-32 max-w-7xl">
      {relatedError && <ProductErrorHandler error={relatedError} />}

      <ProductDetails
        product={product}
        tabbyConfig={tabbyConfig}
      />

      <RelatedProducts products={filteredRelatedProducts} />

      <RecentlyViewed currentProductId={product.id} />
    </div>
  );
}
