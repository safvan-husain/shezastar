import { Product } from '@/lib/product/model/product.model';
import { ProductGrid } from '@/components/ProductGrid';

interface RelatedProductsProps {
  products: Product[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[var(--storefront-text-primary)]">Related Products</h2>
      <ProductGrid
        products={products}
        emptyMessage="No related products available."
      />
    </div>
  );
}
