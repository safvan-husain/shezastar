import { ProductDetailsSkeleton } from '../components/ProductPageSkeleton';

export default function ProductLoading() {
  return (
    <div className="container mx-auto px-4 py-12 space-y-12 mt-24 lg:mt-32 max-w-7xl">
      <ProductDetailsSkeleton />
    </div>
  );
}
