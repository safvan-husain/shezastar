import { Product } from '@/lib/product/model/product.model';
import { Card } from './ui/Card';

interface ProductGridProps {
  products: Product[];
  emptyMessage?: string;
}

function formatPrice(value: number) {
  return `$${value.toFixed(2)}`;
}

export function ProductGrid({ products, emptyMessage = 'No products available yet.' }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <Card className="text-center py-12">
        <p className="text-[var(--muted-foreground)]">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => {
        const primaryImage = product.images?.[0];

        return (
          <Card key={product.id} className="overflow-hidden p-0" hover>
            <div className="relative bg-[var(--muted)] aspect-square">
              {primaryImage ? (
                <img
                  src={primaryImage.url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--muted-foreground)]">
                  <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              {product.offerPrice && (
                <div className="absolute top-3 right-3 bg-[var(--text-primary)] text-[var(--text-inverted)] px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                  Sale
                </div>
              )}
            </div>

            <div className="p-4 space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-[var(--foreground)] line-clamp-2">{product.name}</h3>
                {product.description && (
                  <p className="text-sm text-[var(--muted-foreground)] line-clamp-2 mt-1">{product.description}</p>
                )}
              </div>

              <div className="flex items-baseline gap-2">
                {product.offerPrice ? (
                  <>
                    <span className="text-xl font-bold text-[var(--foreground)]">{formatPrice(product.offerPrice)}</span>
                    <span className="text-sm text-[var(--muted-foreground)] line-through">{formatPrice(product.basePrice)}</span>
                  </>
                ) : (
                  <span className="text-xl font-bold text-[var(--foreground)]">{formatPrice(product.basePrice)}</span>
                )}
              </div>

              <div className="flex items-center justify-between text-sm text-[var(--muted-foreground)]">
                <span>{product.images?.length || 0} images</span>
                <span>{product.variants?.length || 0} variants</span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
